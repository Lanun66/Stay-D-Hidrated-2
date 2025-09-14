import React, { useState } from 'react';

interface UserLinkerProps {
    userId: string | null;
    partnerId: string | null;
    onLink: (partnerId: string) => void;
    onUnlink: () => void;
}

const UserLinker: React.FC<UserLinkerProps> = ({ userId, partnerId, onLink, onUnlink }) => {
    const [inputPartnerId, setInputPartnerId] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (userId) {
            navigator.clipboard.writeText(userId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLink = () => {
        if (inputPartnerId.trim()) {
            onLink(inputPartnerId.trim());
            setInputPartnerId('');
        }
    };

    return (
        <div className="w-full max-w-sm p-4 bg-white/10 rounded-xl backdrop-blur-sm z-10 text-center shadow-lg">
            <div className="mb-4">
                <label className="block text-sm font-medium text-blue-100 mb-1">Bagikan ID Anda:</label>
                <div className="flex items-center justify-center space-x-2">
                    <input
                        type="text"
                        readOnly
                        value={userId || 'Memuat...'}
                        className="w-full px-3 py-2 text-center text-gray-800 bg-white/80 rounded-md shadow-inner focus:outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                        disabled={!userId}
                    >
                        {copied ? 'Disalin!' : 'Salin'}
                    </button>
                </div>
            </div>
            
            {!partnerId ? (
                <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">Hubungkan dengan Pasangan:</label>
                    <div className="flex items-center justify-center space-x-2">
                        <input
                            type="text"
                            value={inputPartnerId}
                            onChange={(e) => setInputPartnerId(e.target.value)}
                            placeholder="Masukkan ID Pasangan"
                            className="w-full px-3 py-2 text-gray-800 bg-white/80 rounded-md shadow-inner focus:outline-none placeholder-gray-500"
                        />
                        <button
                            onClick={handleLink}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-md transition-colors whitespace-nowrap"
                        >
                            Hubungkan
                        </button>
                    </div>
                </div>
            ) : (
                 <button
                    onClick={onUnlink}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                >
                    Putuskan Hubungan dengan Pasangan
                </button>
            )}
        </div>
    );
};

export default UserLinker;
