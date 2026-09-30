import React, { useState } from 'react';
import { Student, DEFAULT_STUDENTS, BALL_COLORS } from '../types';
import { X, Plus, Trash2, Edit2, Check, RotateCcw, Users, ClipboardList } from 'lucide-react';
import { playButtonClick } from '../utils/soundEffects';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onUpdateStudents: (newStudents: Student[]) => void;
  soundVolume: number;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  isOpen,
  onClose,
  students,
  onUpdateStudents,
  soundVolume,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'batch'>('list');
  const [singleNameInput, setSingleNameInput] = useState('');
  const [batchTextInput, setBatchTextInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  // Add single student
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = singleNameInput.trim();
    if (!trimmed) return;

    playButtonClick(soundVolume);
    const nextNumber = students.length > 0 ? Math.max(...students.map(s => s.number)) + 1 : 1;
    const newStudent: Student = {
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: trimmed,
      number: nextNumber,
      color: BALL_COLORS[(nextNumber - 1) % BALL_COLORS.length],
      calledCount: 0,
    };

    onUpdateStudents([...students, newStudent]);
    setSingleNameInput('');
  };

  // Process batch paste (one name per line)
  const handleBatchImport = () => {
    const lines = batchTextInput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    playButtonClick(soundVolume);
    const startNumber = students.length > 0 ? Math.max(...students.map(s => s.number)) + 1 : 1;
    const newStudents: Student[] = lines.map((name, idx) => {
      const num = startNumber + idx;
      return {
        id: 'st_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
        name,
        number: num,
        color: BALL_COLORS[(num - 1) % BALL_COLORS.length],
        calledCount: 0,
      };
    });

    onUpdateStudents([...students, ...newStudents]);
    setBatchTextInput('');
    setActiveTab('list');
  };

  // Delete student
  const handleDelete = (id: string) => {
    playButtonClick(soundVolume);
    const updated = students.filter(s => s.id !== id);
    // Renumber sequentially
    const renumbered = updated.map((s, idx) => ({
      ...s,
      number: idx + 1,
      color: BALL_COLORS[idx % BALL_COLORS.length],
    }));
    onUpdateStudents(renumbered);
  };

  // Start editing
  const handleStartEdit = (st: Student) => {
    setEditingId(st.id);
    setEditingName(st.name);
  };

  // Save edit
  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    playButtonClick(soundVolume);
    const updated = students.map(s => (s.id === id ? { ...s, name: trimmed } : s));
    onUpdateStudents(updated);
    setEditingId(null);
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách học sinh?')) {
      playButtonClick(soundVolume);
      onUpdateStudents([]);
    }
  };

  // Reset to default 20 sample students
  const handleResetToDefault = () => {
    if (window.confirm('Khôi phục danh sách mẫu 20 học sinh ban đầu?')) {
      playButtonClick(soundVolume);
      const defaults: Student[] = DEFAULT_STUDENTS.map((st, idx) => ({
        id: 'st_def_' + (idx + 1),
        name: st.name,
        number: idx + 1,
        color: BALL_COLORS[idx % BALL_COLORS.length],
        calledCount: 0,
      }));
      onUpdateStudents(defaults);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                Quản lý danh sách học sinh
              </h3>
              <p className="text-xs text-slate-500">
                Tổng cộng: <strong className="text-amber-600">{students.length}</strong> học sinh · Tự động lưu trên trình duyệt
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClick(soundVolume);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 gap-2">
          <button
            onClick={() => {
              playButtonClick(soundVolume);
              setActiveTab('list');
            }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'list'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Danh sách ({students.length})
          </button>

          <button
            onClick={() => {
              playButtonClick(soundVolume);
              setActiveTab('batch');
            }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'batch'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Dán nhiều học sinh
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'list' ? (
            <>
              {/* Add Single Input Bar */}
              <form onSubmit={handleAddSingle} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập họ tên học sinh mới (ví dụ: Lê Hồng Phúc)..."
                  value={singleNameInput}
                  onChange={e => setSingleNameInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!singleNameInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
              </form>

              {/* Student Rows Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {students.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-base font-medium">Chưa có học sinh nào trong danh sách.</p>
                    <p className="text-xs mt-1">
                      Hãy thêm học sinh từng bạn hoặc chuyển sang tab &quot;Dán nhiều học sinh&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                    {students.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Number Ball preview */}
                          <div
                            className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: st.color || '#F59E0B' }}
                          >
                            {st.number}
                          </div>

                          {/* Editable Name */}
                          {editingId === st.id ? (
                            <div className="flex items-center gap-2 flex-1 mr-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={e => setEditingName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(st.id)}
                                className="px-2.5 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(st.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                                title="Lưu"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-800 text-sm truncate">
                              {st.name}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {editingId !== st.id && (
                            <button
                              onClick={() => handleStartEdit(st)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Sửa tên"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(st.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Batch import tab */
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Dán danh sách học sinh (Mỗi học sinh một dòng):
              </label>
              <textarea
                rows={9}
                value={batchTextInput}
                onChange={e => setBatchTextInput(e.target.value)}
                placeholder={`Nguyễn Văn An\nTrần Minh Anh\nLê Hoàng Bảo\nPhạm Gia Hân\nNguyễn Thành Nam`}
                className="w-full p-3.5 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-sans"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Số học sinh nhận diện: {batchTextInput.split('\n').filter(l => l.trim()).length}
                </span>
                <button
                  onClick={handleBatchImport}
                  disabled={!batchTextInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  Nhập danh sách
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-100/60 border border-amber-200 transition-colors"
              title="Nạp lại 20 học sinh mẫu ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Dữ liệu mẫu 20 em</span>
            </button>

            {students.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              playButtonClick(soundVolume);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
