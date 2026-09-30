import React, { useEffect, useRef, useState } from 'react';
import { Student } from '../../types';
import { playBalloonPop, playBallBounceSound } from '../../utils/soundEffects';

interface FloatingBalloonsProps {
  availableStudents: Student[];
  isSpinning: boolean;
  duration: number;
  soundEnabled: boolean;
  soundVolume: number;
  onSpinEnd: (winner: Student) => void;
}

interface BalloonItem {
  id: string;
  student: Student;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  swayOffset: number;
  popped: boolean;
}

const BALLOON_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'
];

export const FloatingBalloonsMode: React.FC<FloatingBalloonsProps> = ({
  availableStudents,
  isSpinning,
  duration,
  soundEnabled,
  soundVolume,
  onSpinEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const balloonsRef = useRef<BalloonItem[]>([]);
  const spinStartRef = useRef<number | null>(null);
  const targetWinnerRef = useRef<Student | null>(null);
  const hasPoppedRef = useRef(false);

  // Initialize balloon positions
  useEffect(() => {
    const width = 560;
    const height = 400;

    balloonsRef.current = availableStudents.map((st, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      return {
        id: st.id,
        student: st,
        x: 60 + (col * (width - 120)) / 4 + (Math.random() - 0.5) * 40,
        y: 80 + (row * (height - 150)) / 4 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.3 - Math.random() * 0.4,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        radius: 26,
        swayOffset: Math.random() * Math.PI * 2,
        popped: false,
      };
    });
  }, [availableStudents]);

  // Handle spin trigger
  useEffect(() => {
    if (isSpinning && availableStudents.length > 0) {
      spinStartRef.current = performance.now();
      hasPoppedRef.current = false;
      const winner = availableStudents[Math.floor(Math.random() * availableStudents.length)];
      targetWinnerRef.current = winner;
    }
  }, [isSpinning, availableStudents]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastSoundTime = 0;

    const render = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const balloons = balloonsRef.current;

      ctx.clearRect(0, 0, width, height);

      // Handle spinning vortex / targeting winner
      if (isSpinning && spinStartRef.current && targetWinnerRef.current) {
        const elapsed = (time - spinStartRef.current) / 1000;
        const totalDur = duration;

        if (elapsed < totalDur - 0.8) {
          // Whirl all balloons playfully
          balloons.forEach((b, idx) => {
            const angle = time * 0.003 + (idx * Math.PI * 2) / balloons.length;
            const targetX = width / 2 + Math.cos(angle) * 140;
            const targetY = height / 2 + Math.sin(angle) * 80;
            b.x += (targetX - b.x) * 0.08;
            b.y += (targetY - b.y) * 0.08;
          });

          if (soundEnabled && time - lastSoundTime > 180) {
            playBallBounceSound(soundVolume * 0.15);
            lastSoundTime = time;
          }
        } else {
          // Target balloon moves to center
          const targetBall = balloons.find(b => b.student.id === targetWinnerRef.current?.id);
          if (targetBall) {
            targetBall.x += (width / 2 - targetBall.x) * 0.15;
            targetBall.y += (height / 2 - targetBall.y) * 0.15;
            targetBall.radius = Math.min(48, targetBall.radius + 0.8); // inflate
          }

          if (elapsed >= totalDur && !hasPoppedRef.current) {
            hasPoppedRef.current = true;
            if (targetBall) targetBall.popped = true;

            if (soundEnabled) {
              playBalloonPop(soundVolume);
            }

            setTimeout(() => {
              if (targetWinnerRef.current) {
                onSpinEnd(targetWinnerRef.current);
              }
            }, 500);
          }
        }
      } else {
        // Idle gentle floating and buoyancy
        balloons.forEach((b) => {
          b.swayOffset += 0.02;
          b.y += b.vy;
          b.x += Math.sin(b.swayOffset) * 0.4;

          // Wrap around top/bottom
          if (b.y < -30) {
            b.y = height + 30;
          }
          if (b.x < 30) b.x = 30;
          if (b.x > width - 30) b.x = width - 30;
        });
      }

      // Draw all balloons
      balloons.forEach((b) => {
        if (b.popped) return;

        ctx.save();
        // 1. Balloon string
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radius * 1.15);
        ctx.quadraticCurveTo(
          b.x + Math.sin(time * 0.003 + b.swayOffset) * 10,
          b.y + b.radius * 1.15 + 20,
          b.x + Math.sin(time * 0.003 + b.swayOffset) * 5,
          b.y + b.radius * 1.15 + 40
        );
        ctx.stroke();

        // 2. Balloon tied knot
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.x - 3, b.y + b.radius * 1.15);
        ctx.lineTo(b.x + 3, b.y + b.radius * 1.15);
        ctx.lineTo(b.x, b.y + b.radius * 1.15 + 4);
        ctx.closePath();
        ctx.fill();

        // 3. Balloon Oval Body (3D Radial Gradient)
        const lightX = b.x - b.radius * 0.35;
        const lightY = b.y - b.radius * 0.35;
        const grad = ctx.createRadialGradient(lightX, lightY, b.radius * 0.1, b.x, b.y, b.radius);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.25, b.color);
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radius * 0.9, b.radius * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Specular gloss highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(b.x - b.radius * 0.35, b.y - b.radius * 0.4, b.radius * 0.25, b.radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // 5. Student Number on Balloon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.floor(b.radius * 0.65)}px "Be Vietnam Pro", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText(String(b.student.number), b.x, b.y);

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [availableStudents, isSpinning, duration, soundEnabled, soundVolume, onSpinEnd]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none">
      <div className="relative w-full max-w-[560px] aspect-[4/3] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={560}
          height={400}
          className="w-full h-full object-contain filter drop-shadow-sm"
        />

        {isSpinning && (
          <div className="absolute top-4 bg-sky-500/90 text-white font-display text-lg sm:text-xl px-5 py-1.5 rounded-full shadow-lg border border-sky-300 backdrop-blur-xs flex items-center gap-2 animate-bounce">
            <span className="inline-block w-3 h-3 rounded-full bg-white animate-ping" />
            Bóng bay đang bay lượn...
          </div>
        )}
      </div>

      <div className="text-center mt-1 text-slate-500 text-xs sm:text-sm font-medium">
        Bóng bay sắc màu · {availableStudents.length} quả bóng bay trên bầu trời
      </div>
    </div>
  );
};
