import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { DATASET_CACHE_KEY } from '@/lib/datasetVersion';
import { bootPlaceVault, getVaultCount, getVaultSnapshot } from '@/lib/placeVault';
import { HOTEL_CACHE_KEY, fetchTurkeyHotels, turkeyHotelCacheMeta } from '@/services/hotelApi';
import { TURKEY_HOTELS_DATA } from '@/data/turkeyHotelsData';

export type ApiHealthStatus = 'connected' | 'error' | 'disconnected';

export interface ApiHealthCard {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  status: ApiHealthStatus;
  records: number;
  lastSync: number | null;
  latencyMs: number | null;
  detail: string;
  log: unknown;
}

const SNAPSHOT_KEY = 'flyway.admin.health.v1';
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

async function timedJson(url: string, init: RequestInit, timeoutMs = 8000): Promise<{
  ok: boolean;
  status: number;
  latencyMs: number;
  body: unknown;
}> {
  const started = performance.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const latencyMs = Math.round(performance.now() - started);
    const text = await res.text();
    let body: unknown = text.slice(0, 1200);
    try {
      body = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return { ok: res.ok, status: res.status, latencyMs, body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latencyMs: Math.round(performance.now() - started),
      body: { error: err instanceof Error ? err.message : 'request failed' },
    };
  }
}

function clipLog(value: unknown): unknown {
  try {
    const raw = JSON.stringify(value);
    if (raw.length <= 1600) return value;
    return { truncated: true, preview: raw.slice(0, 1400) };
  } catch {
    return String(value).slice(0, 800);
  }
}

export async function probeTurkeyHotels(): Promise<ApiHealthCard> {
  const started = performance.now();
  try {
    const listings = await fetchTurkeyHotels();
    const meta = turkeyHotelCacheMeta();
    const resorts = listings.filter((row) => row.place_kind === 'resort').length;
    return {
      id: 'turkey-hotels',
      name: 'فنادق ومنتجعات تركيا',
      nameEn: 'Turkey Hotels API (local catalog)',
      description: 'قاعدة الفنادق والمنتجعات المحلية مع تخزين localStorage',
      status: listings.length > 0 ? 'connected' : 'error',
      records: listings.length,
      lastSync: meta.savedAt || Date.now(),
      latencyMs: Math.round(performance.now() - started),
      detail: `${listings.length} منشأة · ${resorts} منتجع · المصدر ${TURKEY_HOTELS_DATA.length} سجل`,
      log: clipLog({
        cacheKey: HOTEL_CACHE_KEY,
        version: meta.version,
        hotels: listings.filter((row) => row.place_kind !== 'resort').length,
        resorts,
        sample: listings.slice(0, 4).map((row) => ({ id: row.id, name: row.name, city: row.city })),
      }),
    };
  } catch (err) {
    return {
      id: 'turkey-hotels',
      name: 'فنادق ومنتجعات تركيا',
      nameEn: 'Turkey Hotels API',
      description: 'قاعدة الفنادق والمنتجعات المحلية',
      status: 'error',
      records: turkeyHotelCacheMeta().count,
      lastSync: turkeyHotelCacheMeta().savedAt,
      latencyMs: Math.round(performance.now() - started),
      detail: err instanceof Error ? err.message : 'فشل تحميل الكتالوج',
      log: { error: String(err) },
    };
  }
}

export async function probeGisBackend(): Promise<ApiHealthCard> {
  const hit = await timedJson('/api/health', { headers: { Accept: 'application/json' } });
  const body = (hit.body && typeof hit.body === 'object') ? hit.body as Record<string, unknown> : {};
  const connected = hit.ok && body.ok === true;
  return {
    id: 'gis-geoapify',
    name: 'خادم GIS / Geoapify',
    nameEn: 'Flyway GIS + Geoapify Places',
    description: 'واجهة /api المحلية ومفتاح Geoapify من جهة الخادم فقط',
    status: connected ? 'connected' : hit.status === 0 ? 'disconnected' : 'error',
    records: Number(body.placeCount) || 0,
    lastSync: connected ? Date.now() : null,
    latencyMs: hit.latencyMs,
    detail: connected
      ? `المخزن ${String(body.store || 'unknown')} · Geoapify ${body.geoapifyConfigured ? 'مفعّل' : 'غير مضبوط'}`
      : 'الخادم 8787 غير متصل أو أعاد خطأ',
    log: clipLog(body),
  };
}

export async function probeGooglePlaces(gis?: ApiHealthCard): Promise<ApiHealthCard> {
  const configured = Boolean(
    gis?.log && typeof gis.log === 'object' && (gis.log as Record<string, unknown>).googlePlacesConfigured,
  );
  return {
    id: 'google-places',
    name: 'Google Places',
    nameEn: 'Google Places API (server-side)',
    description: 'مفتاح GOOGLE_PLACES_API_KEY على الخادم فقط — لا يُعرض في الواجهة',
    status: !gis || gis.status === 'disconnected'
      ? 'disconnected'
      : configured ? 'connected' : 'disconnected',
    records: 0,
    lastSync: configured && gis?.status === 'connected' ? Date.now() : null,
    latencyMs: gis?.latencyMs ?? null,
    detail: configured
      ? 'المفتاح مضبوط على الخادم'
      : 'GOOGLE_PLACES_API_KEY غير مضبوط — لن تُجلب نتائج Google',
    log: clipLog({
      googlePlacesConfigured: configured,
      gisStatus: gis?.status || 'unknown',
    }),
  };
}

export async function probeRapidApi(gis?: ApiHealthCard): Promise<ApiHealthCard> {
  const configured = Boolean(
    gis?.log && typeof gis.log === 'object' && (gis.log as Record<string, unknown>).rapidApiConfigured,
  );
  return {
    id: 'rapidapi-booking',
    name: 'RapidAPI / Booking',
    nameEn: 'RapidAPI Booking endpoint',
    description: 'مفتاح RAPIDAPI_KEY على الخادم — غير مستخدم كمصدر أساسي للفنادق',
    status: configured && gis?.status === 'connected' ? 'connected' : 'disconnected',
    records: 0,
    lastSync: null,
    latencyMs: gis?.latencyMs ?? null,
    detail: configured
      ? 'المفتاح موجود لكن الكتالوج المحلي هو مصدر الفنادق المعتمد'
      : 'غير مضبوط — التطبيق يعتمد الكتالوج المحلي للفنادق',
    log: clipLog({ rapidApiConfigured: configured, sourceOfTruth: 'turkeyHotelsData.js' }),
  };
}

export async function probeSupabasePoi(): Promise<ApiHealthCard> {
  const started = performance.now();
  if (!isSupabaseConfigured()) {
    return {
      id: 'supabase-poi',
      name: 'Supabase / PostgreSQL',
      nameEn: 'Supabase places catalog',
      description: 'مصدر POI الموثّق (VITE_SUPABASE_URL + ANON)',
      status: 'disconnected',
      records: 0,
      lastSync: null,
      latencyMs: 0,
      detail: 'مفاتيح الواجهة غير مضبوطة',
      log: { configured: false },
    };
  }
  const { count, error } = await supabase.from('places').select('id', { count: 'exact', head: true });
  const latencyMs = Math.round(performance.now() - started);
  let datasetVersion: number | null = null;
  try {
    const raw = localStorage.getItem(DATASET_CACHE_KEY);
    if (raw) datasetVersion = Number((JSON.parse(raw) as { version?: number }).version) || null;
  } catch {
    /* ignore */
  }
  return {
    id: 'supabase-poi',
    name: 'Supabase / PostgreSQL',
    nameEn: 'Supabase places catalog',
    description: 'جدول places مع PostGIS',
    status: error ? 'error' : 'connected',
    records: count ?? 0,
    lastSync: error ? null : Date.now(),
    latencyMs,
    detail: error ? error.message : `${count ?? 0} نقطة اهتمام · إصدار البيانات ${datasetVersion ?? '—'}`,
    log: clipLog({ count, error: error?.message || null, datasetVersion }),
  };
}

export async function probeOverpass(): Promise<ApiHealthCard> {
  const query = '[out:json][timeout:8];node(1);out;';
  let lastError = 'all mirrors failed';
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const hit = await timedJson(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
    }, 9000);
    const body = hit.body as { elements?: unknown[] } | Record<string, unknown>;
    if (hit.ok) {
      return {
        id: 'overpass',
        name: 'OpenStreetMap Overpass',
        nameEn: 'Overpass API',
        description: 'مرآة OSM الحية للاستعلام الجغرافي',
        status: 'connected',
        records: Array.isArray((body as { elements?: unknown[] }).elements)
          ? (body as { elements: unknown[] }).elements.length
          : 0,
        lastSync: Date.now(),
        latencyMs: hit.latencyMs,
        detail: `مرآة نشطة: ${new URL(endpoint).host}`,
        log: clipLog({ endpoint, status: hit.status, sample: body }),
      };
    }
    lastError = typeof body === 'object' && body && 'error' in body
      ? String((body as { error: unknown }).error)
      : `HTTP ${hit.status}`;
  }
  return {
    id: 'overpass',
    name: 'OpenStreetMap Overpass',
    nameEn: 'Overpass API',
    description: 'مرآة OSM الحية',
    status: 'error',
    records: 0,
    lastSync: null,
    latencyMs: null,
    detail: lastError,
    log: { error: lastError },
  };
}

export async function probeNominatim(): Promise<ApiHealthCard> {
  const hit = await timedJson(
    'https://nominatim.openstreetmap.org/status.php?format=json',
    { headers: { Accept: 'application/json' } },
    8000,
  );
  const body = (hit.body && typeof hit.body === 'object') ? hit.body as Record<string, unknown> : {};
  const connected = hit.ok;
  return {
    id: 'nominatim',
    name: 'Nominatim Geocoding',
    nameEn: 'OpenStreetMap Nominatim',
    description: 'البحث الجغرافي للعناوين والمدن',
    status: connected ? 'connected' : 'error',
    records: 0,
    lastSync: connected ? Date.now() : null,
    latencyMs: hit.latencyMs,
    detail: connected ? `الحالة ${String(body.status || 'ok')}` : 'تعذر الاتصال بـ Nominatim',
    log: clipLog(body),
  };
}

export async function probeLocalStorage(): Promise<ApiHealthCard> {
  await bootPlaceVault();
  const vault = getVaultCount();
  const snapshot = getVaultSnapshot();
  const hotels = snapshot.filter((row) => row.category_key === 'hotels').length;
  const hotelMeta = turkeyHotelCacheMeta();
  const keys = Object.keys(localStorage).filter((key) => key.startsWith('flyway'));
  let backupCount = 0;
  try {
    const raw = localStorage.getItem('flyway.vault.backup.v1');
    if (raw) {
      const parsed = JSON.parse(raw) as { rows?: unknown[] };
      backupCount = Array.isArray(parsed.rows) ? parsed.rows.length : 0;
    }
  } catch {
    backupCount = 0;
  }
  return {
    id: 'local-storage',
    name: 'LocalStorage / IndexedDB',
    nameEn: 'Client persistence vault',
    description: 'خزينة النقاط المحلية ونسخة localStorage الاحتياطية',
    status: vault > 0 || hotelMeta.count > 0 ? 'connected' : 'error',
    records: vault,
    lastSync: hotelMeta.savedAt,
    latencyMs: 0,
    detail: `الخزينة ${vault} · فنادق مخزّنة ${hotelMeta.count} · مفاتيح flyway ${keys.length}`,
    log: clipLog({
      vault,
      hotelsInVault: hotels,
      hotelCache: hotelMeta,
      backupCount,
      keys,
    }),
  };
}

export async function probeAllApis(): Promise<ApiHealthCard[]> {
  const [hotels, gis, supabasePoi, overpass, nominatim, storage] = await Promise.all([
    probeTurkeyHotels(),
    probeGisBackend(),
    probeSupabasePoi(),
    probeOverpass(),
    probeNominatim(),
    probeLocalStorage(),
  ]);
  const google = await probeGooglePlaces(gis);
  const rapid = await probeRapidApi(gis);
  const cards = [hotels, gis, google, rapid, supabasePoi, overpass, nominatim, storage];
  persistSnapshot(cards);
  return cards;
}

export function persistSnapshot(cards: ApiHealthCard[]): void {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ at: Date.now(), cards }));
  } catch {
    /* ignore */
  }
}

export function readHealthSnapshot(): { at: number; cards: ApiHealthCard[] } | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; cards?: ApiHealthCard[] };
    if (!Array.isArray(parsed.cards)) return null;
    return { at: Number(parsed.at) || 0, cards: parsed.cards };
  } catch {
    return null;
  }
}
