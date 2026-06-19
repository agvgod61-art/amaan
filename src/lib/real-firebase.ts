import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "cohesive-bulwark-pskkt",
  appId: "1:222774696933:web:b996cb00129658901cad0c",
  apiKey: "AIzaSyBRCOijJtgYwNqdpeXdi15lZkXRuE9tYQc",
  authDomain: "cohesive-bulwark-pskkt.firebaseapp.com",
  storageBucket: "cohesive-bulwark-pskkt.firebasestorage.app",
  messagingSenderId: "222774696933",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app, "ai-studio-940ddde2-ba02-4398-8a41-6ac0e8e72adf");
export const realStorage = getStorage(app);
export const auth = getAuth(app);
