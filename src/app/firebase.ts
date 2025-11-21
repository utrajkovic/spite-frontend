import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAc9Xe3v7Ea5P7KBhCIleD6-6-1LZTiU6Y",
  authDomain: "spite-chat.firebaseapp.com",
  projectId: "spite-chat",
  storageBucket: "spite-chat.firebasestorage.app",
  messagingSenderId: "569432699826",
  appId: "1:569432699826:web:ed0bad94e900859b17aaab"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
