// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Konfigurasi Firebase yang valid, disamakan dengan firebase/config.ts
const firebaseConfig = {
  apiKey: "AIzaSyBoYkS07i48_TTc2dBJq8xKpkj-cC7dq8M",
  authDomain: "stay-d-hidrated-2.firebaseapp.com",
  projectId: "stay-d-hidrated-2",
  storageBucket: "stay-d-hidrated-2.appspot.com",
  messagingSenderId: "938308592276",
  appId: "1:938308592276:web:39b3b9624387136ffdca81",
  measurementId: "G-ZLXV7W9L23"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handler untuk notifikasi yang diterima saat aplikasi di background
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload,
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/vite.svg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
