import { isRejectedTransportStock, TRANSPORT_CATEGORY_PHOTOS, transportGalleryFor } from '@/lib/transportPhotos';

const CATEGORY_PHOTOS: Record<string, string[]> = {
  hotels: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=80',
  ],
  restaurants: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
  ],
  hospitals: [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1586773860418-d10276267080?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1600&q=80',
  ],
  pharmacies: [
    'https://images.unsplash.com/photo-1576602976047-174e57a8dca9?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1600&q=80',
  ],
  markets: [
    'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=1600&q=80',
  ],
  attractions: [
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1600&q=80',
  ],
  exchange: [
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1600&q=80',
  ],
  mosques: [
    'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1600&q=80',
  ],
  transport: TRANSPORT_CATEGORY_PHOTOS,
  embassy: [
    'https://images.unsplash.com/photo-1526304640172-767fa768cbac?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=1600&q=80',
  ],
  police: [
    'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80',
  ],
  telecom: [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=1600&q=80',
  ],
  salons: [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80',
  ],
  fuel: [
    'https://images.unsplash.com/photo-1527018601619-a508c7d3b00d?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1573348722427-f1a773268556?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=80',
    'https://images.pexels.com/photos/248280/pexels-photo-248280.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/33688/pexels-photo-33688.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  bakeries: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80',
  ],
  airports: [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&w=1600&q=80',
  ],
};

const OFFICIAL_BUILDING_CATS = new Set(['hospitals', 'police', 'embassy', 'airports', 'fuel']);
const REJECTED_PHOTO_IDS = [
  '1568605117036-5fe5e7bab0b7',
  '1516549655169-df83a0774514',
  '1519494026892-80bbd2d6fd0d',
  '1586773860418-d10276267080',
  '1538108149393-fbbd81895907',
  '1576091160399-112ba8d25d1d',
  '1551076805-e1869033e561',
];
const MEDICAL_PHOTO_RE = /hospital|clinic|hastane|medical|ambulance|ward|surgery/i;

const FUEL_BRAND_PHOTOS: Array<{ test: RegExp; urls: string[] }> = [
  { test: /opet|أوبيت/i, urls: [
    'https://images.unsplash.com/photo-1527018601619-a508c7d3b00d?auto=format&fit=crop&w=1600&q=80',
    'https://images.pexels.com/photos/248280/pexels-photo-248280.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ] },
  { test: /shell|شل/i, urls: [
    'https://images.unsplash.com/photo-1573348722427-f1a773268556?auto=format&fit=crop&w=1600&q=80',
    'https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ] },
  { test: /\bbp\b|بي بي/i, urls: [
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=80',
    'https://images.pexels.com/photos/33688/pexels-photo-33688.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ] },
  { test: /petrol\s*ofisi|\bpo\b|بترول\s*أوفيسي/i, urls: [
    'https://images.pexels.com/photos/248280/pexels-photo-248280.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.unsplash.com/photo-1527018601619-a508c7d3b00d?auto=format&fit=crop&w=1600&q=80',
  ] },
  { test: /aytemiz|أيتميز/i, urls: [
    'https://images.unsplash.com/photo-1573348722427-f1a773268556?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=80',
  ] },
];

function fuelPumpPhoto(place: { id: string; name?: string; description?: string }): string {
  const hay = `${place.name || ''} ${place.description || ''}`;
  const h = hashId(place.id || hay);
  for (const row of FUEL_BRAND_PHOTOS) {
    if (row.test.test(hay)) return row.urls[h % row.urls.length];
  }
  const photos = CATEGORY_PHOTOS.fuel;
  return photos[h % photos.length];
}

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

/** City-hotel facades: tall hospitality buildings and main entrances. */
const HOTEL_FACADE = [
  unsplash('1542314831-068cd1dbfeeb'),
  unsplash('1551882547-ff40c63fe5fa'),
  unsplash('1564501049412-61c2a3083791'),
  unsplash('1445019980597-93fa8acb246c'),
  unsplash('1582719478250-c89cae4dc85b'),
  unsplash('1618773928141-d772d0e0e3c8'),
  unsplash('1596436889106-c3efb97022d5'),
  unsplash('1455587734955-081b58e606f9'),
  unsplash('1496412702744-19c6e4923bed'),
  unsplash('1519167758481-83f550bb49b9'),
  unsplash('1559599238-3087937bbc26'),
  unsplash('1522798514-97ceb8c4e6f8'),
  unsplash('1568084688146-a4d026e95d72'),
  unsplash('1615460549969-36fa19521a4f'),
];

const HOTEL_LOBBY = [
  unsplash('1590381107-e42e4fdde97c'),
  unsplash('1584132967334-10e028bd69f7'),
  unsplash('1578683010236-d716f9a3f461'),
  unsplash('1600596542815-ffad4c1539a9'),
];

const HOTEL_ROOM = [
  unsplash('1611892440504-42a792e24d32'),
  unsplash('1590490360182-c33d57733427'),
  unsplash('1566665797739-73d7baadaf46'),
  unsplash('1598928636135-d146006ff4be'),
  unsplash('1522771739844-6a9f6d5f14af'),
  unsplash('1505693416388-516b61166a31'),
  unsplash('1631049552040-ca509d1b23d3'),
  unsplash('1616594039964-ae9021a400a0'),
  unsplash('1596394516093-501ba68a0ba6'),
  unsplash('1505691938898-95d3715c8f64'),
  unsplash('1616047007921-03381131887c'),
];

/** Resort exteriors: pools, gardens, open waterfront campuses. */
const RESORT_FACADE = [
  unsplash('1571896349842-33c89424de2d'),
  unsplash('1540541338287-41700207dee6'),
  unsplash('1571003123894-1f0594d2b5d9'),
  unsplash('1520250497591-112f2f40a3f4'),
  unsplash('1582719508461-905c673771cb'),
  unsplash('1602002418082-a4443e081ddd'),
  unsplash('1499793983690-e25dfb2ad0ba'),
  unsplash('1501117716987-c8e1c1ea6ba8'),
  unsplash('1606402179428-a7691f76da6a'),
  unsplash('1613490493576-7fde63acd811'),
  unsplash('1610641818989-c0597c0e6d0d'),
  unsplash('1549294413-26f195271c9d'),
  unsplash('1582719478250-c89cae4dc85b'),
  unsplash('1600596542815-ffad4c1539a9'),
  unsplash('1566073771259-6a8506099945'),
];

const RESORT_LOBBY = [
  unsplash('1584132967334-10e028bd69f7'),
  unsplash('1590381107-e42e4fdde97c'),
  unsplash('1600596542815-ffad4c1539a9'),
  unsplash('1578683010236-d716f9a3f461'),
];

const RESORT_ROOM = [
  unsplash('1611892440504-42a792e24d32'),
  unsplash('1631049307264-da0ec9d70304'),
  unsplash('1566665797739-73d7baadaf46'),
  unsplash('1590490360182-c33d57733427'),
  unsplash('1522771739844-6a9f6d5f14af'),
  unsplash('1598928636135-d146006ff4be'),
  unsplash('1505693416388-516b61166a31'),
  unsplash('1631049552040-ca509d1b23d3'),
  unsplash('1616594039964-ae9021a400a0'),
  unsplash('1596394516093-501ba68a0ba6'),
];

export const GALLERY_SLOT_LABELS = [
  'واجهة المبنى الرئيسية',
  'الاستقبال',
  'غرف النوم ونظافتها',
] as const;

const RESORT_NAME_HINT =
  /منتجع|\bresort\b|palace kempinski|six senses|mandarin oriental|les ottomans|sumahan|a'?jia|kalami[sş]|tarabya|adile sultan|green park|florya|marina|bosphorus palace|kempinski|kocatas/i;

export type PlaceKind = 'hotel' | 'resort' | 'restaurant' | 'cafe';

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function isRejectedImage(url: string): boolean {
  if (isRejectedTransportStock(url)) return true;
  if (MEDICAL_PHOTO_RE.test(url)) return true;
  return REJECTED_PHOTO_IDS.some((id) => url.includes(id));
}

function isUsablePhoto(url: string): boolean {
  return /^https?:\/\//i.test(url) && !/source\.unsplash\.com/i.test(url) && !isRejectedImage(url);
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!isUsablePhoto(url) || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function pickSlot(pool: string[], seed: number, used: Set<string>): string {
  for (let i = 0; i < pool.length; i++) {
    const url = pool[(seed + i) % pool.length];
    if (!used.has(url)) {
      used.add(url);
      return url;
    }
  }
  return pool[seed % pool.length];
}

export function resolvePlaceKind(place: {
  place_kind?: PlaceKind | null;
  category_key?: string;
  name?: string;
  description?: string;
  tags?: string[];
  category_label?: string;
}): PlaceKind {
  if (place.place_kind === 'resort' || place.place_kind === 'hotel' || place.place_kind === 'restaurant' || place.place_kind === 'cafe') {
    return place.place_kind;
  }
  const hay = [place.name, place.description, place.category_label, ...(place.tags || [])].filter(Boolean).join(' ');
  if (place.category_key === 'restaurants') {
    if (place.category_label === 'مقهى' || /\bcafe\b|\bkahve\b|\bcoffee\b|مقهى|كافيه/i.test(hay)) return 'cafe';
    return 'restaurant';
  }
  if (place.category_label === 'منتجع' || RESORT_NAME_HINT.test(hay)) return 'resort';
  return 'hotel';
}

function curatedHotelSlots(placeId: string, kind: PlaceKind): [string, string, string] {
  const h = hashId(placeId);
  const used = new Set<string>();
  const facade = kind === 'resort' ? RESORT_FACADE : HOTEL_FACADE;
  const lobby = kind === 'resort' ? RESORT_LOBBY : HOTEL_LOBBY;
  const room = kind === 'resort' ? RESORT_ROOM : HOTEL_ROOM;
  return [
    pickSlot(facade, h, used),
    pickSlot(lobby, h + 19, used),
    pickSlot(room, h + 41, used),
  ];
}

type GalleryPlace = {
  id: string;
  category_key: string;
  image?: string | null;
  images?: string[] | null;
  place_kind?: PlaceKind | null;
  name?: string;
  description?: string;
  tags?: string[];
  category_label?: string;
  address?: string;
};

export function placeGallery(place: GalleryPlace): string[] {
  if (place.category_key === 'fuel') {
    return [fuelPumpPhoto(place)];
  }
  const owned = uniqueUrls([...(place.images || []), place.image || '']);
  if (place.category_key === 'transport') {
    return uniqueUrls(transportGalleryFor(place)).slice(0, 4);
  }
  if (place.category_key === 'restaurants') {
    if (owned.length >= 3) return owned.slice(0, 8);
    return uniqueUrls([...owned, placeHeroImage(place)]).slice(0, 8);
  }
  if (place.category_key !== 'hotels') {
    return uniqueUrls([...owned, placeHeroImage(place)]).slice(0, 1);
  }
  if (owned.length >= 3) return owned.slice(0, 8);
  const kind = resolvePlaceKind(place);
  const curated = curatedHotelSlots(place.id, kind === 'resort' ? 'resort' : 'hotel').filter((url) => !owned.includes(url));
  return uniqueUrls([...owned, ...curated]).slice(0, 8);
}

export function galleryCaption(index: number, kind?: PlaceKind, categoryKey?: string): string {
  if (categoryKey === 'transport') {
    return ['واجهة الفرع', 'الأسطول أو الرصيف', 'صالة الانتظار'][index] || `صورة ${index + 1}`;
  }
  if (kind === 'restaurant') {
    return ['واجهة المطعم', 'صالة الطعام', 'طبق التوقيع'][index] || `صورة ${index + 1}`;
  }
  if (kind === 'cafe') {
    return ['واجهة المقهى', 'الجلسة الداخلية', 'فنجان التوقيع'][index] || `صورة ${index + 1}`;
  }
  return GALLERY_SLOT_LABELS[index] || `صورة ${index + 1}`;
}

export function placeKindLabel(kind: PlaceKind): string {
  if (kind === 'resort') return 'منتجع';
  if (kind === 'cafe') return 'مقهى';
  if (kind === 'restaurant') return 'مطعم';
  return 'فندق';
}

export function placeHeroImage(place: {
  id: string;
  category_key: string;
  image?: string | null;
  images?: string[] | null;
  place_kind?: PlaceKind | null;
  name?: string;
  description?: string;
  tags?: string[];
  category_label?: string;
}): string {
  if (place.category_key === 'hotels') {
    return placeGallery(place)[0];
  }
  if (place.category_key === 'fuel') {
    return fuelPumpPhoto(place);
  }
  if (place.category_key === 'transport') {
    return transportGalleryFor(place)[0] || TRANSPORT_CATEGORY_PHOTOS[0];
  }
  const photos = CATEGORY_PHOTOS[place.category_key] || CATEGORY_PHOTOS.attractions;
  const curated = photos[hashId(place.id) % photos.length];
  if (OFFICIAL_BUILDING_CATS.has(place.category_key)) return curated;
  const raw = place.image || '';
  if (isUsablePhoto(raw)) return raw;
  return curated;
}

export function placeHeroFallback(categoryKey: string, kind?: PlaceKind): string {
  if (categoryKey === 'hotels') {
    return (kind === 'resort' ? RESORT_FACADE : HOTEL_FACADE)[0];
  }
  if (categoryKey === 'transport') {
    return TRANSPORT_CATEGORY_PHOTOS[0];
  }
  const photos = CATEGORY_PHOTOS[categoryKey] || CATEGORY_PHOTOS.attractions;
  return photos[0];
}
