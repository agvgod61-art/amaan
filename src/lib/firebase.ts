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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  console.error(`Firebase error during ${operationType} on ${path}:`, error);
  if (isQuotaError(error)) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("firestore-quota-exceeded"));
    }
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
