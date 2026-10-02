import type { ExperimentRecord, Preferences, SavedCompound } from '../models';

/**
 * Thin promise wrapper over IndexedDB. Every call degrades gracefully (returns empty/undefined)
 * when IndexedDB is unavailable, e.g. private browsing or tests, so persistence never breaks the app.
 */
const DB_NAME = 'chemsim', DB_VERSION = 1, MAX_HISTORY = 50;
export const DEFAULT_PREFS: Preferences = { animations: true, saveHistory: true };

let dbPromise: Promise<IDBDatabase | null> | null = null;
function open(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const rq = indexedDB.open(DB_NAME, DB_VERSION);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('saved', { keyPath: 'formula' });
        db.createObjectStore('prefs', { keyPath: 'key' });
      };
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = rq.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}

async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const db = await open();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, mode);
      const rq = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(rq.result);
      tx.onerror = tx.onabort = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
}

export async function addExperiment(rec: ExperimentRecord): Promise<void> {
  await run('history', 'readwrite', (s) => s.add(rec));
  const keys = (await run('history', 'readonly', (s) => s.getAllKeys())) ?? [];
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_HISTORY))) await run('history', 'readwrite', (s) => s.delete(k));
}
export async function listExperiments(): Promise<ExperimentRecord[]> {
  const all = (await run<ExperimentRecord[]>('history', 'readonly', (s) => s.getAll())) ?? [];
  return all.sort((a, b) => b.timestamp - a.timestamp);
}
export const clearHistory = (): Promise<unknown> => run('history', 'readwrite', (s) => s.clear());

export const saveCompound = (c: SavedCompound): Promise<unknown> => run('saved', 'readwrite', (s) => s.put(c));
export const unsaveCompound = (formula: string): Promise<unknown> => run('saved', 'readwrite', (s) => s.delete(formula));
export const listSaved = async (): Promise<SavedCompound[]> => (await run<SavedCompound[]>('saved', 'readonly', (s) => s.getAll())) ?? [];
export const clearSaved = (): Promise<unknown> => run('saved', 'readwrite', (s) => s.clear());

export async function getPrefs(): Promise<Preferences> {
  const row = await run<{ key: string; value: Preferences } | undefined>('prefs', 'readonly', (s) => s.get('prefs'));
  return { ...DEFAULT_PREFS, ...(row?.value ?? {}) };
}
export const setPrefs = (value: Preferences): Promise<unknown> => run('prefs', 'readwrite', (s) => s.put({ key: 'prefs', value }));
