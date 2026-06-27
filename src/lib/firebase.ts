import { firestoreDb, auth, realStorage, app } from "./real-firebase";
export { firestoreDb as db, auth, realStorage as storage, app };

import {
  getDoc as realGetDoc,
  getDocs as realGetDocs,
  setDoc as realSetDoc,
  addDoc as realAddDoc,
  updateDoc as realUpdateDoc,
  deleteDoc as realDeleteDoc,
  onSnapshot as realOnSnapshot,
  getDocFromCache as realGetDocFromCache,
  getDocsFromCache as realGetDocsFromCache,
} from "firebase/firestore";

export * from "firebase/firestore";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  console.warn(`Firebase error during ${operationType} on ${path}:`, error);
  if (isQuotaError(error)) {
    setQuotaExceededFlag();
  }
}

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("quota") || msg.includes("exceeded")) return true;
  }
  const str = String(error).toLowerCase();
  if (str.includes("quota") || str.includes("exceeded")) return true;
  
  const errObj = error as any;
  if (errObj.message && typeof errObj.message === "string") {
    const msg = errObj.message.toLowerCase();
    if (msg.includes("quota") || msg.includes("exceeded")) return true;
  }
  if (errObj.code && typeof errObj.code === "string" && errObj.code.toLowerCase().includes("resource_exhausted")) {
    return true;
  }
  return false;
}

export function setQuotaExceededFlag() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("firestore_quota_exceeded", "true");
  } catch (err) {
    console.warn("Failed to set quota flag in localStorage:", err);
  }
  window.dispatchEvent(new CustomEvent("firestore-quota-exceeded"));
}

export function checkQuotaExceeded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("firestore_quota_exceeded") === "true";
  } catch (err) {
    console.warn("Failed to read quota flag from localStorage:", err);
    return false;
  }
}

export function clearQuotaExceededFlag() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("firestore_quota_exceeded");
  } catch (err) {
    console.warn("Failed to clear quota flag in localStorage:", err);
  }
}

// Wrapped Operations
export async function getDoc(docRef: any) {
  if (checkQuotaExceeded()) {
    console.warn(`[Quota Bypass] getDoc on ${docRef.path}`);
    try {
      const snap = await realGetDocFromCache(docRef);
      if (snap && snap.exists()) return snap;
    } catch (err) {
      console.warn("getDoc fallback cache fetch failed:", err);
    }
    throw new Error("Quota limit exceeded (Local Fallback in effect)");
  }
  try {
    return await realGetDoc(docRef);
  } catch (error) {
    if (isQuotaError(error)) {
      setQuotaExceededFlag();
      try {
        const snap = await realGetDocFromCache(docRef);
        if (snap && snap.exists()) return snap;
      } catch (err) {
        console.warn("getDoc error cache fetch failed:", err);
      }
    }
    throw error;
  }
}

export async function getDocs(q: any) {
  if (checkQuotaExceeded()) {
    console.warn(`[Quota Bypass] getDocs`);
    try {
      const snap = await realGetDocsFromCache(q);
      if (snap && !snap.empty) return snap;
    } catch (err) {
      console.warn("getDocs fallback cache fetch failed:", err);
    }
    throw new Error("Quota limit exceeded (Local Fallback in effect)");
  }
  try {
    return await realGetDocs(q);
  } catch (error) {
    if (isQuotaError(error)) {
      setQuotaExceededFlag();
      try {
        const snap = await realGetDocsFromCache(q);
        if (snap && !snap.empty) return snap;
      } catch (err) {
        console.warn("getDocs error cache fetch failed:", err);
      }
    }
    throw error;
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  if (checkQuotaExceeded()) {
    console.warn(`[Quota Bypass] setDoc on ${docRef.path}`);
    throw new Error("Quota limit exceeded (Local Fallback in effect)");
  }
  try {
    return await realSetDoc(docRef, data, options);
  } catch (error) {
    if (isQuotaError(error)) {
      setQuotaExceededFlag();
    }
    throw error;
  }
}

export async function addDoc(collectionRef: any, data: any) {
  if (checkQuotaExceeded()) {
    console.warn(`[Quota Bypass] addDoc`);
    throw new Error("Quota limit exceeded (Local Fallback in effect)");
  }
  try {
    return await realAddDoc(collectionRef, data);
  } catch (error) {
    if (isQuotaError(error)) {
      setQuotaExceededFlag();
    }
    throw error;
  }
}

export async function updateDoc(docRef: any, ...args: any[]) {
  if (checkQuotaExceeded()) {
    console.warn(`[Quota Bypass] updateDoc on ${docRef.path}`);
    throw new Error("Quota limit exceeded (Local Fallback in effect)");
  }
  try {
    return await (realUpdateDoc as any)(docRef, ...args);
  } catch (error) {
    if (isQuotaError(error)) {
      setQuotaExceededFlag();
    }
    throw error;
  }
}

export async function deleteDoc(docRef: any) {
  if (checkQuotaExceeded()) {
    console.warn(`[Quota Bypass] deleteDoc on ${docRef.path}`);
    throw new Error("Quota limit exceeded (Local Fallback in effect)");
  }
  try {
    return await realDeleteDoc(docRef);
  } catch (error) {
    if (isQuotaError(error)) {
      setQuotaExceededFlag();
    }
    throw error;
  }
}

export function onSnapshot(reference: any, ...args: any[]): () => void {
  const hasQuota = checkQuotaExceeded();
  if (hasQuota) {
    console.warn(`[Quota Bypass] onSnapshot`);
    let onError: any = null;
    if (args.length === 2 && typeof args[1] === "function") {
      onError = args[1];
    } else if (args.length === 3 && typeof args[2] === "function") {
      onError = args[2];
    } else if (args[0] && typeof args[0] === "object" && typeof args[0].error === "function") {
      onError = args[0].error;
    }
    
    if (onError) {
      setTimeout(() => {
        onError(new Error("Quota limit exceeded (Local Fallback in effect)"));
      }, 0);
    }
    return () => {};
  }
  
  try {
    let onNext = args[0];
    let onError = args[1];
    let options = undefined;
    
    if (typeof args[0] === 'object' && typeof args[1] === 'function') {
      options = args[0];
      onNext = args[1];
      onError = args[2];
    }
    
    const wrappedOnError = (error: any) => {
      if (isQuotaError(error)) {
        setQuotaExceededFlag();
      }
      if (onError) {
        onError(error);
      } else {
        console.warn("Uncaught onSnapshot error:", error);
      }
    };
    
    if (options !== undefined) {
      return realOnSnapshot(reference, options, onNext, wrappedOnError);
    } else {
      return realOnSnapshot(reference, onNext, wrappedOnError);
    }
  } catch (error) {
    if (isQuotaError(error)) {
      setQuotaExceededFlag();
    }
    throw error;
  }
}

