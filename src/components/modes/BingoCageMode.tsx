import React, { useEffect, useRef, useState } from 'react';
import { Student } from '../../types';
import { playBallBounceSound, playBallDropChute } from '../../utils/soundEffects';

interface BingoCageProps {
  students: Student[];
  availableStudents: Student[];
  isSpinning: boolean;
  selectedStudent: Student | null;
  duration: number; // in seconds
  soundEnabled: boolean;
  soundVolume: number;
  onSpinEnd: (winner: Student) => void;
}

interface Ball3D {
  id: string;
  student: Student;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotAngle: number;
  rotSpeed: number;
  radius: number;
  color: string;
  number: number;
  name: number | string;
}

const BALL_PALETTE = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export const BingoCageMode: React.FC<BingoCageProps> = ({
  availableStudents,
  isSpinning,
  duration,
  soundEnabled,
  soundVolume,
  onSpinEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball3D[]>([]);
  const rotationAngleRef = useRef(0);
  const rotationSpeedRef = useRef(0.015);
  const spinStartTimeRef = useRef<number | null>(null);
  const hasTriggeredEndRef = useRef(false);
  const chuteBallRef = useRef<{
    ball: Ball3D;
    progress: number; // 0 to 1 down chute
    zoomProgress: number; // 0 to 1 towards camera
  } | null>(null);

  const [hoveredBallStudent, setHoveredBallStudent] = useState<Student | null>(null);

  // Initialize or update balls based on available students
  useEffect(() => {
    const cageRadius = 140;
    const ballRadius = Math.max(16, Math.min(24, Math.floor(220 / Math.sqrt(Math.max(1, availableStudents.length)))));

    // Create a ball for each available student
    const newBalls: Ball3D[] = availableStudents.map((st, i) => {
      const existing = ballsRef.current.find(b => b.student.id === st.id);
      if (existing) {
        return {
          ...existing,
          radius: ballRadius,
          student: st,
          number: st.number,
        };
      }

      // Initial distributed position inside lower-middle sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI * 0.4) + Math.PI * 0.5; // lower half
      const r = Math.random() * (cageRadius - ballRadius - 20) + 15;

      return {
        id: st.id,
        student: st,
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi) + 25,
        z: r * Math.sin(phi) * Math.sin(theta),
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        vz: (Math.random() - 0.5) * 20,
        rotAngle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        radius: ballRadius,
        color: BALL_PALETTE[i % BALL_PALETTE.length],
        number: st.number,
        name: st.number,
      };
    });

    ballsRef.current = newBalls;
  }, [availableStudents]);

  // Handle spin state triggers
  useEffect(() => {
    if (isSpinning) {
      spinStartTimeRef.current = performance.now();
      hasTriggeredEndRef.current = false;
      chuteBallRef.current = null;
    }
  }, [isSpinning]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let lastBounceSoundTime = 0;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.033);
      lastTime = currentTime;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2 - 15;
      const cageRadius = 145;

      // Handle spinning physics and speed ramping
      if (isSpinning && spinStartTimeRef.current) {
        const elapsedSec = (currentTime - spinStartTimeRef.current) / 1000;
        const totalDuration = duration;

        if (elapsedSec < totalDuration * 0.7) {
          // Fast energetic spin
          const ramp = Math.min(1, elapsedSec / 0.6);
          // 0.15 rad per frame ~ 9 rad/s
          rotationSpeedRef.current = 0.04 + 0.14 * ramp;
        } else if (elapsedSec < totalDuration) {
          // Deceleration phase
          const slowDownFactor = 1 - (elapsedSec - totalDuration * 0.7) / (totalDuration * 0.3);
          rotationSpeedRef.current = 0.025 + 0.15 * Math.max(0, slowDownFactor);
        } else {
          // Spin completed, select winning ball
          rotationSpeedRef.current = 0.015;
          if (!hasTriggeredEndRef.current && availableStudents.length > 0) {
            hasTriggeredEndRef.current = true;
            const winnerIndex = Math.floor(Math.random() * availableStudents.length);
            const winnerStudent = availableStudents[winnerIndex];
            const winningBall = ballsRef.current.find(b => b.student.id === winnerStudent.id) || ballsRef.current[0];

            if (winningBall) {
              chuteBallRef.current = {
                ball: winningBall,
                progress: 0,
                zoomProgress: 0,
              };

              if (soundEnabled) {
                playBallDropChute(soundVolume);
              }

              setTimeout(() => {
                onSpinEnd(winnerStudent);
              }, 1200);
            }
          }
        }
      } else {
        // Idle gentle rotation
        rotationSpeedRef.current = 0.008;
      }

      // Update cage angle
      rotationAngleRef.current += rotationSpeedRef.current;
      const angle = rotationAngleRef.current;
      const omega = rotationSpeedRef.current / Math.max(dt, 0.001); // rad/sec

      // REAL ROTARY LOTTERY PHYSICS WITH INTERNAL LIFTER VANES
      const balls = ballsRef.current;
      const gravity = 380; // px/s^2 downwards
      const maxCageDist = cageRadius - 4;

      // 2 Internal lifter vanes (scoops attached to cage at angle & angle + PI)
      const vaneAngles = [angle % (Math.PI * 2), (angle + Math.PI) % (Math.PI * 2)];

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];

        // Skip ball if currently rolling down chute
        if (chuteBallRef.current && chuteBallRef.current.ball.id === b.id) {
          continue;
        }

        // 1. Gravity
        b.vy += gravity * dt;

        // 2. Continuous Rotational Drag from Outer Wire Wall
        const distFromCenter = Math.sqrt(b.x * b.x + b.y * b.y);
        const normDist = distFromCenter / cageRadius;

        if (normDist > 0.6) {
          // Tangential velocity of a clockwise rotating point (x, y) is: (-omega * y, omega * x)
          const tanVx = -omega * b.y * 0.45;
          const tanVy = omega * b.x * 0.45;

          // Drag ball toward tangential wall velocity
          const gripStrength = Math.min(1.0, (normDist - 0.6) * 2.5) * (isSpinning ? 8.0 : 3.0);
          b.vx += (tanVx - b.vx) * gripStrength * dt;
          b.vy += (tanVy - b.vy) * gripStrength * dt;
        }

        // 3. Internal Lifter Vanes (Curved scoops that lift balls upward)
        if (distFromCenter > 30 && distFromCenter < cageRadius * 0.95) {
          let ballAngle = Math.atan2(b.y, b.x);
          if (ballAngle < 0) ballAngle += Math.PI * 2;

          for (const va of vaneAngles) {
            let diff = ballAngle - va;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            // If ball is right in front of the scoop vane sweeping around
            if (diff >= -0.35 && diff <= 0.25) {
              // Vane pushes the ball forward along the rotation direction
              const sweepSpeed = omega * distFromCenter * 0.85;
              const perpX = -Math.sin(va) * sweepSpeed;
              const perpY = Math.cos(va) * sweepSpeed;

              b.vx += (perpX - b.vx) * 0.65;
              b.vy += (perpY - b.vy) * 0.65 - (isSpinning ? 40 : 10); // upward scoop boost!
              b.vz += (Math.random() - 0.5) * (isSpinning ? 70 : 20); // 3D depth turbulence
              b.rotSpeed += (Math.random() - 0.5) * 0.3;

              if (isSpinning && soundEnabled && currentTime - lastBounceSoundTime > 80) {
                playBallBounceSound(soundVolume * 0.2);
                lastBounceSoundTime = currentTime;
              }
            }
          }
        }

        // 4. Update Position
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;

        // 5. Ball 3D Spin rotation
        b.rotAngle += b.rotSpeed;
        b.rotSpeed *= 0.985;
        // Ball rolling without slipping on surface
        b.rotSpeed += (b.vx + b.vy) * 0.0015;

        // 6. Air resistance
        b.vx *= 0.992;
        b.vy *= 0.992;
        b.vz *= 0.992;

        // 7. Spherical Boundary Collision
        const currentDistSq = b.x * b.x + b.y * b.y + b.z * b.z;
        const maxRadius = maxCageDist - b.radius;
        if (currentDistSq > maxRadius * maxRadius) {
          const currentDist = Math.sqrt(currentDistSq);
          const nx = b.x / currentDist;
          const ny = b.y / currentDist;
          const nz = b.z / currentDist;

          // Push back inside
          b.x = nx * maxRadius;
          b.y = ny * maxRadius;
          b.z = nz * maxRadius;

          // Elastic reflection
          const dot = b.vx * nx + b.vy * ny + b.vz * nz;
          const restitution = isSpinning ? 0.82 : 0.65;
          b.vx = (b.vx - (1 + restitution) * dot * nx);
          b.vy = (b.vy - (1 + restitution) * dot * ny);
          b.vz = (b.vz - (1 + restitution) * dot * nz);

          // Add slight chaotic scatter on wall bounce
          if (isSpinning) {
            b.vx += (Math.random() - 0.5) * 35;
            b.vy += (Math.random() - 0.5) * 35;
            b.vz += (Math.random() - 0.5) * 35;
            b.rotSpeed += (Math.random() - 0.5) * 0.25;

            if (soundEnabled && currentTime - lastBounceSoundTime > 90) {
              playBallBounceSound(soundVolume * 0.25);
              lastBounceSoundTime = currentTime;
            }
          }
        }

        // 8. Ball-to-Ball Pairwise Collisions
        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          const dx = b2.x - b.x;
          const dy = b2.y - b.y;
          const dz = b2.z - b.z;
          const dist2 = dx * dx + dy * dy + dz * dz;
          const minDist = b.radius + b2.radius;

          if (dist2 < minDist * minDist && dist2 > 0.001) {
            const d = Math.sqrt(dist2);
            const nx = dx / d;
            const ny = dy / d;
            const nz = dz / d;
            const overlap = (minDist - d) * 0.5;

            b.x -= nx * overlap;
            b.y -= ny * overlap;
            b.z -= nz * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;
            b2.z += nz * overlap;

            const relVel = (b2.vx - b.vx) * nx + (b2.vy - b.vy) * ny + (b2.vz - b.vz) * nz;
            if (relVel < 0) {
              const impulse = -1.8 * relVel;
              b.vx -= impulse * nx * 0.5;
              b.vy -= impulse * ny * 0.5;
              b.vz -= impulse * nz * 0.5;
              b2.vx += impulse * nx * 0.5;
              b2.vy += impulse * ny * 0.5;
              b2.vz += impulse * nz * 0.5;

              b.rotSpeed += (Math.random() - 0.5) * 0.15;
              b2.rotSpeed += (Math.random() - 0.5) * 0.15;
            }
          }
        }
      }

      // --- CLEAR CANVAS ---
      ctx.clearRect(0, 0, width, height);

      // --- DRAW WARM LUMINOUS STAGE BACKDROP (Removes any dark feeling) ---
      ctx.save();
      const stageAura = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        cageRadius + 60
      );
      stageAura.addColorStop(0, 'rgba(254, 243, 199, 0.65)'); // Warm bright sunny golden amber
      stageAura.addColorStop(0.5, 'rgba(253, 230, 138, 0.35)');
      stageAura.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = stageAura;
      ctx.beginPath();
      ctx.arc(centerX, centerY, cageRadius + 60, 0, Math.PI * 2);
      ctx.fill();

      // Soft ground contact shadow under legs
      const shadowGrad = ctx.createRadialGradient(
        centerX,
        centerY + cageRadius + 75,
        10,
        centerX,
        centerY + cageRadius + 75,
        220
      );
      shadowGrad.addColorStop(0, 'rgba(180, 83, 9, 0.18)');
      shadowGrad.addColorStop(0.6, 'rgba(180, 83, 9, 0.05)');
      shadowGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + cageRadius + 75, 210, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- 1. DRAW BACK STAND (A-frame legs behind cage) ---
      drawStandLegs(ctx, centerX, centerY, cageRadius, false);

      // --- 2. DRAW BACK HALF OF ROTATING WIRE CAGE (z < 0) ---
      drawWireCage(ctx, centerX, centerY, cageRadius, angle, false);

      // --- 3. DRAW INTERNAL ROTATING LIFTER VANES (Thanh gạt đảo bóng) ---
      drawLifterVanes(ctx, centerX, centerY, cageRadius, angle);

      // --- 4. DRAW BALLS (Sorted by z coordinate for true depth) ---
      const sortedBalls = [...balls].sort((a, b) => a.z - b.z);
      for (const b of sortedBalls) {
        if (chuteBallRef.current && chuteBallRef.current.ball.id === b.id) {
          continue; // Draw separately in chute
        }
        drawBall(ctx, centerX + b.x, centerY + b.y, b.z, b.radius, b.color, b.number, b.rotAngle);
      }

      // --- 5. DRAW FRONT HALF OF ROTATING WIRE CAGE (z >= 0) with metallic highlights ---
      drawWireCage(ctx, centerX, centerY, cageRadius, angle, true);

      // --- 6. DRAW FRONT STAND & ROTATING CRANK HANDLE ---
      drawStandLegs(ctx, centerX, centerY, cageRadius, true);
      drawCrankHandle(ctx, centerX + cageRadius + 22, centerY, angle);

      // --- 7. DRAW EXIT CHUTE & TRAY (Right bottom side) ---
      drawExitChute(ctx, centerX, centerY, cageRadius);

      // --- 8. ANIMATE & DRAW WINNING BALL IN CHUTE / ZOOM ---
      if (chuteBallRef.current) {
        const item = chuteBallRef.current;
        if (item.progress < 1) {
          item.progress = Math.min(1, item.progress + dt * 2.5);
        } else if (item.zoomProgress < 1) {
          item.zoomProgress = Math.min(1, item.zoomProgress + dt * 1.8);
        }

        drawChuteAndZoomBall(ctx, centerX, centerY, cageRadius, item);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [availableStudents, isSpinning, duration, soundEnabled, soundVolume, onSpinEnd]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full select-none">
      {/* Canvas container with responsive sizing */}
      <div className="relative w-full max-w-[560px] aspect-[4/3] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={560}
          height={420}
          className="w-full h-full object-contain filter drop-shadow-md"
        />

        {/* Floating status badge when spinning */}
        {isSpinning && (
          <div className="absolute top-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display text-lg sm:text-xl px-6 py-2 rounded-full shadow-xl border-2 border-yellow-200 backdrop-blur-xs flex items-center gap-2.5 animate-bounce">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-white animate-ping" />
            <span className="font-extrabold tracking-wide drop-shadow">Đang quay lồng cầu xổ số...</span>
          </div>
        )}

        {/* Hover preview if available */}
        {hoveredBallStudent && !isSpinning && (
          <div className="absolute bottom-2 bg-slate-900/85 text-white text-sm px-4 py-1.5 rounded-lg pointer-events-none shadow backdrop-blur-xs">
            Học sinh: <span className="font-semibold text-amber-300">{hoveredBallStudent.name}</span> (Số: {hoveredBallStudent.number})
          </div>
        )}
      </div>

      <div className="text-center mt-1 text-amber-900/80 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        Lồng cầu quay số vật lý 3D chân thực · {availableStudents.length} quả bóng đang đảo cuộn
      </div>
    </div>
  );
};

// Helper function: Draw Internal Rotating Lifter Vanes (Thanh gạt đảo bóng bên trong)
function drawLifterVanes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number
) {
  ctx.save();
  const vaneAngles = [angle, angle + Math.PI];

  for (const va of vaneAngles) {
    const innerR = radius * 0.2;
    const outerR = radius * 0.94;
    const x1 = cx + Math.cos(va) * innerR;
    const y1 = cy + Math.sin(va) * innerR;

    // Curved scoop vane
    const midAngle = va + 0.32;
    const cpX = cx + Math.cos(midAngle) * (radius * 0.62);
    const cpY = cy + Math.sin(midAngle) * (radius * 0.62);
    const x2 = cx + Math.cos(va + 0.42) * outerR;
    const y2 = cy + Math.sin(va + 0.42) * outerR;

    // Vane Spine
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpX, cpY, x2, y2);
    ctx.stroke();

    // Vane Golden Highlight
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 1);
    ctx.quadraticCurveTo(cpX, cpY - 1, x2, y2 - 1);
    ctx.stroke();

    // Vane wire mesh teeth / scoop ribs
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
    ctx.lineWidth = 1.8;
    for (let t = 0.25; t <= 0.85; t += 0.2) {
      const rx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpX + t * t * x2;
      const ry = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpY + t * t * y2;
      const perpAngle = va + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(perpAngle) * 12, ry + Math.sin(perpAngle) * 12);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Helper function: Draw realistic metallic A-frame stand
function drawStandLegs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  isFront: boolean
) {
  ctx.save();
  const legSpread = r + 45;
  const baseY = cy + r + 68;

  if (!isFront) {
    // Back support bar connecting left and right base
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx - legSpread, baseY);
    ctx.lineTo(cx + legSpread, baseY);
    ctx.stroke();

    // Metallic highlight on bar
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - legSpread, baseY - 2);
    ctx.lineTo(cx + legSpread, baseY - 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // FRONT A-FRAME LEGS (Left & Right)
  const drawOneLeg = (baseX: number, pivotX: number) => {
    // Leg drop shadow
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.25)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pivotX, cy);
    ctx.lineTo(baseX, baseY);
    ctx.stroke();

    // Metallic Gradient for Leg
    const legGrad = ctx.createLinearGradient(pivotX, cy, baseX, baseY);
    legGrad.addColorStop(0, '#FEF08A');
    legGrad.addColorStop(0.3, '#F59E0B');
    legGrad.addColorStop(0.7, '#D97706');
    legGrad.addColorStop(1, '#78350F');

    ctx.strokeStyle = legGrad;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pivotX, cy);
    ctx.lineTo(baseX, baseY);
    ctx.stroke();

    // Rubber foot stopper at the base
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(baseX - 18, baseY - 3, 36, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.roundRect(baseX - 16, baseY - 1, 32, 4, 2);
    ctx.fill();
  };

  // Left Leg
  drawOneLeg(cx - legSpread, cx - r - 10);
  // Right Leg
  drawOneLeg(cx + legSpread, cx + r + 10);

  // Central Axle Hub Caps (Golden Brass Bearing)
  const drawBearing = (px: number) => {
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(px, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    const hubGrad = ctx.createRadialGradient(px - 3, cy - 3, 2, px, cy, 12);
    hubGrad.addColorStop(0, '#FEF08A');
    hubGrad.addColorStop(0.6, '#F59E0B');
    hubGrad.addColorStop(1, '#92400E');
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(px, cy, 11, 0, Math.PI * 2);
    ctx.fill();

    // Inner bolt
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(px, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  drawBearing(cx - r - 10);
  drawBearing(cx + r + 10);

  ctx.restore();
}

// Helper function: Draw Rotating 3D Wire Cage (Parallels & Meridians)
function drawWireCage(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotationAngle: number,
  isFront: boolean
) {
  ctx.save();

  // Color styling: Bright shining brass wire
  const wireColor = isFront ? 'rgba(217, 119, 6, 0.85)' : 'rgba(217, 119, 6, 0.3)';
  const rimColor = isFront ? 'rgba(245, 158, 11, 0.98)' : 'rgba(217, 119, 6, 0.45)';
  const wireWidth = isFront ? 2.4 : 1.4;

  ctx.strokeStyle = wireColor;
  ctx.lineWidth = wireWidth;

  // 1. Horizontal Latitude Rings (Parallels)
  const latitudeSteps = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75];
  for (const lat of latitudeSteps) {
    const ringY = cy + lat * radius;
    const ringR = Math.sqrt(Math.max(0, radius * radius - (lat * radius) * (lat * radius)));
    if (ringR < 10) continue;

    ctx.beginPath();
    const tilt = 0.28;
    if (isFront) {
      // Front half of horizontal ring
      ctx.ellipse(cx, ringY, ringR, ringR * tilt, 0, 0, Math.PI);
    } else {
      // Back half of horizontal ring
      ctx.ellipse(cx, ringY, ringR, ringR * tilt, 0, Math.PI, Math.PI * 2);
    }
    ctx.stroke();
  }

  // 2. Rotating Longitudinal Meridians (Ellipses rotating in 3D)
  const numMeridians = 14;
  for (let i = 0; i < numMeridians; i++) {
    const angle = rotationAngle + (i * Math.PI) / numMeridians;
    const cosVal = Math.cos(angle);
    const sinVal = Math.sin(angle);

    const isMeridianFront = sinVal >= 0;
    if (isMeridianFront !== isFront) continue;

    const currentWidth = Math.abs(cosVal) * radius;

    ctx.beginPath();
    ctx.ellipse(cx, cy, currentWidth, radius, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Main Center Outer Rim / Equator Belt (drawn in front phase)
  if (isFront) {
    // Outer golden circumference ring
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Brilliant golden rim highlight overlay
    const ringGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    ringGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    ringGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
    ringGrad.addColorStop(1, 'rgba(180, 83, 9, 0.9)');
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Central horizontal axle wire
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    // Axle golden highlight
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy - 1);
    ctx.lineTo(cx + radius, cy - 1);
    ctx.stroke();
  }

  ctx.restore();
}

// Helper function: Draw Rotating Crank Handle with wooden knob
function drawCrankHandle(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  rotationAngle: number
) {
  ctx.save();
  const crankLength = 48;
  const handleX = pivotX + Math.cos(rotationAngle) * crankLength;
  const handleY = pivotY + Math.sin(rotationAngle) * crankLength;

  // Crank Arm (Metallic Bar)
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();

  // Crank Arm Highlight
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();

  // Pivot Collar
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Wooden Knob / Grip (Rotating outward)
  const knobGrad = ctx.createRadialGradient(handleX - 3, handleY - 3, 2, handleX, handleY, 12);
  knobGrad.addColorStop(0, '#FEF08A');
  knobGrad.addColorStop(0.4, '#F59E0B');
  knobGrad.addColorStop(0.8, '#B45309');
  knobGrad.addColorStop(1, '#78350F');
  ctx.fillStyle = knobGrad;
  ctx.beginPath();
  ctx.arc(handleX, handleY, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// Helper function: Draw Curved Exit Chute & Ball Collector Tray
function drawExitChute(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  const chuteStartX = cx + radius * 0.45;
  const chuteStartY = cy + radius * 0.82;
  const chuteEndX = cx + radius * 0.95;
  const chuteEndY = cy + radius + 35;

  // Chute outer shadow
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.15)';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(chuteStartX, chuteStartY + 4);
  ctx.quadraticCurveTo(chuteStartX + 30, chuteEndY, chuteEndX, chuteEndY + 4);
  ctx.stroke();

  // Chute curved rails (twin brass rails)
  const railGrad = ctx.createLinearGradient(chuteStartX, chuteStartY, chuteEndX, chuteEndY);
  railGrad.addColorStop(0, '#FEF08A');
  railGrad.addColorStop(0.5, '#F59E0B');
  railGrad.addColorStop(1, '#B45309');

  // Upper Rail
  ctx.strokeStyle = railGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(chuteStartX, chuteStartY);
  ctx.quadraticCurveTo(chuteStartX + 30, chuteEndY - 12, chuteEndX, chuteEndY - 12);
  ctx.stroke();

  // Lower Rail
  ctx.strokeStyle = railGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(chuteStartX - 5, chuteStartY + 14);
  ctx.quadraticCurveTo(chuteStartX + 25, chuteEndY + 2, chuteEndX - 5, chuteEndY + 2);
  ctx.stroke();

  // Cross ribs on chute
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2.5;
  const steps = [0.2, 0.5, 0.8];
  for (const s of steps) {
    const rx1 = chuteStartX + (chuteEndX - chuteStartX) * s;
    const ry1 = chuteStartY + (chuteEndY - chuteStartY) * s - 8;
    ctx.beginPath();
    ctx.moveTo(rx1, ry1);
    ctx.lineTo(rx1 - 3, ry1 + 14);
    ctx.stroke();
  }

  // End Stop Cup
  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.arc(chuteEndX + 6, chuteEndY - 4, 10, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fill();

  ctx.restore();
}

// Helper function: Draw a single 3D shaded ball with rotating number badge
function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  radius: number,
  color: string,
  number: number,
  rotAngle: number
) {
  ctx.save();

  // Scale subtly with z for 3D depth perception
  const scale = 1 + z * 0.0016;
  const drawR = Math.max(8, radius * scale);

  // Ball Drop Shadow inside cage
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + drawR * 0.85, drawR * 0.9, drawR * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball Body: 3D Radial Gradient with light source at top-left
  const lightX = x - drawR * 0.35;
  const lightY = y - drawR * 0.35;
  const ballGrad = ctx.createRadialGradient(lightX, lightY, drawR * 0.1, x, y, drawR);
  ballGrad.addColorStop(0, '#FFFFFF'); // Specular highlight
  ballGrad.addColorStop(0.2, color); // Pure color
  ballGrad.addColorStop(0.85, adjustColorBrightness(color, -22)); // Core shadow
  ballGrad.addColorStop(1, adjustColorBrightness(color, -45)); // Edge rim shadow

  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(x, y, drawR, 0, Math.PI * 2);
  ctx.fill();

  // White Circular Number Badge on Ball (Rotates with ball rotation!)
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotAngle);

  const badgeR = drawR * 0.52;
  const badgeGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, badgeR);
  badgeGrad.addColorStop(0, '#FFFFFF');
  badgeGrad.addColorStop(0.85, '#F8FAFC');
  badgeGrad.addColorStop(1, '#E2E8F0');

  ctx.fillStyle = badgeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Number Text
  ctx.fillStyle = '#0F172A';
  ctx.font = `bold ${Math.floor(badgeR * 1.05)}px "Be Vietnam Pro", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), 0, 1);
  ctx.restore();

  // Glossy glass shine reflection on top
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x - drawR * 0.28, y - drawR * 0.32, drawR * 0.4, drawR * 0.2, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Helper: Animate ball rolling down chute and dramatic zoom-out
function drawChuteAndZoomBall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  item: {
    ball: Ball3D;
    progress: number;
    zoomProgress: number;
  }
) {
  const chuteStartX = cx + radius * 0.45;
  const chuteStartY = cy + radius * 0.82;
  const chuteEndX = cx + radius * 0.95;
  const chuteEndY = cy + radius + 35;

  let currentX: number;
  let currentY: number;
  let currentRadius = item.ball.radius;

  if (item.progress < 1) {
    // Rolling down chute
    const t = item.progress;
    const cpX = chuteStartX + 30;
    const cpY = chuteEndY - 6;
    currentX = (1 - t) * (1 - t) * chuteStartX + 2 * (1 - t) * t * cpX + t * t * chuteEndX;
    currentY = (1 - t) * (1 - t) * chuteStartY + 2 * (1 - t) * t * cpY + t * t * chuteEndY;
  } else {
    // Zooming out towards screen center
    const zt = item.zoomProgress;
    const easeZ = 1 - Math.pow(1 - zt, 3);
    const targetCenterX = cx;
    const targetCenterY = cy - 20;

    currentX = chuteEndX + (targetCenterX - chuteEndX) * easeZ;
    currentY = chuteEndY + (targetCenterY - chuteEndY) * easeZ;
    currentRadius = item.ball.radius * (1 + easeZ * 2.8);
  }

  // Draw winning ball with bright glowing halo
  ctx.save();
  if (item.zoomProgress > 0) {
    const haloGrad = ctx.createRadialGradient(
      currentX,
      currentY,
      currentRadius * 0.8,
      currentX,
      currentY,
      currentRadius * 2.2
    );
    haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
    haloGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
    haloGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBall(ctx, currentX, currentY, 150, currentRadius, item.ball.color, item.ball.number, item.ball.rotAngle);
  ctx.restore();
}

// Utility to lighten/darken hex colors for 3D shading
function adjustColorBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  let r = (num >> 16) + Math.round(2.55 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(2.55 * percent);
  let b = (num & 0x0000ff) + Math.round(2.55 * percent);

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
