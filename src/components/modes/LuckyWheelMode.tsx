import React, { useEffect, useRef, useState } from 'react';
import { Student } from '../../types';
import { playWheelTick } from '../../utils/soundEffects';

interface LuckyWheelProps {
  availableStudents: Student[];
  isSpinning: boolean;
  duration: number; // in seconds
  soundEnabled: boolean;
  soundVolume: number;
  onSpinEnd: (winner: Student) => void;
}

const SLICE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
  '#84CC16', '#E11D48', '#0EA5E9', '#A855F7', '#EAB308'
];

export const LuckyWheelMode: React.FC<LuckyWheelProps> = ({
  availableStudents,
  isSpinning,
  duration,
  soundEnabled,
  soundVolume,
  onSpinEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const spinStartRef = useRef<number | null>(null);
  const targetRotationRef = useRef<number | null>(null);
  const hasEndedRef = useRef(false);
  const lastTickAngleRef = useRef(0);
  const [selectedWinner, setSelectedWinner] = useState<Student | null>(null);

  // Pick winner & compute target landing angle when spin starts
  useEffect(() => {
    if (isSpinning && availableStudents.length > 0) {
      hasEndedRef.current = false;
      spinStartRef.current = performance.now();

      const winnerIndex = Math.floor(Math.random() * availableStudents.length);
      const winner = availableStudents[winnerIndex];
      setSelectedWinner(winner);

      const numSlices = availableStudents.length;
      const sliceAngle = (Math.PI * 2) / numSlices;

      // Pointer is at the top (-PI/2)
      // Angle inside wheel slice: [i * sliceAngle, (i + 1) * sliceAngle]
      // We want slice `winnerIndex` to center at -PI/2
      const sliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
      const targetBase = -Math.PI / 2 - sliceCenter;

      // Add 8-12 full rotations
      const extraSpins = (6 + Math.floor(Math.random() * 4)) * Math.PI * 2;
      // Slight random offset inside slice (-0.3 to +0.3 of slice width)
      const randomJitter = (Math.random() - 0.5) * sliceAngle * 0.5;

      const currentNorm = rotationRef.current % (Math.PI * 2);
      targetRotationRef.current = rotationRef.current + extraSpins + (targetBase - currentNorm) + randomJitter;
    }
  }, [isSpinning, availableStudents]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startAngle = rotationRef.current;

    const render = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 25;

      const numSlices = Math.max(1, availableStudents.length);
      const sliceAngle = (Math.PI * 2) / numSlices;

      if (isSpinning && spinStartRef.current && targetRotationRef.current !== null) {
        const elapsed = (time - spinStartRef.current) / 1000;
        const totalDuration = duration;
        const progress = Math.min(1, elapsed / totalDuration);

        // Quintic ease out for a dramatic tension wheel stop
        const ease = 1 - Math.pow(1 - progress, 4.5);
        rotationRef.current = startAngle + (targetRotationRef.current - startAngle) * ease;

        // Sound ticker check
        const currentRot = rotationRef.current;
        const angleDiff = Math.abs(currentRot - lastTickAngleRef.current);
        if (angleDiff >= sliceAngle) {
          if (soundEnabled) {
            playWheelTick(soundVolume * 0.4);
          }
          lastTickAngleRef.current = currentRot;
        }

        if (progress >= 1 && !hasEndedRef.current && selectedWinner) {
          hasEndedRef.current = true;
          setTimeout(() => {
            onSpinEnd(selectedWinner);
          }, 300);
        }
      } else if (!isSpinning) {
        startAngle = rotationRef.current;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw outer glowing drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Outer Golden Marquee Ring with Bulbs
      ctx.save();
      const ringGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      ringGrad.addColorStop(0, '#FEF08A');
      ringGrad.addColorStop(0.3, '#F59E0B');
      ringGrad.addColorStop(0.7, '#D97706');
      ringGrad.addColorStop(1, '#B45309');

      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
      ctx.fill();

      // Marquee Bulbs
      const numBulbs = 24;
      for (let i = 0; i < numBulbs; i++) {
        const bAngle = (i * Math.PI * 2) / numBulbs;
        const bx = cx + Math.cos(bAngle) * (radius + 5);
        const by = cy + Math.sin(bAngle) * (radius + 5);
        const isLit = (Math.floor(time / 180) + i) % 2 === 0;

        ctx.fillStyle = isLit ? '#FFFFFF' : '#FEF08A';
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Draw Slices
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationRef.current);

      for (let i = 0; i < numSlices; i++) {
        const student = availableStudents[i];
        const sStart = i * sliceAngle;
        const sEnd = (i + 1) * sliceAngle;
        const color = SLICE_COLORS[i % SLICE_COLORS.length];

        // Slice wedge
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, sStart, sEnd);
        ctx.closePath();
        ctx.fill();

        // Wedge separator border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Wedge Text (Student Name & Number)
        ctx.save();
        const midAngle = sStart + sliceAngle / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;

        // Truncate name if too long to fit wedge
        const fontSize = Math.max(11, Math.min(15, Math.floor(280 / Math.sqrt(numSlices))));
        ctx.font = `bold ${fontSize}px "Be Vietnam Pro", sans-serif`;
        const displayName = student ? `${student.number}. ${student.name}` : `${i + 1}`;
        ctx.fillText(displayName, radius - 18, 0);
        ctx.restore();
      }

      ctx.restore(); // restore wheel rotation

      // 4. Center Golden Hub
      ctx.save();
      const hubGrad = ctx.createRadialGradient(cx - 4, cy - 4, 3, cx, cy, 32);
      hubGrad.addColorStop(0, '#FEF08A');
      hubGrad.addColorStop(0.5, '#F59E0B');
      hubGrad.addColorStop(1, '#92400E');

      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center Star or Icon
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', cx, cy + 1);
      ctx.restore();

      // 5. Top Pointer Indicator (Arrow pointing downward)
      ctx.save();
      const pointerY = cy - radius - 12;

      // Pointer drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(cx, pointerY + 28);
      ctx.lineTo(cx - 16, pointerY - 4);
      ctx.lineTo(cx + 16, pointerY - 4);
      ctx.closePath();
      ctx.fill();

      // Golden Metallic Pointer
      const pGrad = ctx.createLinearGradient(cx - 14, pointerY, cx + 14, pointerY + 26);
      pGrad.addColorStop(0, '#DC2626');
      pGrad.addColorStop(0.5, '#EF4444');
      pGrad.addColorStop(1, '#B91C1C');

      ctx.fillStyle = pGrad;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, pointerY + 26);
      ctx.lineTo(cx - 14, pointerY - 6);
      ctx.lineTo(cx + 14, pointerY - 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Indicator Pivot Dot
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(cx, pointerY - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [availableStudents, isSpinning, duration, soundEnabled, soundVolume, onSpinEnd, selectedWinner]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none">
      <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="w-full h-full object-contain filter drop-shadow-md"
        />

        {isSpinning && (
          <div className="absolute top-4 bg-rose-500/90 text-white font-display text-lg sm:text-xl px-5 py-1.5 rounded-full shadow-lg border border-rose-300 backdrop-blur-xs flex items-center gap-2 animate-bounce">
            <span className="inline-block w-3 h-3 rounded-full bg-white animate-ping" />
            Vòng quay đang quay...
          </div>
        )}
      </div>

      <div className="text-center mt-1 text-slate-500 text-xs sm:text-sm font-medium">
        Vòng quay may mắn · {availableStudents.length} học sinh trên các ô
      </div>
    </div>
  );
};
