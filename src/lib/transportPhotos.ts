import { wikiFile } from '@/lib/hotelPhotos';

export function isRejectedTransportStock(url: string): boolean {
  return TRANSPORT_STOCK_BAN.some((id) => url.includes(id));
}

/** Black-car silhouettes and broken generic transport stock used previously. */
const TRANSPORT_STOCK_BAN = [
  '1485291571150-772bcfc10da5',
  '1449965407474-8f6c8d4a0a3b',
  '1549317661-bd32c8ce16db',
];

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

function pexels(id: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
}

const RENTAL_FLEET = pexels(164634);
const RENTAL_CARS = pexels(116675);
const AIRPORT_TERMINAL = unsplash('1464037866556-6812c9d1c72e');
const DEPARTURE_HALL = unsplash('1436491865332-7a61a109cc05');
const FERRY_WATER = unsplash('1507525428034-b723cf961d3e');
const ENTERPRISE_STOREFRONT = wikiFile('Enterprise Rent-A-Car.jpg');
const SIRKECI_STATION = wikiFile('Sirkeci railway station.jpg');

const BRAND_PHOTOS: Array<{ test: RegExp; photos: string[] }> = [
  {
    test: /\bavis\b|أفيس/i,
    photos: [RENTAL_CARS, RENTAL_FLEET, ENTERPRISE_STOREFRONT],
  },
  {
    test: /\bhertz\b|هرتز/i,
    photos: [RENTAL_CARS, RENTAL_FLEET, ENTERPRISE_STOREFRONT],
  },
  {
    test: /\benterprise\b|إنتربرايز|انتربرايز/i,
    photos: [ENTERPRISE_STOREFRONT, RENTAL_FLEET, RENTAL_CARS],
  },
  {
    test: /\bbudget\b|بدجت/i,
    photos: [RENTAL_FLEET, RENTAL_CARS, ENTERPRISE_STOREFRONT],
  },
  {
    test: /\bsixt\b|سيكست/i,
    photos: [RENTAL_FLEET, RENTAL_CARS, ENTERPRISE_STOREFRONT],
  },
  {
    test: /\beuropcar\b|يوروبكار/i,
    photos: [RENTAL_CARS, RENTAL_FLEET, ENTERPRISE_STOREFRONT],
  },
  {
    test: /\bgarenta\b|جارينتا/i,
    photos: [RENTAL_FLEET, RENTAL_CARS, ENTERPRISE_STOREFRONT],
  },
  {
    test: /\bthrifty\b|ثريفتي/i,
    photos: [RENTAL_CARS, RENTAL_FLEET, ENTERPRISE_STOREFRONT],
  },
  {
    test: /\balamo\b/i,
    photos: [RENTAL_FLEET, RENTAL_CARS, ENTERPRISE_STOREFRONT],
  },
];

const HUB_PHOTOS: Array<{ test: RegExp; photos: string[] }> = [
  {
    test: /sirkeci|سركجي|سركسي/i,
    photos: [SIRKECI_STATION, AIRPORT_TERMINAL, DEPARTURE_HALL],
  },
  {
    test: /kadiköy|kadikoy|كاديكوي|قادي كوي/i,
    photos: [FERRY_WATER, AIRPORT_TERMINAL, DEPARTURE_HALL],
  },
  {
    test: /haydarpasa|haydarpaşa|حيدر باشا/i,
    photos: [SIRKECI_STATION, DEPARTURE_HALL, AIRPORT_TERMINAL],
  },
  {
    test: /marmaray|مرمراي/i,
    photos: [SIRKECI_STATION, AIRPORT_TERMINAL, DEPARTURE_HALL],
  },
  {
    test: /metro|tram|tramway|مترو|ترام/i,
    photos: [AIRPORT_TERMINAL, SIRKECI_STATION, DEPARTURE_HALL],
  },
  {
    test: /ferry|vapur|iskele|مرفأ|عبارة|فيرى/i,
    photos: [FERRY_WATER, AIRPORT_TERMINAL, DEPARTURE_HALL],
  },
  {
    test: /airport|havaalan|havaalanı|مطار/i,
    photos: [AIRPORT_TERMINAL, DEPARTURE_HALL, RENTAL_FLEET],
  },
];

/** Verified category scenes: rental fleets, stations, ferries — never car silhouettes. */
export const TRANSPORT_CATEGORY_PHOTOS = [
  RENTAL_FLEET,
  RENTAL_CARS,
  ENTERPRISE_STOREFRONT,
  SIRKECI_STATION,
];

export function osmMediaUrls(tags?: Record<string, string> | null): string[] {
  if (!tags) return [];
  const urls: string[] = [];
  const push = (value?: string) => {
    const raw = String(value || '').trim();
    if (!raw) return;
    if (/^https?:\/\//i.test(raw) && !isRejectedTransportStock(raw)) urls.push(raw.split(/\s+/)[0]);
  };
  push(tags.image);
  push(tags['image:0']);
  push(tags['contact:image']);
  const commons = String(tags.wikimedia_commons || tags['wiki:commons'] || '').trim();
  if (commons) {
    const file = commons.replace(/^File:/i, '').split(';')[0].trim();
    if (file && !/^Category:/i.test(file)) urls.push(wikiFile(file));
  }
  return urls;
}

export function transportBrandPhotos(hay: string): string[] {
  const text = hay.trim();
  if (!text) return [];
  for (const brand of BRAND_PHOTOS) {
    if (brand.test.test(text)) return brand.photos.slice();
  }
  for (const hub of HUB_PHOTOS) {
    if (hub.test.test(text)) return hub.photos.slice();
  }
  return [];
}

export function transportGalleryFor(place: {
  id?: string;
  name?: string;
  description?: string;
  category_label?: string;
  address?: string;
  image?: string | null;
  images?: string[] | null;
  tags?: string[];
}): string[] {
  const hay = [place.name, place.description, place.category_label, place.address, ...(place.tags || [])]
    .filter(Boolean)
    .join(' ');
  const owned = [...(place.images || []), place.image || '']
    .map((url) => String(url || '').trim())
    .filter((url) => /^https?:\/\//i.test(url) && !isRejectedTransportStock(url));
  const branded = transportBrandPhotos(hay);
  const fallback = TRANSPORT_CATEGORY_PHOTOS;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...owned, ...branded, ...fallback]) {
    if (!url || seen.has(url) || isRejectedTransportStock(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 4) break;
  }
  return out;
}
