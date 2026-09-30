import React, { useEffect, useState, useRef } from 'react';
import { Student } from '../../types';
import { playBoxOpen, playBallBounceSound } from '../../utils/soundEffects';

interface MysteryBoxProps {
  availableStudents: Student[];
  isSpinning: boolean;
  duration: number;
  soundEnabled: boolean;
  soundVolume: number;
  onSpinEnd: (winner: Student) => void;
}

const BOX_COLORS = [
  { box: 'from-amber-400 to-amber-600', ribbon: 'bg-red-500', shadow: 'shadow-amber-500/20' },
  { box: 'from-rose-400 to-rose-600', ribbon: 'bg-amber-300', shadow: 'shadow-rose-500/20' },
  { box: 'from-sky-400 to-sky-600', ribbon: 'bg-yellow-300', shadow: 'shadow-sky-500/20' },
  { box: 'from-emerald-400 to-emerald-600', ribbon: 'bg-rose-400', shadow: 'shadow-emerald-500/20' },
  { box: 'from-purple-400 to-purple-600', ribbon: 'bg-amber-300', shadow: 'shadow-purple-500/20' },
  { box: 'from-indigo-400 to-indigo-600', ribbon: 'bg-emerald-300', shadow: 'shadow-indigo-500/20' },
  { box: 'from-pink-400 to-pink-600', ribbon: 'bg-sky-300', shadow: 'shadow-pink-500/20' },
  { box: 'from-teal-400 to-teal-600', ribbon: 'bg-amber-400', shadow: 'shadow-teal-500/20' },
];

export const MysteryBoxMode: React.FC<MysteryBoxProps> = ({
  availableStudents,
  isSpinning,
  duration,
  soundEnabled,
  soundVolume,
  onSpinEnd,
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [openedBoxIndex, setOpenedBoxIndex] = useState<number | null>(null);
  const [chosenStudent, setChosenStudent] = useState<Student | null>(null);
  const spinTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpinning && availableStudents.length > 0) {
      setOpenedBoxIndex(null);
      setChosenStudent(null);

      const winnerIdx = Math.floor(Math.random() * availableStudents.length);
      const winner = availableStudents[winnerIdx];
      setChosenStudent(winner);

      const startTime = performance.now();
      const totalMs = duration * 1000;

      let interval = 80;
      let currentIndex = 0;

      const cycleBoxes = () => {
        const elapsed = performance.now() - startTime;
        currentIndex = (currentIndex + 1) % availableStudents.length;
        setHighlightedIndex(currentIndex);

        if (soundEnabled && Math.random() > 0.4) {
          playBallBounceSound(soundVolume * 0.2);
        }

        if (elapsed < totalMs - 800) {
          // Accelerate or stay fast
          spinTimerRef.current = window.setTimeout(cycleBoxes, interval);
        } else if (elapsed < totalMs) {
          // Slow down before stopping on winner
          interval += 60;
          spinTimerRef.current = window.setTimeout(cycleBoxes, interval);
        } else {
          // Lock on winner!
          setHighlightedIndex(winnerIdx);
          setOpenedBoxIndex(winnerIdx);

          if (soundEnabled) {
            playBoxOpen(soundVolume);
          }

          setTimeout(() => {
            onSpinEnd(winner);
          }, 900);
        }
      };

      cycleBoxes();

      return () => {
        if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      };
    }
  }, [isSpinning, availableStudents, duration, soundEnabled, soundVolume, onSpinEnd]);

  // Click on a specific box directly if not currently spinning
  const handleBoxClick = (idx: number) => {
    if (isSpinning) return;
    const student = availableStudents[idx];
    if (!student) return;

    setHighlightedIndex(idx);
    setOpenedBoxIndex(idx);
    setChosenStudent(student);

    if (soundEnabled) {
      playBoxOpen(soundVolume);
    }

    setTimeout(() => {
      onSpinEnd(student);
    }, 700);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full select-none py-2">
      {/* Interactive Grid of Gift Boxes */}
      <div className="w-full max-w-2xl max-h-[380px] overflow-y-auto px-4 py-2">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
          {availableStudents.map((st, i) => {
            const isHighlighted = highlightedIndex === i;
            const isOpened = openedBoxIndex === i;
            const colorSet = BOX_COLORS[i % BOX_COLORS.length];

            return (
              <button
                key={st.id}
                onClick={() => handleBoxClick(i)}
                disabled={isSpinning}
                className={`group relative flex flex-col items-center transition-all duration-200 cursor-pointer ${
                  isHighlighted ? 'scale-115 -translate-y-2 z-20' : 'hover:scale-105 hover:-translate-y-1'
                } ${isOpened ? 'animate-bounce' : ''}`}
              >
                {/* 3D Box Body */}
                <div
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${colorSet.box} shadow-md ${colorSet.shadow} border-2 border-white/50 flex items-center justify-center overflow-hidden transition-transform`}
                >
                  {/* Ribbon cross */}
                  <div className={`absolute w-full h-2.5 ${colorSet.ribbon} top-1/2 -translate-y-1/2 shadow-xs`} />
                  <div className={`absolute h-full w-2.5 ${colorSet.ribbon} left-1/2 -translate-x-1/2 shadow-xs`} />

                  {/* Ribbon Bow on Top */}
                  <div className="absolute top-1 flex items-center justify-center z-10">
                    <span className="text-xs sm:text-sm">🎀</span>
                  </div>

                  {/* Number Badge */}
                  <div className="relative z-10 w-6 h-6 rounded-full bg-white/90 text-slate-800 font-bold text-xs flex items-center justify-center shadow-xs">
                    {st.number}
                  </div>

                  {/* Open Lid Effect */}
                  {isOpened && (
                    <div className="absolute inset-0 bg-yellow-300/80 backdrop-blur-xs flex items-center justify-center animate-ping">
                      ✨
                    </div>
                  )}
                </div>

                {/* Box Title / Preview */}
                <span className="mt-1 text-[11px] font-semibold text-slate-700 truncate max-w-[64px]">
                  Hộp {st.number}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-3 text-slate-500 text-xs sm:text-sm font-medium">
        {isSpinning
          ? 'Đang xáo trộn các hộp bí mật...'
          : 'Nhấn "Quay lồng cầu" để xáo trộn hoặc bấm trực tiếp vào một hộp quà!'}
      </div>
    </div>
  );
};
