import React from 'react';

interface ConfigWarningBannerProps {
    message?: string | null;
}

const ConfigWarningBanner: React.FC<ConfigWarningBannerProps> = ({ message }) => {
    const defaultMessage = "Fitur sinkronisasi pasangan dinonaktifkan. Isi `firebase/config.ts` untuk mengaktifkannya.";

    return (
        <div 
            className="absolute top-0 left-0 right-0 bg-amber-500 text-black p-3 text-center z-50 shadow-lg text-sm"
            role="alert"
        >
            <span className="font-semibold">Mode Offline:</span> {message || defaultMessage}
        </div>
    );
};

export default ConfigWarningBanner;