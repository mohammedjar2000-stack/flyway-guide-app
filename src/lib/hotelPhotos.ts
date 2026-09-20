export type HotelPlaceKind = 'hotel' | 'resort';

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}

function pexels(id: number) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
}

export function wikiFile(file: string) {
  const name = file.replace(/^File:/i, '');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1600`;
}

/** Real Wikimedia photos that depict the named establishment. */
const NAMED_PHOTOS: Record<string, string[]> = {
  'pera-palace': [
    wikiFile('Istanbul asv2020-02 img39 Pera Palace Hotel.jpg'),
    wikiFile('Pera-Palas-Entrata-Tan.png'),
  ],
  'four-seasons-sultanahmet': [
    wikiFile('Four Seasons Sultanahmet March 2008.JPG'),
    wikiFile('Four Seasons Sultanahmet interior March 2008.JPG'),
  ],
  'hilton-bosphorus': [
    wikiFile('Hilton Istanbul Bosphorus.jpg'),
    wikiFile('Istanbul Hilton.JPG'),
  ],
  'ritz-carlton': [
    wikiFile('Ritz-Carlton, Istanbul.jpg'),
    wikiFile('Ritz Carlton Istanbul.jpg'),
  ],
  'ciragan-kempinski': [
    wikiFile('Ciragan Palace 2014.JPG'),
    wikiFile('Istanbul asv2020-02 img59 Çırağan Palace.jpg'),
  ],
  'swissotel-bosphorus': [
    wikiFile('Swissotel Istanbul.jpg'),
    wikiFile('Swissôtel the Bosphorus, 2024 (2).jpg'),
  ],
  'cvk-park-bosphorus': [
    wikiFile('CVK Park Bosphorus Hotel, 2022.jpg'),
  ],
  'marmara-taksim': [
    wikiFile('The Marmara Istanbul 1.jpg'),
    wikiFile('The Marmara Istanbul 2.jpg'),
  ],
  'intercontinental': [
    wikiFile('Intercontinental Hotel Istanbul.jpg'),
    wikiFile('Ceylan Intercontinental Istanbul.jpg'),
  ],
  'grand-hyatt-taksim': [
    wikiFile('Grand Hyatt Istanbul.jpg'),
    wikiFile('Grand Hyatt Hotel Istanbul.jpg'),
  ],
  'conrad-bosphorus': [
    wikiFile('Conrad Istanbul Bosphorus.jpg'),
    wikiFile('Conrad Hilton Istanbul.jpg'),
  ],
  'soho-house': [
    wikiFile('Garden of Soho House Istanbul.jpg'),
  ],
  'fairmont-quasar': [
    wikiFile('Quasar Istanbul and Fairmont.jpg'),
  ],
  'sumahan-water': [
    wikiFile('Sumahan on the Water, Cengelköy - panoramio.jpg'),
  ],
  'mandarin-oriental-bosphorus': [
    wikiFile('Mandarin Oriental Hotel and Residences.jpg'),
  ],
  'crowne-plaza-ankara': [
    wikiFile('Crowne Plaza Ankara.JPG'),
  ],
  'movenpick-ankara': [
    wikiFile('Mövenpick.JPG'),
  ],
  'ickale-ankara': [
    wikiFile('Ankara Ickale.JPG'),
  ],
  'buyuk-anadolu-ankara': [
    wikiFile('Ankara Büyük Anadolu.JPG'),
  ],
  'jw-marriott-ankara': [
    wikiFile('JW Marriott Hotel Ankara.jpg'),
  ],
  'sheraton-ankara': [
    wikiFile('Sheraton Ankara Hotel.jpg'),
    wikiFile('Ankara Sheraton Oteli.jpg'),
  ],
  'hilton-ankara': [
    wikiFile('Hilton, Sheraton Ve Karum - panoramio.jpg'),
  ],
};

const URBAN_FACADE_UNSPLASH = [
  '1542314831-068cd1dbfeeb',
  '1551882547-ff40c63fe5fa',
  '1564501049412-61c2a3083791',
  '1445019980597-93fa8acb246c',
  '1582719478250-c89cae4dc85b',
  '1618773928141-d772d0e0e3c8',
  '1596436889106-c3efb97022d5',
  '1455587734955-081b58e606f9',
  '1496412702744-19c6e4923bed',
  '1519167758481-83f550bb49b9',
  '1559599238-3087937bbc26',
  '1522798514-97ceb8c4e6f8',
  '1568084688146-a4d026e95d72',
  '1615460549969-36fa19521a4f',
  '1566073771259-6a8506099945',
].map(unsplash);

const URBAN_LOBBY_UNSPLASH = [
  '1590381107-e42e4fdde97c',
  '1584132967334-10e028bd69f7',
  '1578683010236-d716f9a3f461',
  '1600596542815-ffad4c1539a9',
  '1600585154340-0ef4d93cceb8',
  '1600210492486-724fe5c67fb0',
  '1618221195710-dd6b41faaea6',
  '1600607687939-ce8a6c25118c',
  '1600566753086-00f5fbff160f',
  '1600585154526-990dced4db0d',
  '1600210492493-0946911123ea',
  '1600585152220-90364e23911c',
  '1600573472591-ee6981cf35b6',
  '1600566752355-357e1ee647ce',
  '1560448204-e02f11c3d0e2',
  '1560185007-c5ca9d2c014d',
  '1522708323590-d8972a05714c',
  '1493806285341-c5c2e3182c0c',
  '1600047509807-ba8f99d2cdbc',
  '1560184897-502a91ec1bb8',
].map(unsplash);

const URBAN_ROOM_UNSPLASH = [
  '1611892440504-42a792e24d32',
  '1590490360182-c33d57733427',
  '1566665797739-73d7baadaf46',
  '1598928636135-d146006ff4be',
  '1522771739844-6a9f6d5f14af',
  '1505693416388-516b61166a31',
  '1631049552040-ca509d1b23d3',
  '1616594039964-ae9021a400a0',
  '1596394516093-501ba68a0ba6',
  '1505691938898-95d3715c8f64',
  '1616047007921-03381131887c',
  '1631049307264-da0ec9d70304',
  '1444201988104-6f74e6696fff',
  '1540518614846-fb28366aedee',
  '1595573702556-47b4de4dc607',
].map(unsplash);

const RESORT_EXTERIOR_UNSPLASH = [
  '1571896349842-33c89424de2d',
  '1540541338287-41700207dee6',
  '1571003123894-1f0594d2b5d9',
  '1520250497591-112f2f40a3f4',
  '1582719508461-905c673771cb',
  '1602002418082-a4443e081ddd',
  '1499793983690-e25dfb2ad0ba',
  '1501117716987-c8e1c1ea6ba8',
  '1606402179428-a7691f76da6a',
  '1613490493576-7fde63acd811',
  '1610641818989-c0597c0e6d0d',
  '1549294413-26f195271c9d',
  '1554995207-c18c7db28f05',
].map(unsplash);

/** Disjoint Pexels IDs — consumed once, never shared across slots or properties. */
const PEXELS_IDS = [
  258154, 261102, 271624, 1134176, 2467285, 2506988, 260922, 338504, 2096983, 2034335,
  1024960, 1170412, 1268855, 1838550, 2417842, 2869215, 3201760, 189296, 237371, 210265,
  2290753, 1010657, 1329711, 259588, 261395, 775219, 594077, 53464, 53610, 3774872,
  221457, 261169, 2440296, 161758, 261327, 261398, 65894, 276724, 271643, 279746,
  271816, 1571460, 1571463, 1571453, 1571458, 1571468, 1648776, 2082090, 1571459, 1571461,
  1571471, 1571472, 2029667, 262047, 262048, 271618, 271619, 1579253, 1457842, 1743231,
  2029722, 2373201, 271639, 164595, 1571452, 1571457, 1571467, 1571470, 1571450, 279614,
  280232, 280221, 280222, 323780, 323775, 37347, 439227, 54567, 70441, 72469,
  91227, 106399, 1396122, 1396132, 1438832, 1454806, 1475938, 1488327, 1525041, 1546168,
  1560065, 1643383, 1643384, 1643389, 1669799, 1743229, 1797393, 1813502, 1910472, 1918291,
  1974596, 2029665, 2029670, 2102587, 2102588, 2121121, 2251247, 2351649, 2462015, 2506923,
  2506990, 2554692, 2565222, 259580, 259962, 260345, 2635038, 2724749, 2724748, 277572,
  282737, 2901209, 2901210, 296814, 2983472, 301643, 3288104, 3316922, 3316926, 3370381,
  3399956, 3454523, 347141, 349749, 3551230, 3623770, 3773571, 3773579, 3825889, 3935334,
  3965520, 4112552, 4112232, 4245826, 4352247, 4506272, 4506275, 4577179, 4825701, 4916518,
  4992458, 5095897, 53621, 5490778, 5502227, 5570225, 5824519, 5824520, 6186810, 6186815,
  6186791, 6474471, 6585757, 6585760, 6782567, 6969831, 7031407, 7061663, 1571462, 1571464,
  1571465, 1571466, 1571469, 1648771, 1648772, 1648773, 2082086, 2082087, 2082088, 2082089,
  271620, 271621, 271622, 271623, 271625, 271626, 271627, 271628, 271629, 271630,
  271631, 271632, 271633, 271634, 271635, 271636, 271637, 271638, 271640, 271641,
  271642, 258155, 258156, 261103, 261104, 261105, 1134177, 1134178, 2467286, 2467287,
  2506989, 260923, 260924, 338505, 338506, 2096984, 2034336, 1024961, 1170413, 1268856,
  1838551, 2417843, 2869216, 3201761, 189297, 237372, 210266, 2290754, 1010658, 1329712,
  259589, 261396, 775220, 594078, 221458, 261170, 2440297, 161759, 261328, 261399,
  276725, 271644, 279747, 271817, 1579254, 1457843, 1743232, 2029723, 2373202, 271645,
  164596, 2029668, 262049, 1457844, 1743233, 1579255, 1134179, 2467288, 2506991, 260925,
  8132691, 8132723, 6585759, 6585761, 6186811, 6186812, 5824521, 5502228, 4992459, 4506273,
  4112553, 3773580, 3316927, 2901211, 2724750, 2565223, 2462016, 1918292, 1643390, 1396123,
];

function takePexels(ids: number[], count: number): string[] {
  if (ids.length < count) {
    throw new Error(`Need ${count} Pexels photos, have ${ids.length}`);
  }
  return ids.splice(0, count).map(pexels);
}

const pexelsPool = [...new Set(PEXELS_IDS)];
const URBAN_FACADE = [...URBAN_FACADE_UNSPLASH, ...takePexels(pexelsPool, 65)];
const URBAN_LOBBY = [...URBAN_LOBBY_UNSPLASH, ...takePexels(pexelsPool, 60)];
const URBAN_ROOM = [...URBAN_ROOM_UNSPLASH, ...takePexels(pexelsPool, 65)];
const RESORT_EXTERIOR = [...RESORT_EXTERIOR_UNSPLASH, ...takePexels(pexelsPool, 20)];
const RESORT_LOBBY = takePexels(pexelsPool, 32);
const RESORT_ROOM = takePexels(pexelsPool, 32);

function unique(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function takeUnused(pool: string[], serial: number, used: Set<string>): string {
  const start = ((serial % pool.length) + pool.length) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const url = pool[(start + i) % pool.length];
    if (!used.has(url)) {
      used.add(url);
      return url;
    }
  }
  throw new Error('Hotel photo bank exhausted — a URL would have been reused');
}

/** Wikimedia files for a live hotel when the name clearly matches a known property. */
export function namedHotelPhotosForName(name: string): string[] {
  const n = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  if (n.length < 5) return [];
  for (const [slug, urls] of Object.entries(NAMED_PHOTOS)) {
    const tokens = slug.split('-').filter((token) => token.length > 2);
    if (tokens.length === 0) continue;
    if (tokens.every((token) => n.includes(token))) return unique(urls);
  }
  return [];
}

/**
 * Three distinct photos per property: facade, lobby/reception, guest room.
 * Named Wikimedia files are used when they depict that exact hotel.
 * Remaining slots come from disjoint urban vs resort banks and are never reused.
 */
export function uniqueHotelGallery(
  slug: string,
  kind: HotelPlaceKind,
  serial: number,
  used: Set<string>,
): string[] {
  const named = unique(NAMED_PHOTOS[slug] || []).filter((url) => {
    if (used.has(url)) return false;
    used.add(url);
    return true;
  });
  const facadePool = kind === 'resort' ? RESORT_EXTERIOR : URBAN_FACADE;
  const lobbyPool = kind === 'resort' ? RESORT_LOBBY : URBAN_LOBBY;
  const roomPool = kind === 'resort' ? RESORT_ROOM : URBAN_ROOM;
  const images = [...named];
  if (images.length < 1) images.push(takeUnused(facadePool, serial, used));
  if (images.length < 2) images.push(takeUnused(lobbyPool, serial, used));
  if (images.length < 3) images.push(takeUnused(roomPool, serial, used));
  return images.slice(0, 3);
}

export const HOTEL_PHOTO_USED = new Set<string>();

export function withUniqueHotelImages<T extends { slug: string; place_kind: HotelPlaceKind }>(
  seeds: T[],
  used: Set<string> = HOTEL_PHOTO_USED,
): Array<T & { images: string[] }> {
  let hotelSerial = 0;
  let resortSerial = 0;
  return seeds.map((seed) => {
    const serial = seed.place_kind === 'resort' ? resortSerial++ : hotelSerial++;
    const images = uniqueHotelGallery(seed.slug, seed.place_kind, serial, used);
    return { ...seed, images };
  });
}

export function assertUniqueHotelImages(seeds: Array<{ slug: string; images: string[] }>) {
  const seen = new Map<string, string>();
  for (const seed of seeds) {
    if (seed.images.length < 3) {
      throw new Error(`Hotel ${seed.slug} has fewer than 3 photos`);
    }
    for (const url of seed.images) {
      const owner = seen.get(url);
      if (owner && owner !== seed.slug) {
        throw new Error(`Photo reused by ${owner} and ${seed.slug}`);
      }
      seen.set(url, seed.slug);
    }
  }
}
