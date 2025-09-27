import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';

interface ConfettiPiece {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
  color: string;
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#f97316'];

const Confetti: React.FC = () => {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 120 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 200,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size * 2,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            '--confetti-drift': `${piece.drift}px`,
          } as CSSProperties & { ['--confetti-drift']?: string }}
        />
      ))}
    </div>
  );
};

export default Confetti;
