import React from 'react';

interface WaterGlassProps {
  progress: number;
  currentAmount: number;
}

const WaterGlass: React.FC<WaterGlassProps> = ({ progress, currentAmount }) => {
  return (
    <>
      <style>{`
        @keyframes wave {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
      <div className="relative w-32 h-40 bg-white/10 rounded-t-lg rounded-b-2xl border-2 border-white/30 overflow-hidden shadow-inner flex flex-col items-center justify-center">
        {/* Water Container */}
        <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
          <div
            className="relative w-full bg-sky-300/80 transition-all duration-700 ease-out"
            style={{ height: `${progress}%` }}
          >
            {/* Wave effect */}
            <div
              className="absolute -bottom-1 left-1/2 w-[200%] h-[200%] bg-white/30 rounded-full"
              style={{ animation: 'wave 6s linear infinite' }}
            />
            <div
              className="absolute -bottom-2 left-1/2 w-[205%] h-[205%] bg-white/20 rounded-full"
              style={{ animation: 'wave 10s linear infinite alternate' }}
            />
          </div>
        </div>
        
        {/* Text overlay */}
        <div className="relative z-10 text-center text-shadow">
          <span className="text-4xl font-black tracking-tighter text-white" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.3)'}}>{currentAmount.toFixed(2)}</span>
          <span className="text-xl font-bold text-blue-100" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.3)'}}>L</span>
        </div>
      </div>
    </>
  );
};

export default WaterGlass;
