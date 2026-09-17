import { haversineKm } from '@/lib/geo';
import { sanitizePin } from '@/lib/placePrecision';

export type TravelMode = 'driving' | 'transit' | 'walking' | 'cycling' | 'flight';

export interface RoutePoint {
  label: string;
  lat: number;
  lng: number;
  source: 'gps' | 'place' | 'geocode' | 'map' | 'recent';
}

export interface RouteResult {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
  steps: string[];
  mode: TravelMode;
  estimated?: boolean;
  notice?: string;
}

const OSRM_ENDPOINTS: Record<Exclude<TravelMode, 'flight'>, string[]> = {
  driving: [
    'https://router.project-osrm.org/route/v1/driving',
    'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  ],
  transit: [
    'https://router.project-osrm.org/route/v1/driving',
    'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  ],
  walking: [
    'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
    'https://router.project-osrm.org/route/v1/foot',
  ],
  cycling: [
    'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
    'https://router.project-osrm.org/route/v1/bike',
  ],
};

const MAX_KM: Record<TravelMode, number> = {
  driving: 250,
  transit: 180,
  walking: 40,
  cycling: 80,
  flight: 20000,
};

function stepLabel(type: string, name: string): string {
  const dir =
    type === 'turn-right' || type === 'end of road-right' ? 'انعطف يميناً'
    : type === 'turn-left' || type === 'end of road-left' ? 'انعطف يساراً'
    : type === 'arrive' ? 'وصلت إلى الوجهة'
    : type === 'depart' ? 'ابدأ المسير'
    : type === 'roundabout' || type === 'rotary' ? 'ادخل الدوار'
    : type === 'merge' ? 'اندمج في الطريق'
    : type === 'fork' ? 'اتبع التفرع'
    : 'استمر';
  return name ? `${dir} على ${name}` : dir;
}

function decodeOsrm(json: {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates?: [number, number][] };
    legs?: Array<{ steps?: Array<{ maneuver?: { type?: string }; name?: string }> }>;
  }>;
}): Omit<RouteResult, 'mode'> | null {
  const route = json.routes?.[0];
  const coords: [number, number][] = (route?.geometry?.coordinates ?? []).map((c) => [c[1], c[0]]);
  if (!route || coords.length < 2) return null;
  const steps = (route.legs?.[0]?.steps ?? []).map((s) => stepLabel(s.maneuver?.type || '', s.name || ''));
  return {
    coordinates: coords,
    distanceKm: route.distance / 1000,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    steps: steps.length ? steps : ['ابدأ المسير', 'وصلت إلى الوجهة'],
  };
}

async function fetchOsrm(url: string, signal: AbortSignal): Promise<Omit<RouteResult, 'mode'> | null> {
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  return decodeOsrm(await res.json());
}

function greatCircle(from: RoutePoint, to: RoutePoint, n = 72): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(from.lat);
  const lon1 = toRad(from.lng);
  const lat2 = toRad(to.lat);
  const lon2 = toRad(to.lng);
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
  ));
  if (!Number.isFinite(d) || d < 1e-8) return [[from.lat, from.lng], [to.lat, to.lng]];
  const coords: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    coords.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return coords;
}

export function formatRouteDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} م`;
  if (km < 10) return `${km.toFixed(1)} كم`;
  return `${Math.round(km)} كم`;
}

export function formatRouteDuration(min: number): string {
  if (min < 60) return `${min} دقيقة`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} س ${m} د` : `${h} ساعة`;
}

export async function planRoute(
  origin: RoutePoint,
  dest: RoutePoint,
  mode: TravelMode,
  signal?: AbortSignal,
): Promise<RouteResult | null> {
  const from = sanitizePin(origin.lat, origin.lng);
  const to = sanitizePin(dest.lat, dest.lng);
  if (!from || !to) return null;
  const start = { ...origin, ...from };
  const end = { ...dest, ...to };
  const km = haversineKm(start.lat, start.lng, end.lat, end.lng);
  if (km < 0.02) {
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distanceKm: km,
      durationMin: 1,
      steps: ['أنت عند الوجهة تقريباً'],
      mode,
    };
  }

  if (mode === 'flight') {
    const durationMin = Math.max(45, Math.round((km / 780) * 60 + 40));
    return {
      coordinates: greatCircle(start, end),
      distanceKm: km,
      durationMin,
      steps: ['توجه إلى المطار', 'رحلة مباشرة', 'الوصول إلى الوجهة'],
      mode,
      estimated: true,
      notice: km < 120 ? 'المسافة قصيرة للطيران — يُفضّل السيارة أو النقل العام' : 'مسار جوي تقديري بين النقطتين',
    };
  }

  if (km > MAX_KM[mode]) {
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distanceKm: km,
      durationMin: Math.max(1, Math.round((km / (mode === 'walking' ? 5 : mode === 'cycling' ? 16 : 50)) * 60)),
      steps: ['المسافة خارج نطاق التوجيه التفصيلي'],
      mode,
      estimated: true,
      notice: 'المسافة بعيدة لهذا الوضع — جرّب السيارة أو الطيران',
    };
  }

  const path = `${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
  const endpoints = OSRM_ENDPOINTS[mode];
  let lastError: unknown = null;
  for (const base of endpoints) {
    try {
      const parsed = await fetchOsrm(`${base}/${path}`, signal ?? new AbortController().signal);
      if (!parsed) continue;
      if (mode === 'transit') {
        return {
          ...parsed,
          durationMin: Math.max(parsed.durationMin + 8, Math.round(parsed.durationMin * 1.28)),
          mode,
          estimated: true,
          notice: 'تقدير لمسار النقل العام اعتماداً على شبكة الطرق',
        };
      }
      return { ...parsed, mode };
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }

  if (lastError && signal?.aborted) throw lastError;
  return null;
}

export function pointFromCoords(lat: number, lng: number, label: string, source: RoutePoint['source']): RoutePoint | null {
  const pin = sanitizePin(lat, lng);
  if (!pin) return null;
  return { label, lat: pin.lat, lng: pin.lng, source };
}

export function remainingRouteCoords(
  coords: [number, number][],
  lat: number,
  lng: number,
): [number, number][] {
  if (coords.length < 2) return coords;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const dLat = coords[i][0] - lat;
    const dLng = coords[i][1] - lng;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const sliced = coords.slice(best);
  return sliced.length >= 2 ? sliced : coords.slice(-2);
}

export function currentStepIndex(steps: string[], remaining: number, total: number): number {
  if (!steps.length || total <= 0) return 0;
  const consumed = Math.min(1, Math.max(0, 1 - remaining / total));
  return Math.min(steps.length - 1, Math.floor(consumed * steps.length));
}
