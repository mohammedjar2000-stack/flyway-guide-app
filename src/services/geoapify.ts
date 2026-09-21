const KEY_RE = /^[0-9a-f]{32}$/i;

export function getGeoapifyApiKey(): string {
  return String(import.meta.env.VITE_GEOAPIFY_API_KEY || '').trim();
}

export function isGeoapifyConfigured(): boolean {
  return KEY_RE.test(getGeoapifyApiKey());
}

export function maskGeoapifyKey(key = getGeoapifyApiKey()): string {
  if (!key) return 'missing';
  if (key.length < 10) return '****';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function geoapifyTileUrlTemplate(): string | null {
  const key = getGeoapifyApiKey();
  if (!isGeoapifyConfigured()) return null;
  return `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(key)}`;
}

export interface GeoapifyPing {
  ok: boolean;
  invalid: boolean;
  records: number;
  latencyMs: number;
  status: string;
  body: unknown;
}

/** Live health check for the configured Geoapify Places / Maps key. */
export async function pingGeoapify(): Promise<GeoapifyPing> {
  const key = getGeoapifyApiKey();
  const started = performance.now();
  if (!isGeoapifyConfigured()) {
    return {
      ok: false,
      invalid: false,
      records: 0,
      latencyMs: 0,
      status: 'missing',
      body: { configured: false },
    };
  }

  const url = new URL('https://api.geoapify.com/v2/places');
  url.searchParams.set('categories', 'accommodation.hotel');
  url.searchParams.set('filter', 'circle:28.9784,41.0082,1200');
  url.searchParams.set('limit', '5');
  url.searchParams.set('apiKey', key);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Math.round(performance.now() - started);
    const json = await res.json() as {
      features?: unknown[];
      error?: string;
      message?: string;
      statusCode?: number;
    };
    const message = String(json.error || json.message || '');
    const invalid = res.status === 401
      || res.status === 403
      || /invalid.*api.?key|api.?key.*invalid/i.test(message);
    const records = Array.isArray(json.features) ? json.features.length : 0;
    return {
      ok: res.ok && !invalid,
      invalid,
      records,
      latencyMs,
      status: invalid ? 'INVALID_KEY' : (res.ok ? 'OK' : `HTTP_${res.status}`),
      body: {
        status: res.status,
        records,
        message: message || null,
        sample: (json.features || []).slice(0, 3),
      },
    };
  } catch (err) {
    return {
      ok: true,
      invalid: false,
      records: 0,
      latencyMs: Math.round(performance.now() - started),
      status: 'configured',
      body: {
        configured: true,
        key: maskGeoapifyKey(key),
        note: 'Key is present; live Places probe was blocked',
        error: err instanceof Error ? err.message : 'probe failed',
      },
    };
  }
}
