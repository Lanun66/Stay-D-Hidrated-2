import { useState, useEffect, useCallback } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions, signIn, isFirebaseConfigValid } from '../firebase/config';

interface WaterData {
    current: number;
    target: number;
    lastUpdated: Timestamp;
    partnerId: string | null;
    history: { date: string; amount: number }[];
}

interface LocalStorageData {
    current: number;
    target: number;
    history: { date: string; amount: number }[];
}

interface PartnerData {
    id: string;
    current: number;
    target: number;
}

const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayLocal = new Date(today.getTime() - (offset * 60 * 1000));
    return todayLocal.toISOString().split('T')[0];
};

export const useFirestoreWaterTracker = () => {
    const isOffline = !isFirebaseConfigValid();
    const [userId, setUserId] = useState<string | null>(null);
    const [waterData, setWaterData] = useState<WaterData>({
        current: 0,
        target: 2.0,
        lastUpdated: Timestamp.now(),
        partnerId: null,
        history: [],
    });
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            setError(null);

            if (isOffline) {
                // --- OFFLINE MODE ---
                console.log("Aplikasi berjalan dalam mode offline.");
                const savedData = localStorage.getItem('hydroHomieData');
                const todayStr = getTodayDateString();
                let data: LocalStorageData;

                if (savedData) {
                    data = JSON.parse(savedData);
                    const lastHistoryEntry = data.history[data.history.length - 1];
                    if (lastHistoryEntry && lastHistoryEntry.date !== todayStr) {
                        data.current = 0; // Reset for a new day
                    }
                } else {
                    data = { current: 0, target: 2.0, history: [] };
                }
                setWaterData({ ...data, lastUpdated: Timestamp.now(), partnerId: null });
                setIsLoading(false);
            } else {
                // --- ONLINE MODE ---
                try {
                    await signIn();
                    const currentUser = auth.currentUser;
                    if (!currentUser) throw new Error("Gagal mengautentikasi pengguna.");
                    
                    setUserId(currentUser.uid);

                    const userRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const data = userSnap.data() as Omit<WaterData, 'history'> & { history?: WaterData['history'] };
                        const todayStr = getTodayDateString();
                        const lastUpdatedDate = data.lastUpdated.toDate().toISOString().split('T')[0];
                        
                        if (lastUpdatedDate !== todayStr) {
                             const updatedData = { ...data, current: 0, lastUpdated: Timestamp.now() };
                            setWaterData({ ...updatedData, history: data.history || [] });
                            await updateDoc(userRef, { current: 0, lastUpdated: Timestamp.now() });
                        } else {
                             setWaterData({
                                current: data.current,
                                target: data.target,
                                lastUpdated: data.lastUpdated,
                                partnerId: data.partnerId || null,
                                history: data.history || [],
                            });
                        }
                    } else {
                        const newUserData: WaterData = { current: 0, target: 2.0, lastUpdated: Timestamp.now(), partnerId: null, history: [] };
                        await setDoc(userRef, newUserData);
                        setWaterData(newUserData);
                    }
                } catch (err: any) {
                    console.error("Initialization Error:", err);
                    setError("Gagal terhubung ke Firebase. Periksa koneksi dan konfigurasi Anda.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        initialize();
    }, [isOffline]);

    useEffect(() => {
        if (isOffline || !waterData.partnerId) {
            setPartnerData(null);
            return;
        }
        const partnerRef = doc(db, 'users', waterData.partnerId);
        const unsubscribe = onSnapshot(partnerRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setPartnerData({ id: doc.id, current: data.current, target: data.target });
            }
        });
        return () => unsubscribe();
    }, [isOffline, waterData.partnerId]);

    const updateWater = useCallback(async (amount: number) => {
        const newAmount = Math.max(0, waterData.current + amount);
        const todayStr = getTodayDateString();
        const newHistory = [...waterData.history];
        const todayEntryIndex = newHistory.findIndex(h => h.date === todayStr);

        if (todayEntryIndex !== -1) {
            newHistory[todayEntryIndex].amount = newAmount;
        } else {
            newHistory.push({ date: todayStr, amount: newAmount });
        }
        
        const stateUpdate = { ...waterData, current: newAmount, history: newHistory };
        setWaterData(stateUpdate);

        if (isOffline) {
            localStorage.setItem('hydroHomieData', JSON.stringify({ current: newAmount, target: waterData.target, history: newHistory }));
        } else if (userId) {
            await updateDoc(doc(db, 'users', userId), { current: newAmount, history: newHistory, lastUpdated: Timestamp.now() });
        }
    }, [userId, waterData, isOffline]);

    const updateTarget = useCallback(async (newTarget: number) => {
        if (newTarget <= 0) return;
        setWaterData(prev => ({ ...prev, target: newTarget }));
        if (isOffline) {
            const data = { current: waterData.current, target: newTarget, history: waterData.history };
            localStorage.setItem('hydroHomieData', JSON.stringify(data));
        } else if (userId) {
            await updateDoc(doc(db, 'users', userId), { target: newTarget });
        }
    }, [userId, waterData, isOffline]);

    const linkPartner = useCallback(async (newPartnerId: string) => {
        if (isOffline || !userId) return;
        if (userId === newPartnerId) return alert("Anda tidak bisa menghubungkan dengan diri sendiri.");
        const partnerRef = doc(db, 'users', newPartnerId);
        const partnerSnap = await getDoc(partnerRef);
        if (!partnerSnap.exists()) return alert("ID Pasangan tidak ditemukan.");
        await updateDoc(doc(db, 'users', userId), { partnerId: newPartnerId });
        setWaterData(prev => ({ ...prev, partnerId: newPartnerId }));
        alert("Berhasil terhubung dengan pasangan!");
    }, [isOffline, userId]);

    const unlinkPartner = useCallback(async () => {
        if (isOffline || !userId) return;
        await updateDoc(doc(db, 'users', userId), { partnerId: null });
        setWaterData(prev => ({ ...prev, partnerId: null }));
        alert("Hubungan dengan pasangan telah diputuskan.");
    }, [isOffline, userId]);

    const sendNotificationToPartner = useCallback(async (type: 'encouragement' | 'reminder', partnerInfo: { id: string, current: number, target: number }) => {
        if (isOffline) return alert("Fitur notifikasi memerlukan mode online.");
        const sendNotification = httpsCallable(functions, 'sendNotification');
        await sendNotification({ recipientId: partnerInfo.id, type: type, senderId: userId, partnerCurrent: partnerInfo.current, partnerTarget: partnerInfo.target });
        alert(`Pesan terkirim!`);
    }, [isOffline, userId]);

    return { ...waterData, userId, partnerData, isLoading, error, isOffline, updateWater, updateTarget, linkPartner, unlinkPartner, sendNotificationToPartner };
};
