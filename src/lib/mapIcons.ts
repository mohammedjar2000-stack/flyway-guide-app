import L from 'leaflet';

export const CATEGORY_COLORS: Record<string, string> = {
  hotels: '#84cc16',
  resort: '#0f766e',
  restaurants: '#ea4335',
  cafe: '#b0602a',
  hospitals: '#ef4444',
  pharmacies: '#f59e0b',
  markets: '#8b5cf6',
  attractions: '#ccff00',
  exchange: '#06b6d4',
  mosques: '#7c3aed',
  transport: '#3b82f6',
  embassy: '#1d4ed8',
  police: '#dc2626',
  telecom: '#14b8a6',
  nightlife: '#6366f1',
  salons: '#ec4899',
  fuel: '#f97316',
  bakeries: '#22c55e',
  emergency: '#dc2626',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  hotels: '🏨',
  resort: '🌴',
  restaurants: '🍽️',
  cafe: '☕',
  hospitals: '🏥',
  pharmacies: '💊',
  markets: '🛒',
  attractions: '📸',
  exchange: '💱',
  mosques: '🕌',
  transport: '🚗',
  embassy: '🏛️',
  police: '🚓',
  telecom: '📱',
  nightlife: '🌙',
  salons: '✂️',
  fuel: '⛽',
  bakeries: '🥐',
  emergency: '🚨',
};

function emojiGlyph(key: string) {
  return `<span class="waze-poi-emoji">${CATEGORY_EMOJI[key] || '📍'}</span>`;
}

const iconCache = new Map<string, L.DivIcon>();

export function getCategoryIcon(categoryKey: string, active = false) {
  const cacheKey = `${categoryKey}:${active ? '1' : '0'}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;
  const icon = makeCategoryIcon(categoryKey, active);
  iconCache.set(cacheKey, icon);
  return icon;
}

export function getListingIcon(place: { category_key: string; place_kind?: string; category_label?: string }, active = false) {
  if (place.category_key === 'hotels' && (place.place_kind === 'resort' || place.category_label === 'منتجع')) {
    return getCategoryIcon('resort', active);
  }
  if (place.category_key === 'restaurants') {
    const cafe = place.place_kind === 'cafe' || place.category_label === 'مقهى';
    return getDiningIcon(cafe ? 'cafe' : 'restaurant', active);
  }
  return getCategoryIcon(place.category_key, active);
}

const diningCache = new Map<string, L.DivIcon>();

function utensilsGlyph() {
  return `<g fill="#EA4335" transform="translate(18 16)">
    <g transform="rotate(-34)">
      <rect x="-0.95" y="-0.2" width="1.9" height="7.1" rx="0.85"/>
      <rect x="-3.2" y="-6.55" width="1.2" height="5.55" rx="0.5"/>
      <rect x="-0.6" y="-6.55" width="1.2" height="5.55" rx="0.5"/>
      <rect x="2" y="-6.55" width="1.2" height="5.55" rx="0.5"/>
      <rect x="-3.2" y="-1.55" width="6.4" height="1.45" rx="0.45"/>
    </g>
    <g transform="rotate(34)">
      <rect x="-0.95" y="0.15" width="1.9" height="6.75" rx="0.85"/>
      <path d="M-1.55-6.7C-1.55-7.15-0.7-7.55.7-7.55c2.35 0 3.55 2.05 3.55 5.55H-.55c0-1.45-.2-2.7-.55-3.55-.4-1-.95-1.15-1.45-1.15z"/>
    </g>
  </g>`;
}

function coffeeGlyph() {
  return `<g transform="translate(18 16.1)">
    <path fill="#B0602A" d="M-4.55-2.55h6.7c.8 0 1.4.55 1.4 1.3v3.75c0 2.05-1.9 3.7-4.75 3.7S-6.15 4.55-6.15 2.5v-3.75c0-.75.6-1.3 1.6-1.3z"/>
    <path d="M3.7-1.2h1.45c1.25 0 2.2.9 2.2 2.05s-.95 2.05-2.2 2.05H3.7" fill="none" stroke="#B0602A" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-2.55-6.35c.2 1.05-.3 1.7-.3 2.45" fill="none" stroke="#B0602A" stroke-width="1.15" stroke-linecap="round"/>
    <path d="M-.05-6.75c.2 1.15-.35 1.9-.35 2.7" fill="none" stroke="#B0602A" stroke-width="1.15" stroke-linecap="round"/>
    <path d="M2.45-6.35c.2 1.05-.3 1.7-.3 2.45" fill="none" stroke="#B0602A" stroke-width="1.15" stroke-linecap="round"/>
  </g>`;
}

export function getDiningIcon(kind: 'restaurant' | 'cafe', active = false) {
  const cacheKey = `dining:${kind}:${active ? 1 : 0}`;
  const cached = diningCache.get(cacheKey);
  if (cached) return cached;
  const color = kind === 'cafe' ? '#B0602A' : '#EA4335';
  const w = active ? 38 : 34;
  const h = active ? 48 : 43;
  const icon = L.divIcon({
    className: `gmaps-dining-pin cat-${kind === 'cafe' ? 'cafe' : 'restaurants'}${active ? ' is-active' : ''}`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 1],
    popupAnchor: [0, -h + 6],
    html: `
      <div class="gmaps-dining-pin-wrap" aria-hidden="true">
        <svg viewBox="0 0 36 46" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <path fill="${color}" stroke="#fff" stroke-width="1.75" stroke-linejoin="round"
            d="M18 1c8.284 0 15 6.716 15 15 0 11.25-15 29-15 29S3 27.25 3 16C3 7.716 9.716 1 18 1z"/>
          <circle cx="18" cy="15.5" r="8.1" fill="#fff"/>
          ${kind === 'cafe' ? coffeeGlyph() : utensilsGlyph()}
        </svg>
      </div>
    `,
  });
  diningCache.set(cacheKey, icon);
  return icon;
}

export function makeCategoryIcon(categoryKey: string, active = false) {
  const color = CATEGORY_COLORS[categoryKey] || '#ccff00';
  const size = active ? 50 : 42;
  const inner = active ? 42 : 34;

  return L.divIcon({
    className: `waze-marker cat-${categoryKey}${active ? ' is-active' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 4],
    html: `
      <div class="waze-poi-wrap" style="width:${size}px;height:${size}px">
        <div class="waze-poi" style="width:${inner}px;height:${inner}px;background:${color}">
          ${emojiGlyph(categoryKey)}
        </div>
        <span class="waze-poi-tip" style="border-top-color:${color}"></span>
      </div>
    `,
  });
}

export function makeOriginIcon() {
  return L.divIcon({
    className: 'gmaps-endpoint origin',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div class="gmaps-origin-dot"></div>`,
  });
}

export function makeDestIcon() {
  return L.divIcon({
    className: 'gmaps-endpoint dest',
    iconSize: [36, 46],
    iconAnchor: [18, 45],
    popupAnchor: [0, -40],
    html: `
      <div class="gmaps-dest-pin" aria-hidden="true">
        <svg viewBox="0 0 36 46" width="36" height="46" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#ea4335"
            stroke="#fff"
            stroke-width="1.75"
            stroke-linejoin="round"
            d="M18 1c8.284 0 15 6.716 15 15 0 11.25-15 29-15 29S3 27.25 3 16C3 7.716 9.716 1 18 1z"
          />
          <circle cx="18" cy="15.5" r="5.75" fill="#fff"/>
        </svg>
      </div>
    `,
  });
}

export function makeUserPuckIcon(heading: number | null) {
  const rot = heading == null ? 0 : heading;
  const showCone = heading != null;
  return L.divIcon({
    className: 'waze-puck-marker',
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    html: `
      <div class="waze-puck">
        <div class="waze-puck-ripple"></div>
        <div class="waze-puck-cone" style="opacity:${showCone ? 1 : 0};transform:rotate(${rot}deg)"></div>
        <div class="waze-puck-core">
          <div class="waze-puck-inner"></div>
        </div>
      </div>
    `,
  });
}

function categoryFromMarker(marker: L.Marker): string {
  const cls = (marker.options.icon as L.DivIcon | undefined)?.options?.className || '';
  const hit = cls.match(/cat-([a-z]+)/);
  return hit?.[1] || 'attractions';
}

export function makeClusterIcon(cluster: { getChildCount: () => number; getAllChildMarkers?: () => L.Marker[] }) {
  const count = cluster.getChildCount();
  const children = cluster.getAllChildMarkers?.() ?? [];
  const tallies: Record<string, number> = {};
  for (const marker of children) {
    const key = categoryFromMarker(marker);
    tallies[key] = (tallies[key] || 0) + 1;
  }
  const ranked = Object.entries(tallies).sort((a, b) => b[1] - a[1]);
  const dominant = ranked[0]?.[0] || 'attractions';
  const color = CATEGORY_COLORS[dominant] || '#ccff00';
  const icons = ranked.slice(0, 3).map(([key]) => CATEGORY_EMOJI[key] || '📍').join('');
  const size = count < 8 ? 44 : count < 30 ? 52 : 60;

  return L.divIcon({
    html: `<div class="waze-cluster" style="width:${size}px;height:${size}px;background:${color}">
      <span class="waze-cluster-emoji">${icons || CATEGORY_EMOJI[dominant]}</span>
    </div>`,
    className: 'waze-cluster-wrap',
    iconSize: L.point(size, size),
  });
}
