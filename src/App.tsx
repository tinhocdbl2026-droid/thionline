import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Student,
  GameMode,
  AppSettings,
  CallHistoryItem,
  DEFAULT_STUDENTS,
  BALL_COLORS,
} from './types';
import { BingoCageMode } from './components/modes/BingoCageMode';
import { LuckyWheelMode } from './components/modes/LuckyWheelMode';
import { MysteryBoxMode } from './components/modes/MysteryBoxMode';
import { FloatingBalloonsMode } from './components/modes/FloatingBalloonsMode';
import { DigitalSlotMode } from './components/modes/DigitalSlotMode';
import { WinnerModal } from './components/WinnerModal';
import { StudentManagerModal } from './components/StudentManagerModal';
import { CallHistoryModal } from './components/CallHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { CageAudioController, playButtonClick } from './utils/soundEffects';
import {
  Maximize,
  Minimize,
  Settings as SettingsIcon,
  Users,
  History,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

const STORAGE_KEYS = {
  STUDENTS: 'student_cage_students_v1',
  SETTINGS: 'student_cage_settings_v1',
  HISTORY: 'student_cage_history_v1',
  CALLED_IDS: 'student_cage_called_ids_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  className: 'Lớp 3A',
  teacherName: '',
  duration: 4, // seconds
  soundEnabled: true,
  soundVolume: 0.7,
  speechEnabled: true,
  confettiEnabled: true,
  noRepeat: true,
};

export default function App() {
  // 1. App State & LocalStorage
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default 20 primary students
    return DEFAULT_STUDENTS.map((st, idx) => ({
      id: 'st_' + (idx + 1),
      name: st.name,
      number: idx + 1,
      color: BALL_COLORS[idx % BALL_COLORS.length],
      calledCount: 0,
    }));
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  const [calledIds, setCalledIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CALLED_IDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [history, setHistory] = useState<CallHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CALLED_IDS, JSON.stringify(calledIds));
  }, [calledIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  // 2. Game Mode & Spin State
  const [currentMode, setCurrentMode] = useState<GameMode>('cage');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // 3. Modals
  const [isStudentManagerOpen, setIsStudentManagerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cage Audio controller instance
  const cageAudioRef = useRef<CageAudioController | null>(null);
  useEffect(() => {
    cageAudioRef.current = new CageAudioController(settings.soundVolume);
  }, []);

  useEffect(() => {
    if (cageAudioRef.current) {
      cageAudioRef.current.setVolume(settings.soundVolume);
    }
  }, [settings.soundVolume]);

  // 4. Available Pool Computation
  const availableStudents = useMemo(() => {
    if (!settings.noRepeat) return students;
    return students.filter(s => !calledIds.includes(s.id));
  }, [students, calledIds, settings.noRepeat]);

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    playButtonClick(settings.soundVolume);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.warn);
      }
    }
  };

  // 5. Spin Handler
  const handleStartSpin = () => {
    if (isSpinning) return;
    if (availableStudents.length === 0) {
      alert('Tất cả học sinh đã được gọi! Hãy bấm nút "Đặt lại lượt gọi" để tiếp tục.');
      return;
    }

    playButtonClick(settings.soundVolume);
    setIsSpinning(true);
    setWinnerModalOpen(false);

    // If cage mode, start cage continuous mechanical audio
    if (currentMode === 'cage' && settings.soundEnabled && cageAudioRef.current) {
      cageAudioRef.current.startSpinning();
    }
  };

  // 6. Spin Finish Callback from Mode Component
  const handleSpinEnd = (winner: Student) => {
    setIsSpinning(false);
    if (cageAudioRef.current) {
      cageAudioRef.current.stopSpinning();
    }

    setSelectedStudent(winner);
    setWinnerModalOpen(true);

    // Update called status
    setCalledIds(prev => (prev.includes(winner.id) ? prev : [...prev, winner.id]));

    // Record into history
    const historyItem: CallHistoryItem = {
      id: 'hist_' + Date.now(),
      studentId: winner.id,
      studentName: winner.name,
      studentNumber: winner.number,
      calledAt: Date.now(),
      mode: currentMode,
      order: history.length + 1,
    };
    setHistory(prev => [historyItem, ...prev]);

    // Update student calledCount
    setStudents(prev =>
      prev.map(s => (s.id === winner.id ? { ...s, calledCount: (s.calledCount || 0) + 1, lastCalledAt: Date.now() } : s))
    );
  };

  // 7. Reset Called Pool
  const handleResetCalledStatus = () => {
    playButtonClick(settings.soundVolume);
    setCalledIds([]);
  };

  // 8. Clear History
  const handleClearHistory = () => {
    setHistory([]);
  };

  const calledCount = students.length - availableStudents.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-yellow-50/60 text-slate-800 flex flex-col justify-between selection:bg-amber-200">
      {/* ===== HEADER BAR ===== */}
      <header className="bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-display text-xl sm:text-2xl shadow-md border-2 border-amber-300">
              🎱
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-amber-950 tracking-tight leading-none">
                LỒNG CẦU GỌI TÊN HỌC SINH
              </h1>
              <div className="flex items-center gap-2 text-xs text-amber-800/80 mt-1">
                {settings.className && (
                  <span className="font-semibold inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    {settings.className}
                  </span>
                )}
                {settings.teacherName && (
                  <>
                    <span>·</span>
                    <span>GV: {settings.teacherName}</span>
                  </>
                )}
                <span>·</span>
                <span>{students.length} học sinh</span>
              </div>
            </div>
          </div>

          {/* Action Tools Header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Speech Toggle */}
            <button
              onClick={() => {
                playButtonClick(settings.soundVolume);
                setSettings(prev => ({ ...prev, speechEnabled: !prev.speechEnabled }));
              }}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                settings.speechEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title={settings.speechEnabled ? 'Giọng đọc tên: Đang bật' : 'Giọng đọc tên: Đang tắt'}
            >
              {settings.speechEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">Đọc tên</span>
            </button>

            {/* History Button */}
            <button
              onClick={() => {
                playButtonClick(settings.soundVolume);
                setIsHistoryOpen(true);
              }}
              className="relative p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-amber-50/80 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Xem lịch sử học sinh đã gọi"
            >
              <History className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Lịch sử</span>
              {history.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>

            {/* Student Manager Button */}
            <button
              onClick={() => {
                playButtonClick(settings.soundVolume);
                setIsStudentManagerOpen(true);
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-amber-50/80 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Quản lý danh sách học sinh"
            >
              <Users className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Học sinh ({students.length})</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                playButtonClick(settings.soundVolume);
                setIsSettingsOpen(true);
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-amber-50/80 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Cài đặt thông số"
            >
              <SettingsIcon className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Cài đặt</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Phóng to toàn màn hình máy chiếu"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span className="hidden md:inline">Toàn màn hình</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN BODY ===== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col items-center">
        {/* GAME MODE TABS */}
        <div className="w-full flex items-center justify-center mb-4">
          <div className="bg-white/80 p-1.5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-1 overflow-x-auto max-w-full">
            {[
              { id: 'cage', label: 'Lồng cầu', icon: '🎱' },
              { id: 'wheel', label: 'Vòng quay', icon: '🎡' },
              { id: 'box', label: 'Hộp bí mật', icon: '🎁' },
              { id: 'balloon', label: 'Bóng bay', icon: '🎈' },
              { id: 'number', label: 'Máy chọn số', icon: '🎰' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (isSpinning) return;
                  playButtonClick(settings.soundVolume);
                  setCurrentMode(tab.id as GameMode);
                }}
                disabled={isSpinning}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  currentMode === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INTERACTIVE STAGE */}
        <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[360px] sm:min-h-[440px]">
          {students.length === 0 ? (
            <div className="bg-white/90 p-8 rounded-3xl border-2 border-dashed border-amber-300 text-center max-w-md shadow-sm">
              <Users className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl text-slate-800 mb-1">
                Danh sách học sinh đang trống
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Vui lòng thêm danh sách học sinh để bắt đầu quay lồng cầu gọi tên.
              </p>
              <button
                onClick={() => setIsStudentManagerOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                + Thêm danh sách học sinh
              </button>
            </div>
          ) : (
            <>
              {currentMode === 'cage' && (
                <BingoCageMode
                  students={students}
                  availableStudents={availableStudents}
                  isSpinning={isSpinning}
                  selectedStudent={selectedStudent}
                  duration={settings.duration}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                  onSpinEnd={handleSpinEnd}
                />
              )}

              {currentMode === 'wheel' && (
                <LuckyWheelMode
                  availableStudents={availableStudents}
                  isSpinning={isSpinning}
                  duration={settings.duration}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                  onSpinEnd={handleSpinEnd}
                />
              )}

              {currentMode === 'box' && (
                <MysteryBoxMode
                  availableStudents={availableStudents}
                  isSpinning={isSpinning}
                  duration={settings.duration}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                  onSpinEnd={handleSpinEnd}
                />
              )}

              {currentMode === 'balloon' && (
                <FloatingBalloonsMode
                  availableStudents={availableStudents}
                  isSpinning={isSpinning}
                  duration={settings.duration}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                  onSpinEnd={handleSpinEnd}
                />
              )}

              {currentMode === 'number' && (
                <DigitalSlotMode
                  availableStudents={availableStudents}
                  isSpinning={isSpinning}
                  duration={settings.duration}
                  soundEnabled={settings.soundEnabled}
                  soundVolume={settings.soundVolume}
                  onSpinEnd={handleSpinEnd}
                />
              )}
            </>
          )}
        </div>

        {/* BOTTOM ACTION & CONTROLS DECK */}
        <div className="w-full max-w-2xl mt-4 sm:mt-6 flex flex-col items-center gap-3">
          {/* BIG LAUNCH BUTTON */}
          <button
            onClick={handleStartSpin}
            disabled={isSpinning || availableStudents.length === 0}
            className={`w-full max-w-md py-4 sm:py-5 px-8 rounded-3xl font-display text-2xl sm:text-3xl font-black text-white shadow-xl transition-all transform flex items-center justify-center gap-3 select-none cursor-pointer ${
              isSpinning
                ? 'bg-amber-400 opacity-90 cursor-not-allowed scale-98'
                : availableStudents.length === 0
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 hover:from-rose-600 hover:via-amber-600 hover:to-orange-600 hover:scale-103 active:scale-98 hover:shadow-2xl border-2 border-yellow-200'
            }`}
          >
            {isSpinning ? (
              <>
                <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <span>ĐANG QUAY...</span>
              </>
            ) : availableStudents.length === 0 ? (
              <span>ĐÃ GỌI HẾT HỌC SINH</span>
            ) : (
              <>
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white stroke-none" />
                <span>QUAY LỒNG CẦU</span>
              </>
            )}
          </button>

          {/* STATUS & ROUND CONTROLS */}
          <div className="w-full bg-white/80 backdrop-blur-xs rounded-2xl border border-amber-200/80 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            {/* No Repeat Toggle */}
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={settings.noRepeat}
                onChange={e => {
                  playButtonClick(settings.soundVolume);
                  setSettings(prev => ({ ...prev, noRepeat: e.target.checked }));
                }}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span>Không gọi lại học sinh đã chọn</span>
            </label>

            {/* Counter Badge */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">
                Đã gọi:{' '}
                <strong className="text-amber-600 font-bold">
                  {calledCount} / {students.length}
                </strong>{' '}
                học sinh
              </span>

              {calledCount > 0 && (
                <button
                  onClick={handleResetCalledStatus}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors cursor-pointer"
                  title="Đặt lại lượt gọi để đưa tất cả học sinh vào lại lồng cầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại lượt gọi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STUDENT ROSTER PREVIEW (TICKER) */}
        {students.length > 0 && (
          <div className="w-full max-w-4xl mt-5 bg-white/60 backdrop-blur-2xs rounded-2xl border border-amber-100/80 p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Danh sách lớp ({availableStudents.length} bạn sẵn sàng):
              </span>
              <button
                onClick={() => setIsStudentManagerOpen(true)}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
              >
                Chỉnh sửa danh sách
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {students.map(st => {
                const isCalled = calledIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                      isCalled && settings.noRepeat
                        ? 'bg-slate-100 text-slate-400 line-through opacity-60'
                        : 'bg-white border border-amber-200/60 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full text-[10px] text-white font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: st.color || '#F59E0B' }}
                    >
                      {st.number}
                    </span>
                    <span className="truncate max-w-[120px]">{st.name}</span>
                    {isCalled && !settings.noRepeat && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="w-full text-center py-2 text-xs text-slate-400 border-t border-amber-100/60 bg-white/40">
        Lồng Cầu Gọi Tên Học Sinh · Phần mềm hỗ trợ giảng dạy tiểu học trực quan
      </footer>

      {/* ===== MODALS & OVERLAYS ===== */}
      {/* 1. Winner Celebration Modal */}
      <WinnerModal
        winner={selectedStudent}
        isOpen={winnerModalOpen}
        onClose={() => setWinnerModalOpen(false)}
        onSpinAgain={() => {
          setWinnerModalOpen(false);
          setTimeout(() => {
            handleStartSpin();
          }, 200);
        }}
        speechEnabled={settings.speechEnabled}
        onToggleSpeech={() => setSettings(prev => ({ ...prev, speechEnabled: !prev.speechEnabled }))}
        soundEnabled={settings.soundEnabled}
        soundVolume={settings.soundVolume}
        confettiEnabled={settings.confettiEnabled}
        classNameTitle={settings.className}
      />

      {/* 2. Student Management Modal */}
      <StudentManagerModal
        isOpen={isStudentManagerOpen}
        onClose={() => setIsStudentManagerOpen(false)}
        students={students}
        onUpdateStudents={setStudents}
        soundVolume={settings.soundVolume}
      />

      {/* 3. Call History Modal */}
      <CallHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onResetCalledStatus={handleResetCalledStatus}
        soundVolume={settings.soundVolume}
      />

      {/* 4. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}
