import { useState, useEffect, useCallback } from 'react';
import { db, signIn, functions, httpsCallable, isFirebaseConfigValid } from '../firebase/config';
import { doc, setDoc, onSnapshot, serverTimestamp, DocumentData } from 'firebase/firestore';
import { User } from 'firebase/auth';

const PARTNER_ID_KEY = 'waterTrackerPartnerId';
const LOCAL_WATER_DATA_KEY = 'localWaterData';

export interface UserWaterData {
    currentAmount: number;
    targetAmount: number;
    progressPercentage: number;
    lastUpdate: any;
    name?: string;
}

const defaultUserData: UserWaterData = {
    currentAmount: 0,
    targetAmount: 2.5,
    progressPercentage: 0,
    lastUpdate: null,
};

const calculateProgress = (data: Partial<UserWaterData> | DocumentData | null | undefined): UserWaterData => {
    const current = data?.currentAmount ?? data?.progress ?? 0;
    const target = data?.targetAmount ?? data?.target ?? 2.5;
    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    return {
        currentAmount: current,
        targetAmount: target,
        progressPercentage: progress,
        lastUpdate: data?.lastUpdate,
        name: data?.name || 'Pengguna',
    };
};

export const useFirestoreWaterTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isOnlineMode, setIsOnlineMode] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [currentUserData, setCurrentUserData] = useState<UserWaterData>(defaultUserData);
    const [partnerUserData, setPartnerUserData] = useState<UserWaterData | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);

    // Mode Initialization
    useEffect(() => {
        if (isFirebaseConfigValid()) {
            setIsOnlineMode(true);
            const authenticate = async () => {
                try {
                    const signedInUser = await signIn();
                    setUser(signedInUser);
                } catch (e) {
                    console.error("Firebase Authentication failed:", e);
                    setIsOnlineMode(false); // Fallback to offline mode
                    setConfigError("Gagal terhubung ke Firebase. Periksa kredensial dan koneksi Anda.");
                }
            };
            authenticate();
        } else {
            setIsOnlineMode(false);
            setConfigError("Mode offline: Konfigurasi Firebase untuk mengaktifkan sinkronisasi pasangan.");
            // Load local data
            const savedData = localStorage.getItem(LOCAL_WATER_DATA_KEY);
            if (savedData) {
                setCurrentUserData(calculateProgress(JSON.parse(savedData)));
            }
            // Load partner ID for display purposes, even if offline
            setPartnerId(localStorage.getItem(PARTNER_ID_KEY));
            setIsLoading(false);
        }
    }, []);

    // Local Mode: Save to localStorage
    useEffect(() => {
        if (!isOnlineMode) {
            localStorage.setItem(LOCAL_WATER_DATA_KEY, JSON.stringify({
                currentAmount: currentUserData.currentAmount,
                targetAmount: currentUserData.targetAmount,
            }));
        }
    }, [currentUserData, isOnlineMode]);


    // Online Mode: Firestore listener for current user
    useEffect(() => {
        if (!isOnlineMode || !user) {
             if (isOnlineMode) setIsLoading(false);
            return;
        }

        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setCurrentUserData(calculateProgress(docSnap.data()));
            } else {
                setDoc(userRef, { 
                    name: `Pengguna ${user.uid.substring(0, 5)}`,
                    progress: 0, 
                    target: 2.5, 
                    lastUpdate: serverTimestamp() 
                });
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Firestore snapshot error:", err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOnlineMode, user]);

     // Online Mode: Load partner and listen for changes
    useEffect(() => {
        if (isOnlineMode) {
             setPartnerId(localStorage.getItem(PARTNER_ID_KEY));
        }
    }, [isOnlineMode]);

    // Online Mode: Firestore listener for partner
    useEffect(() => {
        if (!isOnlineMode || !partnerId) {
            setPartnerUserData(null);
            return;
        }

        const partnerRef = doc(db, 'users', partnerId);
        const unsubscribe = onSnapshot(partnerRef, (docSnap) => {
            setPartnerUserData(docSnap.exists() ? calculateProgress(docSnap.data()) : null);
        });

        return () => unsubscribe();
    }, [isOnlineMode, partnerId]);
    
    // --- Actions ---

    const addWater = useCallback(() => {
        const newAmount = currentUserData.currentAmount + 0.25;
        if (isOnlineMode && user) {
            const userRef = doc(db, 'users', user.uid);
            setDoc(userRef, { progress: newAmount }, { merge: true });
        } else {
            setCurrentUserData(prev => calculateProgress({ ...prev, currentAmount: newAmount }));
        }
    }, [currentUserData, isOnlineMode, user]);

    const resetWater = useCallback(() => {
        if (isOnlineMode && user) {
            const userRef = doc(db, 'users', user.uid);
            setDoc(userRef, { progress: 0 }, { merge: true });
        } else {
            setCurrentUserData(prev => calculateProgress({ ...prev, currentAmount: 0 }));
        }
    }, [isOnlineMode, user]);
    
    const linkPartner = useCallback((id: string) => {
        if (!isOnlineMode) {
            alert("Fitur ini memerlukan koneksi ke Firebase. Silakan konfigurasikan kredensial Anda.");
            return;
        }
        const trimmedId = id.trim();
        if (trimmedId && trimmedId !== user?.uid) {
            localStorage.setItem(PARTNER_ID_KEY, trimmedId);
            setPartnerId(trimmedId);
        } else {
            alert("ID Pasangan tidak valid atau sama dengan ID Anda.");
        }
    }, [isOnlineMode, user]);

    const unlinkPartner = useCallback(() => {
        localStorage.removeItem(PARTNER_ID_KEY);
        setPartnerId(null);
    }, []);

    const sendNotificationToPartner = useCallback(async (
        type: 'encouragement' | 'reminder',
        partnerData: { id: string; current: number; target: number }
    ) => {
        if (!isOnlineMode) {
            alert("Fitur ini memerlukan koneksi ke Firebase.");
            return;
        }
        if (!partnerData.id) {
            alert("Tidak ada pasangan terhubung.");
            return;
        }
        try {
            const sendNotification = httpsCallable(functions, 'sendNotification');
            await sendNotification({
                recipientUid: partnerData.id,
                type: type,
                partnerCurrent: partnerData.current,
                partnerTarget: partnerData.target,
            });
            alert('Notifikasi berhasil dikirim!');
        } catch (error) {
            console.error('Gagal mengirim notifikasi:', error);
            alert('Gagal mengirim notifikasi. Pastikan Cloud Function sudah di-deploy.');
        }
    }, [isOnlineMode]);

    return {
        currentUserData,
        partnerUserData,
        userId: user?.uid ?? null,
        partnerId,
        isGoalReached: currentUserData.progressPercentage >= 100,
        isLoading,
        isOnlineMode,
        configError,
        addWater,
        resetWater,
        linkPartner,
        unlinkPartner,
        sendNotificationToPartner,
    };
};
