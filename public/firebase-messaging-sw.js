// Firebase Cloud Messaging Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA2-bffnWQLIK-yArCd_oW6se4spD2giu0",
  authDomain: "clicker2-79762.firebaseapp.com",
  projectId: "clicker2-79762",
  storageBucket: "clicker2-79762.firebasestorage.app",
  messagingSenderId: "969059096232",
  appId: "1:969059096232:web:05e9f6bc65a04961f8149d",
  measurementId: "G-NP11LJQYM6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Coin Clicker ⚡';
  const notificationOptions = {
    body: payload.notification?.body || 'Your automated power generators are full of energy!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
