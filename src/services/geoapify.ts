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
  return null;
}

export interface GeoapifyPing {
  ok: boolean;
  invalid: boolean;
  records: number;
  latencyMs: number;
  status: string;
  body: unknown;
}

/** Live Geoapify probes are disabled after the performance rollback. */
export async function pingGeoapify(): Promise<GeoapifyPing> {
  return {
    ok: false,
    invalid: false,
    records: 0,
    latencyMs: 0,
    status: 'disabled',
    body: { paused: true },
  };
}
