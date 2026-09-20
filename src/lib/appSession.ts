import { CATEGORIES, type PageKey } from '@/types';
import { DEFAULT_CATEGORY_KEYS } from '@/lib/mapConfig';
import {
  FALLBACK_MAP_CENTER,
  resolveMapFocus,
  type AppLocation,
} from '@/lib/cityCoordinates';

export const APP_SESSION_KEY = 'flyway.session.v1';

export interface AppSession {
  view: PageKey;
  cats: string[];
  q: string;
  city?: string;
  country?: string;
  district?: string;
  label?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  poiId?: string;
}

const PAGE_KEYS: PageKey[] = [
  'home',
  'navigator',
  'directory',
  'visas',
  'hotels',
  'insurance',
  'rewards',
  'discover-iraq',
  'admin',
];

const PAGE_SET = new Set<string>(PAGE_KEYS);
const CAT_SET = new Set(['police', ...CATEGORIES.map((c) => c.key)]);
const DEFAULTS: AppSession = {
  view: 'home',
  cats: [...DEFAULT_CATEGORY_KEYS],
  q: '',
};

type Listener = (session: AppSession) => void;
const listeners = new Set<Listener>();
let listening = false;

function isPageKey(value: string | null | undefined): value is PageKey {
  return Boolean(value && PAGE_SET.has(value));
}

function parseCats(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined;
  const next = raw
    .split(',')
    .map((c) => c.trim())
    .filter((c) => CAT_SET.has(c));
  return next.length ? next : undefined;
}

function parseNum(raw: string | null | undefined): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function sameCats(a: string[], b: string[]) {
  return a.length === b.length && a.every((key) => b.includes(key));
}

function readStorage(): Partial<AppSession> {
  try {
    const raw = window.localStorage.getItem(APP_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<AppSession>;
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(session: AppSession) {
  try {
    window.localStorage.setItem(APP_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode / quota */
  }
}

export function readUrlSession(search = window.location.search): Partial<AppSession> {
  const params = new URLSearchParams(search);
  const viewRaw = params.get('view');
  const session: Partial<AppSession> = {};
  if (isPageKey(viewRaw)) session.view = viewRaw;
  const cats = parseCats(params.get('cats'));
  if (cats) session.cats = cats;
  const q = params.get('q');
  if (q) session.q = q;
  const city = params.get('city');
  if (city) session.city = city;
  const country = params.get('country');
  if (country) session.country = country;
  const district = params.get('district');
  if (district) session.district = district;
  const label = params.get('label');
  if (label) session.label = label;
  const lat = parseNum(params.get('lat'));
  const lng = parseNum(params.get('lng'));
  const zoom = parseNum(params.get('zoom'));
  if (lat != null) session.lat = lat;
  if (lng != null) session.lng = lng;
  if (zoom != null) session.zoom = zoom;
  const poiId = params.get('poi');
  if (poiId) session.poiId = poiId;
  return session;
}

function urlHasView(search = window.location.search) {
  return isPageKey(new URLSearchParams(search).get('view'));
}

function urlLooksLikeMap(url: Partial<AppSession>) {
  return Boolean(url.view === 'navigator' || url.city || url.country || url.district || url.lat != null);
}

function leftoverForcesHome(search = window.location.search) {
  const url = readUrlSession(search);
  if (urlHasView(search) || urlLooksLikeMap(url)) return false;
  const params = new URLSearchParams(search);
  const keys = [...params.keys()];
  return keys.some((key) => key === 'cats' || key === 'q' || key === 'v') &&
    keys.every((key) => key === 'cats' || key === 'q' || key === 'v');
}

function roundCoord(value?: number) {
  if (value == null || !Number.isFinite(value)) return undefined;
  return Math.round(value * 1e5) / 1e5;
}

export function sanitizeSession(input: Partial<AppSession>): AppSession {
  const view = isPageKey(input.view) ? input.view : 'home';
  const cats = (input.cats || []).filter((c) => CAT_SET.has(c));
  return {
    view,
    cats: cats.length ? cats : [...DEFAULT_CATEGORY_KEYS],
    q: (input.q || '').trim(),
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || undefined,
    district: input.district?.trim() || undefined,
    label: input.label?.trim() || undefined,
    lat: roundCoord(input.lat),
    lng: roundCoord(input.lng),
    zoom: Number.isFinite(input.zoom) ? Math.round(input.zoom as number) : undefined,
    poiId: input.poiId?.trim() || undefined,
  };
}

export function peekSession(): AppSession {
  const url = readUrlSession();
  const stored = readStorage();
  const params = new URLSearchParams(window.location.search);

  if (leftoverForcesHome()) {
    return sanitizeSession({ ...DEFAULTS, ...stored, view: 'home' });
  }

  if (urlHasView() || urlLooksLikeMap(url)) {
    const next: Partial<AppSession> = { ...stored, ...url };
    if (!params.has('cats')) {
      next.cats = stored.cats?.length ? stored.cats : [...DEFAULT_CATEGORY_KEYS];
    }
    if (!params.has('q')) next.q = stored.q ?? '';
    if (!url.view && urlLooksLikeMap(url)) next.view = 'navigator';
    return sanitizeSession(next);
  }

  return sanitizeSession({ ...DEFAULTS, ...stored });
}

export function resolveInitialSession(): AppSession {
  return peekSession();
}

function toSearchParams(session: AppSession) {
  const params = new URLSearchParams();
  params.set('view', session.view);
  if (session.cats.length && !sameCats(session.cats, DEFAULT_CATEGORY_KEYS)) {
    params.set('cats', session.cats.join(','));
  }
  if (session.q) params.set('q', session.q);
  if (session.country) params.set('country', session.country);
  if (session.city) params.set('city', session.city);
  if (session.district) params.set('district', session.district);
  if (session.label && session.label !== session.city) params.set('label', session.label);
  if (session.lat != null && session.lng != null) {
    params.set('lat', session.lat.toFixed(5));
    params.set('lng', session.lng.toFixed(5));
  }
  if (session.zoom != null) params.set('zoom', String(Math.round(session.zoom)));
  if (session.poiId) params.set('poi', session.poiId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function emit(session: AppSession) {
  listeners.forEach((fn) => fn(session));
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const next: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    if (obj[key] !== undefined) next[key] = obj[key];
  });
  return next;
}

export function writeSession(
  patch: Partial<AppSession>,
  history: 'replace' | 'push' | 'none' = 'replace',
): AppSession {
  const current = peekSession();
  const merged = sanitizeSession({ ...current, ...omitUndefined(patch as Record<string, unknown>) });
  writeStorage(merged);
  const unchanged = JSON.stringify(current) === JSON.stringify(merged);
  if (history !== 'none' && typeof window !== 'undefined') {
    const next = `${window.location.pathname}${toSearchParams(merged)}${window.location.hash}`;
    const href = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== href) {
      if (history === 'push') window.history.pushState({ flyway: true }, '', next);
      else window.history.replaceState({ flyway: true }, '', next);
    }
  }
  if (!unchanged) emit(merged);
  return merged;
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);
  ensureHistoryListener();
  return () => listeners.delete(listener);
}

function ensureHistoryListener() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', () => {
    const next = peekSession();
    writeStorage(next);
    emit(next);
  });
}

export function sessionToLocation(session: AppSession): AppLocation {
  return resolveMapFocus({
    country: session.country,
    city: session.city,
    district: session.district,
    lat: session.lat,
    lng: session.lng,
    label: session.label,
  });
}

export function locationToSessionPatch(loc: AppLocation): Partial<AppSession> {
  return {
    city: loc.city || '',
    country: loc.country || '',
    district: loc.district || '',
    label: loc.label || '',
    lat: loc.lat,
    lng: loc.lng,
    zoom: loc.zoom,
    poiId: loc.poiId || '',
  };
}

export function locationFromFallbackSession(session: AppSession): AppLocation {
  const focused = sessionToLocation(session);
  if (session.lat != null && session.lng != null) {
    return {
      ...focused,
      lat: session.lat,
      lng: session.lng,
      zoom: session.zoom ?? focused.zoom,
      label: session.label || focused.label,
      poiId: session.poiId,
    };
  }
  return focused.city || focused.country ? focused : FALLBACK_MAP_CENTER;
}
