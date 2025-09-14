import { useState, useEffect, useCallback } from 'react';
import { db, signIn, functions, httpsCallable } from '../firebase/config';
import { doc, setDoc, onSnapshot, serverTimestamp, DocumentData } from 'firebase/firestore';
import { User } from 'firebase/auth';

const PARTNER_ID_KEY = 'waterTrackerPartnerId';

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
        name: data.name || 'Pengguna',
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
                setDoc(userRef, { 
                    name: `Pengguna ${user.uid.substring(0, 5)}`,
                    progress: 0, 
                    target: 2.5, 
                    lastUpdate: serverTimestamp() 
                });
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

    const sendNotificationToPartner = useCallback(async (
        type: 'encouragement' | 'reminder',
        partnerData: { id: string; current: number; target: number }
    ) => {
        if (!partnerData.id) {
            alert("Tidak ada pasangan terhubung.");
            return;
        }

        /*
        * PENTING: Kode ini memanggil Cloud Function bernama 'sendNotification'.
        * Anda HARUS men-deploy fungsi ini ke proyek Firebase Anda.
        *
        * Berikut adalah contoh implementasi Cloud Function (index.ts):
        *
        * const functions = require("firebase-functions");
        * const admin = require("firebase-admin");
        * admin.initializeApp();
        *
        * exports.sendNotification = functions.https.onCall(async (data, context) => {
        *   if (!context.auth) {
        *     throw new functions.https.HttpsError("unauthenticated", "Fungsi ini harus dipanggil saat masuk.");
        *   }
        *
        *   const senderUid = context.auth.uid;
        *   const recipientUid = data.recipientUid;
        *   const type = data.type;
        *
        *   // Dapatkan data pengirim dan penerima dari Firestore
        *   const db = admin.firestore();
        *   const senderDoc = await db.collection("users").doc(senderUid).get();
        *   const recipientDoc = await db.collection("users").doc(recipientUid).get();
        *
        *   if (!recipientDoc.exists || !senderDoc.exists) {
        *     throw new functions.https.HttpsError("not-found", "Pengguna tidak ditemukan.");
        *   }
        *
        *   const senderName = senderDoc.data().name || "Pasanganmu";
        *   const recipientToken = recipientDoc.data().fcmToken;
        *
        *   if (!recipientToken) {
        *     console.log("Penerima tidak memiliki FCM token.");
        *     return { success: false, reason: "No FCM token" };
        *   }
        *
        *   let title = "";
        *   let body = "";
        *
        *   if (type === "encouragement") {
        *     title = "Kamu dapat semangat baru! 🎉";
        *     body = `${senderName} kasih semangat! Ayo lanjut minum 💧`;
        *   } else if (type === "reminder") {
        *     title = "Pengingat Minum 💧";
        *     const current = data.partnerCurrent;
        *     const target = data.partnerTarget;
        *     body = `Hei, jangan lupa minum, progress kamu baru ${current.toFixed(2)}L dari target ${target.toFixed(1)}L.`;
        *   } else {
        *      return { success: false, reason: "Invalid type" };
        *   }
        *
        *   const payload = {
        *     notification: { title, body, icon: "/vite.svg" },
        *     token: recipientToken,
        *     webpush: { fcmOptions: { link: "/" } },
        *   };
        *
        *   try {
        *     await admin.messaging().send(payload);
        *     console.log("Notifikasi berhasil dikirim.");
        *     return { success: true };
        *   } catch (error) {
        *     console.error("Gagal mengirim notifikasi:", error);
        *     throw new functions.https.HttpsError("internal", "Gagal mengirim notifikasi.");
        *   }
        * });
        */

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
            alert('Gagal mengirim notifikasi. Pastikan Cloud Function sudah di-deploy dan Anda memiliki koneksi internet.');
        }
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
        sendNotificationToPartner,
    };
};