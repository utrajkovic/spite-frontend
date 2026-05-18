importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAc9Xe3v7Ea5P7KBhCIleD6-6-1LZTiU6Y",
  authDomain: "spite-chat.firebaseapp.com",
  projectId: "spite-chat",
  storageBucket: "spite-chat.firebasestorage.app",
  messagingSenderId: "569432699826",
  appId: "1:569432699826:web:ed0bad94e900859b17aaab"
});

const messaging = firebase.messaging();

// Background notifikacije (kad je app u pozadini ili zatvorena)
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/assets/icon/icon-192.png',
    badge: '/assets/icon/icon-192.png',
    data: payload.data
  });
});

// Klik na notifikaciju - otvori app i navigiraj
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  let url = '/';

  if (data?.type === 'invite') url = '/tabs/tab-profile';
  else if (data?.type === 'workout_assigned') url = '/tabs/tab1';
  else if (data?.type === 'message') url = `/chat/${data.from}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      clients.openWindow(url);
    })
  );
});
