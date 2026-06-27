import { firestoreDb, auth, realStorage, app } from "./real-firebase";
export { firestoreDb as db, auth, realStorage as storage, app };

export * from "firebase/firestore";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function isPermissionError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("permission") || msg.includes("denied")) return true;
  }
  const str = String(error).toLowerCase();
  if (str.includes("permission") || str.includes("denied")) return true;
  
  const errObj = error as any;
  if (errObj.message && typeof errObj.message === "string") {
    const msg = errObj.message.toLowerCase();
    if (msg.includes("permission") || msg.includes("denied")) return true;
  }
  if (errObj.code && typeof errObj.code === "string" && (errObj.code.toLowerCase().includes("permission") || errObj.code.toLowerCase().includes("denied"))) {
    return true;
  }
  return false;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  if (isPermissionError(error)) {
    console.warn(`Firebase permission warning during ${operationType} on ${path}. Please ensure your firestore.rules are deployed in the Firebase Console:`, error);
  } else {
    console.error(`Firebase error during ${operationType} on ${path}:`, error);
  }
  if (isQuotaError(error)) {
    try {
      localStorage.setItem("firestore_quota_exceeded", "true");
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("firestore-quota-exceeded"));
    }
  }
}

export function isFirebaseDisabledByQuota(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("firestore_quota_exceeded") === "true";
  } catch (e) {
    return false;
  }
}

export function clearQuotaExceededFlag(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("firestore_quota_exceeded");
    localStorage.removeItem("agv_quota_banner_dismissed");
  } catch (e) {
    console.warn("localStorage clear failed:", e);
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
