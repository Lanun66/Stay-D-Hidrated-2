import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';
import { getFunctions, Functions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBoYkS07i48_TTc2dBJq8xKpkj-cC7dq8M",
  authDomain: "stay-d-hidrated-2.firebaseapp.com",
  projectId: "stay-d-hidrated-2",
  storageBucket: "stay-d-hidrated-2.appspot.com",
  messagingSenderId: "938308592276",
  appId: "1:938308592276:web:39b3b9624387136ffdca81",
  measurementId: "G-ZLXV7W9L23"
};

export const isFirebaseConfigValid = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_");

interface FirebaseServices {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    messaging: Messaging | null;
    functions: Functions;
}

let services: FirebaseServices | null = null;

if (isFirebaseConfigValid) {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const functions = getFunctions(app);
        
        let messaging: Messaging | null = null;
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            messaging = getMessaging(app);
        }

        services = { app, auth, db, messaging, functions };

        // Aktifkan mode persisten untuk pengalaman offline yang lebih baik
        enableIndexedDbPersistence(db).catch((err) => {
             if (err.code === 'failed-precondition') {
                console.warn("Mode persisten gagal, kemungkinan karena ada beberapa tab terbuka.");
            } else if (err.code === 'unimplemented') {
                console.warn("Browser ini tidak mendukung mode persisten offline.");
            }
        });

    } catch (error) {
        console.error("Inisialisasi Firebase gagal:", error);
        services = null;
    }
} else {
    console.warn("Konfigurasi Firebase tidak valid. Fitur online akan dinonaktifkan.");
}

export const firebaseServices = services;
export { httpsCallable };
