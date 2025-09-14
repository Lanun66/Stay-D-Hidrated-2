
import React from 'react';
import WaterDropIcon from './WaterDropIcon';

interface AddWaterButtonProps {
    onAdd: () => void;
    isGoalReached: boolean;
}

const AddWaterButton: React.FC<AddWaterButtonProps> = ({ onAdd, isGoalReached }) => {
    return (
        <button
            onClick={onAdd}
            disabled={isGoalReached}
            className={`
                w-40 h-40 rounded-full 
                bg-white/20 backdrop-blur-sm
                flex flex-col items-center justify-center 
                text-white font-bold text-lg
                shadow-xl
                transition-all duration-300 ease-in-out
                transform hover:scale-105 active:scale-95
                focus:outline-none focus:ring-4 focus:ring-white/50
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            `}
            aria-label="Tambah 0.25L air"
        >
            <WaterDropIcon className="w-12 h-12 mb-1" />
            <span>+0.25L</span>
        </button>
    );
};

export default AddWaterButton;
