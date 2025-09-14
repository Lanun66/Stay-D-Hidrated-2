import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getMessaging } from "firebase/messaging";

// Konfigurasi Firebase yang valid dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBoYkS07i48_TTc2dBJq8xKpkj-cC7dq8M",
  authDomain: "stay-d-hidrated-2.firebaseapp.com",
  projectId: "stay-d-hidrated-2",
  storageBucket: "stay-d-hidrated-2.appspot.com",
  messagingSenderId: "938308592276",
  appId: "1:938308592276:web:39b3b9624387136ffdca81",
  measurementId: "G-ZLXV7W9L23"
};

// Fungsi untuk memeriksa apakah konfigurasi Firebase valid
export const isFirebaseConfigValid = () => {
    // Kredensial yang valid tidak akan pernah dimulai dengan string placeholder ini
    return !Object.values(firebaseConfig).some(value => value.includes('REPLACE_WITH_YOUR'));
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
        // Melempar galat asli untuk ditangani oleh pemanggil
        throw error;
    }
};

export { auth, db, functions, messaging, httpsCallable };
