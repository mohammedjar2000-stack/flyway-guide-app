export type LiveApiChannel =
  | 'overpass'
  | 'gis'
  | 'geoapify'
  | 'google-places'
  | 'nominatim'
  | 'rapidapi'
  | 'supabase';

export const LIVE_API_CHANNELS: LiveApiChannel[] = [
  'overpass',
  'gis',
  'geoapify',
  'google-places',
  'nominatim',
  'rapidapi',
  'supabase',
];

export const LIVE_API_CHANNEL_META: Record<LiveApiChannel, { label: string; labelEn: string; cardId?: string }> = {
  overpass: { label: 'OpenStreetMap Overpass', labelEn: 'Overpass', cardId: 'overpass' },
  gis: { label: 'GIS / الكتالوج الحي', labelEn: 'GIS catalog', cardId: 'gis-geoapify' },
  geoapify: { label: 'Geoapify', labelEn: 'Geoapify', cardId: 'gis-geoapify' },
  'google-places': { label: 'Google Places', labelEn: 'Google Places', cardId: 'google-places' },
  nominatim: { label: 'Nominatim', labelEn: 'Nominatim', cardId: 'nominatim' },
  rapidapi: { label: 'RapidAPI', labelEn: 'RapidAPI', cardId: 'rapidapi-booking' },
  supabase: { label: 'Supabase', labelEn: 'Supabase', cardId: 'supabase-poi' },
};

export interface LiveApiState {
  master: boolean;
  channels: Record<LiveApiChannel, boolean>;
}

export const LIVE_API_EVENT = 'flyway:live-api-changed';

function allOff(): Record<LiveApiChannel, boolean> {
  return {
    overpass: false,
    gis: false,
    geoapify: false,
    'google-places': false,
    nominatim: false,
    rapidapi: false,
    supabase: false,
  };
}

export function defaultLiveApiState(): LiveApiState {
  return { master: false, channels: allOff() };
}

/** Live remote POI/tile/health APIs are permanently disabled after the performance rollback. */
export function readLiveApiState(): LiveApiState {
  return defaultLiveApiState();
}

export function isLiveMasterOn(): boolean {
  return false;
}

export function isLiveApiEnabled(_channel: LiveApiChannel): boolean {
  return false;
}

export function isAnyLiveApiEnabled(): boolean {
  return false;
}

export function setLiveApiMaster(_on?: boolean): LiveApiState {
  return defaultLiveApiState();
}

export function setLiveApiChannel(_channel: LiveApiChannel, _on?: boolean): LiveApiState {
  return defaultLiveApiState();
}

export function subscribeLiveApi(_listener: (state: LiveApiState) => void): () => void {
  return () => undefined;
}

export function cardChannel(cardId: string): LiveApiChannel | null {
  if (cardId === 'overpass') return 'overpass';
  if (cardId === 'gis-geoapify') return 'gis';
  if (cardId === 'google-places') return 'google-places';
  if (cardId === 'nominatim') return 'nominatim';
  if (cardId === 'rapidapi-booking') return 'rapidapi';
  if (cardId === 'supabase-poi') return 'supabase';
  return null;
}

export function isLocalOnlyCard(cardId: string): boolean {
  return cardId === 'turkey-hotels' || cardId === 'local-storage';
}

export function isCardLiveEnabled(cardId: string): boolean {
  return isLocalOnlyCard(cardId);
}

export function setCardLiveEnabled(_cardId: string, _on?: boolean): LiveApiState {
  return defaultLiveApiState();
}
