import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import { playVictoryFanfare, playButtonClick } from '../utils/soundEffects';
import { speakStudentName } from '../utils/speech';
import { Volume2, VolumeX, Sparkles, X, RefreshCw } from 'lucide-react';

interface WinnerModalProps {
  winner: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  soundEnabled: boolean;
  soundVolume: number;
  confettiEnabled: boolean;
  classNameTitle: string;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  isOpen,
  onClose,
  onSpinAgain,
  speechEnabled,
  onToggleSpeech,
  soundEnabled,
  soundVolume,
  confettiEnabled,
  classNameTitle,
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      // 1. Play Victory Fanfare sound
      if (soundEnabled) {
        playVictoryFanfare(soundVolume);
      }

      // 2. Fire Confetti
      if (confettiEnabled) {
        // Multi-stage confetti celebration
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });
        fire(0.2, {
          spread: 60,
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 1.1,
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });

        // Second side burst after 300ms
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 300);
      }

      // 3. Web Speech API read out: "Mời bạn [Tên học sinh]"
      if (speechEnabled) {
        // slight delay to let fanfare establish first
        const speechTimer = setTimeout(() => {
          speakStudentName(winner.name, true);
        }, 500);
        return () => clearTimeout(speechTimer);
      }
    }
  }, [isOpen, winner, soundEnabled, soundVolume, confettiEnabled, speechEnabled]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      {/* Light ray radiating background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[800px] h-[800px] rounded-full bg-gradient-radial from-amber-400/25 via-amber-500/10 to-transparent blur-3xl animate-pulse-subtle" />
      </div>

      <div className="relative w-full max-w-xl bg-gradient-to-b from-white via-amber-50/50 to-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={() => {
            playButtonClick(soundVolume);
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
          title="Đóng (Esc)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Top Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-sm font-semibold mb-3">
          <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
          <span>{classNameTitle ? `${classNameTitle} · ` : ''}CHÚC MỪNG BẠN</span>
        </div>

        {/* Big 3D Winning Ball Icon with Number */}
        <div className="relative my-2">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-2xl flex items-center justify-center border-4 border-white transform transition-transform hover:scale-105"
            style={{
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${winner.color || '#F59E0B'} 40%, #78350F 100%)`,
            }}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/95 shadow-md flex items-center justify-center">
              <span className="font-display font-black text-2xl sm:text-3xl text-slate-900">
                {winner.number}
              </span>
            </div>
          </div>
          <span className="absolute -bottom-2 bg-amber-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
            Số {winner.number}
          </span>
        </div>

        {/* Massive Student Name Display */}
        <div className="my-4 max-w-full px-2">
          <div className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-widest mb-1">
            Học sinh được gọi tên
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-rose-600 tracking-tight leading-tight drop-shadow-sm text-balance">
            🎉 {winner.name.toUpperCase()} 🎉
          </h2>
        </div>

        {/* Speech audio speaker button */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => {
              playButtonClick(soundVolume);
              speakStudentName(winner.name, true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-semibold transition-colors"
            title="Đọc lại tên học sinh"
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>Nghe đọc lại: &quot;Mời bạn {winner.name}&quot;</span>
          </button>

          <button
            onClick={() => {
              playButtonClick(soundVolume);
              onToggleSpeech();
            }}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
              speechEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
            title="Bật/Tắt tự động đọc tên"
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <button
            onClick={() => {
              playButtonClick(soundVolume);
              onSpinAgain();
            }}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-display text-xl font-bold shadow-lg hover:shadow-xl hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Gọi tiếp</span>
          </button>

          <button
            onClick={() => {
              playButtonClick(soundVolume);
              onClose();
            }}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-base transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
