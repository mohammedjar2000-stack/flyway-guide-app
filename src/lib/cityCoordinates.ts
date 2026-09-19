import { DEFAULT_MAP_CENTER } from '@/lib/mapConfig';
import { haversineKm } from '@/lib/geo';
import { cityIntegrityKey, cityLandBbox } from '@/lib/coordIntegrity';

export const CITY_ZOOM = 14;
export const DISTRICT_ZOOM = 16;

export interface AppLocation {
  lat: number;
  lng: number;
  zoom: number;
  label: string;
  country?: string;
  city?: string;
  district?: string;
  categoryKey?: string;
  poiId?: string;
  bbox?: { south: number; west: number; north: number; east: number };
}

export interface CityCoordinate {
  name: string;
  en: string;
  country: string;
  countryEn: string;
  countryCode: string;
  lat: number;
  lng: number;
  zoom: number;
}

export interface DistrictCoordinate {
  name: string;
  en: string;
  query: string;
  lat: number;
  lng: number;
}

export const CITY_COORDINATES: Record<string, CityCoordinate> = {
  istanbul: { name: 'إسطنبول', en: 'Istanbul', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 41.0082, lng: 28.9784, zoom: CITY_ZOOM },
  allturkey: { name: 'عموم تركيا', en: 'All Turkey', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 39.14, lng: 35.17, zoom: 6 },
  ankara: { name: 'أنقرة', en: 'Ankara', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 39.9334, lng: 32.8597, zoom: CITY_ZOOM },
  izmir: { name: 'إزمير', en: 'Izmir', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 38.4237, lng: 27.1428, zoom: CITY_ZOOM },
  antalya: { name: 'أنطاليا', en: 'Antalya', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 36.8969, lng: 30.7133, zoom: CITY_ZOOM },
  trabzon: { name: 'ترابزون', en: 'Trabzon', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 41.0027, lng: 39.7168, zoom: CITY_ZOOM },
  bursa: { name: 'بورصة', en: 'Bursa', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 40.1885, lng: 29.061, zoom: CITY_ZOOM },
  gaziantep: { name: 'غازي عنتاب', en: 'Gaziantep', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 37.0662, lng: 37.3781, zoom: CITY_ZOOM },
  konya: { name: 'قونية', en: 'Konya', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 37.8746, lng: 32.4932, zoom: CITY_ZOOM },
  adana: { name: 'أضنة', en: 'Adana', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 37.0, lng: 35.3213, zoom: CITY_ZOOM },
  mersin: { name: 'مرسين', en: 'Mersin', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 36.8121, lng: 34.6415, zoom: CITY_ZOOM },
  kayseri: { name: 'قيصري', en: 'Kayseri', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 38.7312, lng: 35.4787, zoom: CITY_ZOOM },
  samsun: { name: 'سامسون', en: 'Samsun', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 41.2867, lng: 36.33, zoom: CITY_ZOOM },
  bodrum: { name: 'بودروم', en: 'Bodrum', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 37.0344, lng: 27.4305, zoom: CITY_ZOOM },
  alanya: { name: 'ألانية', en: 'Alanya', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 36.5444, lng: 31.9954, zoom: CITY_ZOOM },
  fethiye: { name: 'فتحية', en: 'Fethiye', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 36.6592, lng: 29.127, zoom: CITY_ZOOM },
  edirne: { name: 'أدرنة', en: 'Edirne', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 41.6771, lng: 26.5557, zoom: CITY_ZOOM },
  van: { name: 'وان', en: 'Van', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 38.4891, lng: 43.4089, zoom: CITY_ZOOM },
  diyarbakir: { name: 'ديار بكر', en: 'Diyarbakir', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 37.9144, lng: 40.2306, zoom: CITY_ZOOM },
  eskisehir: { name: 'إسكي شهير', en: 'Eskisehir', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 39.7767, lng: 30.5206, zoom: CITY_ZOOM },
  denizli: { name: 'دنيزلي', en: 'Denizli', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 37.7765, lng: 29.0864, zoom: CITY_ZOOM },
  mugla: { name: 'موغلا', en: 'Mugla', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 37.2153, lng: 28.3636, zoom: CITY_ZOOM },
  hatay: { name: 'هاتاي', en: 'Hatay', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 36.2023, lng: 36.1613, zoom: CITY_ZOOM },
  nevsehir: { name: 'نوشهر', en: 'Nevsehir', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 38.6244, lng: 34.7239, zoom: CITY_ZOOM },
  malatya: { name: 'ملطية', en: 'Malatya', country: 'تركيا', countryEn: 'Turkey', countryCode: 'TR', lat: 38.3552, lng: 38.3095, zoom: CITY_ZOOM },
  dubai: { name: 'دبي', en: 'Dubai', country: 'الإمارات', countryEn: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708, zoom: CITY_ZOOM },
  abudhabi: { name: 'أبوظبي', en: 'Abu Dhabi', country: 'الإمارات', countryEn: 'United Arab Emirates', countryCode: 'AE', lat: 24.4539, lng: 54.3773, zoom: CITY_ZOOM },
  sharjah: { name: 'الشارقة', en: 'Sharjah', country: 'الإمارات', countryEn: 'United Arab Emirates', countryCode: 'AE', lat: 25.3463, lng: 55.4209, zoom: CITY_ZOOM },
  ajman: { name: 'عجمان', en: 'Ajman', country: 'الإمارات', countryEn: 'United Arab Emirates', countryCode: 'AE', lat: 25.4052, lng: 55.5136, zoom: CITY_ZOOM },
  riyadh: { name: 'الرياض', en: 'Riyadh', country: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', lat: 24.7136, lng: 46.6753, zoom: CITY_ZOOM },
  jeddah: { name: 'جدة', en: 'Jeddah', country: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', lat: 21.4858, lng: 39.1925, zoom: CITY_ZOOM },
  mecca: { name: 'مكة المكرمة', en: 'Mecca', country: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', lat: 21.4225, lng: 39.8262, zoom: CITY_ZOOM },
  medina: { name: 'المدينة المنورة', en: 'Medina', country: 'السعودية', countryEn: 'Saudi Arabia', countryCode: 'SA', lat: 24.5247, lng: 39.5692, zoom: CITY_ZOOM },
  tehran: { name: 'طهران', en: 'Tehran', country: 'إيران', countryEn: 'Iran', countryCode: 'IR', lat: 35.6892, lng: 51.389, zoom: CITY_ZOOM },
  mashhad: { name: 'مشهد', en: 'Mashhad', country: 'إيران', countryEn: 'Iran', countryCode: 'IR', lat: 36.2605, lng: 59.6168, zoom: CITY_ZOOM },
  isfahan: { name: 'أصفهان', en: 'Isfahan', country: 'إيران', countryEn: 'Iran', countryCode: 'IR', lat: 32.6546, lng: 51.668, zoom: CITY_ZOOM },
  shiraz: { name: 'شيراز', en: 'Shiraz', country: 'إيران', countryEn: 'Iran', countryCode: 'IR', lat: 29.5918, lng: 52.5836, zoom: CITY_ZOOM },
  muscat: { name: 'مسقط', en: 'Muscat', country: 'عُمان', countryEn: 'Oman', countryCode: 'OM', lat: 23.588, lng: 58.3829, zoom: CITY_ZOOM },
  salalah: { name: 'صلالة', en: 'Salalah', country: 'عُمان', countryEn: 'Oman', countryCode: 'OM', lat: 17.0151, lng: 54.0924, zoom: CITY_ZOOM },
  kualalumpur: { name: 'كوالالمبور', en: 'Kuala Lumpur', country: 'ماليزيا', countryEn: 'Malaysia', countryCode: 'MY', lat: 3.139, lng: 101.6869, zoom: CITY_ZOOM },
  penang: { name: 'بينانغ', en: 'Penang', country: 'ماليزيا', countryEn: 'Malaysia', countryCode: 'MY', lat: 5.4141, lng: 100.3288, zoom: CITY_ZOOM },
  bangkok: { name: 'بانكوك', en: 'Bangkok', country: 'تايلاند', countryEn: 'Thailand', countryCode: 'TH', lat: 13.7563, lng: 100.5018, zoom: CITY_ZOOM },
  phuket: { name: 'بوكيت', en: 'Phuket', country: 'تايلاند', countryEn: 'Thailand', countryCode: 'TH', lat: 7.8804, lng: 98.3923, zoom: CITY_ZOOM },
  tokyo: { name: 'طوكيو', en: 'Tokyo', country: 'اليابان', countryEn: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503, zoom: CITY_ZOOM },
  osaka: { name: 'أوساكا', en: 'Osaka', country: 'اليابان', countryEn: 'Japan', countryCode: 'JP', lat: 34.6937, lng: 135.5023, zoom: CITY_ZOOM },
  kyoto: { name: 'كيوتو', en: 'Kyoto', country: 'اليابان', countryEn: 'Japan', countryCode: 'JP', lat: 35.0116, lng: 135.7681, zoom: CITY_ZOOM },
  cairo: { name: 'القاهرة', en: 'Cairo', country: 'مصر', countryEn: 'Egypt', countryCode: 'EG', lat: 30.0444, lng: 31.2357, zoom: CITY_ZOOM },
  alexandria: { name: 'الإسكندرية', en: 'Alexandria', country: 'مصر', countryEn: 'Egypt', countryCode: 'EG', lat: 31.2001, lng: 29.9187, zoom: CITY_ZOOM },
  amman: { name: 'عمّان', en: 'Amman', country: 'الأردن', countryEn: 'Jordan', countryCode: 'JO', lat: 31.9454, lng: 35.9284, zoom: CITY_ZOOM },
  doha: { name: 'الدوحة', en: 'Doha', country: 'قطر', countryEn: 'Qatar', countryCode: 'QA', lat: 25.2854, lng: 51.531, zoom: CITY_ZOOM },
  berlin: { name: 'برلين', en: 'Berlin', country: 'ألمانيا', countryEn: 'Germany', countryCode: 'DE', lat: 52.52, lng: 13.405, zoom: CITY_ZOOM },
  munich: { name: 'ميونخ', en: 'Munich', country: 'ألمانيا', countryEn: 'Germany', countryCode: 'DE', lat: 48.1351, lng: 11.582, zoom: CITY_ZOOM },
  baghdad: { name: 'بغداد', en: 'Baghdad', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 33.3152, lng: 44.3661, zoom: CITY_ZOOM },
  karbala: { name: 'كربلاء', en: 'Karbala', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 32.616, lng: 44.0249, zoom: CITY_ZOOM },
  najaf: { name: 'النجف', en: 'Najaf', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 32.025, lng: 44.346, zoom: CITY_ZOOM },
  basra: { name: 'البصرة', en: 'Basra', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 30.508, lng: 47.7835, zoom: CITY_ZOOM },
  erbil: { name: 'أربيل', en: 'Erbil', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 36.1911, lng: 44.0093, zoom: CITY_ZOOM },
  mosul: { name: 'الموصل', en: 'Mosul', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 36.335, lng: 43.1189, zoom: CITY_ZOOM },
  kirkuk: { name: 'كركوك', en: 'Kirkuk', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 35.4681, lng: 44.3922, zoom: CITY_ZOOM },
  sulaymaniyah: { name: 'السليمانية', en: 'Sulaymaniyah', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 35.5616, lng: 45.4306, zoom: CITY_ZOOM },
  duhok: { name: 'دهوك', en: 'Duhok', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 36.8671, lng: 42.9884, zoom: CITY_ZOOM },
  hillah: { name: 'الحلة', en: 'Hillah', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 32.4787, lng: 44.4328, zoom: CITY_ZOOM },
  nasiriyah: { name: 'الناصرية', en: 'Nasiriyah', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 31.0576, lng: 46.2576, zoom: CITY_ZOOM },
  amarah: { name: 'العمارة', en: 'Amarah', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 31.836, lng: 47.144, zoom: CITY_ZOOM },
  ramadi: { name: 'الرمادي', en: 'Ramadi', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 33.4258, lng: 43.3078, zoom: CITY_ZOOM },
  kut: { name: 'الكوت', en: 'Kut', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 32.5128, lng: 45.818, zoom: CITY_ZOOM },
  diwaniyah: { name: 'الديوانية', en: 'Diwaniyah', country: 'العراق', countryEn: 'Iraq', countryCode: 'IQ', lat: 31.9929, lng: 44.9255, zoom: CITY_ZOOM },
  london: { name: 'لندن', en: 'London', country: 'بريطانيا', countryEn: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278, zoom: CITY_ZOOM },
  paris: { name: 'باريس', en: 'Paris', country: 'فرنسا', countryEn: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522, zoom: CITY_ZOOM },
};

const ALIAS_TO_KEY: Record<string, string> = {};
for (const [key, city] of Object.entries(CITY_COORDINATES)) {
  ALIAS_TO_KEY[normalizeName(key)] = key;
  ALIAS_TO_KEY[normalizeName(city.en)] = key;
  ALIAS_TO_KEY[normalizeName(city.name)] = key;
}
ALIAS_TO_KEY[normalizeName('Abu Dhabi')] = 'abudhabi';
ALIAS_TO_KEY[normalizeName('أبو ظبي')] = 'abudhabi';
ALIAS_TO_KEY[normalizeName('Kuala Lumpur')] = 'kualalumpur';
ALIAS_TO_KEY[normalizeName('Makkah')] = 'mecca';
ALIAS_TO_KEY[normalizeName('Makkah al Mukarramah')] = 'mecca';
ALIAS_TO_KEY[normalizeName('Madinah')] = 'medina';
ALIAS_TO_KEY[normalizeName('Al Madinah')] = 'medina';
ALIAS_TO_KEY[normalizeName('المدينة')] = 'medina';
ALIAS_TO_KEY[normalizeName('المدينه')] = 'medina';
ALIAS_TO_KEY[normalizeName('دبى')] = 'dubai';
ALIAS_TO_KEY[normalizeName('دبـي')] = 'dubai';
ALIAS_TO_KEY[normalizeName('DXB')] = 'dubai';
ALIAS_TO_KEY[normalizeName('Dubai City')] = 'dubai';
ALIAS_TO_KEY[normalizeName('Konstantiniyye')] = 'istanbul';
ALIAS_TO_KEY[normalizeName('عموم تركيا')] = 'allturkey';
ALIAS_TO_KEY[normalizeName('All Turkey')] = 'allturkey';
ALIAS_TO_KEY[normalizeName('Cappadocia')] = 'nevsehir';
ALIAS_TO_KEY[normalizeName('Kapadokya')] = 'nevsehir';
ALIAS_TO_KEY[normalizeName('كبادوكيا')] = 'nevsehir';
ALIAS_TO_KEY[normalizeName('Goreme')] = 'nevsehir';
ALIAS_TO_KEY[normalizeName('Göreme')] = 'nevsehir';
ALIAS_TO_KEY[normalizeName('غوريم')] = 'nevsehir';
ALIAS_TO_KEY[normalizeName('Urgup')] = 'nevsehir';
ALIAS_TO_KEY[normalizeName('طرابزون')] = 'trabzon';
ALIAS_TO_KEY[normalizeName('Konak')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Bornova')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Karsiyaka')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Karşıyaka')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Alsancak')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Buca')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Cigli')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Bayrakli')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Gaziemir')] = 'izmir';
ALIAS_TO_KEY[normalizeName('Kepez')] = 'antalya';
ALIAS_TO_KEY[normalizeName('Muratpasa')] = 'antalya';
ALIAS_TO_KEY[normalizeName('Muratpaşa')] = 'antalya';
ALIAS_TO_KEY[normalizeName('Konyaalti')] = 'antalya';
ALIAS_TO_KEY[normalizeName('Konyaaltı')] = 'antalya';
ALIAS_TO_KEY[normalizeName('Lara')] = 'antalya';
ALIAS_TO_KEY[normalizeName('Kaleici')] = 'antalya';
ALIAS_TO_KEY[normalizeName('Ortahisar')] = 'trabzon';
ALIAS_TO_KEY[normalizeName('Akcaabat')] = 'trabzon';
ALIAS_TO_KEY[normalizeName('Yomra')] = 'trabzon';
ALIAS_TO_KEY[normalizeName('Kizilay')] = 'ankara';
ALIAS_TO_KEY[normalizeName('Cankaya')] = 'ankara';
ALIAS_TO_KEY[normalizeName('Çankaya')] = 'ankara';
ALIAS_TO_KEY[normalizeName('Kecioren')] = 'ankara';
ALIAS_TO_KEY[normalizeName('Yenimahalle')] = 'ankara';
ALIAS_TO_KEY[normalizeName('Osmangazi')] = 'bursa';
ALIAS_TO_KEY[normalizeName('Nilufer')] = 'bursa';
ALIAS_TO_KEY[normalizeName('Nilüfer')] = 'bursa';
ALIAS_TO_KEY[normalizeName('Yildirim')] = 'bursa';
ALIAS_TO_KEY[normalizeName('Mudanya')] = 'bursa';

export const DISTRICT_COORDINATES: Record<string, DistrictCoordinate[]> = {
  Istanbul_TR: [
    { name: 'تقسيم', en: 'Taksim', query: 'Taksim, Istanbul, Turkey', lat: 41.0369, lng: 28.985 },
    { name: 'السلطان أحمد', en: 'Sultanahmet', query: 'Sultanahmet, Istanbul, Turkey', lat: 41.0086, lng: 28.9802 },
    { name: 'فاتح', en: 'Fatih', query: 'Fatih, Istanbul, Turkey', lat: 41.0167, lng: 28.95 },
    { name: 'بشيكتاش', en: 'Besiktas', query: 'Besiktas, Istanbul, Turkey', lat: 41.0422, lng: 29.0087 },
    { name: 'نيشانتاشي', en: 'Nisantasi', query: 'Nisantasi, Istanbul, Turkey', lat: 41.0533, lng: 28.9911 },
    { name: 'كاديكوي', en: 'Kadikoy', query: 'Kadikoy, Istanbul, Turkey', lat: 40.9881, lng: 29.025 },
    { name: 'شيشلي', en: 'Sisli', query: 'Sisli, Istanbul, Turkey', lat: 41.0602, lng: 28.987 },
    { name: 'أمينونو', en: 'Eminonu', query: 'Eminonu, Istanbul, Turkey', lat: 41.0167, lng: 28.9744 },
    { name: 'لاليلي', en: 'Laleli', query: 'Laleli, Istanbul, Turkey', lat: 41.0104, lng: 28.9568 },
    { name: 'أكساراي', en: 'Aksaray', query: 'Aksaray, Istanbul, Turkey', lat: 41.0108, lng: 28.9474 },
    { name: 'بيوغلو', en: 'Beyoglu', query: 'Beyoglu, Istanbul, Turkey', lat: 41.0358, lng: 28.9779 },
    { name: 'ليفنت', en: 'Levent', query: 'Levent, Istanbul, Turkey', lat: 41.0805, lng: 29.0138 },
    { name: 'ماسلاك', en: 'Maslak', query: 'Maslak, Istanbul, Turkey', lat: 41.108, lng: 29.0238 },
    { name: 'استقلال', en: 'Istiklal', query: 'Istiklal Caddesi, Istanbul, Turkey', lat: 41.0339, lng: 28.9775 },
    { name: 'شارع بغداد', en: 'Bagdat Caddesi', query: 'Bagdat Caddesi, Kadikoy, Istanbul, Turkey', lat: 40.9662, lng: 29.0628 },
    { name: 'أتاشهير', en: 'Atasehir', query: 'Atasehir, Istanbul, Turkey', lat: 40.9833, lng: 29.1167 },
    { name: 'باكيركوي', en: 'Bakirkoy', query: 'Bakirkoy, Istanbul, Turkey', lat: 40.9833, lng: 28.85 },
  ],
  Ankara_TR: [
    { name: 'قيزيل أي', en: 'Kizilay', query: 'Kizilay, Ankara, Turkey', lat: 39.9208, lng: 32.8541 },
    { name: 'تشانكايا', en: 'Cankaya', query: 'Cankaya, Ankara, Turkey', lat: 39.9248, lng: 32.8853 },
    { name: 'أولوس', en: 'Ulus', query: 'Ulus, Ankara, Turkey', lat: 39.9415, lng: 32.8547 },
    { name: 'بهتشلي إيفلر', en: 'Bahcelievler', query: 'Bahcelievler, Ankara, Turkey', lat: 39.928, lng: 32.822 },
  ],
  Antalya_TR: [
    { name: 'كاليتشي', en: 'Kaleici', query: 'Kaleici, Antalya, Turkey', lat: 36.885, lng: 30.7046 },
    { name: 'لارا', en: 'Lara', query: 'Lara, Antalya, Turkey', lat: 36.855, lng: 30.736 },
    { name: 'كوني آلتي', en: 'Konyaalti', query: 'Konyaalti, Antalya, Turkey', lat: 36.884, lng: 30.65 },
    { name: 'كبز', en: 'Kepez', query: 'Kepez, Antalya, Turkey', lat: 36.9204, lng: 30.7058 },
    { name: 'سايد', en: 'Side', query: 'Side, Antalya, Turkey', lat: 36.7667, lng: 31.3889 },
  ],
  Trabzon_TR: [
    { name: 'أورتا حصار', en: 'Ortahisar', query: 'Ortahisar, Trabzon, Turkey', lat: 41.005, lng: 39.7269 },
    { name: 'أوزونغول', en: 'Uzungol', query: 'Uzungol, Trabzon, Turkey', lat: 40.6186, lng: 40.2947 },
    { name: 'أكشابات', en: 'Akcaabat', query: 'Akcaabat, Trabzon, Turkey', lat: 41.021, lng: 39.571 },
  ],
  Izmir_TR: [
    { name: 'ألسانجاك', en: 'Alsancak', query: 'Alsancak, Izmir, Turkey', lat: 38.439, lng: 27.144 },
    { name: 'كوناك', en: 'Konak', query: 'Konak, Izmir, Turkey', lat: 38.4192, lng: 27.1287 },
    { name: 'كارشياكا', en: 'Karsiyaka', query: 'Karsiyaka, Izmir, Turkey', lat: 38.455, lng: 27.11 },
    { name: 'بورنوفا', en: 'Bornova', query: 'Bornova, Izmir, Turkey', lat: 38.462, lng: 27.216 },
  ],
  Bursa_TR: [
    { name: 'نيلوفر', en: 'Nilufer', query: 'Nilufer, Bursa, Turkey', lat: 40.213, lng: 28.978 },
    { name: 'عثمان غازي', en: 'Osmangazi', query: 'Osmangazi, Bursa, Turkey', lat: 40.195, lng: 29.06 },
    { name: 'يلدرم', en: 'Yildirim', query: 'Yildirim, Bursa, Turkey', lat: 40.184, lng: 29.1 },
  ],
  Bodrum_TR: [
    { name: 'مركز بودروم', en: 'Bodrum Center', query: 'Bodrum Marina, Turkey', lat: 37.0344, lng: 27.4305 },
    { name: 'بيتز', en: 'Bitez', query: 'Bitez, Bodrum, Turkey', lat: 37.038, lng: 27.4 },
    { name: 'تورغوترئيس', en: 'Turgutreis', query: 'Turgutreis, Bodrum, Turkey', lat: 37.007, lng: 27.26 },
  ],
  Nevsehir_TR: [
    { name: 'غوريم', en: 'Goreme', query: 'Goreme, Cappadocia, Turkey', lat: 38.6431, lng: 34.8289 },
    { name: 'أورغوب', en: 'Urgup', query: 'Urgup, Cappadocia, Turkey', lat: 38.6314, lng: 34.912 },
    { name: 'أفانوس', en: 'Avanos', query: 'Avanos, Cappadocia, Turkey', lat: 38.715, lng: 34.8467 },
  ],
  Gaziantep_TR: [
    { name: 'شاهين باي', en: 'Sahinbey', query: 'Sahinbey, Gaziantep, Turkey', lat: 37.059, lng: 37.378 },
    { name: 'شهيت كامل', en: 'Sehitkamil', query: 'Sehitkamil, Gaziantep, Turkey', lat: 37.078, lng: 37.382 },
  ],
  Dubai_AE: [
    { name: 'وسط دبي', en: 'Downtown Dubai', query: 'Downtown Dubai, UAE', lat: 25.1972, lng: 55.2744 },
    { name: 'دبي مارينا', en: 'Dubai Marina', query: 'Dubai Marina, UAE', lat: 25.0805, lng: 55.1403 },
    { name: 'ديرة', en: 'Deira', query: 'Deira, Dubai, UAE', lat: 25.272, lng: 55.331 },
    { name: 'جميرا', en: 'Jumeirah', query: 'Jumeirah, Dubai, UAE', lat: 25.2048, lng: 55.248 },
    { name: 'البرشاء', en: 'Al Barsha', query: 'Al Barsha, Dubai, UAE', lat: 25.1112, lng: 55.198 },
    { name: 'الخليج التجاري', en: 'Business Bay', query: 'Business Bay, Dubai, UAE', lat: 25.185, lng: 55.265 },
  ],
  'Abu Dhabi_AE': [
    { name: 'كورنيش أبوظبي', en: 'Corniche', query: 'Corniche, Abu Dhabi, UAE', lat: 24.4764, lng: 54.321 },
    { name: 'جزيرة ياس', en: 'Yas Island', query: 'Yas Island, Abu Dhabi, UAE', lat: 24.495, lng: 54.605 },
    { name: 'الخالدية', en: 'Al Khalidiyah', query: 'Al Khalidiyah, Abu Dhabi, UAE', lat: 24.466, lng: 54.353 },
  ],
  Riyadh_SA: [
    { name: 'العليا', en: 'Al Olaya', query: 'Al Olaya, Riyadh, Saudi Arabia', lat: 24.711, lng: 46.675 },
    { name: 'العزيزية', en: 'Al Aziziyah', query: 'Al Aziziyah, Riyadh, Saudi Arabia', lat: 24.585, lng: 46.772 },
    { name: 'الملز', en: 'Al Malaz', query: 'Al Malaz, Riyadh, Saudi Arabia', lat: 24.661, lng: 46.735 },
    { name: 'النخيل', en: 'Al Nakheel', query: 'Al Nakheel, Riyadh, Saudi Arabia', lat: 24.74, lng: 46.65 },
  ],
  Jeddah_SA: [
    { name: 'الحمرا', en: 'Al Hamra', query: 'Al Hamra, Jeddah, Saudi Arabia', lat: 21.543, lng: 39.148 },
    { name: 'الروضة', en: 'Al Rawdah', query: 'Al Rawdah, Jeddah, Saudi Arabia', lat: 21.562, lng: 39.16 },
    { name: 'الكورنيش', en: 'Corniche', query: 'Jeddah Corniche, Saudi Arabia', lat: 21.612, lng: 39.106 },
  ],
  Cairo_EG: [
    { name: 'وسط القاهرة', en: 'Downtown Cairo', query: 'Downtown Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
    { name: 'الزمالك', en: 'Zamalek', query: 'Zamalek, Cairo, Egypt', lat: 30.0626, lng: 31.2196 },
    { name: 'المعادي', en: 'Maadi', query: 'Maadi, Cairo, Egypt', lat: 29.9602, lng: 31.2569 },
    { name: 'مدينة نصر', en: 'Nasr City', query: 'Nasr City, Cairo, Egypt', lat: 30.0566, lng: 31.33 },
  ],
  Doha_QA: [
    { name: 'سوق واقف', en: 'Souq Waqif', query: 'Souq Waqif, Doha, Qatar', lat: 25.2866, lng: 51.533 },
    { name: 'الخليج الغربي', en: 'West Bay', query: 'West Bay, Doha, Qatar', lat: 25.327, lng: 51.531 },
    { name: 'اللؤلؤة', en: 'The Pearl', query: 'The Pearl, Doha, Qatar', lat: 25.368, lng: 51.551 },
  ],
  Bangkok_TH: [
    { name: 'سوكومفيت', en: 'Sukhumvit', query: 'Sukhumvit, Bangkok, Thailand', lat: 13.738, lng: 100.561 },
    { name: 'سيام', en: 'Siam', query: 'Siam, Bangkok, Thailand', lat: 13.746, lng: 100.534 },
    { name: 'سيلوم', en: 'Silom', query: 'Silom, Bangkok, Thailand', lat: 13.726, lng: 100.528 },
    { name: 'خاو سان', en: 'Khao San', query: 'Khao San Road, Bangkok, Thailand', lat: 13.759, lng: 100.497 },
  ],
  Tokyo_JP: [
    { name: 'شينجوكو', en: 'Shinjuku', query: 'Shinjuku, Tokyo, Japan', lat: 35.6938, lng: 139.7034 },
    { name: 'شيبا', en: 'Shibuya', query: 'Shibuya, Tokyo, Japan', lat: 35.6595, lng: 139.7004 },
    { name: 'أساكوسا', en: 'Asakusa', query: 'Asakusa, Tokyo, Japan', lat: 35.7148, lng: 139.7967 },
    { name: 'جينزا', en: 'Ginza', query: 'Ginza, Tokyo, Japan', lat: 35.6717, lng: 139.7649 },
    { name: 'أكيهابارا', en: 'Akihabara', query: 'Akihabara, Tokyo, Japan', lat: 35.6984, lng: 139.7731 },
  ],
  Baghdad_IQ: [
    { name: 'الكرادة', en: 'Karrada', query: 'Karrada, Baghdad, Iraq', lat: 33.302, lng: 44.423 },
    { name: 'المنصور', en: 'Mansour', query: 'Mansour, Baghdad, Iraq', lat: 33.315, lng: 44.343 },
    { name: 'الجادرية', en: 'Jadriya', query: 'Jadriya, Baghdad, Iraq', lat: 33.278, lng: 44.377 },
    { name: 'زيونة', en: 'Zayouna', query: 'Zayouna, Baghdad, Iraq', lat: 33.325, lng: 44.455 },
  ],
  Karbala_IQ: [
    { name: 'باب بغداد', en: 'Bab Baghdad', query: 'Bab Baghdad, Karbala, Iraq', lat: 32.6169, lng: 44.032 },
    { name: 'حي الحسين', en: 'Al Hussain', query: 'Al Hussain, Karbala, Iraq', lat: 32.616, lng: 44.0249 },
    { name: 'المخيم', en: 'Al Mukhayyam', query: 'Al Mukhayyam, Karbala, Iraq', lat: 32.612, lng: 44.028 },
  ],
  Amman_JO: [
    { name: 'وسط عمّان', en: 'Downtown Amman', query: 'Downtown Amman, Jordan', lat: 31.951, lng: 35.934 },
    { name: 'عبدون', en: 'Abdoun', query: 'Abdoun, Amman, Jordan', lat: 31.953, lng: 35.893 },
    { name: 'الجبيهة', en: 'Jubeiha', query: 'Jubeiha, Amman, Jordan', lat: 32.02, lng: 35.87 },
  ],
  Berlin_DE: [
    { name: 'ميتي', en: 'Mitte', query: 'Mitte, Berlin, Germany', lat: 52.52, lng: 13.405 },
    { name: 'كروزبرغ', en: 'Kreuzberg', query: 'Kreuzberg, Berlin, Germany', lat: 52.499, lng: 13.403 },
    { name: 'شارلوتنبرغ', en: 'Charlottenburg', query: 'Charlottenburg, Berlin, Germany', lat: 52.516, lng: 13.304 },
  ],
  Tehran_IR: [
    { name: 'تجريش', en: 'Tajrish', query: 'Tajrish, Tehran, Iran', lat: 35.804, lng: 51.433 },
    { name: 'ولي عصر', en: 'Valiasr', query: 'Valiasr, Tehran, Iran', lat: 35.721, lng: 51.411 },
  ],
  Mashhad_IR: [
    { name: 'حرم الإمام الرضا', en: 'Imam Reza Shrine', query: 'Imam Reza Shrine, Mashhad, Iran', lat: 36.287, lng: 59.615 },
    { name: 'ساجدية', en: 'Sajjadiyeh', query: 'Sajjadiyeh, Mashhad, Iran', lat: 36.32, lng: 59.55 },
  ],
  Muscat_OM: [
    { name: 'مطرح', en: 'Muttrah', query: 'Muttrah, Muscat, Oman', lat: 23.616, lng: 58.566 },
    { name: 'القرم', en: 'Al Khuwair', query: 'Al Khuwair, Muscat, Oman', lat: 23.588, lng: 58.433 },
  ],
  'Kuala Lumpur_MY': [
    { name: 'بوكيت بينتانغ', en: 'Bukit Bintang', query: 'Bukit Bintang, Kuala Lumpur, Malaysia', lat: 3.1466, lng: 101.711 },
    { name: 'تشيناتاون', en: 'Chinatown', query: 'Petaling Street, Kuala Lumpur, Malaysia', lat: 3.1436, lng: 101.6978 },
  ],
};

export const FALLBACK_MAP_CENTER: AppLocation = {
  lat: DEFAULT_MAP_CENTER.lat,
  lng: DEFAULT_MAP_CENTER.lng,
  zoom: DEFAULT_MAP_CENTER.zoom,
  label: DEFAULT_MAP_CENTER.label,
  city: DEFAULT_MAP_CENTER.label,
  country: 'تركيا',
};

export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
}

export function isValidCoord(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function lookupCity(name?: string | null): CityCoordinate | null {
  if (!name) return null;
  const raw = name.split(/[،,]/)[0]?.trim() ?? name;
  const n = normalizeName(raw);
  if (!n) return null;

  if (n === 'دبي' || n === 'دبى' || n === 'dubai' || n === 'dxb' || n === 'dubaicity') {
    return CITY_COORDINATES.dubai;
  }
  if (n === 'المدينه' || n === 'المدينهالمنوره' || n === 'medina' || n === 'madinah' || n === 'almadinah') {
    return CITY_COORDINATES.medina;
  }

  const key = ALIAS_TO_KEY[n];
  if (key) return CITY_COORDINATES[key];

  const matches = Object.values(CITY_COORDINATES).filter(
    (city) => normalizeName(city.name) === n || normalizeName(city.en) === n,
  );
  return matches.length === 1 ? matches[0] : null;
}

export function bboxAround(lat: number, lng: number, radiusKm = 18): {
  south: number;
  west: number;
  north: number;
  east: number;
} {
  const dLat = radiusKm / 110.574;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusKm / (111.32 * Math.max(cos, 0.2));
  return {
    south: lat - dLat,
    north: lat + dLat,
    west: lng - dLng,
    east: lng + dLng,
  };
}

const MAX_CITY_SPAN_DEG = 0.62;
const MIN_CITY_SPAN_DEG = 0.12;

export function fitCityBbox(
  bbox: { south: number; west: number; north: number; east: number },
  lat?: number | null,
  lng?: number | null,
  radiusKm = 20,
): { south: number; west: number; north: number; east: number } {
  const latSpan = bbox.north - bbox.south;
  const lngSpan = Math.abs(bbox.east - bbox.west);
  const cx = isValidCoord(lat, lng) ? (lat as number) : (bbox.south + bbox.north) / 2;
  const cy = isValidCoord(lat, lng) ? (lng as number) : (bbox.west + bbox.east) / 2;
  if (latSpan > MAX_CITY_SPAN_DEG || lngSpan > MAX_CITY_SPAN_DEG) return bboxAround(cx, cy, radiusKm);
  if (latSpan < MIN_CITY_SPAN_DEG || lngSpan < MIN_CITY_SPAN_DEG) return bboxAround(cx, cy, 14);
  return bbox;
}

export function getCityBoundingBox(name?: string | null, radiusKm = 18) {
  const city = lookupCity(name);
  if (!city) return null;
  if (city.en === 'All Turkey') {
    return { south: 35.82, west: 25.66, north: 42.32, east: 44.82 };
  }
  const landKey = cityIntegrityKey(city.en, city.countryEn) || cityIntegrityKey(city.name);
  const land = landKey ? cityLandBbox(landKey) : null;
  if (land) return land;
  const radius = city.en === 'Dubai' || city.en === 'Istanbul' ? 22 : radiusKm;
  return bboxAround(city.lat, city.lng, radius);
}

export function locationIdentityEqual(a?: AppLocation | null, b?: AppLocation | null): boolean {
  if (!a || !b) return false;
  if (a.poiId || b.poiId) return a.poiId === b.poiId;
  return a.city === b.city && a.country === b.country && a.district === b.district;
}

export function locationsEqual(a?: AppLocation | null, b?: AppLocation | null): boolean {
  if (!a || !b) return false;
  return (
    locationIdentityEqual(a, b) &&
    a.categoryKey === b.categoryKey &&
    Math.abs(a.lat - b.lat) < 0.0004 &&
    Math.abs(a.lng - b.lng) < 0.0004 &&
    a.zoom === b.zoom
  );
}

const TURKEY_COUNTRY_KEYS = new Set(['turkey', 'turkiye', 'tr', 'تركيا']);

export function getMajorCitiesForCountry(countryName?: string | null): CityCoordinate[] {
  if (!countryName) return Object.values(CITY_COORDINATES);
  const q = normalizeName(countryName);
  if (TURKEY_COUNTRY_KEYS.has(q)) {
    return Object.values(CITY_COORDINATES).filter((city) => city.countryCode === 'TR' && city.en !== 'All Turkey');
  }
  return Object.values(CITY_COORDINATES).filter(
    (city) =>
      normalizeName(city.country) === q ||
      normalizeName(city.countryEn) === q ||
      normalizeName(city.countryCode) === q,
  );
}

export function listCountriesFromCatalog(): Array<{ name: string; en: string; code: string }> {
  const seen = new Map<string, { name: string; en: string; code: string }>();
  for (const city of Object.values(CITY_COORDINATES)) {
    if (!seen.has(city.countryCode)) {
      seen.set(city.countryCode, { name: city.country, en: city.countryEn, code: city.countryCode });
    }
  }
  return [...seen.values()];
}

export function getDistrictsForCity(cityName?: string | null, countryCode?: string | null): DistrictCoordinate[] {
  const city = lookupCity(cityName);
  if (!city) return [];
  const code = countryCode || city.countryCode;
  return DISTRICT_COORDINATES[`${city.en}_${code}`] ?? [];
}

const DISTRICT_EXTRA_LABELS: Record<string, string[]> = {
  taksim: ['تقسيم', 'ميدان تقسيم', 'taksim square', 'ميدان تقسيم'],
  sultanahmet: ['السلطان احمد', 'sultan ahmet'],
  kadikoy: ['كاديكوي', 'kadıköy', 'kadiköy'],
  nisantasi: ['نيشانتاشي', 'nişantaşı'],
  konyaalti: ['كونالتي', 'كونيالتي', 'konyaaltı', 'konyalti', 'kunalti'],
  uzungol: ['اوزنجول', 'أوزنجول', 'uzungöl', 'uzun gol', 'uzungöl'],
  kaleici: ['كاليتي', 'البلده القديمه', 'old town'],
  alsancak: ['السانجاك', 'alsancak'],
  kizilay: ['قيزيل اي', 'kızılay'],
  kepez: ['كبز', 'kepez'],
  istiklal: ['استقلال', 'شارع الاستقلال', 'istiklal caddesi', 'istiklal'],
  bagdatcaddesi: ['شارع بغداد', 'bagdat', 'bağdat caddesi'],
};

function districtSearchLabels(district: DistrictCoordinate): string[] {
  const extra = DISTRICT_EXTRA_LABELS[normalizeName(district.en)] || [];
  return [district.name, district.en, district.query, ...extra];
}

export function lookupDistrict(
  districtName: string,
  cityName?: string | null,
  countryName?: string | null,
): { district: DistrictCoordinate; city: CityCoordinate } | null {
  const q = normalizeName(districtName);
  if (!q) return null;
  const cities = cityName
    ? [lookupCity(cityName)].filter((c): c is CityCoordinate => Boolean(c))
    : countryName
      ? getMajorCitiesForCountry(countryName)
      : Object.values(CITY_COORDINATES);

  let fuzzy: { district: DistrictCoordinate; city: CityCoordinate; len: number } | null = null;
  for (const city of cities) {
    for (const district of getDistrictsForCity(city.en, city.countryCode)) {
      for (const label of districtSearchLabels(district)) {
        const token = normalizeName(label);
        if (!token) continue;
        if (token === q) return { district, city };
        if (token.length >= 4 && (q.includes(token) || token.includes(q))) {
          if (!fuzzy || token.length > fuzzy.len) fuzzy = { district, city, len: token.length };
        }
      }
    }
  }
  return fuzzy ? { district: fuzzy.district, city: fuzzy.city } : null;
}

export interface LocaleHit {
  city: CityCoordinate;
  district: DistrictCoordinate | null;
  lat: number;
  lng: number;
  zoom: number;
  label: string;
  districtName: string | null;
}

export function detectLocaleInText(text: string, hintCity?: string | null): LocaleHit | null {
  const n = normalizeName(text);
  if (!n) return null;

  const turkeyCities = Object.values(CITY_COORDINATES).filter(
    (city) => city.countryEn === 'Turkey' && city.en !== 'All Turkey',
  );

  let bestDistrict: { district: DistrictCoordinate; city: CityCoordinate; len: number } | null = null;
  const hinted = lookupCity(hintCity);
  const districtCities = hinted?.countryCode === 'TR' ? [hinted, ...turkeyCities] : turkeyCities;
  const seen = new Set<string>();
  for (const city of districtCities) {
    if (seen.has(city.en)) continue;
    seen.add(city.en);
    for (const district of getDistrictsForCity(city.en, city.countryCode)) {
      for (const label of districtSearchLabels(district)) {
        const token = normalizeName(label);
        if (token.length < 4 || !n.includes(token)) continue;
        if (!bestDistrict || token.length > bestDistrict.len) {
          bestDistrict = { district, city, len: token.length };
        }
      }
    }
  }

  let bestCity: { city: CityCoordinate; len: number } | null = null;
  for (const city of turkeyCities) {
    for (const label of [city.name, city.en]) {
      const token = normalizeName(label);
      if (token.length < 4 || !n.includes(token)) continue;
      if (!bestCity || token.length > bestCity.len) bestCity = { city, len: token.length };
    }
  }

  if (bestDistrict) {
    const city = bestDistrict.city;
    return {
      city,
      district: bestDistrict.district,
      lat: bestDistrict.district.lat,
      lng: bestDistrict.district.lng,
      zoom: DISTRICT_ZOOM,
      label: `${bestDistrict.district.name}، ${city.name}`,
      districtName: bestDistrict.district.name,
    };
  }

  if (bestCity) {
    return {
      city: bestCity.city,
      district: null,
      lat: bestCity.city.lat,
      lng: bestCity.city.lng,
      zoom: CITY_ZOOM,
      label: bestCity.city.name,
      districtName: null,
    };
  }

  if (hinted?.countryEn === 'Turkey' && hinted.en !== 'All Turkey') {
    return {
      city: hinted,
      district: null,
      lat: hinted.lat,
      lng: hinted.lng,
      zoom: hinted.zoom,
      label: hinted.name,
      districtName: null,
    };
  }
  return null;
}

export function firstMajorCityForCountry(countryName?: string | null): CityCoordinate | null {
  const cities = getMajorCitiesForCountry(countryName);
  if (!cities.length) return null;
  if (TURKEY_COUNTRY_KEYS.has(normalizeName(countryName || ''))) {
    return cities.find((c) => c.en === 'Istanbul') ?? cities[0];
  }
  return cities[0];
}

/** Nearest curated metro city within maxKm, used when Nominatim returns a district or street as "city". */
export function nearestMajorCity(
  lat: number,
  lng: number,
  countryName?: string | null,
  maxKm = 95,
): CityCoordinate | null {
  const pool = (countryName ? getMajorCitiesForCountry(countryName) : Object.values(CITY_COORDINATES))
    .filter((city) => city.en !== 'All Turkey');
  const cities = pool.length ? pool : Object.values(CITY_COORDINATES);
  let best: CityCoordinate | null = null;
  let bestKm = Infinity;
  for (const city of cities) {
    const km = haversineKm(lat, lng, city.lat, city.lng);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  if (!best || bestKm > maxKm) return null;
  return best;
}

/**
 * Resolve the metro city for map catalogs. District/street/GPS labels must not
 * drop the city-wide hotel dataset.
 */
export function resolveCatalogCity(options: {
  city?: string | null;
  country?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
}): CityCoordinate | null {
  const named = lookupCity(options.city) || lookupCity(options.district);
  if (named) return named;

  const placeName = options.district || options.city;
  if (placeName) {
    const knownCity = lookupCity(options.city);
    const hit = lookupDistrict(placeName, knownCity?.name, options.country);
    if (hit) return hit.city;
  }

  if (isValidCoord(options.lat, options.lng)) {
    const near = nearestMajorCity(options.lat as number, options.lng as number, options.country);
    if (near) return near;
  }

  return firstMajorCityForCountry(options.country);
}

export function catalogBoundsForCity(
  city: CityCoordinate | null,
  origin?: { lat: number; lng: number } | null,
): { south: number; west: number; north: number; east: number } {
  if (city?.en === 'All Turkey') {
    return { south: 35.82, west: 25.66, north: 42.32, east: 44.82 };
  }
  if (city) {
    return getCityBoundingBox(city.name, 22) ?? bboxAround(city.lat, city.lng, 22);
  }
  if (origin && isValidCoord(origin.lat, origin.lng)) {
    return bboxAround(origin.lat, origin.lng, 18);
  }
  return bboxAround(FALLBACK_MAP_CENTER.lat, FALLBACK_MAP_CENTER.lng, 22);
}

export function safeMapCenter(lat?: number | null, lng?: number | null, zoom?: number): { lat: number; lng: number; zoom: number } {
  if (isValidCoord(lat, lng)) {
    return { lat: lat as number, lng: lng as number, zoom: zoom ?? CITY_ZOOM };
  }
  return { lat: FALLBACK_MAP_CENTER.lat, lng: FALLBACK_MAP_CENTER.lng, zoom: zoom ?? FALLBACK_MAP_CENTER.zoom };
}

export function resolveMapFocus(input: {
  country?: string | null;
  city?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
  label?: string | null;
  categoryKey?: string;
  bbox?: { south: number; west: number; north: number; east: number } | null;
}): AppLocation {
  const known = lookupCity(input.city) || lookupCity(input.label) || lookupCity(input.country);
  const fittedBbox = input.bbox
    ? fitCityBbox(input.bbox, input.lat, input.lng)
    : undefined;

  const districtHit = input.district && !isValidCoord(input.lat, input.lng)
    ? lookupDistrict(input.district, known?.name ?? input.city, known?.country ?? input.country)
    : null;
  if (districtHit && !isValidCoord(input.lat, input.lng)) {
    return {
      lat: districtHit.district.lat,
      lng: districtHit.district.lng,
      zoom: DISTRICT_ZOOM,
      label: `${districtHit.district.name}، ${districtHit.city.name}`,
      country: districtHit.city.country,
      city: districtHit.city.name,
      district: districtHit.district.name,
      categoryKey: input.categoryKey,
      bbox: bboxAround(districtHit.district.lat, districtHit.district.lng, 6),
    };
  }

  if (isValidCoord(input.lat, input.lng) && (input.city || input.district || input.label || input.country)) {
    const lat = input.lat as number;
    const lng = input.lng as number;
    const cityName = known?.name ?? input.city ?? undefined;
    return {
      lat,
      lng,
      zoom: input.district ? DISTRICT_ZOOM : (known?.zoom ?? CITY_ZOOM),
      label: input.label || [input.district, cityName || input.city].filter(Boolean).join('، ') || known?.name || FALLBACK_MAP_CENTER.label,
      country: input.country ?? known?.country,
      city: cityName,
      district: input.district ?? undefined,
      categoryKey: input.categoryKey,
      bbox: fittedBbox ?? bboxAround(lat, lng, cityName ? 18 : 16),
    };
  }

  if (known) {
    return {
      lat: known.lat,
      lng: known.lng,
      zoom: known.zoom,
      label: known.name,
      country: known.country,
      city: known.name,
      categoryKey: input.categoryKey,
      bbox: fittedBbox ?? getCityBoundingBox(known.name) ?? undefined,
    };
  }

  const fallbackCity = firstMajorCityForCountry(input.country);
  if (fallbackCity && !input.city) {
    return {
      lat: fallbackCity.lat,
      lng: fallbackCity.lng,
      zoom: CITY_ZOOM,
      label: fallbackCity.name,
      country: fallbackCity.country,
      city: fallbackCity.name,
      categoryKey: input.categoryKey,
      bbox: getCityBoundingBox(fallbackCity.name) ?? undefined,
    };
  }

  if (isValidCoord(input.lat, input.lng)) {
    const safe = safeMapCenter(input.lat, input.lng, CITY_ZOOM);
    return {
      ...safe,
      label: input.label || input.city || input.country || FALLBACK_MAP_CENTER.label,
      country: input.country ?? undefined,
      city: input.city ?? undefined,
      district: input.district ?? undefined,
      categoryKey: input.categoryKey,
      bbox: bboxAround(safe.lat, safe.lng, 16),
    };
  }

  return {
    ...FALLBACK_MAP_CENTER,
    categoryKey: input.categoryKey,
    bbox: getCityBoundingBox(FALLBACK_MAP_CENTER.city) ?? undefined,
  };
}

export function listingMatchesLocation(
  item: { city?: string | null; country_name?: string | null; address?: string | null; name?: string | null },
  location?: Pick<AppLocation, 'city' | 'country' | 'district'> | null,
): boolean {
  if (!location?.city && !location?.district) return true;
  const hay = [item.city, item.country_name, item.address, item.name].filter(Boolean).join(' ');
  const hayNorm = normalizeName(hay);
  if (!hayNorm) return true;
  if (location.district && hayNorm.includes(normalizeName(location.district))) return true;
  if (location.city) {
    const city = lookupCity(location.city);
    if (hayNorm.includes(normalizeName(location.city))) return true;
    if (city && hayNorm.includes(normalizeName(city.en))) return true;
  }
  if (location.country && hayNorm.includes(normalizeName(location.country))) return true;
  return false;
}
