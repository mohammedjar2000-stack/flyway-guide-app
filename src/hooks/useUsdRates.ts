import { useState } from 'react';
import { USD_FALLBACK_RATES } from '@/lib/worldCurrencies';

const CACHE_KEY = 'flyway.usdRates.v1';
const TTL_MS = 12 * 60 * 60 * 1000;

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

export function useUsdRates(_enabled = true) {
  const cached = readCache();
  const [rates] = useState<Record<string, number>>(() => ({
    ...USD_FALLBACK_RATES,
    ...(cached?.rates ?? {}),
  }));
  return {
    rates,
    live: Boolean(cached),
    updatedAt: cached?.fetchedAt ?? null,
  };
}
