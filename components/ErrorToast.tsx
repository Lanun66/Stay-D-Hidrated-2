import React, { useEffect, useState } from 'react';

interface ErrorToastProps {
    message: string;
    onDismiss: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Allow time for fade out animation before removing from DOM
            setTimeout(onDismiss, 300); 
        }, 5000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div 
            className={`
                bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl 
                transition-all duration-300 ease-in-out transform
                ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
            role="alert"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 text-2xl mr-3">⚠️</div>
                <div className="flex-1">
                    <p className="font-bold">Terjadi Masalah</p>
                    <p className="text-sm">{message}</p>
                </div>
                <button 
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onDismiss, 300);
                    }} 
                    className="ml-4 text-red-100 hover:text-white"
                    aria-label="Tutup"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default ErrorToast;