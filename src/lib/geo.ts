import type { DirectoryListing } from '@/types';

const EARTH_RADIUS_KM = 6371;
export const RADIUS_KM = 4;

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function withinRadius(lat: number, lng: number, centerLat: number, centerLng: number): boolean {
  return haversineKm(centerLat, centerLng, lat, lng) <= RADIUS_KM;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export function isValidBounds(b?: MapBounds | null): boolean {
  if (!b) return false;
  const { south, west, north, east } = b;
  if (![south, west, north, east].every((n) => Number.isFinite(n))) return false;
  if (south >= north) return false;
  if (Math.abs(east - west) < 0.001) return false;
  if (south < -85 || north > 85) return false;
  if (Math.abs(west) > 180 || Math.abs(east) > 180) return false;
  return true;
}

export function sanitizeBounds(b?: MapBounds | null): MapBounds | null {
  if (!b) return null;
  let { south, west, north, east } = b;
  if (![south, west, north, east].every((n) => Number.isFinite(n))) return null;
  if (south > north) [south, north] = [north, south];
  if (west === east) return null;
  if (north - south < 0.008) {
    const mid = (south + north) / 2;
    south = mid - 0.03;
    north = mid + 0.03;
  }
  if (Math.abs(east - west) < 0.008) {
    const mid = (west + east) / 2;
    west = mid - 0.03;
    east = mid + 0.03;
  }
  const next = { south, west, north, east };
  if (!isValidBounds(next)) return null;
  if (north - south > 2.8 || Math.abs(east - west) > 2.8) return null;
  return next;
}

export function padBounds(b: MapBounds, factor = 0.12): MapBounds {
  const latPad = Math.max((b.north - b.south) * factor, 0.004);
  const lngPad = Math.max((b.east - b.west) * factor, 0.004);
  return {
    south: b.south - latPad,
    west: b.west - lngPad,
    north: b.north + latPad,
    east: b.east + lngPad,
  };
}

export function boundsSpanDeg(b: MapBounds): number {
  return Math.max(b.north - b.south, Math.abs(b.east - b.west));
}

export function pointInBounds(lat: number, lng: number, b: MapBounds): boolean {
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

export function roundBounds(b: MapBounds, precision = 3): MapBounds {
  const r = (n: number) => Number(n.toFixed(precision));
  return { south: r(b.south), west: r(b.west), north: r(b.north), east: r(b.east) };
}

const SPREAD_RADIUS_DEG = 0.004;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function spreadCoordinates<T extends { id: string; lat: number; lng: number }>(
  items: T[]
): T[] {
  const coordGroups = new Map<string, T[]>();
  for (const item of items) {
    const key = `${item.lat.toFixed(5)},${item.lng.toFixed(5)}`;
    const group = coordGroups.get(key);
    if (group) group.push(item);
    else coordGroups.set(key, [item]);
  }

  const result: T[] = [];
  for (const [, group] of coordGroups) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const n = group.length;
    for (let i = 0; i < n; i++) {
      const item = group[i];
      const h = hashId(item.id);
      const angle = (h % 360) * (Math.PI / 180);
      const ring = Math.floor(h / 360) % 3;
      const radius = SPREAD_RADIUS_DEG * (0.3 + ring * 0.35);
      const offset = i / n;
      const finalAngle = angle + offset * Math.PI * 2;
      result.push({
        ...item,
        lat: item.lat + Math.cos(finalAngle) * radius,
        lng: item.lng + Math.sin(finalAngle) * radius,
      });
    }
  }
  return result;
}

export async function fetchNearbyFromOSM(
  _lat: number,
  _lng: number,
  _radiusMeters: number = 4000,
): Promise<DirectoryListing[]> {
  return [];
}

export function radiusMetersFromBounds(b: MapBounds): number {
  const km = haversineKm(b.south, b.west, b.north, b.east) / 2;
  return Math.min(12000, Math.max(800, Math.round(km * 1000)));
}

