
import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  style: React.CSSProperties;
}

const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const newPieces: ConfettiPiece[] = Array.from({ length: 100 }).map((_, i) => {
      const colors = ['#60a5fa', '#3b82f6', '#93c5fd', '#ffffff'];
      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 3 + 2}s`,
          animationDelay: `${Math.random() * 2}s`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          transform: `rotate(${Math.random() * 360}deg)`,
        },
      };
    });
    setPieces(newPieces);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fall {
          0% { top: -10%; opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 20px;
          opacity: 0;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden">
        {pieces.map(piece => (
          <div key={piece.id} className="confetti-piece" style={piece.style}></div>
        ))}
      </div>
    </>
  );
};

export default Confetti;
