import {
  DISTRICT_COORDINATES,
  getMajorCitiesForCountry,
  isValidCoord,
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

async function getCitiesForCountry(code: string): Promise<CityData[]> {
  const cached = countryCache.get(code);
  if (cached) return cached;
  const csc = await loadCSC();
  const rawCities = csc.City.getCitiesOfCountry(code) as unknown as RawCity[];
  const cities: CityData[] = rawCities.map((rc) => ({
    name: toArabicCityName(rc.name),
    en: rc.name,
    lat: parseFloat(rc.latitude) || 0,
    lng: parseFloat(rc.longitude) || 0,
    countryCode: code,
    stateCode: rc.stateCode,
    districts: getDistrictsForCity(rc.name, code),
  }));
  countryCache.set(code, cities);
  return cities;
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

export async function searchCountries(query: string): Promise<CountryData[]> {
  const dataset = await getDataset();
  const q = query.trim();
  if (!q) return dataset.filter((c) => prioritySet.has(c.code));
  return dataset
    .map((c) => ({ c, score: queryMatchScore(q, c.name, c.en, c.code) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name, 'ar'))
    .map((row) => row.c);
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
  if (!q || countryName) {
    if (major.length > 0) return major;
  }

  const dataset = await getDataset();

  if (countryName) {
    const country = dataset.find((c) => c.name === countryName || c.en === countryName);
    if (!country) return major;
    let cities = country.cities;
    if (cities.length === 0) {
      cities = await getCitiesForCountry(country.code);
    }
    const extra = cities
      .filter((x) => !q || x.name.toLowerCase().includes(q) || x.en.toLowerCase().includes(q))
      .slice(0, 40)
      .map((city) => {
        const known = lookupCity(city.en) ?? lookupCity(city.name);
        return {
          city: {
            ...city,
            lat: isValidCoord(city.lat, city.lng) ? city.lat : (known?.lat ?? city.lat),
            lng: isValidCoord(city.lat, city.lng) ? city.lng : (known?.lng ?? city.lng),
            districts: city.districts.length ? city.districts : (DISTRICT_DATA[`${city.en}_${city.countryCode}`] ?? []),
          },
          countryName: country.name,
        };
      });
    const seen = new Set(major.map((m) => m.city.en.toLowerCase()));
    return [...major, ...extra.filter((e) => !seen.has(e.city.en.toLowerCase()))].slice(0, 50);
  }

  if (major.length > 0 && q) return major.slice(0, 50);

  const results: { city: CityData; countryName: string }[] = [...major];
  for (const c of dataset) {
    if (results.length >= 50) break;
    let cities = c.cities;
    if (cities.length === 0 && !prioritySet.has(c.code) && q) {
      cities = await getCitiesForCountry(c.code);
    }
    for (const city of cities) {
      if (results.length >= 50) break;
      if (!q || city.name.toLowerCase().includes(q) || city.en.toLowerCase().includes(q)) {
        results.push({ city, countryName: c.name });
      }
    }
  }
  return results;
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
  const dataset = await getDataset();
  return dataset.find((c) => c.name === name || c.en === name);
}

export async function findCityByName(
  name: string,
  countryName?: string
): Promise<{ city: CityData; countryName: string } | undefined> {
  const dataset = await getDataset();
  const countries = countryName
    ? dataset.filter((c) => c.name === countryName)
    : dataset;
  for (const c of countries) {
    let cities = c.cities;
    if (cities.length === 0 && !prioritySet.has(c.code)) {
      cities = await getCitiesForCountry(c.code);
    }
    const city = cities.find((city) => city.name === name || city.en === name);
    if (city) return { city, countryName: c.name };
  }
  return undefined;
}

export const PRIORITY_LOCATION_DATASET: CountryData[] = [];
export const LOCATION_DATASET: CountryData[] = [];
