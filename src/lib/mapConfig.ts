import { CATEGORIES } from '@/types';

export const DEFAULT_MAP_CENTER = {
  lat: 41.0082,
  lng: 28.9784,
  zoom: 14,
  label: 'إسطنبول',
} as const;

/** Street-level zoom still has raster tiles; 19+ often 404s into a black canvas. */
export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 18;
export const MAP_FOCUS_ZOOM = 16;

export const DEFAULT_CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export const EMERGENCY_CATEGORY_KEYS = ['hospitals', 'pharmacies', 'police'] as const;

export const MIN_FETCH_ZOOM = 10;
export const MAX_BOUNDS_SPAN_DEG = 2.4;
export const FETCH_RADIUS_METERS = 18000;

export interface FilterBarGroup {
  id: string;
  label: string;
  emoji: string;
  keys: string[];
}

/** One chip per homepage guide category. embassy chip also includes police. */
export const FILTER_BAR_GROUPS: FilterBarGroup[] = CATEGORIES.map((c) => ({
  id: c.key,
  label: c.shortLabel,
  emoji: '📍',
  keys: c.key === 'embassy' ? ['embassy', 'police'] : [c.key],
}));
