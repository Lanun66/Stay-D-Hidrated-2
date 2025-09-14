import React from 'react';
import WaterGlass from './WaterGlass';

interface WaterProgressProps {
  progress: number;
  currentAmount: number;
}

const WaterProgress: React.FC<WaterProgressProps> = ({ progress, currentAmount }) => {
  const radius = 90;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="absolute w-full h-full" viewBox="0 0 200 200">
        {/* Background Circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <WaterGlass progress={progress} currentAmount={currentAmount} />
    </div>
  );
};

export default WaterProgress;