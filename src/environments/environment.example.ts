// Kopiraj ovaj fajl kao environment.ts i environment.prod.ts
// i popuni vrednosti
export const environment = {
  production: false,
  backendUrl: 'https://spite-backend-v2.onrender.com/api',
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  vapidKey: 'YOUR_VAPID_KEY'
};
