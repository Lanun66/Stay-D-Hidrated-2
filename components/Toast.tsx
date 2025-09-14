import React, { useEffect, useState } from 'react';

interface ToastProps {
    title: string;
    body: string;
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ title, body, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        setIsVisible(true);

        // Auto dismiss after 5 seconds
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
                bg-white/90 backdrop-blur-sm text-gray-800 p-4 rounded-lg shadow-2xl 
                transition-all duration-300 ease-in-out transform
                ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}
            `}
            role="alert"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 text-2xl mr-3">💧</div>
                <div className="flex-1">
                    <p className="font-bold text-blue-600">{title}</p>
                    <p className="text-sm">{body}</p>
                </div>
                <button onClick={onDismiss} className="ml-4 text-gray-400 hover:text-gray-600">&times;</button>
            </div>
        </div>
    );
};

export default Toast;