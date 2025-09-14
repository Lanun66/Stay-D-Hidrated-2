import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getMessaging } from "firebase/messaging";

// PENTING: Ganti nilai-nilai placeholder di bawah ini dengan kredensial
// dari proyek Firebase Anda. Anda bisa menemukannya di
// Project Settings > General di Firebase Console.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// Fungsi untuk memeriksa apakah konfigurasi Firebase valid
export const isFirebaseConfigValid = () => {
    return !Object.values(firebaseConfig).some(value => value.startsWith('REPLACE_WITH_YOUR'));
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const messaging = getMessaging(app);

// Fungsi untuk masuk secara anonim
export const signIn = async () => {
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        console.error("Error signing in anonymously:", error);
        // Lemparkan galat agar dapat ditangkap oleh pemanggil
        throw error;
    }
};

export { auth, db, functions, messaging, httpsCallable };
