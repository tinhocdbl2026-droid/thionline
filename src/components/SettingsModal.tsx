import React from 'react';
import { AppSettings } from '../types';
import { X, Settings as SettingsIcon, Volume2, Sparkles, UserCheck, Mic, Clock, GraduationCap } from 'lucide-react';
import { playButtonClick } from '../utils/soundEffects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    playButtonClick(settings.soundVolume);
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                Cài đặt ứng dụng
              </h3>
              <p className="text-xs text-slate-500">Tùy chỉnh thông số lớp học và hiệu ứng</p>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClick(settings.soundVolume);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Class & Teacher Name */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Thông tin lớp học
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">Tên lớp:</span>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={settings.className}
                    onChange={e => handleChange('className', e.target.value)}
                    placeholder="Ví dụ: Lớp 3A"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">Tên giáo viên:</span>
                <input
                  type="text"
                  value={settings.teacherName}
                  onChange={e => handleChange('teacherName', e.target.value)}
                  placeholder="Ví dụ: Cô Mai"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Spin Duration Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thời gian quay: {settings.duration} giây
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map(sec => (
                <button
                  key={sec}
                  onClick={() => handleChange('duration', sec)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                    settings.duration === sec
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sec} Giây
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Toggles */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Tính năng & Hiệu ứng
            </label>

            {/* Sound toggle + volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">Âm thanh hiệu ứng</span>
                    <span className="text-xs text-slate-500">Tiếng quay lồng cầu, lách cách và kèn chiến thắng</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={e => handleChange('soundEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              {settings.soundEnabled && (
                <div className="flex items-center gap-3 pl-8 pr-2">
                  <span className="text-xs text-slate-400">Âm lượng:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={e => handleChange('soundVolume', parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-xs font-mono font-bold text-slate-600 w-8 text-right">
                    {Math.round(settings.soundVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Speech toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mic className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Đọc tên học sinh</span>
                  <span className="text-xs text-slate-500">Tự động phát giọng đọc &quot;Mời bạn [Tên]&quot;</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.speechEnabled}
                onChange={e => handleChange('speechEnabled', e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Confetti toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Hiệu ứng pháo giấy</span>
                  <span className="text-xs text-slate-500">Bắn pháo hoa giấy rực rỡ khi tìm ra học sinh</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.confettiEnabled}
                onChange={e => handleChange('confettiEnabled', e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* No repeat toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Không gọi lại học sinh đã chọn</span>
                  <span className="text-xs text-slate-500">Học sinh đã gọi sẽ tạm thời loại khỏi lượt quay kế tiếp</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.noRepeat}
                onChange={e => handleChange('noRepeat', e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              playButtonClick(settings.soundVolume);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            Lưu và đóng
          </button>
        </div>
      </div>
    </div>
  );
};
