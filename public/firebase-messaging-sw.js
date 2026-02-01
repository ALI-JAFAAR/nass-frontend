/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

// Fill these from your environment (same values as VITE_ vars)
firebase.initializeApp({
  apiKey: "AIzaSyCRVvZCAF_msHP6i7SS27gzRL9--JRsoUk",
  authDomain: "deeratna-market.firebaseapp.com",
  projectId: "deeratna-market",
  storageBucket: "deeratna-market.firebasestorage.app",
  messagingSenderId: "243995563526",
  appId: "1:243995563526:web:ad5f4bf54f8f070dabd587",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "إشعار";
  const notificationOptions = {
    body: payload.notification?.body || "",
    data: payload.data || {},
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// When user clicks a notification, focus the client and ask it to play a sound
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      let client = allClients.find((c) => 'focus' in c);
      if (client) {
        await client.focus();
        client.postMessage({ type: 'play-sound' });
      } else {
        const newClient = await clients.openWindow('/');
        if (newClient) {
          newClient.postMessage({ type: 'play-sound' });
        }
      }
    })()
  );
});


