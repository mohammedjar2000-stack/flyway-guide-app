import type { RoutePoint } from '@/lib/routing';
import { sanitizePin } from '@/lib/placePrecision';

const KEY = 'flyway-route-recent';
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
