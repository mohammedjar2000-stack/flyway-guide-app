function wikiPath(file: string): string {
  const name = file.replace(/^File:/i, '').trim();
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1600`;
}

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

function pexels(id: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
}

const RENTAL_FLEET = pexels(164634);
const RENTAL_CARS = pexels(116675);
const AIRPORT_HUB = unsplash('1464037866556-6812c9d1c72e');
const TERMINAL = unsplash('1436491865332-7a61a109cc05');
const FERRY = unsplash('1507525428034-b723cf961d3e');
const ENTERPRISE = wikiPath('Enterprise Rent-A-Car.jpg');
const SIRKECI = wikiPath('Sirkeci railway station.jpg');

const NAMED_VENUE_PHOTOS: Array<{ test: RegExp; photos: string[] }> = [
  { test: /\bavis\b|أفيس/i, photos: [AIRPORT_HUB, RENTAL_CARS, RENTAL_FLEET] },
  { test: /\bhertz\b|هرتز/i, photos: [RENTAL_CARS, AIRPORT_HUB, RENTAL_FLEET] },
  { test: /\benterprise\b|إنتربرايز|انتربرايز/i, photos: [ENTERPRISE, RENTAL_FLEET, AIRPORT_HUB] },
  { test: /\bbudget\b|بدجت/i, photos: [RENTAL_FLEET, RENTAL_CARS, AIRPORT_HUB] },
  { test: /\bsixt\b|سيكست/i, photos: [AIRPORT_HUB, RENTAL_FLEET, TERMINAL] },
  { test: /\beuropcar\b|يوروبكار/i, photos: [TERMINAL, AIRPORT_HUB, RENTAL_FLEET] },
  { test: /\bgarenta\b|جارينتا/i, photos: [RENTAL_FLEET, AIRPORT_HUB, RENTAL_CARS] },
  { test: /\bthrifty\b|ثريفتي/i, photos: [RENTAL_CARS, RENTAL_FLEET, AIRPORT_HUB] },
  { test: /\balamo\b/i, photos: [RENTAL_FLEET, AIRPORT_HUB, RENTAL_CARS] },
  { test: /sirkeci|سركجي/i, photos: [SIRKECI, AIRPORT_HUB, TERMINAL] },
  { test: /kadiköy|kadikoy|كاديكوي/i, photos: [FERRY, AIRPORT_HUB, TERMINAL] },
  { test: /haydarpasa|haydarpaşa|حيدر باشا/i, photos: [SIRKECI, TERMINAL, AIRPORT_HUB] },
  { test: /marmaray|مرمراي/i, photos: [SIRKECI, AIRPORT_HUB, TERMINAL] },
];

export function brandVenuePhotos(name = ''): string[] {
  const hay = name.trim();
  if (!hay) return [];
  for (const row of NAMED_VENUE_PHOTOS) {
    if (row.test.test(hay)) return row.photos.slice();
  }
  return [];
}

export function extractOsmImageUrls(tags: Record<string, string> = {}): string[] {
  const urls: string[] = [];
  const push = (value?: string) => {
    const raw = String(value || '').trim();
    if (/^https?:\/\//i.test(raw)) urls.push(raw.split(/\s+/)[0]);
  };
  push(tags.image);
  push(tags['image:0']);
  push(tags['contact:image']);
  const commons = String(tags.wikimedia_commons || '').trim();
  if (commons) {
    const file = commons.replace(/^File:/i, '').split(';')[0].trim();
    if (file && !/^Category:/i.test(file)) urls.push(wikiPath(file));
  }
  return Array.from(new Set(urls));
}

export function extractRawImageUrls(raw: Record<string, unknown> = {}): string[] {
  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') tags[key] = value;
  }
  return extractOsmImageUrls(tags);
}

export function collectImageMetadata(opts: {
  name?: string;
  tags?: Record<string, string>;
  raw?: Record<string, unknown>;
  extra?: string[];
}): { image_url: string | null; images: string[] } {
  const fromTags = opts.tags ? extractOsmImageUrls(opts.tags) : [];
  const fromRaw = opts.raw ? extractRawImageUrls(opts.raw) : [];
  const branded = brandVenuePhotos(opts.name);
  const images = Array.from(new Set([...fromTags, ...fromRaw, ...(opts.extra ?? []), ...branded]));
  return { image_url: images[0] || null, images };
}
