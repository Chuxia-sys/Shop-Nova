import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  writeBatch,
  DocumentData,
  DocumentSnapshot as DocSnap,
  enableMultiTabIndexedDbPersistence,
  type Transaction,
  type QueryConstraint,
  type WhereFilterOp,
  type OrderByDirection,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------------------------------------------------------------------------
// Enable offline persistence
// ---------------------------------------------------------------------------
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "Firestore persistence: multiple tabs open, persistence enabled in one tab only."
      );
    } else if (err.code === "unimplemented") {
      console.warn("Firestore persistence: not supported in this browser.");
    }
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FirestoreDocument {
  id: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  createdBy?: string;
  updatedBy?: string;
  status?: string;
  active?: boolean;
  deleted?: boolean;
  [key: string]: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  orderByField?: string;
  orderDirection?: OrderByDirection;
  startAfterDoc?: DocSnap | null;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

// ---------------------------------------------------------------------------
// Helper: Convert Firestore timestamps to serializable dates
// ---------------------------------------------------------------------------

function serializeTo<T extends Record<string, unknown>>(
  docSnap: DocSnap<DocumentData, DocumentData>
): T {
  const data = docSnap.data();
  if (!data) return { id: docSnap.id } as unknown as T;
  const serialized: Record<string, unknown> = { id: docSnap.id };
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      serialized[key] = value.toDate().toISOString();
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else {
      serialized[key] = value;
    }
  }
  return serialized as T;
}

// ---------------------------------------------------------------------------
// Create Document
// ---------------------------------------------------------------------------

export async function createDocument<T extends FirestoreDocument>(
  collectionName: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">,
  customId?: string
): Promise<T> {
  const collectionRef = collection(db, collectionName);
  const timestamp = serverTimestamp();

  const docData = {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
    active: data.active ?? true,
    deleted: false,
  };

  if (customId) {
    const docRef = doc(db, collectionName, customId);
    await setDoc(docRef, docData);
    const snap = await getDoc(docRef);
    return serializeTo<T>(snap);
  }

  const docRef = await addDoc(collectionRef, docData);
  const snap = await getDoc(docRef);
  return serializeTo<T>(snap);
}

// ---------------------------------------------------------------------------
// Update Document
// ---------------------------------------------------------------------------

export async function updateDocument<T extends FirestoreDocument>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<T> {
  const docRef = doc(db, collectionName, documentId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(docRef);
  return serializeTo<T>(snap);
}

// ---------------------------------------------------------------------------
// Delete Document (hard delete)
// ---------------------------------------------------------------------------

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
}

// ---------------------------------------------------------------------------
// Soft Delete
// ---------------------------------------------------------------------------

export async function softDelete(
  collectionName: string,
  documentId: string,
  userId?: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  await updateDoc(docRef, {
    deleted: true,
    status: "deleted",
    updatedAt: serverTimestamp(),
    ...(userId ? { updatedBy: userId } : {}),
  });
}

// ---------------------------------------------------------------------------
// Restore Document
// ---------------------------------------------------------------------------

export async function restoreDocument(
  collectionName: string,
  documentId: string,
  userId?: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  await updateDoc(docRef, {
    deleted: false,
    status: "active",
    updatedAt: serverTimestamp(),
    ...(userId ? { updatedBy: userId } : {}),
  });
}

// ---------------------------------------------------------------------------
// Get Document
// ---------------------------------------------------------------------------

export async function getDocument<T extends FirestoreDocument>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, documentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return serializeTo<T>(snap);
}

// ---------------------------------------------------------------------------
// Get Collection (all documents)
// ---------------------------------------------------------------------------

export async function getCollection<T extends FirestoreDocument>(
  collectionName: string
): Promise<T[]> {
  const colRef = collection(db, collectionName);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => serializeTo<T>(d));
}

// ---------------------------------------------------------------------------
// Query Collection
// ---------------------------------------------------------------------------

export async function queryCollection<T extends FirestoreDocument>(
  collectionName: string,
  filters: QueryFilter[] = [],
  orderByField?: string,
  orderDirection: OrderByDirection = "desc",
  limitCount?: number
): Promise<T[]> {
  const constraints: QueryConstraint[] = [];

  // Add deleted filter by default
  constraints.push(where("deleted", "==", false));

  for (const f of filters) {
    constraints.push(where(f.field, f.operator, f.value));
  }

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeTo<T>(d));
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export async function paginateCollection<T extends FirestoreDocument>(
  collectionName: string,
  params: PaginationParams,
  filters: QueryFilter[] = []
): Promise<PaginatedResult<T>> {
  const {
    page,
    limit: pageSize,
    orderByField = "createdAt",
    orderDirection = "desc",
  } = params;

  // Get total count
  const countConstraints: QueryConstraint[] = [where("deleted", "==", false)];
  for (const f of filters) {
    countConstraints.push(where(f.field, f.operator, f.value));
  }
  const countQuery = query(collection(db, collectionName), ...countConstraints);
  const countSnap = await getDocs(countQuery);
  const total = countSnap.size;

  const totalPages = Math.ceil(total / pageSize);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Build paginated query
  const queryConstraints: QueryConstraint[] = [where("deleted", "==", false)];

  for (const f of filters) {
    queryConstraints.push(where(f.field, f.operator, f.value));
  }

  queryConstraints.push(orderBy(orderByField, orderDirection));
  queryConstraints.push(limit(pageSize));

  // If page > 1, we need to use cursor-based pagination
  // For simplicity, we fetch all and slice (not ideal for large datasets)
  // A better approach would use startAfter with a cursor
  if (page > 1) {
    // Fetch all matching docs up to the current page
    const allQuery = query(
      collection(db, collectionName),
      where("deleted", "==", false),
      ...filters.map((f) => where(f.field, f.operator, f.value)),
      orderBy(orderByField, orderDirection)
    );
    const allSnap = await getDocs(allQuery);
    const allDocs = allSnap.docs;
    const startIndex = (page - 1) * pageSize;
    const pageDocs = allDocs.slice(startIndex, startIndex + pageSize);

    return {
      data: pageDocs.map((d) => serializeTo<T>(d)),
      pagination: { page, limit: pageSize, total, totalPages, hasNext, hasPrev },
    };
  }

  const q = query(collection(db, collectionName), ...queryConstraints);
  const snap = await getDocs(q);

  return {
    data: snap.docs.map((d) => serializeTo<T>(d)),
    pagination: { page, limit: pageSize, total, totalPages, hasNext, hasPrev },
  };
}

// ---------------------------------------------------------------------------
// Search (simple text search using Firestore)
// ---------------------------------------------------------------------------

export async function searchCollection<T extends FirestoreDocument>(
  collectionName: string,
  searchField: string,
  searchTerm: string,
  limitCount: number = 20
): Promise<T[]> {
  // Firestore doesn't support full-text search natively.
  // This uses a simple prefix match on the search field.
  const q = query(
    collection(db, collectionName),
    where("deleted", "==", false),
    where(searchField, ">=", searchTerm),
    where(searchField, "<=", searchTerm + "\uf8ff"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => serializeTo<T>(d));
}

// ---------------------------------------------------------------------------
// Batch Write
// ---------------------------------------------------------------------------

export async function batchWrite(
  operations: Array<{
    type: "set" | "update" | "delete";
    collection: string;
    documentId: string;
    data?: Record<string, unknown>;
  }>
): Promise<void> {
  const batch = writeBatch(db);

  for (const op of operations) {
    const docRef = doc(db, op.collection, op.documentId);
    switch (op.type) {
      case "set":
        batch.set(docRef, { ...op.data, updatedAt: serverTimestamp() });
        break;
      case "update":
        batch.update(docRef, { ...op.data, updatedAt: serverTimestamp() });
        break;
      case "delete":
        batch.delete(docRef);
        break;
    }
  }

  await batch.commit();
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

export async function executeTransaction<T>(
  updateFn: (transaction: Transaction) => Promise<T>
): Promise<T> {
  return runTransaction(db, updateFn);
}

// ---------------------------------------------------------------------------
// Real-time Listener
// ---------------------------------------------------------------------------

export function realTimeListener<T extends FirestoreDocument>(
  collectionName: string,
  filters: QueryFilter[] = [],
  onData: (items: T[]) => void,
  onError?: (error: Error) => void,
  orderByField?: string,
  orderDirection: OrderByDirection = "desc"
): Unsubscribe {
  const constraints: QueryConstraint[] = [where("deleted", "==", false)];

  for (const f of filters) {
    constraints.push(where(f.field, f.operator, f.value));
  }

  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }

  const q = query(collection(db, collectionName), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => serializeTo<T>(d));
      onData(items);
    },
    onError
  );
}

// ---------------------------------------------------------------------------
// Real-time Document Listener
// ---------------------------------------------------------------------------

export function realTimeDocumentListener<T extends FirestoreDocument>(
  collectionName: string,
  documentId: string,
  onData: (item: T | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, documentId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(serializeTo<T>(snap));
    },
    onError
  );
}

// ---------------------------------------------------------------------------
// Filter helper
// ---------------------------------------------------------------------------

export function filter(
  field: string,
  operator: WhereFilterOp,
  value: unknown
): QueryFilter {
  return { field, operator, value };
}

// ---------------------------------------------------------------------------
// Get document reference
// ---------------------------------------------------------------------------

export function getDocRef(collectionName: string, documentId: string) {
  return doc(db, collectionName, documentId);
}

// ---------------------------------------------------------------------------
// Get collection reference
// ---------------------------------------------------------------------------

export function getColRef(collectionName: string) {
  return collection(db, collectionName);
}