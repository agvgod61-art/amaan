import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBRCOijJtgYwNqdpeXdi15lZkXRuE9tYQc",
  authDomain: "cohesive-bulwark-pskkt.firebaseapp.com",
  projectId: "cohesive-bulwark-pskkt",
  storageBucket: "cohesive-bulwark-pskkt.firebasestorage.app",
  messagingSenderId: "222774696933",
  appId: "1:222774696933:web:b996cb00129658901cad0c",
  measurementId: ""
};

// Clear any stale local quota flag since we are connecting to a new project database
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("firestore_quota_exceeded");
    localStorage.removeItem("agv_quota_banner_dismissed");
  } catch (e) {
    console.warn("localStorage clear failed:", e);
  }
}

export const app = initializeApp(firebaseConfig);
export const firestoreDb = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-remixmotogphelme-940ddde2-ba02-4398-8a41-6ac0e8e72adf");
export const realStorage = getStorage(app);
export const auth = getAuth(app);

