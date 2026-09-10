// Firebase Cloud Messaging Background Web Push Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSy_REPLACE_WITH_YOUR_FIREBASE_CLIENT_KEY",
  authDomain: "pajonline-shopping.firebaseapp.com",
  projectId: "pajonline-shopping",
  storageBucket: "pajonline-shopping.firebasestorage.app",
  messagingSenderId: "226689194744",
  appId: "1:226689194744:web:0fd2ce3c17575df609790d"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || 'BuyWise AI Price Drop Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'A verified price drop has occurred for your tracked product.',
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
