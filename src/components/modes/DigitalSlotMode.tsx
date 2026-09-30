import React, { useEffect, useState, useRef } from 'react';
import { Student } from '../../types';
import { playWheelTick, playBallBounceSound } from '../../utils/soundEffects';

interface DigitalSlotProps {
  availableStudents: Student[];
  isSpinning: boolean;
  duration: number;
  soundEnabled: boolean;
  soundVolume: number;
  onSpinEnd: (winner: Student) => void;
}

export const DigitalSlotMode: React.FC<DigitalSlotProps> = ({
  availableStudents,
  isSpinning,
  duration,
  soundEnabled,
  soundVolume,
  onSpinEnd,
}) => {
  const [displayNumber, setDisplayNumber] = useState<number>(availableStudents[0]?.number || 1);
  const [displayName, setDisplayName] = useState<string>(availableStudents[0]?.name || '---');
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpinning && availableStudents.length > 0) {
      setIsLocked(false);
      const winner = availableStudents[Math.floor(Math.random() * availableStudents.length)];
      const startTime = performance.now();
      const totalMs = duration * 1000;

      let delay = 40; // very fast roll

      const runRoll = () => {
        const elapsed = performance.now() - startTime;
        const randomStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)];
        setDisplayNumber(randomStudent.number);
        setDisplayName(randomStudent.name);

        if (soundEnabled && Math.random() > 0.5) {
          playWheelTick(soundVolume * 0.3);
        }

        if (elapsed < totalMs - 1200) {
          timerRef.current = window.setTimeout(runRoll, delay);
        } else if (elapsed < totalMs) {
          // Tension slowdown
          delay += 45;
          timerRef.current = window.setTimeout(runRoll, delay);
        } else {
          // Lock on winner
          setDisplayNumber(winner.number);
          setDisplayName(winner.name);
          setIsLocked(true);

          if (soundEnabled) {
            playBallBounceSound(soundVolume * 0.8);
          }

          setTimeout(() => {
            onSpinEnd(winner);
          }, 700);
        }
      };

      runRoll();

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [isSpinning, availableStudents, duration, soundEnabled, soundVolume, onSpinEnd]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-4 select-none">
      {/* Arcade / Digital Lottery Board */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 p-5 rounded-3xl shadow-2xl border-4 border-amber-300">
        {/* Flashing Marquee Bulbs */}
        <div className="absolute top-2 left-6 right-6 flex justify-between">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                isSpinning
                  ? i % 2 === 0
                    ? 'bg-yellow-200 shadow-md shadow-yellow-200 animate-ping'
                    : 'bg-red-400'
                  : 'bg-yellow-300 shadow-xs'
              }`}
            />
          ))}
        </div>

        {/* Machine Header */}
        <div className="text-center pt-3 pb-2">
          <span className="text-white font-display text-lg tracking-wider uppercase font-bold drop-shadow">
            MÁY CHỌN SỐ NGẪU NHIÊN
          </span>
        </div>

        {/* Big LED Number Display Window */}
        <div className="bg-slate-950 rounded-2xl p-6 border-4 border-amber-400 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle grid lines background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Number Label */}
          <span className="text-amber-400/80 text-xs font-semibold uppercase tracking-widest mb-1">
            SỐ THỨ TỰ
          </span>

          {/* Big Number Roll */}
          <div
            className={`font-mono tabular-nums text-7xl sm:text-8xl font-black transition-all ${
              isLocked
                ? 'text-yellow-400 scale-110 drop-shadow-[0_0_25px_rgba(250,204,21,0.8)]'
                : 'text-amber-300'
            }`}
          >
            {String(displayNumber).padStart(2, '0')}
          </div>

          {/* Rapid Name Display Banner */}
          <div className="mt-4 w-full bg-slate-900/90 rounded-xl px-4 py-2.5 border border-slate-700/80 text-center">
            <span className="text-xs text-slate-400 block mb-0.5">Học sinh tương ứng:</span>
            <span
              className={`font-display text-xl sm:text-2xl font-bold truncate block ${
                isLocked ? 'text-emerald-400' : 'text-slate-100'
              }`}
            >
              {displayName}
            </span>
          </div>
        </div>

        {/* Bottom Decorative Bulbs */}
        <div className="mt-4 flex justify-between px-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                isSpinning
                  ? i % 2 !== 0
                    ? 'bg-yellow-200 shadow-md shadow-yellow-200 animate-pulse'
                    : 'bg-amber-300'
                  : 'bg-yellow-300 shadow-xs'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="text-center mt-3 text-slate-500 text-xs sm:text-sm font-medium">
        Máy chọn số điện tử · Chạy số ngẫu nhiên tốc độ cao
      </div>
    </div>
  );
};
