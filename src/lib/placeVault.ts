import type { DirectoryListing } from '@/types';
import { isAuthenticVenueName, isNearDuplicate } from '@/lib/placeAuthenticity';
import { normalizeFuelBakeryListing, pinListing } from '@/lib/placePrecision';
import { shoppingLabel } from '@/lib/shoppingKind';
import { financialKind, financialLabel } from '@/lib/financialKind';
import { placeGallery, placeHeroImage, placeKindLabel, resolvePlaceKind } from '@/lib/placeImagery';
import { normalizeTurkeyEmergencyPhone } from '@/lib/turkeyEmergency';
import { getAllVerifiedPlaces } from '@/lib/verifiedPlaces';
import { CURATED_CATALOG_VERSION } from '@/lib/turkeyCuratedGuard';

const DB_NAME = 'flyway-guide-places';
const DB_VERSION = 1;
const LISTINGS_STORE = 'listings';
const META_STORE = 'meta';
const LS_BACKUP_KEY = 'flyway.vault.backup.v1';
const LS_META_KEY = 'flyway.vault.meta.v1';
const PERSIST_DEBOUNCE_MS = 450;
const BACKUP_CAP = 6000;

const byId = new Map<string, DirectoryListing>();
const dirty = new Set<string>();
const listeners = new Set<() => void>();

let revision = 0;
let seeded = false;
let bootPromise: Promise<void> | null = null;
let persistTimer = 0;
let dbPromise: Promise<IDBDatabase | null> | null = null;

function notify() {
  revision += 1;
  listeners.forEach((fn) => {
    try { fn(); } catch { /* keep other listeners alive */ }
  });
  window.dispatchEvent(new CustomEvent('flyway:vault-updated', { detail: { revision, count: byId.size } }));
}

export function getVaultRevision() {
  return revision;
}

export function getVaultCount() {
  return byId.size;
}

export function getVaultSnapshot(): DirectoryListing[] {
  return [...byId.values()];
}

export function subscribeVault(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function isStoredListing(value: unknown): value is DirectoryListing {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<DirectoryListing>;
  return Boolean(row.id)
    && typeof row.name === 'string'
    && row.name.trim().length >= 2
    && typeof row.category_key === 'string'
    && Number.isFinite(Number(row.lat))
    && Number.isFinite(Number(row.lng));
}

function compactListing(item: DirectoryListing): DirectoryListing {
  const normalized = normalizeFuelBakeryListing(item);
  if (normalized.category_key === 'fuel') {
    const image = placeHeroImage(normalized);
    return {
      ...normalized,
      images: [image],
      image,
      tags: Array.isArray(normalized.tags) ? normalized.tags.slice(0, 8) : [],
      proximity_note: normalized.proximity_note || '',
      description: normalized.description || '',
      address: normalized.address || '',
      phone: normalized.phone || '',
      hours: normalized.hours || '',
    };
  }
  const images = (normalized.images || []).filter((url) => /^https?:\/\//i.test(url)).slice(0, 4);
  return {
    ...normalized,
    images,
    image: normalized.image || images[0] || '',
    tags: Array.isArray(normalized.tags) ? normalized.tags.slice(0, 8) : [],
    proximity_note: normalized.proximity_note || '',
    description: normalized.description || '',
    address: normalized.address || '',
    phone: normalized.phone || '',
    hours: normalized.hours || '',
  };
}

function richer(prev: DirectoryListing, next: DirectoryListing): DirectoryListing {
  const images = [...(prev.images || []), ...(next.images || [])]
    .filter((url, i, all) => url && all.indexOf(url) === i)
    .slice(0, 8);
  return {
    ...prev,
    ...next,
    name: next.name || prev.name,
    description: (next.description || '').length >= (prev.description || '').length ? next.description : prev.description,
    address: (next.address || '').length >= (prev.address || '').length ? next.address : prev.address,
    phone: next.phone || prev.phone,
    hours: next.hours || prev.hours,
    website: next.website || prev.website,
    city: next.city || prev.city,
    country_name: next.country_name || prev.country_name,
    image: next.image || prev.image || images[0] || '',
    images: images.length ? images : (prev.images || next.images || []),
    tags: [...new Set([...(prev.tags || []), ...(next.tags || [])])].slice(0, 8),
    rating: Math.max(Number(prev.rating) || 0, Number(next.rating) || 0),
    is_featured: Boolean(prev.is_featured || next.is_featured),
    lat: next.lat || prev.lat,
    lng: next.lng || prev.lng,
  };
}

function upsertMemory(item: DirectoryListing): boolean {
  const pinned = pinListing(item);
  if (!pinned) return false;
  item = pinned;
  const prev = byId.get(item.id);
  if (!prev) {
    byId.set(item.id, compactListing(item));
    dirty.add(item.id);
    return true;
  }
  const merged = richer(prev, item);
  if (
    merged.name === prev.name
    && merged.address === prev.address
    && merged.phone === prev.phone
    && merged.city === prev.city
    && merged.lat === prev.lat
    && merged.lng === prev.lng
    && merged.hours === prev.hours
    && merged.category_key === prev.category_key
    && merged.category_label === prev.category_label
    && (merged.images || []).join('|') === (prev.images || []).join('|')
  ) {
    return false;
  }
  byId.set(item.id, compactListing(merged));
  dirty.add(item.id);
  return true;
}

function cellKey(category: string, lat: number, lng: number) {
  return `${category}:${Math.round(lat * 200)}:${Math.round(lng * 200)}`;
}

export function ingestListings(buckets: DirectoryListing[][], opts?: { fromCache?: boolean }): DirectoryListing[] {
  const accepted: DirectoryListing[] = [];
  const seen = new Set<string>();
  const grid = new Map<string, DirectoryListing[]>();
  const fromCache = Boolean(opts?.fromCache);

  const nearby = (item: DirectoryListing) => {
    const i = Math.round(item.lat * 200);
    const j = Math.round(item.lng * 200);
    const hits: DirectoryListing[] = [];
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const bucket = grid.get(`${item.category_key}:${i + di}:${j + dj}`);
        if (bucket) hits.push(...bucket);
      }
    }
    return hits;
  };

  const take = (item: DirectoryListing) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    const key = cellKey(item.category_key, item.lat, item.lng);
    const bucket = grid.get(key);
    if (bucket) bucket.push(item);
    else grid.set(key, [item]);
    accepted.push(item);
  };

  const ingest = (item: DirectoryListing) => {
    if (fromCache) {
      if (!isStoredListing(item)) return;
      const pinned = pinListing(item);
      if (!pinned) return;
      if (nearby(pinned).some((existing) => isNearDuplicate(existing, pinned))) return;
      take(pinned);
      return;
    }
    if (!isAuthenticVenueName(item.name, item.category_key) && !isAuthenticVenueName(item.description, item.category_key)) {
      return;
    }
    const pinned = pinListing(item);
    if (!pinned) return;
    if (seen.has(pinned.id)) return;
    pinned.phone = normalizeTurkeyEmergencyPhone(
      pinned.phone,
      pinned.country_name,
      pinned.city,
      pinned.category_key,
      pinned.address,
    );
    if (pinned.category_key === 'hotels' || pinned.category_key === 'restaurants') {
      pinned.place_kind = resolvePlaceKind(pinned);
      pinned.category_label = placeKindLabel(pinned.place_kind);
    }
    if (pinned.category_key === 'markets') {
      pinned.category_label = shoppingLabel(pinned);
    }
    if (pinned.category_key === 'exchange') {
      pinned.category_label = financialLabel(financialKind(pinned));
    }
    const owned = (pinned.images || []).filter((url) => /^https?:\/\//i.test(url));
    if (pinned.category_key === 'transport' || owned.length < 3) {
      pinned.images = placeGallery(pinned);
    }
    pinned.image = pinned.images?.[0] || pinned.image;
    if (nearby(pinned).some((existing) => isNearDuplicate(existing, pinned))) return;
    take(pinned);
  };

  for (const bucket of buckets) {
    for (const item of bucket) ingest(item);
  }
  return accepted;
}

export function replaceWithDatabaseListings(rows: DirectoryListing[]): number {
  const incoming = ingestListings([rows], { fromCache: true });
  if (incoming.length === 0) return 0;
  const keepIds = new Set(incoming.map((row) => row.id));
  const removed: string[] = [];
  for (const row of incoming) {
    for (const existing of [...byId.values()]) {
      if (keepIds.has(existing.id)) continue;
      if (!isNearDuplicate(existing, row)) continue;
      byId.delete(existing.id);
      removed.push(existing.id);
    }
    upsertMemory(row);
  }
  if (removed.length) {
    void openDb().then((db) => { if (db) void deleteMany(db, removed); });
  }
  notify();
  schedulePersist();
  writeLocalBackup(getVaultSnapshot());
  return incoming.length;
}

export function mergeIntoVault(rows: DirectoryListing[], opts?: { fromCache?: boolean; persist?: boolean }): number {
  const prepared = opts?.fromCache
    ? rows.filter(isStoredListing)
    : ingestListings([getVaultSnapshot(), rows]);
  let changed = 0;
  for (const item of prepared) {
    if (upsertMemory(item)) changed += 1;
  }
  const dropped = sanitizeCatalogInMemory();
  if (dropped.length) {
    changed += dropped.length;
    void openDb().then((db) => { if (db) void deleteMany(db, dropped); });
    writeLocalBackup(getVaultSnapshot());
  }
  if (changed && opts?.persist !== false) schedulePersist();
  if (changed) notify();
  return changed;
}

export function rememberUserListing(item: DirectoryListing): DirectoryListing | null {
  const pinned = pinListing({
    ...item,
    id: item.id || `user-${item.category_key}-${item.lat.toFixed(5)}-${item.lng.toFixed(5)}`,
    is_featured: true,
  });
  if (!pinned) return null;
  mergeIntoVault([pinned]);
  return byId.get(pinned.id) || pinned;
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(LISTINGS_STORE)) {
          const store = db.createObjectStore(LISTINGS_STORE, { keyPath: 'id' });
          store.createIndex('city', 'city', { unique: false });
          store.createIndex('category_key', 'category_key', { unique: false });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function readAllFromStore(db: IDBDatabase, storeName: string): Promise<unknown[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function deleteMany(db: IDBDatabase, ids: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (ids.length === 0) {
      resolve();
      return;
    }
    try {
      const tx = db.transaction(LISTINGS_STORE, 'readwrite');
      const store = tx.objectStore(LISTINGS_STORE);
      for (const id of ids) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function sanitizeCatalogInMemory(): string[] {
  const drop: string[] = [];
  for (const item of [...byId.values()]) {
    const pinned = pinListing(item);
    if (!pinned) {
      byId.delete(item.id);
      drop.push(item.id);
      continue;
    }
    if (pinned.lat !== item.lat || pinned.lng !== item.lng || pinned.image !== item.image || pinned.category_key !== item.category_key) {
      byId.set(item.id, compactListing(pinned));
      dirty.add(item.id);
    }
  }
  return drop;
}

function putMany(db: IDBDatabase, rows: DirectoryListing[]): Promise<void> {
  return new Promise((resolve) => {
    if (rows.length === 0) {
      resolve();
      return;
    }
    try {
      const tx = db.transaction([LISTINGS_STORE, META_STORE], 'readwrite');
      const store = tx.objectStore(LISTINGS_STORE);
      for (const row of rows) store.put(compactListing(row));
      tx.objectStore(META_STORE).put({
        key: 'head',
        count: byId.size,
        savedAt: Date.now(),
        revision,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

function readLocalBackup(): DirectoryListing[] {
  try {
    const raw = localStorage.getItem(LS_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { rows?: unknown[] };
    return (parsed.rows || []).filter(isStoredListing);
  } catch {
    return [];
  }
}

function writeLocalBackup(rows: DirectoryListing[]) {
  try {
    const featured = rows.filter((row) => row.is_featured || String(row.id).startsWith('verified-') || String(row.id).startsWith('user-'));
    const rest = rows.filter((row) => !featured.includes(row));
    const picked = [...featured, ...rest].slice(0, BACKUP_CAP).map(compactListing);
    localStorage.setItem(LS_BACKUP_KEY, JSON.stringify({ v: CURATED_CATALOG_VERSION, at: Date.now(), rows: picked }));
    localStorage.setItem(LS_META_KEY, JSON.stringify({ count: byId.size, savedAt: Date.now(), revision, catalog: CURATED_CATALOG_VERSION }));
  } catch {
    /* quota — IndexedDB remains the durable store */
  }
}

async function flushPersist() {
  persistTimer = 0;
  const ids = [...dirty];
  if (ids.length === 0) return;
  dirty.clear();
  const rows = ids.map((id) => byId.get(id)).filter((row): row is DirectoryListing => Boolean(row));
  const db = await openDb();
  if (db) await putMany(db, rows);
  else writeLocalBackup(getVaultSnapshot());
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = window.setTimeout(() => { void flushPersist(); }, PERSIST_DEBOUNCE_MS);
}

function bindLifecycle() {
  const flush = () => { void flushPersist(); };
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  if (navigator.storage?.persist) void navigator.storage.persist();
}

function seedModules() {
  if (seeded) return;
  seeded = true;
  if (byId.size > 0) return;
  const seeds = getAllVerifiedPlaces();
  for (const item of ingestListings([seeds], { fromCache: true })) upsertMemory(item);
}

export async function bootPlaceVault(): Promise<void> {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    bindLifecycle();
    const [db, backup] = await Promise.all([openDb(), Promise.resolve(readLocalBackup())]);
    const idbRows = db
      ? (await readAllFromStore(db, LISTINGS_STORE)).filter(isStoredListing)
      : [];
    const incoming = idbRows.length >= backup.length ? idbRows : [...idbRows, ...backup];
    for (const item of incoming.filter(isStoredListing)) {
      upsertMemory(item);
    }
    seedModules();
    const dropped = sanitizeCatalogInMemory();
    if (dropped.length && db) await deleteMany(db, dropped);
    if (dropped.length) writeLocalBackup(getVaultSnapshot());
    notify();
    schedulePersist();
  })();
  return bootPromise;
}

seedModules();
if (typeof window !== 'undefined') {
  void bootPlaceVault();
}
