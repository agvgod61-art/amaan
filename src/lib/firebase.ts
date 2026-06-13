import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBRCOijJtgYwNqdpeXdi15lZkXRuE9tYQc",
  authDomain: "cohesive-bulwark-pskkt.firebaseapp.com",
  projectId: "cohesive-bulwark-pskkt",
  storageBucket: "cohesive-bulwark-pskkt.firebasestorage.app",
  messagingSenderId: "222774696933",
  appId: "1:222774696933:web:b996cb00129658901cad0c",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, "ai-studio-940ddde2-ba02-4398-8a41-6ac0e8e72adf");
export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore error during ${operationType} on ${path}:`, error);
}

export function isQuotaError(error: unknown): boolean {
  if (error instanceof Error && error.message.includes("quota")) {
    return true;
  }
  return false;
}


