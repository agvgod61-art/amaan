import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cohesive-bulwark-pskkt",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:222774696933:web:b996cb00129658901cad0c",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBRCOijJtgYwNqdpeXdi15lZkXRuE9tYQc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cohesive-bulwark-pskkt.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cohesive-bulwark-pskkt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "222774696933",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

export const app = initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-940ddde2-ba02-4398-8a41-6ac0e8e72adf");
export const realStorage = getStorage(app);
export const auth = getAuth(app);
