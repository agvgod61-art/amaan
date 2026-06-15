// This file acts as a compatibility layer to migrate from Firebase to Supabase without changing 1000 lines of component code.
import { supabase } from "./supabase";

export const db = supabase;
export const auth = supabase.auth;

// Mocks for firebase/firestore
export const collection = (db: any, path: string) => ({
  type: "collection",
  path,
});
export const doc = (db: any, path: string, id?: string) => ({
  type: "doc",
  path,
  id,
});
export const getDocs = async (q: any) => {
  // Check if it's our mocked query
  if (q && q.type === "query") {
    let sQuery = supabase.from(q.path).select("*");
    for (const op of q.ops) {
      if (op.type === "where") {
        if (op.op === "==") sQuery = sQuery.eq(op.field, op.value);
        if (op.op === "array-contains")
          sQuery = sQuery.contains(op.field, [op.value]);
        if (op.op === "in") sQuery = sQuery.in(op.field, op.value);
      }
      if (op.type === "orderBy")
        sQuery = sQuery.order(op.field, { ascending: op.dir !== "desc" });
      if (op.type === "limit") sQuery = sQuery.limit(op.limit);
      if (op.type === "startAfter") {
        /* Pagination is complex in this mock */
      }
    }
    const { data, error } = await sQuery;
    if (error) throw error;
    return {
      empty: !data || data.length === 0,
      docs: (data || []).map((d: any) => ({
        id: d.id,
        data: () => d,
        exists: () => true,
      })),
      forEach: (cb: any) =>
        (data || []).forEach((d: any) =>
          cb({ id: d.id, data: () => d, exists: () => true }),
        ),
    };
  }

  // Basic collection get
  if (q && q.type === "collection") {
    const { data, error } = await supabase.from(q.path).select("*");
    if (error) throw error;
    return {
      empty: !data || data.length === 0,
      docs: (data || []).map((d: any) => ({
        id: d.id,
        data: () => d,
        exists: () => true,
      })),
      forEach: (cb: any) =>
        (data || []).forEach((d: any) =>
          cb({ id: d.id, data: () => d, exists: () => true }),
        ),
    };
  }
  return { empty: true, docs: [], forEach: () => {} };
};

export const getDoc = async (docRef: any) => {
  if (docRef && docRef.type === "doc") {
    const { data, error } = await supabase
      .from(docRef.path)
      .select("*")
      .eq("id", docRef.id)
      .single();
    if (error) {
      if (error.code === "PGRST116")
        return { exists: () => false, data: () => null }; // not found
      throw error;
    }
    return {
      exists: () => !!data,
      data: () => data,
      id: docRef.id,
    };
  }
  return { exists: () => false, data: () => null };
};

export const setDoc = async (docRef: any, data: any, options: any = {}) => {
  if (docRef && docRef.type === "doc") {
    const payload = { id: docRef.id, ...data };
    const { error } = await supabase.from(docRef.path).upsert(payload);
    if (error) throw error;
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  if (docRef && docRef.type === "doc") {
    const { error } = await supabase
      .from(docRef.path)
      .update(data)
      .eq("id", docRef.id);
    if (error) throw error;
  }
};

export const deleteDoc = async (docRef: any) => {
  if (docRef && docRef.type === "doc") {
    const { error } = await supabase
      .from(docRef.path)
      .delete()
      .eq("id", docRef.id);
    if (error) throw error;
  }
};

export const addDoc = async (colRef: any, data: any) => {
  if (colRef && colRef.type === "collection") {
    const { data: res, error } = await supabase
      .from(colRef.path)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return { id: res.id };
  }
  return { id: "unknown" };
};

export const query = (colRef: any, ...ops: any[]) => {
  return { type: "query", path: colRef.path, ops };
};

export const where = (field: string, op: string, value: any) => ({
  type: "where",
  field,
  op,
  value,
});
export const orderBy = (field: string, dir: string = "asc") => ({
  type: "orderBy",
  field,
  dir,
});
export const limit = (l: number) => ({ type: "limit", limit: l });
export const startAfter = (doc: any) => ({ type: "startAfter", doc });

export const getDocsFromCache = getDocs; // Just redirect to normal getDocs
export const getDocFromCache = getDoc;
export const serverTimestamp = () => new Date().toISOString();
export const onSnapshot = () => () => {};

export const writeBatch = (db: any) => {
  return {
    set: async (docRef: any, data: any) => {
      await setDoc(docRef, data);
    },
    update: async (docRef: any, data: any) => {
      await updateDoc(docRef, data);
    },
    delete: async (docRef: any) => {
      await deleteDoc(docRef);
    },
    commit: async () => {}, // in a real mock we might collect them and run in parallel, but sequential here is fine for mock
  };
};

export const storage = { type: "storage" };
export const ref = (storage: any, path: string) => ({ type: "ref", path });
export const deleteObject = async (ref: any) => {
  // If it's a Supabase storage URL actually we should parse it, but for our mock we don't care.
  if (ref && ref.type === "ref") {
    // If it's a Firebase URL, we can't delete it easily from Supabase.
  }
};

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
  console.error(`Supabase error during ${operationType} on ${path}:`, error);
}

export function isQuotaError(error: unknown): boolean {
  return false;
}
