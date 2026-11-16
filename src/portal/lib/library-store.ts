// The last complete live library, kept in IndexedDB so a reload or a new
// visit can show it at once while a fresh copy streams in behind it.
//
// IndexedDB rather than localStorage: the library is about a megabyte of JSON
// and growing, which is a fifth of localStorage's quota, and localStorage
// reads block the main thread.
//
// Everything here fails soft. A private window, blocked site data or a full
// disk turns every call into a no-op, and the Portal simply loads from the
// network as it did before.

import type { PortalAsset } from "./portal-assets";

const DB_NAME = "portal";
const STORE = "library";
const KEY = "live";
/** Older than this is not worth showing, even as a placeholder. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface StoredLibrary {
  assets: PortalAsset[];
  folders: { name: string; count: number }[];
  projects: number;
  savedAt: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadStoredLibrary(): Promise<StoredLibrary | null> {
  try {
    const db = await open();
    const value = await new Promise<StoredLibrary | undefined>((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result as StoredLibrary | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!value?.assets?.length || Date.now() - value.savedAt > MAX_AGE_MS) return null;
    return value;
  } catch {
    return null;
  }
}

export async function saveStoredLibrary(library: Omit<StoredLibrary, "savedAt">): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ ...library, savedAt: Date.now() }, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* Not stored: the next visit loads from the network. */
  }
}
