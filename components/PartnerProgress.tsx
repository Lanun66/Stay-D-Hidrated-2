import React from 'react';

interface PartnerProgressProps {
    name: string;
    current: number;
    target: number;
    progress: number;
    partnerId: string;
    onSendNotification: (
        type: 'encouragement' | 'reminder',
        partnerData: { id: string; current: number; target: number }
    ) => void;
}

const PartnerProgress: React.FC<PartnerProgressProps> = ({ name, current, target, progress, partnerId, onSendNotification }) => {
    const isReminderDisabled = progress >= 80;

    const handleSendEncouragement = () => {
        onSendNotification('encouragement', { id: partnerId, current, target });
    };

    const handleSendReminder = () => {
        onSendNotification('reminder', { id: partnerId, current, target });
    };

    return (
        <div className="w-full p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-lg">
            <div className="flex justify-between items-center mb-1 text-blue-100">
                <span className="font-semibold">{name}</span>
                <span className="text-sm font-medium">{current.toFixed(2)}L / {target.toFixed(1)}L</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-4 overflow-hidden mb-3">
                <div
                    className="bg-green-400 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-center items-center space-x-2">
                <button 
                    onClick={handleSendEncouragement}
                    className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 rounded-md transition-colors text-white font-semibold"
                >
                    Kasih Semangat 🎉
                </button>
                <button
                    onClick={handleSendReminder}
                    disabled={isReminderDisabled}
                    className="flex-1 px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 rounded-md transition-colors text-white font-semibold disabled:bg-gray-500 disabled:opacity-70 disabled:cursor-not-allowed"
                    title={isReminderDisabled ? "Progress pasangan sudah bagus!" : "Ingatkan pasangan untuk minum"}
                >
                    Ingatkan Minum 💧
                </button>
            </div>
        </div>
    );
};

export default PartnerProgress;