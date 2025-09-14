import React, { useState } from 'react';
import EditIcon from './EditIcon';

interface EditableTargetProps {
    target: number;
    onTargetChange: (newTarget: number) => void;
}

const EditableTarget: React.FC<EditableTargetProps> = ({ target, onTargetChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newTarget, setNewTarget] = useState(target.toFixed(1));

    const handleSave = () => {
        const parsedTarget = parseFloat(newTarget);
        if (!isNaN(parsedTarget) && parsedTarget > 0) {
            onTargetChange(parsedTarget);
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setNewTarget(target.toFixed(1));
        }
    };

    return (
        <div className="flex items-center justify-center text-white text-lg font-semibold space-x-2 z-10">
            {isEditing ? (
                <>
                    <input
                        type="number"
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        className="w-20 text-center bg-white/30 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-white"
                        autoFocus
                    />
                    <span>L / hari</span>
                </>
            ) : (
                <>
                    <span>Target: {target.toFixed(1)}L</span>
                    <button onClick={() => setIsEditing(true)} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Ubah target">
                        <EditIcon className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
    );
};

export default EditableTarget;
