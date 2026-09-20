import type { RoutePoint, TravelMode } from '@/lib/routing';
import { sanitizePin } from '@/lib/placePrecision';

const KEY = 'flyway-route-recent';
const DRAFT_KEY = 'flyway.route.draft.v1';
const MAX = 8;

export interface RecentPlace {
  label: string;
  lat: number;
  lng: number;
  at: number;
}

function read(): RecentPlace[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPlace[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && sanitizePin(p.lat, p.lng) && p.label);
  } catch {
    return [];
  }
}

function write(items: RecentPlace[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* ignore quota */
  }
}

export function getRecentPlaces(): RecentPlace[] {
  return read().sort((a, b) => b.at - a.at).slice(0, MAX);
}

export function rememberPlace(point: Pick<RoutePoint, 'label' | 'lat' | 'lng'>): RecentPlace[] {
  const pin = sanitizePin(point.lat, point.lng);
  if (!pin || !point.label.trim()) return getRecentPlaces();
  const next = read().filter((p) => {
    const sameName = p.label.trim() === point.label.trim();
    const samePin = Math.abs(p.lat - pin.lat) < 0.00015 && Math.abs(p.lng - pin.lng) < 0.00015;
    return !sameName && !samePin;
  });
  next.unshift({ label: point.label.trim(), lat: pin.lat, lng: pin.lng, at: Date.now() });
  write(next);
  return next.slice(0, MAX);
}

export interface RouteDraft {
  origin: RoutePoint | null;
  dest: RoutePoint | null;
  mode: TravelMode;
  open?: boolean;
}

export function readRouteDraft(): RouteDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RouteDraft>;
    const pin = (p?: RoutePoint | null) => {
      if (!p) return null;
      const next = sanitizePin(p.lat, p.lng);
      if (!next || !p.label) return null;
      return { ...p, lat: next.lat, lng: next.lng } as RoutePoint;
    };
    return {
      origin: pin(parsed.origin ?? null),
      dest: pin(parsed.dest ?? null),
      mode: parsed.mode === 'walking' || parsed.mode === 'transit' || parsed.mode === 'cycling' || parsed.mode === 'flight'
        ? parsed.mode
        : 'driving',
      open: Boolean(parsed.open),
    };
  } catch {
    return null;
  }
}

export function writeRouteDraft(draft: RouteDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function clearRouteDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
