import { useEffect, useState } from 'react';
import { USD_FALLBACK_RATES } from '@/lib/worldCurrencies';

const CACHE_KEY = 'flyway.usdRates.v1';
const TTL_MS = 12 * 60 * 60 * 1000;
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';

interface CacheShape {
  rates: Record<string, number>;
  fetchedAt: number;
}

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed?.rates || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useUsdRates() {
  const [rates, setRates] = useState<Record<string, number>>(() => ({ ...USD_FALLBACK_RATES }));
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setRates({ ...USD_FALLBACK_RATES, ...cached.rates });
      setLive(true);
      setUpdatedAt(cached.fetchedAt);
    }

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(RATES_URL, { signal: ctrl.signal });
        if (!res.ok) return;
        const json = await res.json() as { result?: string; rates?: Record<string, number> };
        if (json.result !== 'success' || !json.rates) return;
        const next = { ...USD_FALLBACK_RATES, ...json.rates };
        const fetchedAt = Date.now();
        setRates(next);
        setLive(true);
        setUpdatedAt(fetchedAt);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: json.rates, fetchedAt }));
      } catch {
        /* keep fallback / cache */
      }
    })();
    return () => ctrl.abort();
  }, []);

  return { rates, live, updatedAt };
}
