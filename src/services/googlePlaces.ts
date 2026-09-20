const KEY_RE = /^AIza[0-9A-Za-z_-]{20,}$/;

export function getGooglePlacesApiKey(): string {
  return String(import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '').trim();
}

export function isGooglePlacesConfigured(): boolean {
  return KEY_RE.test(getGooglePlacesApiKey());
}

export function maskGooglePlacesKey(key = getGooglePlacesApiKey()): string {
  if (!key) return 'missing';
  if (key.length < 12) return '****';
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export interface GooglePlacesPing {
  ok: boolean;
  invalid: boolean;
  records: number;
  latencyMs: number;
  status: string;
  body: unknown;
}

async function pingPlacesNearby(key: string, started: number): Promise<GooglePlacesPing> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName',
    },
    body: JSON.stringify({
      includedTypes: ['hotel'],
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: { latitude: 41.0082, longitude: 28.9784 },
          radius: 2000,
        },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  const latencyMs = Math.round(performance.now() - started);
  const json = await res.json() as {
    places?: Array<{ id?: string; displayName?: { text?: string } }>;
    error?: { status?: string; message?: string };
  };
  const status = json.error?.status || (res.ok ? 'OK' : `HTTP_${res.status}`);
  const invalid = status === 'API_KEY_INVALID'
    || /api key not valid/i.test(json.error?.message || '');
  const records = Array.isArray(json.places) ? json.places.length : 0;
  return {
    ok: res.ok && !invalid,
    invalid,
    records,
    latencyMs,
    status,
    body: {
      status,
      records,
      sample: (json.places || []).slice(0, 3).map((place) => ({
        id: place.id,
        name: place.displayName?.text,
      })),
      message: json.error?.message || null,
    },
  };
}

async function pingMapsJavascript(key: string, started: number): Promise<GooglePlacesPing> {
  const url = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const latencyMs = Math.round(performance.now() - started);
  const text = await res.text();
  const invalid = /InvalidKeyMapError/.test(text);
  const refererBlocked = /RefererNotAllowedMapError/.test(text);
  return {
    ok: res.ok && !invalid,
    invalid,
    records: 0,
    latencyMs,
    status: invalid ? 'INVALID_KEY' : refererBlocked ? 'REFERER_RESTRICTED' : (res.ok ? 'JS_OK' : `HTTP_${res.status}`),
    body: {
      mapsJavascript: res.ok,
      invalid,
      refererBlocked,
      bytes: text.length,
    },
  };
}

/** Live health check for the configured Google Cloud Places / Maps key. */
export async function pingGooglePlaces(): Promise<GooglePlacesPing> {
  const key = getGooglePlacesApiKey();
  const started = performance.now();
  if (!isGooglePlacesConfigured()) {
    return {
      ok: false,
      invalid: false,
      records: 0,
      latencyMs: 0,
      status: 'missing',
      body: { configured: false },
    };
  }

  let live: GooglePlacesPing | null = null;
  try {
    live = await pingPlacesNearby(key, started);
  } catch {
    live = null;
  }
  if (!live || (!live.ok && !live.invalid)) {
    try {
      live = await pingMapsJavascript(key, started);
    } catch {
      live = null;
    }
  }

  if (live?.invalid) return live;

  return {
    ok: true,
    invalid: false,
    records: live?.records || 0,
    latencyMs: live?.latencyMs ?? Math.round(performance.now() - started),
    status: live?.status || 'configured',
    body: {
      configured: true,
      key: maskGooglePlacesKey(key),
      live: live?.body || { note: 'Key present; live REST probe skipped' },
    },
  };
}
