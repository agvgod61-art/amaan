import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBseurLRrRozZG16lP6HIsMtaaAdgTE0vE",
  authDomain: "helmet-938a2.firebaseapp.com",
  projectId: "helmet-938a2",
  storageBucket: "helmet-938a2.firebasestorage.app",
  messagingSenderId: "871531804108",
  appId: "1:871531804108:web:95109ca54a50a594925969",
  measurementId: "G-3KP4LDYC6B"
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
});
export const realStorage = getStorage(app);
export const auth = getAuth(app);

