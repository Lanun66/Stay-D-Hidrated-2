import React from 'react';

interface PartnerProgressProps {
    name: string;
    current: number;
    target: number;
    progress: number;
}

const PartnerProgress: React.FC<PartnerProgressProps> = ({ name, current, target, progress }) => {
    return (
        <div className="w-full p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-lg">
            <div className="flex justify-between items-center mb-1 text-blue-100">
                <span className="font-semibold">{name}</span>
                <span className="text-sm font-medium">{current.toFixed(2)}L / {target.toFixed(1)}L</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-4 overflow-hidden">
                <div
                    className="bg-green-400 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default PartnerProgress;
