import { useState, useEffect, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInAnonymously,
    User,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    collection,
    query,
    orderBy,
    limit,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { firebaseServices, httpsCallable } from '../firebase/config';

interface WaterData {
    id: string;
    current: number;
    target: number;
    partnerId: string | null;
}

interface HistoryEntry {
    date: string; // YYYY-MM-DD
    amount: number;
}

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const useFirestoreWaterTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // For fatal errors
    const [toastError, setToastError] = useState<string | null>(null); // For non-fatal errors
    const [userId, setUserId] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [target, setTarget] = useState(2); // Default target 2L
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerData, setPartnerData] = useState<WaterData | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    
    const [isOffline] = useState(!firebaseServices);
    const [configError] = useState(
        !firebaseServices
            ? "Konfigurasi Firebase tidak valid. Fitur online dinonaktifkan."
            : null
    );

    useEffect(() => {
        if (isOffline || !firebaseServices) {
            setIsLoading(false);
            return;
        }

        const { auth } = firebaseServices;
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (e) {
                    console.error("Anonymous sign-in failed", e);
                    setError("Gagal terhubung ke layanan otentikasi. Silakan muat ulang.");
                    setIsLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, [isOffline]);
    
    useEffect(() => {
        if (!userId || isOffline || !firebaseServices) return;

        const { db } = firebaseServices;
        const userRef = doc(db, 'users', userId);
        const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTarget(data.target || 2);
                setPartnerId(data.partnerId || null);
            } else {
                await setDoc(userRef, { target: 2, partnerId: null, createdAt: serverTimestamp() });
                setTarget(2);
            }
            if (isLoading) setIsLoading(false);
        }, (err) => {
            console.error("Error fetching user data:", err);
            if (err.code === 'permission-denied') {
                setError("Akses data ditolak. Periksa aturan keamanan Firestore Anda.");
            } else if (err.code !== 'unavailable') {
                setToastError("Gagal menyinkronkan data pengguna. Menampilkan data offline.");
            }
            if (isLoading) setIsLoading(false);
        });

        const today = getTodayDateString();
        const historyRef = doc(db, `users/${userId}/history`, today);
        const unsubscribeHistory = onSnapshot(historyRef, (historySnap) => {
            setCurrent(historySnap.exists() ? historySnap.data().amount : 0);
        }, (err) => {
            console.error("Error fetching today's history:", err);
            if (err.code !== 'unavailable') {
                setToastError("Gagal menyinkronkan data hari ini.");
            }
            setCurrent(0);
        });

        return () => {
            unsubscribeUser();
            unsubscribeHistory();
        };
    }, [userId, isOffline, isLoading]);
    
    useEffect(() => {
        if (!userId || isOffline || !firebaseServices) return;
        
        const { db } = firebaseServices;
        const historyCol = collection(db, `users/${userId}/history`);
        const q = query(historyCol, orderBy('date', 'desc'), limit(7));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const historyData: HistoryEntry[] = [];
            querySnapshot.forEach((doc) => {
                historyData.push({ date: doc.id, ...doc.data() } as HistoryEntry);
            });
            setHistory(historyData.reverse());
        }, (err) => {
             console.error("Error fetching history:", err);
             if (err.code !== 'unavailable') {
                setToastError("Gagal memuat riwayat minum.");
             }
        });

        return () => unsubscribe();
    }, [userId, isOffline]);
    
    useEffect(() => {
        if (!partnerId || isOffline || !firebaseServices) {
            setPartnerData(null);
            return;
        }
        
        const { db } = firebaseServices;
        const partnerRef = doc(db, 'users', partnerId);
        let unsubscribePartnerHistory: () => void = () => {};

        const unsubscribePartner = onSnapshot(partnerRef, (docSnap) => {
            unsubscribePartnerHistory();

            if (docSnap.exists()) {
                const data = docSnap.data();
                const today = getTodayDateString();
                const partnerHistoryRef = doc(db, `users/${partnerId}/history`, today);
                
                unsubscribePartnerHistory = onSnapshot(partnerHistoryRef, (historySnap) => {
                    setPartnerData({
                        id: docSnap.id,
                        target: data.target || 2,
                        partnerId: data.partnerId || null,
                        current: historySnap.exists() ? historySnap.data().amount : 0,
                    });
                }, (err) => {
                    console.error("Error fetching partner history:", err);
                    if (err.code !== 'unavailable') {
                        setToastError("Gagal menyinkronkan data pasangan.");
                    }
                });
            } else {
                setPartnerData(null);
            }
        }, (err) => {
            console.error("Error fetching partner data:", err);
            if (err.code !== 'unavailable') {
                setToastError("Gagal memuat data pasangan.");
            }
            setPartnerData(null);
        });

        return () => {
            unsubscribePartner();
            unsubscribePartnerHistory();
        };
    }, [partnerId, isOffline]);

    const updateWater = useCallback(async (amount: number) => {
        if (!userId || isOffline || !firebaseServices) return;

        const { db } = firebaseServices;
        const newCurrent = current + amount;
        const today = getTodayDateString();
        const historyRef = doc(db, `users/${userId}/history`, today);
        
        try {
             await setDoc(historyRef, { amount: newCurrent, date: today }, { merge: true });
        } catch (e) {
            console.error("Error updating water intake: ", e);
            setToastError("Gagal menyimpan data. Periksa koneksi Anda.");
        }
    }, [current, userId, isOffline]);

    const updateTarget = useCallback(async (newTarget: number) => {
        if (!userId || newTarget <= 0 || isOffline || !firebaseServices) return;

        const { db } = firebaseServices;
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, { target: newTarget });
        } catch(e) {
            console.error("Error updating target: ", e);
            setToastError("Gagal memperbarui target. Periksa koneksi Anda.");
        }
    }, [userId, isOffline]);

    const linkPartner = useCallback(async (newPartnerId: string) => {
        if (!userId || userId === newPartnerId || isOffline || !firebaseServices) return;
        
        const { db } = firebaseServices;
        const userRef = doc(db, 'users', userId);
        const partnerRef = doc(db, 'users', newPartnerId);

        try {
            const partnerSnap = await getDoc(partnerRef);
            
            if (!partnerSnap.exists()) {
                setToastError("ID Pasangan tidak ditemukan.");
                return;
            }

            const batch = writeBatch(db);
            batch.update(userRef, { partnerId: newPartnerId });
            batch.update(partnerRef, { partnerId: userId });
            await batch.commit();
        } catch (e: any) {
            if (e.code === 'unavailable') {
                setToastError("Koneksi internet tidak stabil. Coba lagi nanti.");
            } else {
                console.error("Error linking partner: ", e);
                setToastError("Gagal menghubungkan dengan pasangan.");
            }
        }
    }, [userId, isOffline]);

    const unlinkPartner = useCallback(async () => {
        if (!userId || !partnerId || isOffline || !firebaseServices) return;
        
        const { db } = firebaseServices;
        const userRef = doc(db, 'users', userId);
        const partnerRef = doc(db, 'users', partnerId);

        try {
            const batch = writeBatch(db);
            batch.update(userRef, { partnerId: null });
            batch.update(partnerRef, { partnerId: null });
            await batch.commit();
        } catch (e) {
            console.error("Error unlinking partner: ", e);
            setToastError("Gagal memutuskan hubungan. Periksa koneksi Anda.");
        }
    }, [userId, partnerId, isOffline]);
    
    const sendNotificationToPartner = useCallback(async (
        type: 'encouragement' | 'reminder',
        partnerInfo: { id: string; current: number; target: number }
    ) => {
        if (!userId || isOffline || !firebaseServices) {
             setToastError("Fitur notifikasi tidak tersedia saat ini.");
            return;
        }
        
        const { functions } = firebaseServices;
        try {
            const sendNotification = httpsCallable(functions, 'sendNotification');
            await sendNotification({
                recipientId: partnerInfo.id,
                type: type,
                senderId: userId,
                partnerCurrent: partnerInfo.current,
                partnerTarget: partnerInfo.target,
            });
            // This alert can be replaced by a success toast in the future
            alert(`Pesan ${type === 'encouragement' ? 'semangat' : 'pengingat'} terkirim!`);
        } catch (e) {
            console.error("Error sending notification:", e);
            setToastError("Gagal mengirim notifikasi. Pastikan Cloud Function 'sendNotification' sudah di-deploy.");
        }
    }, [userId, isOffline]);

    const clearToastError = useCallback(() => {
        setToastError(null);
    }, []);

    return {
        userId,
        current,
        target,
        partnerId,
        partnerData,
        history,
        isLoading,
        error,
        toastError,
        clearToastError,
        isOffline,
        configError,
        updateWater,
        updateTarget,
        linkPartner,
        unlinkPartner,
        sendNotificationToPartner,
    };
};