import React, { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db, messaging } from '../firebase/config';
import Toast from './Toast';

interface NotificationManagerProps {
    userId: string | null;
}

interface ToastMessage {
    id: number;
    title: string;
    body: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ userId }) => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Minta izin dan simpan token FCM
    const requestPermissionAndSaveToken = async () => {
        if (!userId) return;
        
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                console.log('Izin notifikasi diberikan.');
                // PENTING: Ganti placeholder di bawah ini dengan VAPID key Anda.
                // Anda bisa membuatnya di Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration.
                const currentToken = await getToken(messaging, { vapidKey: "REPLACE_WITH_YOUR_VAPID_KEY" });

                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    const userRef = doc(db, 'users', userId);
                    await setDoc(userRef, { fcmToken: currentToken }, { merge: true });
                } else {
                    console.log('Tidak bisa mendapatkan token. Izin mungkin perlu di-refresh.');
                }
            } else {
                console.log('Izin notifikasi ditolak.');
            }
        } catch (error) {
            console.error('Terjadi kesalahan saat meminta izin notifikasi:', error);
        }
    };
    
    // Listener untuk notifikasi saat aplikasi terbuka (foreground)
    useEffect(() => {
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Pesan diterima saat foreground:', payload);
            const newToast: ToastMessage = {
                id: Date.now(),
                title: payload.notification?.title || 'Notifikasi Baru',
                body: payload.notification?.body || '',
            };
            setToasts(prevToasts => [...prevToasts, newToast]);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const removeToast = (id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    return (
        <>
            {/* Banner Permintaan Izin */}
            {notificationPermission === 'default' && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black p-3 text-center z-50 flex items-center justify-center">
                    <p className="mr-4">Aktifkan notifikasi untuk menerima pengingat dari pasangan Anda!</p>
                    <button 
                        onClick={requestPermissionAndSaveToken}
                        className="bg-black text-white font-bold py-1 px-3 rounded-md hover:bg-gray-800"
                    >
                        Aktifkan
                    </button>
                </div>
            )}
            
            {/* Kontainer Toast */}
            <div className="fixed top-5 right-5 z-50 w-full max-w-sm space-y-3">
                 {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        title={toast.title}
                        body={toast.body}
                        onDismiss={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </>
    );
};

export default NotificationManager;