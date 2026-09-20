import type { CivicSeed } from '@/lib/istanbulCivicSeeds';
import { haversineMeters } from '@/lib/coordIntegrity';
import { TURKEY_BBOX } from '@/lib/turkeyScope';

/** Bump this whenever the curated وقود catalog changes so vault/query caches drop. */
export const FUEL_CATALOG_VERSION = 4;

const MATCH_METERS = 40;

const BRAND_PAIR: Array<[RegExp, RegExp]> = [
  [/opet|أوبيت/i, /opet|أوبيت/i],
  [/shell|شل/i, /shell|شل/i],
  [/petrol\s*ofisi|بترول\s*أوفيسي|\bpo\b/i, /petrol\s*ofisi|بترول\s*أوفيسي|\bpo\b/i],
  [/\bbp\b|بي\s*بي/i, /\bbp\b|بي\s*بي/i],
];
const H24 = '24/7';
const OPET = '+90 444 1666';
const SHELL = '+90 444 0147';
const PO = '+90 444 0123';
const BP = '+90 444 2273';

export interface CuratedFuelStation {
  city: 'istanbul' | 'ankara' | 'izmir' | 'antalya' | 'trabzon';
  slug: string;
  name: string;
  name_en: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
  phone: string;
  rating: number;
}

function station(
  city: CuratedFuelStation['city'],
  slug: string,
  name: string,
  name_en: string,
  address: string,
  lat: number,
  lng: number,
  phone: string,
  rating = 4.2,
): CuratedFuelStation {
  return {
    city,
    slug,
    name,
    name_en,
    address,
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    hours: H24,
    phone,
    rating,
  };
}

/**
 * Strict allowlist of branded amenity=fuel stations (Opet, Shell, Petrol Ofisi, BP).
 * Coordinates are OpenStreetMap nodes with brand + amenity=fuel.
 * Istanbul 15, other hubs 10–12. No workshops, offices, or insurance agencies.
 */
export const TURKEY_FUEL_STATIONS: CuratedFuelStation[] = [
  // ——— Istanbul (15) ———
  station('istanbul', 'opet-dolapdere', 'أوبيت دولاب دره', 'Opet Dolapdere Caddesi', 'Dolapdere Caddesi, Şişli', 41.04842, 28.98499, OPET, 4.3),
  station('istanbul', 'opet-karakoy', 'أوبيت قركوي', 'Opet Karakoy Necatibey', 'Necatibey Caddesi, Beyoğlu', 41.02608, 28.97979, OPET, 4.2),
  station('istanbul', 'shell-sisli', 'شل شيشلي', 'Shell Sisli', 'Halaskargazi Caddesi, Şişli', 41.05594, 28.99770, SHELL, 4.2),
  station('istanbul', 'shell-levent', 'شل ليفنت', 'Shell Levent', 'Büyükdere Caddesi, Levent, Beşiktaş', 41.08772, 29.01775, SHELL, 4.3),
  station('istanbul', 'opet-maslak', 'أوبيت ماسلاك', 'Opet Maslak', 'Büyükdere Caddesi, Maslak, Sarıyer', 41.11754, 29.02347, OPET, 4.3),
  station('istanbul', 'opet-bakirkoy-aksu', 'أوبيت باكركوي أكسو', 'Opet Bakirkoy Aksu Caddesi', 'Aksu Caddesi, Bakırköy', 40.98772, 28.88395, OPET, 4.2),
  station('istanbul', 'shell-florya', 'شل فلوريا شنليك كوي', 'Shell Senlikkoy Florya', 'Şenlikköy, Bakırköy', 40.98793, 28.79607, SHELL, 4.2),
  station('istanbul', 'opet-halkali', 'أوبيت هالقي فاتح جادة', 'Opet Kucukcekmece Halkali Fatih Caddesi', 'Fatih Caddesi, Halkalı, Küçükçekmece', 41.02922, 28.80650, OPET, 4.2),
  station('istanbul', 'opet-beylikduzu', 'أوبيت بيليك دوزو حريت', 'Opet Beylikduzu Hurriyet Bulvari', 'Hürriyet Bulvarı, Beylikdüzü', 40.98987, 28.66845, OPET, 4.2),
  station('istanbul', 'opet-harem', 'أوبيت حرم ساحل يولو', 'Opet Uskudar Harem Sahil Yolu', 'Harem Sahil Yolu, Üsküdar', 41.00986, 29.01224, OPET, 4.3),
  station('istanbul', 'po-libadiye', 'بترول أوفيسي ليباديه', 'Petrol Ofisi Libadiye Caddesi', 'Libadiye Caddesi, Üsküdar', 41.01125, 29.07528, PO, 4.2),
  station('istanbul', 'bp-esenyurt', 'بي بي إسنيورت', 'BP Esenyurt', 'Esenyurt, İstanbul', 41.06008, 28.68832, BP, 4.2),
  station('istanbul', 'shell-maltepe', 'شل مالتبه', 'Shell Maltepe', 'Bağdat Caddesi, Maltepe', 40.93888, 29.13617, SHELL, 4.2),
  station('istanbul', 'opet-pendik', 'أوبيت بندك أنقرة جادة', 'Opet Pendik Ankara Caddesi', 'Ankara Caddesi, Pendik', 40.89570, 29.24906, OPET, 4.2),
  station('istanbul', 'opet-bagcilar', 'أوبيت باغجلار عثمان غازي', 'Opet Bagcilar Osmangazi Caddesi', 'Osmangazi Caddesi, Bağcılar', 41.04770, 28.85975, OPET, 4.2),

  // ——— Ankara (12) ———
  station('ankara', 'opet-eskisehir-yolu', 'أوبيت إسكي شهير يولو', 'Opet Cankaya Eskisehir Yolu 5. Km', 'Eskişehir Yolu 5. Km, Çankaya', 39.90918, 32.79025, OPET, 4.3),
  station('ankara', 'opet-dikmen-south', 'أوبيت دكمن جنوبي', 'Opet Cankaya Dikmen Caddesi', 'Dikmen Caddesi, Çankaya', 39.86411, 32.81871, OPET, 4.2),
  station('ankara', 'opet-dikmen', 'أوبيت دكمن', 'Opet Dikmen Caddesi Cankaya', 'Dikmen Caddesi, Çankaya', 39.89764, 32.84273, OPET, 4.2),
  station('ankara', 'opet-biskek', 'أوبيت بشكك جادة', 'Opet Cankaya Biskek Caddesi', 'Bişkek Caddesi, Çankaya', 39.92149, 32.81725, OPET, 4.3),
  station('ankara', 'po-hipodrom', 'بترول أوفيسي هيبودروم', 'Petrol Ofisi Hipodrom', 'Hipodrom Caddesi, Çankaya', 39.93220, 32.82801, PO, 4.2),
  station('ankara', 'bp-ulus', 'بي بي أولوس', 'BP Ulus Altindag', 'Çankırı Caddesi, Altındağ', 39.94568, 32.84759, BP, 4.2),
  station('ankara', 'shell-yenimahalle', 'شل يني محله', 'Shell Yenimahalle', 'Fatih Sultan Mehmet Bulvarı, Yenimahalle', 39.95340, 32.83923, SHELL, 4.2),
  station('ankara', 'opet-hipodrom', 'أوبيت هيبودروم', 'Opet Yenimahalle Hipodrom Caddesi', 'Hipodrom Caddesi, Yenimahalle', 39.95150, 32.82393, OPET, 4.2),
  station('ankara', 'opet-kecioren', 'أوبيت كيجي أوران يوزغات', 'Opet Kecioren Yozgat Bulvari', 'Yozgat Bulvarı, Keçiören', 39.99792, 32.82116, OPET, 4.2),
  station('ankara', 'opet-etimesgut-fsm', 'أوبيت إتيميسغوت فاتح سلطان', 'Opet Etimesgut Fatih Sultan Mehmet Bulvari', 'Fatih Sultan Mehmet Bulvarı, Etimesgut', 39.94469, 32.75802, OPET, 4.2),
  station('ankara', 'po-baglica', 'بترول أوفيسي باغليجا', 'Petrol Ofisi Baglica Etimesgut Bulvari', 'Etimesgut Bulvarı, Bağlıca, Etimesgut', 39.90247, 32.64625, PO, 4.2),
  station('ankara', 'opet-esenboga', 'أوبيت إسنبوغا يولو', 'Opet Pursaklar Esenboga Havalimani Yolu', 'Esenboğa Havalimanı Yolu 10. Km, Pursaklar', 40.02643, 32.89661, OPET, 4.3),

  // ——— Izmir (12) ———
  station('izmir', 'opet-bornova-kemalpasa', 'أوبيت بورنوفا كمال باشا', 'Opet Bornova Kemal Pasa Caddesi', 'Kemal Paşa Caddesi, Bornova', 38.43167, 27.22553, OPET, 4.2),
  station('izmir', 'opet-ibrahim-hakki', 'أوبيت يوزباشي إبراهيم حقي', 'Opet Yuzbasi Ibrahim Hakki Caddesi', 'Yüzbaşı İbrahim Hakkı Caddesi, Bornova', 38.46496, 27.18984, OPET, 4.2),
  station('izmir', 'opet-universite', 'أوبيت جامعة جادة', 'Opet Universite Caddesi', 'Üniversite Caddesi, Bornova', 38.44391, 27.18412, OPET, 4.3),
  station('izmir', 'shell-karsiyaka', 'شل كارشياكا', 'Shell Karsiyaka', 'Cemal Gürsel Caddesi, Karşıyaka', 38.46824, 27.11344, SHELL, 4.2),
  station('izmir', 'opet-anadolu-cigli', 'أوبيت أناضول تشيغلي', 'Opet Anadolu Caddesi Cigli', 'Anadolu Caddesi, Çiğli', 38.47779, 27.09575, OPET, 4.2),
  station('izmir', 'shell-mithatpasa', 'شل مدحت باشا', 'Shell Mithat Pasa Caddesi', 'Mithatpaşa Caddesi, Balçova', 38.39751, 27.06692, SHELL, 4.2),
  station('izmir', 'opet-karabaglar', 'أوبيت قره باغ لار', 'Opet Karabaglar Eski Izmir Caddesi', 'Eski İzmir Caddesi, Karabağlar', 38.37752, 27.10970, OPET, 4.2),
  station('izmir', 'bp-buca', 'بي بي بوجا أوزمن', 'BP Buca Ozmen Caddesi', 'Özmen Caddesi, Buca', 38.38284, 27.17119, BP, 4.2),
  station('izmir', 'po-bornova', 'بترول أوفيسي بورنوفا', 'Petrol Ofisi Bornova', 'Ankara Caddesi, Bornova', 38.43060, 27.21164, PO, 4.2),
  station('izmir', 'shell-konak', 'شل كوناك', 'Shell Konak', 'Halit Ziya Bulvarı, Konak', 38.40250, 27.11665, SHELL, 4.2),
  station('izmir', 'opet-ismail-sivri', 'أوبيت إسماعيل سيفري', 'Opet Ismail Sivri Bulvari', 'İsmail Sivri Bulvarı, Buca', 38.36274, 27.14968, OPET, 4.2),
  station('izmir', 'shell-alsancak', 'شل ألسانجاك', 'Shell Alsancak', 'Şair Eşref Bulvarı, Konak', 38.46561, 27.13675, SHELL, 4.2),

  // ——— Antalya (10) ———
  station('antalya', 'opet-konyaalti', 'أوبيت كوني آلتي أتاتورك', 'Opet Konyaalti Ataturk Caddesi 411', 'Atatürk Caddesi No:411, Bahtılı, Konyaaltı', 36.89416, 30.58444, '+90 242 419 2049', 4.3),
  station('antalya', 'opet-barinaklar', 'أوبيت باريناكلار', 'Opet Muratpasa Barinaklar Bulvari 90', 'Barınaklar Bulvarı No:90, Çağlayan, Muratpaşa', 36.85345, 30.77541, '+90 242 323 3121', 4.3),
  station('antalya', 'opet-gazi', 'أوبيت غازي بولفاري', 'Opet Muratpasa Gazi Bulvari 644', 'Gazi Bulvarı No:644, Doğuyaka, Muratpaşa', 36.90954, 30.74097, '+90 242 339 3960', 4.2),
  station('antalya', 'opet-aspendos', 'أوبيت أسبندوس', 'Opet Muratpasa Aspendos Bulvari 182', 'Aspendos Bulvarı No:182, Yeşilova, Muratpaşa', 36.89502, 30.75830, '+90 532 297 8292', 4.2),
  station('antalya', 'opet-vatan', 'أوبيت وطن بولفاري', 'Opet Muratpasa Vatan Bulvari 41', 'Vatan Bulvarı No:41, Güvenlik, Muratpaşa', 36.90325, 30.68448, '+90 533 281 9332', 4.2),
  station('antalya', 'opet-adnan-menderes', 'أوبيت عدنان مندريس', 'Opet Muratpasa Adnan Menderes Bulvari 22A', 'Adnan Menderes Bulvarı No:22/A, Yüksekalan, Muratpaşa', 36.89552, 30.70902, '+90 242 312 2783', 4.2),
  station('antalya', 'shell-kepez', 'شل كبز', 'Shell Kepez', 'Yıldırım Beyazıt Caddesi, Kepez', 36.91847, 30.70458, SHELL, 4.2),
  station('antalya', 'shell-serik', 'شل سريك جادة', 'Shell Serik Caddesi Aksu', 'Serik Caddesi, Aksu', 36.91535, 31.08028, SHELL, 4.1),
  station('antalya', 'po-konyaalti', 'بترول أوفيسي كوني آلتي', 'Petrol Ofisi Konyaalti', 'Akdeniz Bulvarı, Konyaaltı', 36.84338, 30.59775, PO, 4.1),
  station('antalya', 'po-doguyaka', 'بترول أوفيسي دوغوياكا', 'Petrol Ofisi Doguyaka', 'Gazi Bulvarı, Doğuyaka, Muratpaşa', 36.90792, 30.74588, PO, 4.1),

  // ——— Trabzon + Uzungöl road (10) ———
  station('trabzon', 'opet-akcaabat', 'أوبيت أكشابات', 'Opet Akcaabat Adnan Kahveci Bulvari 85', 'Adnan Kahveci Bulvarı No:85, Söğütlü, Akçaabat', 41.01199, 39.61271, '+90 462 248 7558', 4.3),
  station('trabzon', 'opet-anadolu', 'أوبيت أورتاهيسار أناضول', 'Opet Ortahisar Anadolu Bulvari 72', 'Anadolu Bulvarı No:72, Sanayi, Ortahisar', 40.99114, 39.74907, '+90 462 332 4242', 4.2),
  station('trabzon', 'opet-devlet-karayolu', 'أوبيت دولة قره يولو', 'Opet Ortahisar Devlet Karayolu Caddesi 66', 'Devlet Karayolu Caddesi No:66, Sanayi, Ortahisar', 40.99734, 39.74850, '+90 462 325 8891', 4.2),
  station('trabzon', 'opet-sahil-188', 'أوبيت ساحل دولت 188', 'Opet Ortahisar Devlet Sahil Yolu Caddesi 188', 'Devlet Sahil Yolu Caddesi No:188, 2 Nolu Beşirli, Ortahisar', 40.99502, 39.66882, '+90 462 221 2506', 4.3),
  station('trabzon', 'opet-akyazi', 'أوبيت أكيازي ساحل', 'Opet Ortahisar Sahil Caddesi Akyazi', 'Sahil Caddesi, Akyazı, Ortahisar', 40.99745, 39.64165, '+90 462 333 1000', 4.2),
  station('trabzon', 'opet-uzungol-yolu', 'أوبيت أوف — طريق أوزونغول', 'Opet Of Uzungol Yolu', 'Uzungöl Yolu, Cumapazarı, Of', 40.83632, 40.27215, '+90 462 791 4120', 4.3),
  station('trabzon', 'shell-akcaabat', 'شل أكشابات', 'Shell Akcaabat', 'Adnan Kahveci Bulvarı, Akçaabat', 41.01315, 39.60518, SHELL, 4.2),
  station('trabzon', 'shell-havalimani', 'شل مطار طرابزون', 'Havalimani Shell Trabzon', 'Devlet Sahil Yolu, Yomra / Havalimanı', 40.99314, 39.78110, SHELL, 4.3),
  station('trabzon', 'shell-carsibasi', 'شل غرب أكشابات', 'Shell Akcaabat Bati Sahil', 'Sahil Yolu, Akçaabat', 41.06721, 39.51625, SHELL, 4.1),
];

export function isTurkeyFuelCoordinate(lat: number, lng: number): boolean {
  return lat >= TURKEY_BBOX.south && lat <= TURKEY_BBOX.north
    && lng >= TURKEY_BBOX.west && lng <= TURKEY_BBOX.east;
}

export function isCuratedTurkeyFuelPin(lat: number, lng: number, nameHay = ''): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (!isTurkeyFuelCoordinate(lat, lng)) return true;
  const hit = TURKEY_FUEL_STATIONS.find((row) => haversineMeters(lat, lng, row.lat, row.lng) <= MATCH_METERS);
  if (!hit) return false;
  const hay = nameHay.trim();
  if (!hay) return true;
  const catalogHay = `${hit.name} ${hit.name_en}`;
  return BRAND_PAIR.some(([catalogRe, incomingRe]) => catalogRe.test(catalogHay) && incomingRe.test(hay));
}

export function turkeyFuelSeedsByCity(): Record<string, CivicSeed[]> {
  const out: Record<string, CivicSeed[]> = {};
  for (const row of TURKEY_FUEL_STATIONS) {
    const seed: CivicSeed = {
      category_key: 'fuel',
      name: row.name,
      name_en: row.name_en,
      address: row.address,
      hours: row.hours,
      phone: row.phone,
      lat: row.lat,
      lng: row.lng,
      rating: row.rating,
    };
    (out[row.city] ||= []).push(seed);
  }
  return out;
}

export const TURKEY_FUEL_SEEDS_BY_CITY = turkeyFuelSeedsByCity();
