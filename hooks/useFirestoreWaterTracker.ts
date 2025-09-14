import { useState, useEffect, useCallback } from 'react';
import { db, signIn } from '../firebase/config';
import { doc, setDoc, onSnapshot, serverTimestamp, DocumentData } from 'firebase/firestore';
import { User } from 'firebase/auth';

const PARTNER_ID_KEY = 'waterTrackerPartnerId';

interface UserWaterData {
    currentAmount: number;
    targetAmount: number;
    progressPercentage: number;
    lastUpdate: any;
}

const defaultUserData: UserWaterData = {
    currentAmount: 0,
    targetAmount: 2.5,
    progressPercentage: 0,
    lastUpdate: null,
};

const calculateProgress = (data: DocumentData | null | undefined): UserWaterData => {
    if (!data) return defaultUserData;
    const current = data.progress || 0;
    const target = data.target || 2.5;
    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    return {
        currentAmount: current,
        targetAmount: target,
        progressPercentage: progress,
        lastUpdate: data.lastUpdate,
    };
};

export const useFirestoreWaterTracker = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [currentUserData, setCurrentUserData] = useState<UserWaterData>(defaultUserData);
    const [partnerUserData, setPartnerUserData] = useState<UserWaterData | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(localStorage.getItem(PARTNER_ID_KEY));

    // Sign in user anonymously
    useEffect(() => {
        const authenticate = async () => {
            const signedInUser = await signIn();
            if(signedInUser) {
                setUser(signedInUser);
            } else {
                // Handle auth error
                setIsLoading(false);
            }
        };
        authenticate();
    }, []);

    // Firestore listener for current user
    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        const userRef = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setCurrentUserData(calculateProgress(docSnap.data()));
            } else {
                // Create user document if it doesn't exist
                setDoc(userRef, { progress: 0, target: 2.5, lastUpdate: serverTimestamp() });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Firestore listener for partner
    useEffect(() => {
        if (!partnerId) {
            setPartnerUserData(null);
            return;
        };

        const partnerRef = doc(db, 'users', partnerId);
        const unsubscribe = onSnapshot(partnerRef, (docSnap) => {
            if (docSnap.exists()) {
                setPartnerUserData(calculateProgress(docSnap.data()));
            } else {
                setPartnerUserData(null); // Partner ID might be invalid
            }
        });

        return () => unsubscribe();
    }, [partnerId]);
    
    const updateFirestoreProgress = useCallback(async (newAmount: number) => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { 
            progress: Math.max(0, newAmount),
            target: currentUserData.targetAmount,
            lastUpdate: serverTimestamp() 
        }, { merge: true });
    }, [user, currentUserData.targetAmount]);

    const addWater = useCallback(() => {
        const newAmount = currentUserData.currentAmount + 0.25;
        updateFirestoreProgress(newAmount);
    }, [currentUserData.currentAmount, updateFirestoreProgress]);

    const resetWater = useCallback(() => {
        updateFirestoreProgress(0);
    }, [updateFirestoreProgress]);
    
    const linkPartner = useCallback((id: string) => {
        const trimmedId = id.trim();
        if (trimmedId && trimmedId !== user?.uid) {
            localStorage.setItem(PARTNER_ID_KEY, trimmedId);
            setPartnerId(trimmedId);
        } else {
            alert("ID Pasangan tidak valid atau sama dengan ID Anda.");
        }
    }, [user]);

    const unlinkPartner = useCallback(() => {
        localStorage.removeItem(PARTNER_ID_KEY);
        setPartnerId(null);
    }, []);

    return {
        currentUserData,
        partnerUserData,
        userId: user?.uid ?? null,
        partnerId,
        isGoalReached: currentUserData.progressPercentage >= 100,
        isLoading,
        addWater,
        resetWater,
        linkPartner,
        unlinkPartner,
    };
};
