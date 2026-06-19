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
}

export function isQuotaError(error: unknown): boolean {
  if (error instanceof Error && error.message.includes("quota")) return true;
  return false;
}
