import {
  DISTRICT_COORDINATES,
  firstMajorCityForCountry,
  getMajorCitiesForCountry,
  isValidCoord,
  listCountriesFromCatalog,
  lookupCity,
  queryMatchScore,
} from '@/lib/cityCoordinates';

export interface CityData {
  name: string;
  en: string;
  lat: number;
  lng: number;
  countryCode: string;
  stateCode?: string;
  districts: DistrictData[];
}

export interface DistrictData {
  name: string;
  en: string;
  query: string;
  lat?: number;
  lng?: number;
}

export interface CountryData {
  name: string;
  en: string;
  code: string;
  lat: number;
  lng: number;
  zoom: number;
  cities: CityData[];
}

interface RawCountry {
  name: string;
  isoCode: string;
  latitude: string;
  longitude: string;
}
interface RawCity {
  name: string;
  countryCode: string;
  stateCode: string;
  latitude: string;
  longitude: string;
}

const ARABIC_COUNTRY_NAMES: Record<string, string> = {
  TR: 'تركيا', AE: 'الإمارات', SA: 'السعودية', IR: 'إيران', OM: 'عُمان',
  MY: 'ماليزيا', TH: 'تايلاند', JP: 'اليابان', EG: 'مصر', JO: 'الأردن',
  QA: 'قطر', DE: 'ألمانيا', IQ: 'العراق', GB: 'بريطانيا', FR: 'فرنسا',
  US: 'أمريكا', IT: 'إيطاليا', ES: 'إسبانيا', NL: 'هولندا', BE: 'بلجيكا',
  CH: 'سويسرا', AT: 'النمسا', SE: 'السويد', NO: 'النرويج', DK: 'الدنمارك',
  FI: 'فنلندا', PL: 'بولندا', CZ: 'التشيك', GR: 'اليونان', PT: 'البرتغال',
  HR: 'كرواتيا', BG: 'بلغاريا', RO: 'رومانيا', HU: 'المجر', SK: 'سلوفاكيا',
  SI: 'سلوفينيا', RS: 'صربيا', BA: 'البوسنة', AL: 'ألبانيا', MK: 'مقدونيا',
  MT: 'مالطا', CY: 'قبرص', GE: 'جورجيا', AZ: 'أذربيجان', AM: 'أرمينيا',
  RU: 'روسيا', UA: 'أوكرانيا', BY: 'بيلاروس', LT: 'ليتوانيا', LV: 'لاتفيا',
  EE: 'إستونيا', MD: 'مولدوفا', IN: 'الهند', PK: 'باكستان', BD: 'بنغلاديش',
  LK: 'سريلانكا', NP: 'نيبال', BH: 'البحرين', KW: 'الكويت', YE: 'اليمن',
  LB: 'لبنان', SY: 'سوريا', PS: 'فلسطين', TN: 'تونس', DZ: 'الجزائر',
  MA: 'المغرب', LY: 'ليبيا', SD: 'السودان', SO: 'الصومال', DJ: 'جيبوتي',
  KM: 'جزر القمر', MR: 'موريتانيا', TD: 'تشاد', NE: 'النيجر', ML: 'مالي',
  BF: 'بوركينا فاسو', GN: 'غينيا', SN: 'السنغال', GM: 'غامبيا',
  CI: 'ساحل العاج', GH: 'غانا', TG: 'توغو', BJ: 'بنين', NG: 'نيجيريا',
  CM: 'الكاميرون', CF: 'إفريقيا الوسطى', CG: 'الكونغو', CD: 'الكونغو الديمقراطية',
  UG: 'أوغندا', KE: 'كينيا', TZ: 'تنزانيا', RW: 'رواندا', BI: 'بوروندي',
  ET: 'إثيوبيا', ER: 'إريتريا', ZW: 'زيمبابوي', ZM: 'زامبيا', MW: 'مالاوي',
  MZ: 'موزمبيق', AO: 'أنغولا', NA: 'ناميبيا', BW: 'بوتسوانا', ZA: 'جنوب أفريقيا',
  LS: 'ليسوتو', SZ: 'إسواتيني', MG: 'مدغشقر', MU: 'موريشيوس', SC: 'سيشل',
  CV: 'الرأس الأخضر', ST: 'ساو تومي', GQ: 'غينيا الاستوائية', GA: 'الغابون',
  SL: 'سيراليون', LR: 'ليبيريا', KH: 'كمبوديا', LA: 'لاوس', VN: 'فيتنام',
  MM: 'ميانمار', SG: 'سنغافورة', ID: 'إندونيسيا', PH: 'الفلبين', BN: 'بروناي',
  TL: 'تيمور الشرقية', KP: 'كوريا الشمالية', KR: 'كوريا الجنوبية', CN: 'الصين',
  TW: 'تايوان', HK: 'هونغ كونغ', MO: 'ماكاو', MN: 'منغوليا', KZ: 'كازاخستان',
  UZ: 'أوزبكستان', TM: 'تركمانستان', KG: 'قيرغيزستان', TJ: 'طاجيكستان',
  AF: 'أفغانستان', IL: 'إسرائيل', AU: 'أستراليا', NZ: 'نيوزيلندا',
  FJ: 'فيجي', PG: 'بابوا غينيا الجديدة', SB: 'جزر سليمان', VU: 'فانواتو',
  WS: 'ساموا', TO: 'تونغا', KI: 'كيريباتي', TV: 'توفالو', NR: 'ناورو',
  PW: 'بالاو', MH: 'جزر مارشال', FM: 'ميكرونيزيا', CK: 'جزر كوك', NU: 'نيوي',
  CA: 'كندا', MX: 'المكسيك', GT: 'غواتيمالا', BZ: 'بليز', HN: 'هندوراس',
  SV: 'السلفادور', NI: 'نيكاراغوا', CR: 'كوستاريكا', PA: 'بنما', CU: 'كوبا',
  JM: 'جامايكا', HT: 'هايتي', DO: 'جمهورية الدومينيكان', BS: 'باهاماس',
  BB: 'باربادوس', TT: 'ترينيداد وتوباغو', GD: 'غرينادا', LC: 'سانت لوسيا',
  VC: 'سانت فينسنت', AG: 'أنتيغوا وبربودا', DM: 'دومينيكا', KN: 'سانت كيتس ونيفيس',
  CO: 'كولومبيا', VE: 'فنزويلا', EC: 'الإكوادور', PE: 'بيرو', BO: 'بوليفيا',
  CL: 'تشيلي', AR: 'الأرجنتين', UY: 'أوروغواي', PY: 'باراغواي', BR: 'البرازيل',
  GY: 'غيانا', SR: 'سورينام', IS: 'آيسلندا', LU: 'لوكسمبورغ', MC: 'موناكو',
  AD: 'أندورا', SM: 'سان مارينو', VA: 'الفاتيكان', LI: 'ليختنشتاين',
};

const ARABIC_CITY_NAMES: Record<string, string> = {
  Istanbul: 'إسطنبول', Trabzon: 'ترابزون', Antalya: 'أنطاليا', Bursa: 'بورصة',
  Ankara: 'أنقرة', Izmir: 'إزمير', Dubai: 'دبي', 'Abu Dhabi': 'أبوظبي',
  Sharjah: 'الشارقة', Ajman: 'عجمان', Riyadh: 'الرياض', Jeddah: 'جدة',
  Mecca: 'مكة المكرمة', Medina: 'المدينة المنورة', Tehran: 'طهران',
  Mashhad: 'مشهد', Shiraz: 'شيراز', Isfahan: 'أصفهان', Muscat: 'مسقط',
  Salalah: 'صلالة', 'Kuala Lumpur': 'كوالالمبور', Penang: 'بينانغ',
  Bangkok: 'بانكوك', Phuket: 'بوكيت', 'Chiang Mai': 'تشيانغ ماي',
  Tokyo: 'طوكيو', Osaka: 'أوساكا', Kyoto: 'كيوتو', Cairo: 'القاهرة',
  Alexandria: 'الإسكندرية', Luxor: 'الأقصر', Aswan: 'أسوان', Giza: 'الجيزة',
  Amman: 'عمّان', Aqaba: 'العقبة', Doha: 'الدوحة', Berlin: 'برلين',
  Munich: 'ميونخ', Frankfurt: 'فرانكفورت', Hamburg: 'هامبورغ', Cologne: 'كولن',
  Baghdad: 'بغداد', Basra: 'البصرة', Erbil: 'أربيل', Mosul: 'الموصل',
  Najaf: 'النجف', Karbala: 'كربلاء', Kirkuk: 'كركوك', Sulaymaniyah: 'السليمانية',
  Duhok: 'دهوك', Fallujah: 'الفلوجة', Hillah: 'الحلة', Kut: 'الكوت',
  London: 'لندن', Paris: 'باريس', Rome: 'روما', Madrid: 'مدريد',
  Barcelona: 'برشلونة', Amsterdam: 'أمستردام', Brussels: 'بروكسل',
  Vienna: 'فيينا', Stockholm: 'ستوكهولم', Copenhagen: 'كوبنهاغن',
  Helsinki: 'هلسنكي', Athens: 'أثينا', Lisbon: 'لشبونة', Prague: 'براغ',
  Warsaw: 'وارسو', Budapest: 'بودابست', Bucharest: 'بوخارست', Zagreb: 'زرغب',
  'New York': 'نيويورك', 'Los Angeles': 'لوس أنجلوس',
  'San Francisco': 'سان فرانسيسكو', Chicago: 'شيكاغو', Washington: 'واشنطن',
  Miami: 'ميامي', Toronto: 'تورنتو', Vancouver: 'فانكوفر', Montreal: 'مونتريال',
  Sydney: 'سيدني', Melbourne: 'ملبورن', Kabul: 'كابول', Karachi: 'كراتشي',
  Lahore: 'لاهور', Islamabad: 'إسلام آباد', Delhi: 'دلهي', Mumbai: 'مومباي',
  Bangalore: 'بنغالور', Singapore: 'سنغافورة', 'Hong Kong': 'هونغ كونغ',
  Seoul: 'سيول', Beijing: 'بكين', Shanghai: 'شنغهاي', Guangzhou: 'قوانغتشو',
  Manila: 'مانيلا', Jakarta: 'جاكارتا', Hanoi: 'هانوي',
  'Ho Chi Minh City': 'هوشي منه', 'Phnom Penh': 'بنوم بنه', Vientiane: 'فيينتيان',
  Yangon: 'يانغون', Tashkent: 'طشقند', Almaty: 'ألماتي', Baku: 'باكو',
  Tbilisi: 'تبليسي', Yerevan: 'يريفان', Kyiv: 'كييف', Moscow: 'موسكو',
  Minsk: 'مينسك', 'Kuwait City': 'مدينة الكويت', Manama: 'المنامة',
  Sanaa: 'صنعاء', Beirut: 'بيروت', Damascus: 'دمشق', Tunis: 'تونس',
  Algiers: 'الجزائر', Rabat: 'الرباط', Khartoum: 'الخرطوم',
  'Addis Ababa': 'أديس أبابا', Nairobi: 'نيروبي', Dakar: 'داكار', Accra: 'أكرا',
  Lagos: 'لاغوس', Abuja: 'أبوجا', Casablanca: 'الدار البيضاء',
  Tripoli: 'طرابلس', Milan: 'ميلانو', Naples: 'نابولي', Venice: 'البندقية',
  Florence: 'فلورنسا', Nice: 'نيس', Lyon: 'ليون', Marseille: 'مرسيليا',
  Geneva: 'جنيف', Zurich: 'زيورخ', Reykjavik: 'ريكيافيك', Oslo: 'أوسلو',
  Bergen: 'برغن', Gothenburg: 'غوتنبرغ', Dublin: 'دبلن', Edinburgh: 'إدنبرة',
  Glasgow: 'غلاسكو', Manchester: 'مانشستر', Birmingham: 'برمنغهام',
  Liverpool: 'ليفربول', Bristol: 'بريستول', Leeds: 'ليدز', Newcastle: 'نيوكاسل',
  Cardiff: 'كارديف', Belfast: 'بلفاست', Bodrum: 'بودروم', Fethiye: 'فتحية',
  Marmaris: 'مرماريس', Konya: 'قونية', Gaziantep: 'غازي عنتاب',
  Kayseri: 'قيصري', Samsun: 'سامسون', Sivas: 'سيواس', Denizli: 'دينيزلي',
  Adana: 'أضنة', Mersin: 'مرسين', Antakya: 'أنطاكيا', Van: 'فان',
  Erzurum: 'أرضروم', Rize: 'ريزة', Sinop: 'سينوب', Edirne: 'أدرنة',
  Alanya: 'ألانية', Side: 'سايد', Belek: 'بيلك', Kemer: 'كيمر',
  Cesme: 'تشيشمي', Pamukkale: 'باموكالي', Cappadocia: 'كابادوكيا',
  Nevsehir: 'نوشهر', Urgup: 'أورغوب', Goreme: 'غوريم',
};

const DISTRICT_DATA: Record<string, DistrictData[]> = DISTRICT_COORDINATES;

const PRIORITY_COUNTRIES = [
  'TR', 'AE', 'SA', 'IR', 'OM', 'MY', 'TH', 'JP', 'EG', 'JO', 'QA', 'DE', 'IQ',
  'GB', 'FR', 'IT', 'ES', 'NL', 'US', 'CA', 'AU', 'IN', 'PK', 'ID', 'PH', 'VN',
  'KR', 'CN', 'SG', 'BH', 'KW', 'LB', 'SY', 'TN', 'MA', 'DZ', 'LY', 'SD', 'KE',
  'ET', 'NG', 'ZA', 'RU', 'UA', 'PL', 'CZ', 'GR', 'PT', 'HR', 'HU', 'RO', 'BG',
  'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'BE', 'IE', 'GE', 'AZ', 'AM', 'KZ', 'UZ',
];

function toArabicCountryName(enName: string, isoCode: string): string {
  return ARABIC_COUNTRY_NAMES[isoCode] ?? enName;
}
function toArabicCityName(enName: string): string {
  return ARABIC_CITY_NAMES[enName] ?? enName;
}
function getDistrictsForCity(cityEnName: string, countryCode: string): DistrictData[] {
  return DISTRICT_DATA[`${cityEnName}_${countryCode}`] ?? [];
}

let cscModule: typeof import('country-state-city') | null = null;
async function loadCSC() {
  if (!cscModule) cscModule = await import('country-state-city');
  return cscModule;
}

const countryCache = new Map<string, CityData[]>();
const countryRawCache = new Map<string, RawCity[]>();
const CITY_SUGGEST_CAP = 80;

function mapRawCity(rc: RawCity, code: string): CityData {
  return {
    name: toArabicCityName(rc.name),
    en: rc.name,
    lat: parseFloat(rc.latitude) || 0,
    lng: parseFloat(rc.longitude) || 0,
    countryCode: code,
    stateCode: rc.stateCode,
    districts: [],
  };
}

async function getRawCitiesForCountry(code: string): Promise<RawCity[]> {
  const cached = countryRawCache.get(code);
  if (cached) return cached;
  const csc = await loadCSC();
  const rawCities = (csc.City.getCitiesOfCountry(code) as unknown as RawCity[]) ?? [];
  countryRawCache.set(code, rawCities);
  return rawCities;
}

async function getCitiesForCountry(code: string, query = ''): Promise<CityData[]> {
  const q = query.trim().toLowerCase();
  if (!q) {
    const cached = countryCache.get(code);
    if (cached) return cached;
  }
  const rawCities = await getRawCitiesForCountry(code);
  const matched = q
    ? rawCities.filter((rc) => rc.name.toLowerCase().includes(q))
    : rawCities;
  const cities = matched.slice(0, Math.max(CITY_SUGGEST_CAP * 2, 160)).map((rc) => mapRawCity(rc, code));
  if (!q) countryCache.set(code, cities);
  return cities;
}

function resolveCountryIsoSync(countryName?: string): string | undefined {
  if (!countryName) return undefined;
  const q = countryName.trim();
  if (!q) return undefined;
  const upper = q.toUpperCase();
  const catalog = listCountriesFromCatalog();
  const byCode = catalog.find((c) => c.code === upper);
  if (byCode) return byCode.code;
  if (ARABIC_COUNTRY_NAMES[upper]) return upper;
  const fromCatalog = catalog.find(
    (c) => c.name === q || c.en === q || c.code.toLowerCase() === q.toLowerCase(),
  );
  if (fromCatalog) return fromCatalog.code;
  return Object.entries(ARABIC_COUNTRY_NAMES).find(([, ar]) => ar === q)?.[0];
}

async function resolveCountryIso(countryName?: string): Promise<string | undefined> {
  const instant = resolveCountryIsoSync(countryName);
  if (instant) return instant;
  if (!countryName?.trim()) return undefined;
  const raw = await getAllCountriesRaw();
  const q = countryName.trim().toLowerCase();
  const hit = raw.find((c) => {
    const ar = toArabicCountryName(c.name, c.isoCode);
    return (
      c.isoCode.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      ar === countryName.trim() ||
      ar.toLowerCase() === q
    );
  });
  return hit?.isoCode;
}

function mergeCityHits(
  major: { city: CityData; countryName: string }[],
  extra: { city: CityData; countryName: string }[],
  cap = CITY_SUGGEST_CAP,
) {
  const seen = new Set(major.map((m) => m.city.en.toLowerCase()));
  const out = [...major];
  for (const row of extra) {
    if (out.length >= cap) break;
    const key = row.city.en.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out.slice(0, cap);
}

let allCountriesRaw: RawCountry[] | null = null;
async function getAllCountriesRaw(): Promise<RawCountry[]> {
  if (allCountriesRaw) return allCountriesRaw;
  const csc = await loadCSC();
  allCountriesRaw = csc.Country.getAllCountries() as unknown as RawCountry[];
  return allCountriesRaw;
}

function buildCountryData(raw: RawCountry, cities: CityData[]): CountryData {
  const cityWithCoords = cities.find((c) => c.lat !== 0 && c.lng !== 0);
  const fallbackLat = cityWithCoords?.lat ?? parseFloat(raw.latitude) ?? 0;
  const fallbackLng = cityWithCoords?.lng ?? parseFloat(raw.longitude) ?? 0;
  return {
    name: toArabicCountryName(raw.name, raw.isoCode),
    en: raw.name,
    code: raw.isoCode,
    lat: parseFloat(raw.latitude) || fallbackLat,
    lng: parseFloat(raw.longitude) || fallbackLng,
    zoom: 6,
    cities,
  };
}

const prioritySet = new Set(PRIORITY_COUNTRIES);

let _datasetPromise: Promise<CountryData[]> | null = null;
let _dataset: CountryData[] | null = null;

export async function getDataset(): Promise<CountryData[]> {
  if (_dataset) return _dataset;
  if (!_datasetPromise) {
    _datasetPromise = (async () => {
      const raw = await getAllCountriesRaw();
      const priorityRaw = raw.filter((c) => prioritySet.has(c.isoCode));
      const otherRaw = raw.filter((c) => !prioritySet.has(c.isoCode));
      const priorityCountries: CountryData[] = [];
      for (const r of priorityRaw) {
        const cities = await getCitiesForCountry(r.isoCode);
        priorityCountries.push(buildCountryData(r, cities));
      }
      const otherCountries = otherRaw.map((r) => buildCountryData(r, []));
      _dataset = [...priorityCountries, ...otherCountries];
      return _dataset;
    })();
  }
  return _datasetPromise;
}

export function catalogCountries(): CountryData[] {
  return listCountriesFromCatalog().map((country) => {
    const first = firstMajorCityForCountry(country.name);
    return {
      name: country.name,
      en: country.en,
      code: country.code,
      lat: first?.lat ?? 0,
      lng: first?.lng ?? 0,
      zoom: 6,
      cities: [],
    };
  });
}

function mergeCountries(rows: CountryData[]): CountryData[] {
  const seen = new Set<string>();
  const out: CountryData[] = [];
  for (const row of rows) {
    if (seen.has(row.code)) continue;
    seen.add(row.code);
    out.push(row);
  }
  return out;
}

function filterCountryList(rows: CountryData[], query: string): CountryData[] {
  const q = query.trim();
  if (!q) return rows;
  return rows
    .map((c) => ({ c, score: queryMatchScore(q, c.name, c.en, c.code) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name, 'ar'))
    .map((row) => row.c);
}

function namedCountries(): CountryData[] {
  const catalog = catalogCountries();
  const extra = Object.entries(ARABIC_COUNTRY_NAMES).map(([code, name]) => {
    const first = firstMajorCityForCountry(name);
    return {
      name,
      en: catalog.find((c) => c.code === code)?.en || code,
      code,
      lat: first?.lat ?? 0,
      lng: first?.lng ?? 0,
      zoom: 6,
      cities: [] as CityData[],
    };
  });
  return mergeCountries([...catalog, ...extra]);
}

let _namedCountries: CountryData[] | null = null;
function allNamedCountries(): CountryData[] {
  if (!_namedCountries) _namedCountries = namedCountries();
  return _namedCountries;
}

export function searchCountriesSync(query: string): CountryData[] {
  const all = allNamedCountries();
  if (!query.trim()) {
    return mergeCountries([
      ...catalogCountries(),
      ...all.filter((c) => prioritySet.has(c.code)),
    ]).slice(0, 40);
  }
  return filterCountryList(all, query).slice(0, 40);
}

export async function searchCountries(query: string): Promise<CountryData[]> {
  return searchCountriesSync(query);
}

function majorCitiesAsResults(countryName?: string, query = ''): { city: CityData; countryName: string }[] {
  return getMajorCitiesForCountry(countryName)
    .map((c) => ({
      city: {
        name: c.name,
        en: c.en,
        lat: c.lat,
        lng: c.lng,
        countryCode: c.countryCode,
        districts: DISTRICT_DATA[`${c.en}_${c.countryCode}`] ?? [],
      },
      countryName: c.country,
      score: query ? queryMatchScore(query, c.name, c.en, c.country) : 1,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ city, countryName }) => ({ city, countryName }));
}

export function listMajorCities(countryName?: string, query = '') {
  return majorCitiesAsResults(countryName, query);
}

export async function searchCities(
  query: string,
  countryName?: string
): Promise<{ city: CityData; countryName: string }[]> {
  const q = query.trim().toLowerCase();
  const major = majorCitiesAsResults(countryName, query);
  if (!countryName) return major.slice(0, CITY_SUGGEST_CAP);

  const code = await resolveCountryIso(countryName);
  if (!code) return major.slice(0, CITY_SUGGEST_CAP);

  const cities = await getCitiesForCountry(code, query);
  const countryLabel = ARABIC_COUNTRY_NAMES[code] ?? countryName;
  const extra = cities
    .filter((x) => !q || x.name.toLowerCase().includes(q) || x.en.toLowerCase().includes(q))
    .slice(0, CITY_SUGGEST_CAP)
    .map((city) => {
      const known = lookupCity(city.en) ?? lookupCity(city.name);
      return {
        city: {
          ...city,
          lat: isValidCoord(city.lat, city.lng) ? city.lat : (known?.lat ?? city.lat),
          lng: isValidCoord(city.lat, city.lng) ? city.lng : (known?.lng ?? city.lng),
          districts: city.districts.length ? city.districts : getDistrictsForCity(city.en, city.countryCode),
        },
        countryName: countryLabel,
      };
    });
  return mergeCityHits(major, extra);
}

export function searchDistricts(
  query: string,
  cityName?: string,
  countryName?: string
): { district: DistrictData; cityName: string; countryName: string }[] {
  const q = query.trim().toLowerCase();
  const wantedCity = lookupCity(cityName);
  const results: { district: DistrictData; cityName: string; countryName: string }[] = [];
  for (const [key, districts] of Object.entries(DISTRICT_DATA)) {
    const sep = key.lastIndexOf('_');
    const cityEn = key.slice(0, sep);
    const countryCode = key.slice(sep + 1);
    const country = ARABIC_COUNTRY_NAMES[countryCode] ?? countryCode;
    const city = ARABIC_CITY_NAMES[cityEn] ?? lookupCity(cityEn)?.name ?? cityEn;
    if (countryName && country !== countryName && wantedCity?.country !== country) continue;
    if (cityName) {
      const rowCity = lookupCity(cityEn);
      const matches =
        city === cityName ||
        cityEn.toLowerCase() === cityName.toLowerCase() ||
        Boolean(wantedCity && rowCity && wantedCity.en === rowCity.en);
      if (!matches) continue;
    }
    for (const d of districts) {
      if (!q || d.name.toLowerCase().includes(q) || d.en.toLowerCase().includes(q) || d.query.toLowerCase().includes(q)) {
        results.push({ district: d, cityName: city, countryName: country });
      }
    }
  }
  return results;
}

export async function findCountryByName(name: string): Promise<CountryData | undefined> {
  const fromCatalog = catalogCountries().find((c) => c.name === name || c.en === name);
  if (fromCatalog) return fromCatalog;
  const raw = await getAllCountriesRaw();
  const hit = raw.find((c) => c.name === name || toArabicCountryName(c.name, c.isoCode) === name);
  return hit ? buildCountryData(hit, []) : undefined;
}

export async function findCityByName(
  name: string,
  countryName?: string
): Promise<{ city: CityData; countryName: string } | undefined> {
  const known = lookupCity(name);
  if (known && (!countryName || known.country === countryName || known.countryEn === countryName || known.countryCode === countryName)) {
    return {
      city: {
        name: known.name,
        en: known.en,
        lat: known.lat,
        lng: known.lng,
        countryCode: known.countryCode,
        districts: getDistrictsForCity(known.en, known.countryCode),
      },
      countryName: known.country,
    };
  }
  const code = await resolveCountryIso(countryName);
  if (!code) return undefined;
  const cities = await getCitiesForCountry(code);
  const city = cities.find((row) => row.name === name || row.en === name);
  if (!city) return undefined;
  return { city, countryName: ARABIC_COUNTRY_NAMES[code] ?? countryName ?? city.en };
}

export const PRIORITY_LOCATION_DATASET: CountryData[] = [];
export const LOCATION_DATASET: CountryData[] = [];
