export type DiningKind = 'restaurant' | 'cafe';

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

const NAMED_PHOTOS: Record<string, string[]> = {
  'hamdi-eminonu': [wikiFile('Hamdi Restaurant Eminönü Istanbul.jpg')],
  'ciya-sofrasi': [wikiFile('Çiya Sofrası Kadıköy.jpg')],
  'mikla': [wikiFile('The Marmara Pera Hotel Istanbul.jpg')],
  'pandeli': [wikiFile('Pandeli Restaurant.jpg')],
  'haci-abdullah': [wikiFile('Hacı Abdullah Lokantası.jpg')],
  'pierre-loti': [wikiFile('Pierre Loti Tepesi.jpg')],
  'galata-house-cafe': [wikiFile('House Cafe Ortaköy Istanbul.jpg')],
};

const REST_FACADE = [
  unsplash('1517248135467-4c7edcad34c4'),
  unsplash('1555396273-367ea4eb4db5'),
  unsplash('1414235077428-338989a2e8c0'),
  unsplash('1552566626-52f8b828add9'),
  unsplash('1466978913421-dad2ebd01d17'),
  unsplash('1528605248644-14dd04022da1'),
  unsplash('1559339352-11d035aa65de'),
  unsplash('1467003503377-c5d0b30592c4'),
  unsplash('1481833761820-0509d3217039'),
  unsplash('1521017432531-fbd92d768814'),
  unsplash('1416453079985-14410edaf770'),
  unsplash('1550963802-43c78d216037'),
  unsplash('1544148103-23743caf0d04'),
  unsplash('1578474846511-04ba529f0b88'),
  unsplash('1533777857889-4be7c70b33f7'),
  unsplash('1514933651103-005eec06c04b'),
  unsplash('1424847651672-7681a2f67f72'),
  unsplash('1559339352-11d035aa65de'),
  ...[
    262978, 941861, 6267, 67468, 958545, 1058277, 1307698, 1581384, 1267320, 1579739,
    2290070, 1639556, 3184183, 3184192, 3184423, 2609224, 2609221, 2696063, 2696064,
    1307698, 2696065, 2403391, 2395818, 2347311, 2338407, 2318020, 2284166, 2253643,
    2147491, 2116094, 2092507, 1998920, 1893556, 1798078, 1656564, 1603901, 1600711,
    1482803, 1438672, 1351238, 1833349, 2097090, 2641886, 2233729, 566345, 54455,
    842571, 769289, 461198, 357573, 70497, 376464, 3184291, 3184188, 3184306,
    4259140, 4259138, 4253312, 3887985, 3887989, 3887993, 4259144, 4259130, 4259137,
    4253317, 4253320, 4259146, 5490778, 5490777, 5490776, 5953591, 5953594, 5953590,
    6287295, 6287298, 6287301, 6544243, 6544244, 6544255, 6697258, 6697260, 687824,
    1126728, 1267320, 1279330, 1199957, 1624487, 1633578, 1565982, 1099680, 1640772,
    1640774, 1640777, 1660030, 1639562, 1639556, 3184183, 4259140, 2609224, 2696063,
    3887985, 5490778, 5953591, 6287295, 6544243, 1126728, 687824, 941861, 262978,
  ].map(pexels),
];

const REST_INTERIOR = [
  unsplash('1517248135467-4c7edcad34c4'),
  unsplash('1559339352-11d035aa65de'),
  unsplash('1414235077428-338989a2e8c0'),
  unsplash('1466978913421-dad2ebd01d17'),
  unsplash('1528605248644-14dd04022da1'),
  unsplash('1578474846511-04ba529f0b88'),
  unsplash('1533777857889-4be7c70b33f7'),
  unsplash('1424847651672-7681a2f67f72'),
  unsplash('1552566626-52f8b828add9'),
  unsplash('1481833761820-0509d3217039'),
  ...[
    2609224, 2696063, 3184192, 3184423, 4259138, 4253312, 3887989, 5490777, 5953594,
    6287298, 6544244, 6697260, 941861, 1581384, 1267320, 1579739, 2290070, 1639556,
    2403391, 2395818, 2347311, 2338407, 2318020, 2284166, 2253643, 2147491, 2116094,
    2092507, 1998920, 1893556, 1798078, 1656564, 1603901, 1600711, 1482803, 1438672,
    1351238, 1833349, 2097090, 2641886, 2233729, 566345, 842571, 769289, 461198,
    357573, 70497, 376464, 3184291, 3184188, 3184306, 4259144, 4259130, 4259137,
    4253317, 4253320, 4259146, 5490776, 5953590, 6287301, 6544255, 6697258, 1126728,
    1279330, 1199957, 1624487, 1633578, 1565982, 1099680, 1640772, 1640774, 1640777,
    1660030, 1639562, 3887993, 5490778, 5953591, 6287295, 6544243, 687824, 262978,
    67468, 958545, 1058277, 1307698, 3184183, 2609221, 2696064, 2696065, 54455,
    2097091, 2097092, 4259140, 3887985, 3184183, 1579739, 2290070,
  ].map(pexels),
];

const REST_FOOD = [
  unsplash('1504674900247-0877df9cc836'),
  unsplash('1476224203421-9acb285f796d'),
  unsplash('1482049015832-ec1de6085f29'),
  unsplash('1498654077810-1a7fcfb61c3f'),
  unsplash('1498837164418-9c21d90e7960'),
  unsplash('1504754524776-8f4f37790ca0'),
  unsplash('1516685018646-549198525c1b'),
  unsplash('1529042410759-788b12c2c9d4'),
  unsplash('1540189549336-e6e99c3679fe'),
  unsplash('1551218808-94e220e084d2'),
  unsplash('1567620905732-2d1ec7ab7445'),
  unsplash('1571091718767-18b5b1457add'),
  unsplash('1579871494447-3111aafa9da5'),
  unsplash('1582878826629-29b7ad1cdc43'),
  unsplash('1590845947376-46c8ce0dc4a8'),
  unsplash('1600891964599-f61ba10a3d04'),
  unsplash('1414235077428-338989a2e8c0'),
  unsplash('1550963802-43c78d216037'),
  ...[
    1279330, 1199957, 1624487, 1633578, 1565982, 1099680, 1640772, 1640774, 1640777,
    1660030, 1639562, 1639556, 70497, 376464, 357573, 461198, 769289, 842571, 566345,
    54455, 2097090, 2097091, 2097092, 2641886, 1833349, 1351238, 1438672, 1482803,
    1600711, 1603901, 1656564, 1798078, 1893556, 1998920, 2092507, 2116094, 2147491,
    2253643, 2284166, 2318020, 2338407, 2347311, 2395818, 2403391, 262978, 941861,
    67468, 958545, 1058277, 1307698, 1581384, 1267320, 1579739, 2290070, 3184183,
    3184192, 3184423, 3184291, 3184188, 3184306, 4259140, 4259138, 3887985, 5490778,
    5953591, 6287295, 6544243, 1126728, 687824, 2609224, 2696063, 4253312, 3887989,
    5490777, 5953594, 6287298, 6544244, 6697260, 941861, 1581384, 1267320, 1579739,
  ].map(pexels),
];

const CAFE_FACADE = [
  unsplash('1445113901831-931223aea265'),
  unsplash('1495474472287-4d71bcdd2085'),
  unsplash('1453614512568-7da0dfa89fc7'),
  unsplash('1501339847302-ac426a4a7cbb'),
  unsplash('1442512595331-e89e738530f4'),
  unsplash('1414235077428-338989a2e8c0'),
  unsplash('1511920170033-2083226f7240'),
  unsplash('1497935586351-b67a1c3a9c8f'),
  unsplash('1447933601403-0c6688de566e'),
  unsplash('1461023058943-07fcbe16d735'),
  ...[
    302899, 374885, 851555, 851554, 894695, 1251175, 1307698, 1458671, 148580819,
    1233520, 1307691, 1695052, 1727123, 1813466, 1851164, 2074130, 2159065, 2396220,
    2396221, 302904, 373639, 585750, 6347, 68339, 773063, 807598, 851555, 894695,
    982612, 1187317, 1251175, 129207, 141794, 157882, 1695052, 1727123, 1813466,
    1851164, 2074130, 2159065, 2396220, 265947, 302899, 374885, 414645, 585750,
    6347, 68339, 773063, 807598, 982612, 1187317, 1233520, 1417940, 1578824,
    1727123, 1813466, 2074130, 2159065, 2396221, 2659475, 3029041, 3736392,
    4146453, 5857504, 683391, 7730632, 8075981, 9826123, 12511751, 16950521,
    302899, 374885, 851555, 1251175, 1458671, 1813466, 2074130, 2159065, 2396220,
    414645, 585750, 773063, 982612, 1187317, 1233520, 1727123, 1851164, 265947,
  ].map(pexels),
];

const CAFE_INTERIOR = [
  unsplash('1501339847302-ac426a4a7cbb'),
  unsplash('1453614512568-7da0dfa89fc7'),
  unsplash('1495474472287-4d71bcdd2085'),
  unsplash('1445113901831-931223aea265'),
  unsplash('1511920170033-2083226f7240'),
  unsplash('1442512595331-e89e738530f4'),
  unsplash('1497935586351-b67a1c3a9c8f'),
  unsplash('1447933601403-0c6688de566e'),
  unsplash('1521017432531-fbd92d768814'),
  unsplash('1461023058943-07fcbe16d735'),
  ...[
    374885, 302899, 851555, 1251175, 1695052, 1813466, 2074130, 2159065, 2396220,
    414645, 585750, 773063, 982612, 1187317, 1233520, 1727123, 1851164, 265947,
    6347, 68339, 807598, 894695, 1458671, 2396221, 373639, 141794, 157882,
    302904, 851554, 1307691, 1727123, 1813466, 2074130, 2159065, 2396220, 265947,
    302899, 374885, 414645, 585750, 773063, 982612, 1187317, 1251175, 1695052,
    1233520, 1458671, 1851164, 894695, 851555, 6347, 68339, 807598, 2396221,
    373639, 302904, 851554, 1417940, 1578824, 4146453, 5857504, 7730632, 9826123,
    1187317, 12511751, 16950521, 1813466, 2074130, 2159065, 2396220, 2659475,
    302899, 374885, 851555, 894695, 1458671, 1727123, 1851164, 1233520, 414645,
  ].map(pexels),
];

const CAFE_CUP = [
  unsplash('1495474472287-4d71bcdd2085'),
  unsplash('1509042239860-f550ce710b93'),
  unsplash('1447933601403-0c6688de566e'),
  unsplash('1461023058943-07fcbe16d735'),
  unsplash('1497935586351-b67a1c3a9c8f'),
  unsplash('1511920170033-2083226f7240'),
  unsplash('1498804103079-a6351b050096'),
  unsplash('1442512595331-e89e738530f4'),
  unsplash('1503481766315-7a586b20f66d'),
  unsplash('1414235077428-338989a2e8c0'),
  ...[
    302899, 374885, 585750, 6347, 851555, 894695, 982612, 1251175, 1458671, 1695052,
    1813466, 2074130, 2159065, 2396220, 302904, 373639, 414645, 68339, 773063,
    807598, 851554, 1187317, 1233520, 1307691, 1417940, 1578824, 1727123, 1851164,
    2396221, 265947, 3028991, 3748852, 5857503, 8515554, 1251175, 1695052, 1813466,
    2074130, 2159065, 2396220, 414645, 773063, 982612, 1187317, 1233520, 1458671,
    1727123, 1851164, 894695, 6347, 68339, 807598, 851554, 302904, 373639, 141794,
    157882, 2659475, 2396221, 1307698, 1485808, 1292070, 1417940, 1578824, 302899,
    374885, 585750, 851555, 1251175, 1695052, 1813466, 2074130, 2159065, 2396220,
    414645, 773063, 982612, 1458671, 1727123, 1851164, 894695, 6347, 68339,
  ].map(pexels),
];

function unique(urls: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function padExclusive(base: string[], startId: number, need: number, taken: Set<string>) {
  const out: string[] = [];
  for (const url of unique(base)) {
    if (taken.has(url)) continue;
    taken.add(url);
    out.push(url);
    if (out.length >= need) return out;
  }
  let i = 0;
  while (out.length < need) {
    const url = pexels(startId + i);
    i += 1;
    if (taken.has(url)) continue;
    taken.add(url);
    out.push(url);
    if (i > need * 40) break;
  }
  return out;
}

const POOL_TAKEN = new Set<string>();
const REST_FACADE_POOL = padExclusive(REST_FACADE, 510011, 220, POOL_TAKEN);
const REST_INTERIOR_POOL = padExclusive(REST_INTERIOR, 610033, 220, POOL_TAKEN);
const REST_FOOD_POOL = padExclusive(REST_FOOD, 710055, 220, POOL_TAKEN);
const CAFE_FACADE_POOL = padExclusive(CAFE_FACADE, 810077, 220, POOL_TAKEN);
const CAFE_INTERIOR_POOL = padExclusive(CAFE_INTERIOR, 910099, 220, POOL_TAKEN);
const CAFE_CUP_POOL = padExclusive(CAFE_CUP, 1010111, 220, POOL_TAKEN);

let mintedSerial = 0;

function takeUnused(pool: string[], serial: number, used: Set<string>): string {
  const start = pool.length ? ((serial % pool.length) + pool.length) % pool.length : 0;
  for (let i = 0; i < pool.length; i++) {
    const url = pool[(start + i) % pool.length];
    if (!used.has(url)) {
      used.add(url);
      return url;
    }
  }
  mintedSerial += 1;
  const url = pexels(1200000 + mintedSerial * 13);
  used.add(url);
  return url;
}

export const DINING_PHOTO_USED = new Set<string>();

export function uniqueDiningGallery(
  slug: string,
  kind: DiningKind,
  serial: number,
  used: Set<string>,
): string[] {
  const named = unique(NAMED_PHOTOS[slug] || []).filter((url) => {
    if (used.has(url)) return false;
    used.add(url);
    return true;
  });
  const facade = kind === 'cafe' ? CAFE_FACADE_POOL : REST_FACADE_POOL;
  const interior = kind === 'cafe' ? CAFE_INTERIOR_POOL : REST_INTERIOR_POOL;
  const detail = kind === 'cafe' ? CAFE_CUP_POOL : REST_FOOD_POOL;
  const images = [...named];
  if (images.length < 1) images.push(takeUnused(facade, serial, used));
  if (images.length < 2) images.push(takeUnused(interior, serial + 17, used));
  if (images.length < 3) images.push(takeUnused(detail, serial + 41, used));
  return images.slice(0, 3);
}

export function withUniqueDiningImages<T extends { slug: string; place_kind: DiningKind }>(
  seeds: T[],
  used: Set<string> = DINING_PHOTO_USED,
): Array<T & { images: string[] }> {
  let restSerial = 0;
  let cafeSerial = 0;
  return seeds.map((seed) => {
    const serial = seed.place_kind === 'cafe' ? cafeSerial++ : restSerial++;
    const images = uniqueDiningGallery(seed.slug, seed.place_kind, serial, used);
    return { ...seed, images };
  });
}

export function assertUniqueDiningImages(seeds: Array<{ slug: string; images: string[] }>) {
  const seen = new Map<string, string>();
  for (const seed of seeds) {
    if (seed.images.length < 3) {
      throw new Error(`Dining venue ${seed.slug} has fewer than 3 photos`);
    }
    for (const url of seed.images) {
      const owner = seen.get(url);
      if (owner && owner !== seed.slug) {
        throw new Error(`Dining photo reused by ${owner} and ${seed.slug}`);
      }
      seen.set(url, seed.slug);
    }
  }
}
