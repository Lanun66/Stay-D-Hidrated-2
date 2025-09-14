import React from 'react';

const ConfigWarningBanner: React.FC = () => {
    return (
        <div 
            className="absolute top-0 left-0 right-0 bg-amber-500 text-black p-3 text-center z-50 shadow-lg text-sm"
            role="alert"
        >
            <span className="font-semibold">Mode Offline:</span> Fitur sinkronisasi pasangan dinonaktifkan. Isi `firebase/config.ts` untuk mengaktifkannya.
        </div>
    );
};

export default ConfigWarningBanner;
