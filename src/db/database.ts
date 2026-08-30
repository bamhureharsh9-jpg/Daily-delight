import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseSchema } from './types';
import { SEED } from './seedData';
import { realtime } from './realtime';

const STORAGE_KEY = '@dailydelight/db/v1';
let cache: DatabaseSchema | null = null;
let initPromise: Promise<DatabaseSchema> | null = null;

// Load DB from AsyncStorage (with seed fallback)
export async function loadDB(): Promise<DatabaseSchema> {
  if (cache) return cache;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        cache = JSON.parse(raw) as DatabaseSchema;
      } else {
        cache = JSON.parse(JSON.stringify(SEED));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      }
    } catch (err) {
      console.warn('DB load failed, using seed', err);
      cache = JSON.parse(JSON.stringify(SEED));
    }
    return cache!;
  })();

  return initPromise;
}

export async function saveDB(db: DatabaseSchema): Promise<void> {
  cache = db;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.warn('DB save failed', err);
  }
}

export async function updateDB(mutator: (db: DatabaseSchema) => void): Promise<DatabaseSchema> {
  const db = await loadDB();
  mutator(db);
  await saveDB(db);
  return db;
}

export async function resetDB(): Promise<void> {
  cache = JSON.parse(JSON.stringify(SEED));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  realtime.emit('db:reset', null);
}

// Subscribe to changes - returns unsubscribe fn
export function subscribe<T = any>(event: string, fn: (payload: T) => void): () => void {
  return realtime.on(event, fn);
}

export function notify(event: string, payload?: any): void {
  realtime.emit(event, payload);
}
