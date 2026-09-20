import type { DirectoryListing } from '@/types';
import { CATEGORIES } from '@/types';
import { lookupCity, resolveCatalogCity } from '@/lib/cityCoordinates';
import { ISTANBUL_HOTEL_SEEDS } from '@/lib/istanbulHotels';
import { ANKARA_HOTEL_SEEDS } from '@/lib/ankaraHotels';
import { ISTANBUL_DINING_SEEDS } from '@/lib/istanbulDining';
import { ANKARA_DINING_SEEDS } from '@/lib/ankaraDining';
import { placeGallery, placeKindLabel, resolvePlaceKind, type PlaceKind } from '@/lib/placeImagery';
import { isAuthenticVenueName, isGenericSeedName } from '@/lib/placeAuthenticity';
import { pinListing } from '@/lib/placePrecision';
import { normalizeTurkeyEmergencyPhone } from '@/lib/turkeyEmergency';
import { ISTANBUL_CIVIC_SEEDS, type CivicSeed } from '@/lib/istanbulCivicSeeds';
import { TURKEY_PROVINCE_SEEDS } from '@/lib/turkeyProvinceSeeds';
import { turkeyAirportListings, turkeyAirportPins } from '@/lib/turkeyAirports';
import { isAllTurkeyCity } from '@/lib/turkeyScope';
import { TURKEY_FUEL_STATIONS } from '@/lib/turkeyFuelStations';
import { TURKEY_HUB_SEEDS, premierProvinceSeeds } from '@/lib/turkeyHubCatalog';
import { registerCuratedTurkeyPins } from '@/lib/turkeyCuratedGuard';

export interface VerifiedPlace {
  category_key: string;
  name: string;
  name_en: string;
  address: string;
  hours: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  slug?: string;
  place_kind?: PlaceKind;
  images?: string[];
  website?: string;
}

function v(
  category_key: string,
  name: string,
  name_en: string,
  address: string,
  lat: number,
  lng: number,
  hours: string,
  phone: string,
  rating: number,
): VerifiedPlace {
  return { category_key, name, name_en, address, lat, lng, hours, phone, rating };
}

function fuelVerified(city: string): VerifiedPlace[] {
  return TURKEY_FUEL_STATIONS.filter((row) => row.city === city).map((row) => ({
    category_key: 'fuel',
    name: row.name,
    name_en: row.name_en,
    address: row.address,
    hours: row.hours,
    phone: row.phone,
    lat: row.lat,
    lng: row.lng,
    rating: row.rating,
    slug: row.slug,
  }));
}

function slugFromEn(nameEn: string): string {
  return nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'place';
}

function fromCivic(rows: CivicSeed[]): VerifiedPlace[] {
  return rows.map((row) => ({
    category_key: row.category_key,
    name: row.name,
    name_en: row.name_en,
    address: row.address,
    hours: row.hours,
    phone: row.phone,
    lat: row.lat,
    lng: row.lng,
    rating: row.rating,
    website: row.website,
    slug: slugFromEn(row.name_en),
  }));
}

function hotelVerified(rows: Array<{
  name: string;
  name_en: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  slug?: string;
  place_kind?: PlaceKind;
  images?: string[];
}>): VerifiedPlace[] {
  return rows.map((hotel) => ({
    category_key: 'hotels',
    name: hotel.name,
    name_en: hotel.name_en,
    address: hotel.address,
    hours: '24/7',
    phone: hotel.phone,
    lat: hotel.lat,
    lng: hotel.lng,
    rating: hotel.rating,
    slug: hotel.slug,
    place_kind: hotel.place_kind,
    images: hotel.images,
  }));
}

function diningVerified(rows: Array<{
  name: string;
  name_en: string;
  address: string;
  hours: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  slug?: string;
  place_kind?: PlaceKind;
  images?: string[];
}>): VerifiedPlace[] {
  return rows.map((venue) => ({
    category_key: 'restaurants',
    name: venue.name,
    name_en: venue.name_en,
    address: venue.address,
    hours: venue.hours,
    phone: venue.phone,
    lat: venue.lat,
    lng: venue.lng,
    rating: venue.rating,
    slug: venue.slug,
    place_kind: venue.place_kind,
    images: venue.images,
  }));
}

const VERIFIED_BY_CITY: Record<string, VerifiedPlace[]> = {
  istanbul: [
    v('hospitals', 'المستشفى الأمريكي', 'American Hospital Istanbul', 'Güzelbahçe Sokak No:20, Nişantaşı, Şişli', 41.04861, 28.99444, '24/7', '+90 212 444 3777', 4.7),
    v('hospitals', 'مستشفى أجيبادم تقسيم', 'Acibadem Taksim Hospital', 'Dolapdere Taksim Caddesi, İnönü, Şişli', 41.04151, 28.98224, '24/7', '+90 212 444 5544', 4.6),
    v('hospitals', 'مستشفى كلية طب إسطنبول — تشابا', 'Istanbul Faculty of Medicine Hospital Capa', 'Turgut Özal Millet Caddesi, Fatih', 41.01355, 28.93220, '24/7', '+90 212 414 2000', 4.5),
    v('hospitals', 'المستشفى الألماني — تقسيم', 'Deutsche Hospital Taksim', 'Sıraselviler Caddesi No:119, Beyoğlu', 41.03420, 28.98510, '24/7', '+90 212 293 2150', 4.5),
    v('hospitals', 'ميموريال شيشلي', 'Memorial Sisli Hospital', 'Piyalepaşa Bulvarı, Okmeydanı, Şişli', 41.06028, 28.98778, '24/7', '+90 212 314 6666', 4.6),
    v('hospitals', 'فلورنس نايتينغيل شيشلي', 'Florence Nightingale Hospital Sisli', 'Abide-i Hürriyet Caddesi, Şişli', 41.05770, 28.98720, '24/7', '+90 212 224 4950', 4.5),
    v('hospitals', 'أجيبادم ماسلاك', 'Acibadem Maslak Hospital', 'Büyükdere Caddesi No:40, Maslak, Sarıyer', 41.10806, 29.02389, '24/7', '+90 212 304 4444', 4.6),
    v('hospitals', 'ليف هاوسبيتال أولوس', 'Liv Hospital Ulus', 'Ulus Ahmet Adnan Saygun Cad. No:8, Beşiktaş', 41.04940, 29.02470, '24/7', '+90 212 999 8089', 4.6),
    v('hospitals', 'مستشفى جامعة كوتش', 'Koc University Hospital', 'Davutpaşa Caddesi No:4, Topkapı, Zeytinburnu', 41.01590, 28.90890, '24/7', '+90 850 250 8250', 4.6),
    v('hospitals', 'مستشفى جراح باشا', 'Cerrahpasa Medical Faculty Hospital', 'Kocamustafapaşa Caddesi, Fatih', 41.00350, 28.94180, '24/7', '+90 212 414 3000', 4.5),
    v('hospitals', 'شيشلي إتفال', 'Sisli Hamidiye Etfal Training Hospital', 'Halaskargazi Caddesi, Şişli', 41.05860, 28.98690, '24/7', '+90 212 373 5000', 4.4),
    v('hospitals', 'باكركوي سادي كونوك', 'Bakirkoy Dr. Sadi Konuk Hospital', 'Zuhuratbaba, Bakırköy', 40.98970, 28.87280, '24/7', '+90 212 414 7100', 4.4),
    v('hospitals', 'ميديپول ميغا', 'Medipol Mega University Hospital', 'TEM Avrupa Otoyolu Göztepe Çıkışı No:1, Bağcılar', 41.06140, 28.80810, '24/7', '+90 444 7044', 4.5),
    v('hospitals', 'أجيبادم ألتونيزاده', 'Acibadem Altunizade Hospital', 'Yurtcan Sokak No:1, Altunizade, Üsküdar', 41.02140, 29.04860, '24/7', '+90 216 649 4444', 4.6),
    v('pharmacies', 'صيدلية تقسيم', 'Taksim Eczanesi', 'Sıraselviler Caddesi No:51, Beyoğlu', 41.03505, 28.98545, '24/7', '+90 212 249 1286', 4.4),
    v('pharmacies', 'صيدلية السلطان أحمد', 'Sultanahmet Eczanesi', 'Alemdar Caddesi No:16, Fatih', 41.00892, 28.97748, '08:00 - 23:00', '+90 212 513 7225', 4.3),
    v('pharmacies', 'صيدلية نيشانتشي', 'Nisantasi Eczanesi', 'Valikonağı Caddesi, Nişantaşı, Şişli', 41.04890, 28.99410, '08:00 - 24:00', '', 4.3),
    v('pharmacies', 'صيدلية كاديكوي', 'Kadikoy Eczanesi', 'Bahariye Caddesi, Kadıköy', 40.99080, 29.02450, '08:00 - 24:00', '', 4.3),
    v('pharmacies', 'صيدلية بشكطاش', 'Besiktas Eczanesi', 'Barbaros Bulvarı, Beşiktaş', 41.04250, 29.00720, '08:00 - 23:00', '', 4.2),
    v('pharmacies', 'صيدلية الفاتح', 'Fatih Eczanesi', 'Fezviye Caddesi, Fatih', 41.01820, 28.94980, '08:00 - 23:00', '', 4.2),
    v('pharmacies', 'صيدلية أسكودار', 'Uskudar Eczanesi', 'Hakimiyeti Milliye Caddesi, Üsküdar', 41.02350, 29.01500, '08:00 - 23:00', '', 4.3),
    v('pharmacies', 'صيدلية ليفنت', 'Levent Eczanesi', 'Büyükdere Caddesi, Levent, Beşiktaş', 41.08050, 29.01380, '09:00 - 22:00', '', 4.3),
    v('pharmacies', 'صيدلية باكركوي', 'Bakirkoy Eczanesi', 'İstanbul Caddesi, Bakırköy', 40.98150, 28.87220, '08:00 - 24:00', '', 4.2),
    ...hotelVerified(ISTANBUL_HOTEL_SEEDS),
    ...diningVerified(ISTANBUL_DINING_SEEDS),
    v('mosques', 'جامع السلطان أحمد', 'Blue Mosque Sultan Ahmed', 'Atmeydanı Caddesi, Sultanahmet, Fatih', 41.00541, 28.97681, '05:00 - 22:00', '', 4.9),
    v('mosques', 'جامع السليمانية', 'Suleymaniye Mosque', 'Süleymaniye Mahallesi, Fatih', 41.01613, 28.96407, '05:00 - 22:00', '', 4.9),
    v('mosques', 'جامع الفاتح', 'Fatih Mosque Istanbul', 'Fevzi Paşa Caddesi, Fatih', 41.01972, 28.94997, '05:00 - 22:00', '', 4.8),
    v('mosques', 'الجامع الجديد', 'New Mosque Yeni Cami', 'Eminönü, Fatih', 41.01686, 28.97196, '05:00 - 22:00', '', 4.8),
    v('mosques', 'جامع أيوب سلطان', 'Eyup Sultan Mosque', 'Camii Kebir Caddesi, Eyüpsultan', 41.04796, 28.93364, '05:00 - 22:00', '', 4.9),
    v('mosques', 'جامع أورتاكوي', 'Ortakoy Mosque', 'Mecidiye Köprüsü Sokak, Beşiktaş', 41.04722, 29.02694, '05:00 - 22:00', '', 4.8),
    v('mosques', 'جامع دولما بهتشه', 'Dolmabahce Mosque', 'Dolmabahçe Caddesi, Beşiktaş', 41.03940, 28.99560, '05:00 - 22:00', '', 4.7),
    v('mosques', 'جامع بايزيد', 'Beyazit Mosque', 'Beyazıt Meydanı, Fatih', 41.01028, 28.96472, '05:00 - 22:00', '', 4.7),
    v('mosques', 'جامع تشاملجا', 'Camlica Mosque', 'Küçük Çamlıca, Üsküdar', 41.02780, 29.06890, '05:00 - 22:00', '', 4.8),
    v('mosques', 'جامع شاكيرين', 'Sakirin Mosque', 'Karacaahmet, Üsküdar', 41.02750, 29.03030, '05:00 - 22:00', '', 4.7),
    v('attractions', 'آيا صوفيا', 'Hagia Sophia Grand Mosque', 'Sultan Ahmet Mahallesi, Fatih', 41.00858, 28.98018, '09:00 - 19:30', '', 4.9),
    v('attractions', 'برج غلطة', 'Galata Tower', 'Bereketzade, Galata, Beyoğlu', 41.02566, 28.97419, '08:30 - 23:00', '+90 212 245 4141', 4.7),
    v('attractions', 'قصر توبكابي', 'Topkapi Palace', 'Cankurtaran, Fatih', 41.01152, 28.98338, '09:00 - 18:00', '+90 212 512 0480', 4.8),
    v('attractions', 'صهريج البازيليك', 'Basilica Cistern', 'Yerebatan Caddesi, Sultanahmet', 41.00815, 28.97789, '09:00 - 18:30', '+90 212 568 6600', 4.7),
    v('attractions', 'قصر دولما بهتشه', 'Dolmabahce Palace', 'Dolmabahçe Caddesi, Beşiktaş', 41.03917, 29.00000, '09:00 - 16:00', '+90 212 327 2626', 4.8),
    v('attractions', 'برج الفتاة', 'Maidens Tower Kiz Kulesi', 'Salacak, Üsküdar', 41.02111, 29.00417, '09:00 - 18:30', '', 4.6),
    v('attractions', 'متحف إسطنبول للفن الحديث', 'Istanbul Modern', 'Kılıç Ali Paşa, Tophane, Beyoğlu', 41.02580, 28.98000, '10:00 - 18:00', '', 4.6),
    v('attractions', 'متحف الآثار', 'Istanbul Archaeological Museums', 'Osman Hamdi Bey Yokuşu, Gülhane', 41.01160, 28.98140, '09:00 - 18:00', '', 4.7),
    v('markets', 'البازار الكبير', 'Grand Bazaar Istanbul', 'Beyazıt, Fatih', 41.01064, 28.96808, '09:00 - 19:00', '', 4.6),
    v('markets', 'سوق التوابل', 'Spice Bazaar Egyptian Bazaar', 'Rüstem Paşa, Fatih', 41.01658, 28.97055, '08:00 - 19:30', '', 4.6),
    v('markets', 'إيستيني بارك', 'Istinye Park', 'İstinye Bayırı Caddesi, Sarıyer', 41.11060, 29.03470, '10:00 - 22:00', '', 4.6),
    v('markets', 'مول جواهر', 'Cevahir Mall Sisli', 'Büyükdere Caddesi, Şişli', 41.05970, 28.98780, '10:00 - 22:00', '', 4.5),
    v('markets', 'كانيون', 'Kanyon Shopping Mall', 'Büyükdere Caddesi No:185, Levent', 41.07830, 29.01140, '10:00 - 22:00', '', 4.6),
    v('markets', 'زورلو سنتر', 'Zorlu Center', 'Koruhkıran Caddesi, Beşiktaş', 41.06720, 29.01640, '10:00 - 22:00', '', 4.6),
    v('markets', 'سوق كاديكوي', 'Kadikoy Market', 'Güneşli Bahariye, Kadıköy', 40.99050, 29.02580, '08:00 - 20:00', '', 4.5),
    v('police', 'مركز شرطة بيوغلو', 'Beyoglu Police Station', 'Hüseyinağa Mahallesi, Beyoğlu', 41.03380, 28.97790, '24/7', '112', 4.1),
    v('police', 'مديرية أمن إسطنبول', 'Istanbul Police Headquarters', 'Vatan Caddesi, Fatih', 41.01306, 28.93639, '24/7', '112', 4.2),
    v('police', 'مركز شرطة السلطان أحمد', 'Sultanahmet Tourism Police', 'Yerebatan Caddesi, Fatih', 41.00680, 28.97850, '24/7', '112', 4.2),
    v('police', 'مركز شرطة الفاتح', 'Fatih District Police Station', 'Fevzi Paşa Caddesi, Fatih', 41.01850, 28.94920, '24/7', '112', 4.1),
    v('police', 'مركز شرطة كاديكوي', 'Kadikoy Police Station', 'Rıhtım Caddesi, Kadıköy', 40.99030, 29.02750, '24/7', '112', 4.1),
    v('police', 'مركز شرطة بشكطاش', 'Besiktas Police Station', 'Sinanpaşa Mahallesi, Beşiktaş', 41.04280, 29.00560, '24/7', '112', 4.1),
    v('police', 'مركز شرطة شيشلي', 'Sisli Police Station', 'Halaskargazi Caddesi, Şişli', 41.06020, 28.98750, '24/7', '112', 4.1),
    v('police', 'مركز شرطة أسكودار', 'Uskudar Police Station', 'Doğancılar Caddesi, Üsküdar', 41.02280, 29.01560, '24/7', '112', 4.1),
    v('transport', 'أفيس تقسيم', 'Avis Taksim Car Rental', 'Sıraselviler Caddesi, Beyoğlu', 41.03540, 28.98480, '08:00 - 20:00', '+90 212 297 9560', 4.2),
    v('transport', 'محطة سركجي', 'Sirkeci Railway Station', 'Ankara Caddesi, Eminönü', 41.01530, 28.97690, '24/7', '', 4.5),
    v('transport', 'مرفأ كاديكوي', 'Kadikoy Ferry Terminal', 'Rıhtım Caddesi, Kadıköy', 40.99280, 29.02310, '06:00 - 00:00', '', 4.6),
    v('bakeries', 'غلّوغلو قركوي', 'Karakoy Gulluoglu', 'Mumhane Caddesi, Karaköy', 41.02305, 28.97540, '07:00 - 23:00', '+90 212 293 0910', 4.6),
    v('bakeries', 'حافظ مصطفى سركجي', 'Hafiz Mustafa Sirkeci', 'Hamidiye Caddesi No:84, Sirkeci', 41.01650, 28.97580, '07:00 - 01:00', '+90 212 513 3610', 4.6),
    v('telecom', 'تركسل تقسيم', 'Turkcell Taksim', 'İstiklal Caddesi, Beyoğlu', 41.03520, 28.98190, '10:00 - 22:00', '', 4.2),
    v('telecom', 'فودافون الاستقلال', 'Vodafone Istiklal', 'İstiklal Caddesi, Beyoğlu', 41.03450, 28.97980, '10:00 - 22:00', '', 4.2),
    v('nightlife', '360 إسطنبول', '360 Istanbul', 'İstiklal Caddesi No:163, Beyoğlu', 41.03340, 28.97920, '18:00 - 02:00', '+90 212 251 1042', 4.3),
    v('nightlife', 'بابيلون بومونتي', 'Babylon Bomonti', 'Tarihi Bomonti Bira Fabrikası, Şişli', 41.05860, 28.97860, '19:00 - 02:00', '', 4.5),
    {
      ...v('embassy', 'القنصلية العامة لجمهورية العراق في إسطنبول', 'Consulate General of the Republic of Iraq in Istanbul', 'Vali Konağı Cad. No:93, Nişantaşı, Şişli, İstanbul', 41.04880, 28.99450, '09:00 - 15:00', '+90 212 232 2112', 4.5),
      website: 'https://mofa.gov.iq',
    },
    v('embassy', 'قنصلية الولايات المتحدة — إسطنبول', 'US Consulate General Istanbul', 'Üç Şehitler Sokak, Istinye, Sarıyer', 41.10470, 29.01690, '08:00 - 17:00', '+90 212 335 9000', 4.3),
    ...fuelVerified('istanbul'),
    ...fromCivic(ISTANBUL_CIVIC_SEEDS),
    ...fromCivic(TURKEY_HUB_SEEDS.istanbul),
  ],
  trabzon: [
    v('hospitals', 'مستشفى فارابي الجامعي', 'KTU Farabi Hospital', 'Farabi Caddesi, Üniversite Mahallesi, Ortahisar, Trabzon', 40.99238, 39.76938, '24/7', '+90 462 377 5777', 4.5),
    v('hospitals', 'ميديكال بارك طرابزون', 'Medical Park Trabzon Hospital', 'Devlet Sahil Yolu Cad. No:46, Yıldızlı, Akçaabat', 41.00736, 39.62523, '24/7', '+90 462 341 4444', 4.4),
    v('hospitals', 'ميديكال بارك كارادينيز', 'Medical Park Karadeniz Hospital', 'Yavuz Selim Bulvarı No:190, İnönü, Ortahisar', 40.99952, 39.70017, '24/7', '+90 462 229 0000', 4.4),
    v('pharmacies', 'صيدلية فارابي', 'Farabi Eczanesi', 'Farabi Caddesi, Ortahisar', 41.00310, 39.76980, '08:00 - 24:00', '+90 462 325 1515', 4.3),
    v('pharmacies', 'صيدلية ظفر', 'Zafer Eczanesi Trabzon', 'Uzun Sokak No:12, Ortahisar', 41.00620, 39.72705, '08:00 - 23:00', '+90 462 321 2020', 4.2),
    v('hotels', 'فندق زورلو جراند', 'Zorlu Grand Hotel Trabzon', 'Kahramanmaraş Caddesi No:9, Ortahisar', 41.00535, 39.72880, '24/7', '+90 462 230 0000', 4.5),
    v('hotels', 'نوفوتيل طرابزون', 'Novotel Trabzon', 'Fabrika Sokak, Kaşüstü, Yomra', 40.96892, 39.83886, '24/7', '+90 462 223 0000', 4.4),
    v('hotels', 'راديسون بلو طرابزون', 'Radisson Blu Hotel Trabzon', 'Boztepe Çamlık Sokak, Boztepe, Ortahisar', 40.99708, 39.72997, '24/7', '+90 462 455 0000', 4.4),
    v('mosques', 'جامع آيا صوفيا طرابزون', 'Trabzon Hagia Sophia Mosque', 'Devlet Sahil Yolu, Fatih Mahallesi, Ortahisar', 41.00309, 39.69611, '05:00 - 22:00', '', 4.8),
    v('markets', 'فوروم طرابزون', 'Forum Trabzon', 'Devlet Karayolu Caddesi, Kalkınma Mahallesi, Ortahisar', 40.99980, 39.76139, '10:00 - 22:00', '+90 462 444 0559', 4.5),
    v('restaurants', 'مطعم فيشلاند', 'Fishland Restaurant Trabzon', 'Uzun Sokak, Ortahisar', 41.00590, 39.72640, '11:00 - 00:00', '', 4.3),
    v('police', 'مديرية أمن طرابزون', 'Trabzon Police Headquarters', 'Kahramanmaraş Caddesi, Ortahisar', 41.00480, 39.72410, '24/7', '112', 4.1),
    v('attractions', 'متحف طرابزون', 'Trabzon Museum Kostaki Mansion', 'Zeytinlik Caddesi, Ortahisar', 41.00590, 39.72080, '09:00 - 17:00', '', 4.5),
    v('attractions', 'كوشك أتاتورك', 'Ataturk Pavilion Trabzon', 'Soğuksu, Ortahisar', 40.99980, 39.70740, '08:00 - 17:00', '', 4.6),
    v('mosques', 'جامع أورتاهيسار', 'Ortahisar Mosque Trabzon', 'Kaleiçi, Ortahisar', 41.00500, 39.72020, '05:00 - 22:00', '', 4.6),
    v('restaurants', 'مطعم جميل أوستا', 'Cemil Usta Restaurant Trabzon', 'Uzun Sokak, Ortahisar', 41.00610, 39.72680, '11:00 - 00:00', '', 4.4),
    v('transport', 'أفيس طرابزون', 'Avis Trabzon Car Rental', 'Kahramanmaraş Caddesi, Ortahisar', 41.00420, 39.72580, '08:00 - 19:00', '', 4.2),
    v('bakeries', 'مخبز كوزا', 'Koza Pastanesi Trabzon', 'Uzun Sokak, Ortahisar', 41.00600, 39.72620, '07:00 - 22:00', '', 4.3),
    v('salons', 'صالون ميدان', 'Meydan Kuafor Trabzon', 'Meydan, Ortahisar', 41.00550, 39.72690, '10:00 - 21:00', '', 4.2),
    v('telecom', 'تركسل ميدان', 'Turkcell Trabzon Meydan', 'Meydan, Ortahisar', 41.00540, 39.72720, '09:00 - 21:00', '', 4.2),
    v('exchange', 'صرافة ميدان طرابزون', 'Meydan Doviz Trabzon', 'Uzun Sokak, Ortahisar', 41.00580, 39.72650, '09:00 - 19:00', '', 4.2),
    ...fuelVerified('trabzon'),
    ...fromCivic(TURKEY_HUB_SEEDS.trabzon),
  ],
  antalya: [
    v('hospitals', 'مستشفى ميموريال أنطاليا', 'Memorial Antalya Hospital', 'Zafer Mah. Yıldırım Beyazıt Cad. No:91, Kepez', 36.89110, 30.71060, '24/7', '+90 242 314 6666', 4.6),
    v('hospitals', 'مستشفى جامعة أكdeniz', 'Akdeniz University Hospital', 'Pınarbaşı Mahallesi, Konyaaltı', 36.88750, 30.65620, '24/7', '+90 242 249 6000', 4.5),
    v('pharmacies', 'صيدلية كاليتشي', 'Kaleici Eczanesi', 'Hidırlık Sokak, Kaleiçi', 36.88520, 30.70480, '08:00 - 23:00', '', 4.3),
    v('hotels', 'فندق أكرا أنطاليا', 'Akra Hotel Antalya', 'Lara Caddesi, Muratpaşa', 36.86240, 30.73410, '24/7', '+90 242 249 4949', 4.7),
    v('hotels', 'تيرا سيتي أنطاليا', 'Teras City Hotel Antalya', 'Şirinyalı Mahallesi, Muratpaşa', 36.86680, 30.72650, '24/7', '', 4.4),
    v('mosques', 'جامع يلدرم بايزيد', 'Yildirim Bayezid Mosque Antalya', 'Kaleiçi, Muratpaşa', 36.88490, 30.70540, '05:00 - 22:00', '', 4.7),
    v('markets', 'مول مارك أنطاليا', 'MarkAntalya AVM', 'Kızıltoprak, Muratpaşa', 36.88720, 30.70210, '10:00 - 22:00', '', 4.5),
    v('attractions', 'البلدة القديمة كاليتشي', 'Kaleici Old Town Antalya', 'Kaleiçi, Muratpaşa', 36.88500, 30.70460, '00:00 - 24:00', '', 4.8),
    ...fuelVerified('antalya'),
    ...fromCivic(TURKEY_HUB_SEEDS.antalya),
  ],
  ankara: [
    v('hospitals', 'مستشفى حاجت تبه', 'Hacettepe University Hospital', 'Hacettepe Mahallesi, Altındağ', 39.93180, 32.86340, '24/7', '+90 312 305 5000', 4.6),
    v('hospitals', 'مدينة بيلkent الطبية', 'Ankara Bilkent City Hospital', 'Üniversiteler Mahallesi, Çankaya', 39.89150, 32.75480, '24/7', '+90 312 552 6000', 4.5),
    v('pharmacies', 'صيدلية كيزيلاي', 'Kizilay Eczanesi', 'Atatürk Bulvarı, Çankaya', 39.92080, 32.85410, '08:00 - 23:00', '', 4.3),
    ...hotelVerified(ANKARA_HOTEL_SEEDS),
    ...diningVerified(ANKARA_DINING_SEEDS),
    v('markets', 'كيفن أنقرة', 'Kentpark AVM Ankara', 'Eskişehir Yolu, Çankaya', 39.90010, 32.77580, '10:00 - 22:00', '', 4.5),
    ...fuelVerified('ankara'),
    ...fromCivic(TURKEY_HUB_SEEDS.ankara),
  ],
  izmir: [
    v('hospitals', 'مستشفى إيجة الجامعي', 'Ege University Hospital', 'Kazımdirik Mahallesi, Bornova', 38.46120, 27.22040, '24/7', '+90 232 390 0000', 4.5),
    v('hospitals', 'ميديكال بارك إزمير', 'Medical Park Izmir Hospital', 'Yeni Girne Bulvarı, Karşıyaka', 38.46280, 27.11050, '24/7', '+90 232 399 5050', 4.4),
    v('pharmacies', 'صيدلية كوناك', 'Konak Eczanesi', 'Konak Meydanı, Konak', 38.41920, 27.12870, '08:00 - 23:00', '', 4.2),
    v('hotels', 'سويس أوتيل إزمير', 'Swissotel Buyuk Efes Izmir', 'Gaziosmanpaşa Bulvarı No:1, Alsancak', 38.43280, 27.14090, '24/7', '+90 232 414 0000', 4.6),
    v('markets', 'فوروم بورنوفا', 'Forum Bornova', 'Kazımdirik, Bornova', 38.45060, 27.21140, '10:00 - 22:00', '', 4.5),
    ...fuelVerified('izmir'),
    ...fromCivic(TURKEY_HUB_SEEDS.izmir),
  ],
  bursa: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.bursa),
  bodrum: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.bodrum),
  nevsehir: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.nevsehir),
  gaziantep: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.gaziantep),
  adana: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.adana),
  konya: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.konya),
  alanya: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.alanya),
  samsun: premierProvinceSeeds(TURKEY_PROVINCE_SEEDS.samsun),
  dubai: [
    v('hospitals', 'مستشفى راشد', 'Rashid Hospital Dubai', 'Oud Metha Road, Umm Hurair 2, Bur Dubai', 25.24418, 55.31889, '24/7', '+971 4 219 2000', 4.5),
    v('hospitals', 'مستشفى دبي', 'Dubai Hospital', 'Al Khaleej Street, Al Baraha, Deira', 25.28480, 55.32155, '24/7', '+971 4 219 5000', 4.5),
    v('hospitals', 'ميديكلينك سيتي هوسبيتال', 'Mediclinic City Hospital', 'Building 37, Dubai Healthcare City', 25.23037, 55.32277, '24/7', '+971 4 435 9999', 4.6),
    v('pharmacies', 'صيدلية أستر — دبي مول', 'Aster Pharmacy Dubai Mall', 'Dubai Mall, Downtown Dubai', 25.19750, 55.27960, '10:00 - 00:00', '+971 4 339 9810', 4.5),
    v('pharmacies', 'صيدلية لايف — الرقة', 'Life Pharmacy Al Rigga', 'Al Rigga Road, Deira', 25.25950, 55.32680, '24/7', '+971 4 227 0444', 4.4),
    v('hotels', 'عنوان داون تاون دبي', 'Address Downtown Dubai', 'Mohammed Bin Rashid Boulevard', 25.19355, 55.27890, '24/7', '+971 4 436 8888', 4.8),
    v('hotels', 'أتلانتس النخلة', 'Atlantis The Palm Dubai', 'Crescent Road, Palm Jumeirah', 25.13080, 55.11720, '24/7', '+971 4 426 2000', 4.7),
    v('hotels', 'برج العرب', 'Burj Al Arab Jumeirah', 'Jumeirah St, Umm Suqeim 3', 25.14133, 55.18540, '24/7', '+971 4 301 7777', 4.8),
    v('mosques', 'مسجد جميرا', 'Jumeirah Mosque', 'Jumeirah Beach Road, Jumeirah 1', 25.23396, 55.26586, '09:00 - 20:30', '+971 4 353 6666', 4.8),
    v('markets', 'دبي مول', 'The Dubai Mall', 'Financial Centre Road, Downtown Dubai', 25.19850, 55.27960, '10:00 - 00:00', '+971 4 362 7500', 4.7),
    v('restaurants', 'بيت الشاي العربي', 'Arabian Tea House Cafe', 'Al Fahidi Street, Bur Dubai', 25.26340, 55.30010, '08:00 - 00:00', '+971 4 353 8011', 4.5),
    v('exchange', 'صرافة الإمارات — الفهيدي', 'Emirates NBD Exchange Al Fahidi', 'Al Fahidi Street, Bur Dubai', 25.26300, 55.29720, '09:00 - 21:00', '', 4.3),
    v('police', 'مركز شرطة بر دبي', 'Bur Dubai Police Station', 'Al Fahidi Street, Bur Dubai', 25.25740, 55.29510, '24/7', '999', 4.2),
    v('fuel', 'اينوك الشيخ زايد', 'ENOC Sheikh Zayed Road', 'Sheikh Zayed Road, Trade Centre', 25.21780, 55.27940, '24/7', '', 4.1),
    v('attractions', 'برج خليفة', 'Burj Khalifa', '1 Sheikh Mohammed bin Rashid Blvd, Downtown', 25.19720, 55.27438, '10:00 - 22:00', '+971 4 888 8888', 4.8),
    v('attractions', 'إطار دبي', 'Dubai Frame', 'Zabeel Park, Dubai', 25.23556, 55.30028, '09:00 - 21:00', '+971 4 388 4444', 4.6),
    v('markets', 'مول الإمارات', 'Mall of the Emirates', 'Sheikh Zayed Road, Al Barsha', 25.11814, 55.20056, '10:00 - 00:00', '+971 4 409 9000', 4.7),
    v('markets', 'سوق الذهب', 'Dubai Gold Souk', 'Al Khathib Road, Deira', 25.26970, 55.29600, '10:00 - 22:00', '', 4.5),
    v('hospitals', 'المستشفى الإيراني دبي', 'Iranian Hospital Dubai', 'Al Wasl Road, Al Badaa', 25.23890, 55.28850, '24/7', '+971 4 344 0250', 4.4),
    v('hospitals', 'المستشفى الأمريكي دبي', 'American Hospital Dubai', 'Oud Metha Road, Dubai Healthcare City', 25.23290, 55.32410, '24/7', '+971 4 377 4000', 4.6),
    v('hotels', 'فندق جميرا بيتش', 'Jumeirah Beach Hotel', 'Jumeirah Beach Road, Umm Suqeim', 25.14190, 55.19130, '24/7', '+971 4 348 0000', 4.7),
    v('hotels', 'جيفورا', 'Gevora Hotel', 'Sheikh Zayed Road, Trade Centre', 25.21555, 55.27690, '24/7', '+971 4 354 3333', 4.4),
    v('transport', 'هرتز دبي', 'Hertz Dubai Sheikh Zayed', 'Sheikh Zayed Road, Trade Centre', 25.21700, 55.27900, '08:00 - 22:00', '+971 4 206 0206', 4.3),
    v('bakeries', 'بول — دبي مول', 'Paul Bakery Dubai Mall', 'Dubai Mall, Downtown', 25.19780, 55.27940, '09:00 - 00:00', '', 4.4),
    v('salons', 'تيب تو تو — دبي مول', 'Tips & Toes Dubai Mall', 'Dubai Mall, Downtown', 25.19790, 55.27920, '10:00 - 22:00', '', 4.4),
    v('telecom', 'اتصالات — دبي مول', 'Etisalat Dubai Mall', 'Dubai Mall, Downtown', 25.19740, 55.27950, '10:00 - 22:00', '+971 800 101', 4.3),
    v('nightlife', 'لا مير', 'La Mer Dubai', 'Jumeirah 1, Dubai', 25.23080, 55.25690, '10:00 - 00:00', '', 4.6),
    v('embassy', 'قنصلية العراق — دبي', 'Consulate General of Iraq Dubai', 'Al Karama, Dubai', 25.24380, 55.30420, '08:00 - 14:00', '+971 4 396 4100', 4.2),
    v('hospitals', 'لطيفة للنساء والولادة', 'Latifa Hospital', 'Oud Metha Road, Al Jaddaf', 25.22480, 55.32740, '24/7', '+971 4 219 3000', 4.5),
    v('hospitals', 'السعودي الألماني دبي', 'Saudi German Hospital Dubai', 'Al Barsha 3, Hessa Street', 25.09060, 55.21080, '24/7', '+971 4 389 0000', 4.5),
    v('hospitals', 'الإمارات جميرا', 'Emirates Hospital Jumeirah', 'Jumeirah Beach Road, Jumeirah 2', 25.22190, 55.25320, '24/7', '+971 4 349 6666', 4.5),
    v('hospitals', 'إن إم سي رويال — مجمع دبي للاستثمار', 'NMC Royal Hospital DIP', 'Dubai Investments Park', 24.97860, 55.16480, '24/7', '+971 4 801 3999', 4.4),
    v('pharmacies', 'بوتس — مول الإمارات', 'Boots Mall of the Emirates', 'Mall of the Emirates, Al Barsha', 25.11820, 55.20080, '10:00 - 00:00', '', 4.4),
    v('pharmacies', 'لايف — جي بي آر', 'Life Pharmacy JBR', 'The Walk, Jumeirah Beach Residence', 25.07840, 55.13390, '24/7', '', 4.4),
    v('pharmacies', 'أستر — مارينا مول', 'Aster Pharmacy Marina Mall', 'Dubai Marina Mall', 25.07720, 55.14120, '10:00 - 00:00', '', 4.3),
    v('hotels', 'أرماني برج خليفة', 'Armani Hotel Dubai', 'Burj Khalifa, Downtown Dubai', 25.19720, 55.27440, '24/7', '+971 4 888 3888', 4.8),
    v('hotels', 'جي دبليو ماريوت ماركيز', 'JW Marriott Marquis Dubai', 'Business Bay, Sheikh Zayed Road', 25.18500, 55.26080, '24/7', '+971 4 414 0000', 4.6),
    v('hotels', 'ريتز كارلتون مركز دبي المالي', 'The Ritz-Carlton DIFC', 'Gate Village, DIFC', 25.21180, 55.28000, '24/7', '+971 4 372 8888', 4.7),
    v('hotels', 'ون آند أونلي رويال ميراج', 'One and Only Royal Mirage', 'Al Sufouh Road, Dubai Marina', 25.09390, 55.14860, '24/7', '+971 4 399 9999', 4.8),
    v('mosques', 'مسجد دبي الكبير', 'Grand Mosque Dubai', 'Ali bin Abi Talib Street, Bur Dubai', 25.26480, 55.29640, '05:00 - 22:00', '', 4.7),
    v('mosques', 'مسجد الفاروق عمر', 'Al Farooq Omar Mosque', 'Al Safa 1, Dubai', 25.17580, 55.23940, '05:00 - 22:00', '', 4.8),
    v('markets', 'ابن بطوطة مول', 'Ibn Battuta Mall', 'Sheikh Zayed Road, Jebel Ali', 25.04450, 55.11760, '10:00 - 00:00', '', 4.6),
    v('markets', 'سيتي سنتر ديرة', 'City Centre Deira', '8th Street, Port Saeed, Deira', 25.25220, 55.33280, '10:00 - 00:00', '', 4.5),
    v('markets', 'دبي مارينا مول', 'Dubai Marina Mall', 'Dubai Marina', 25.07640, 55.14110, '10:00 - 00:00', '', 4.5),
    v('police', 'مركز شرطة ديرة', 'Deira Police Station', 'Al Rigga Road, Deira', 25.26280, 55.32640, '24/7', '999', 4.2),
    v('police', 'مركز شرطة جميرا', 'Jumeirah Police Station', 'Al Wasl Road, Jumeirah', 25.22840, 55.25980, '24/7', '999', 4.2),
    v('police', 'مركز شرطة البرشاء', 'Al Barsha Police Station', 'Al Barsha 1, Dubai', 25.11120, 55.20240, '24/7', '999', 4.2),
    v('police', 'مركز شرطة القصيص', 'Al Qusais Police Station', 'Al Qusais 2, Dubai', 25.26880, 55.37620, '24/7', '999', 4.1),
    v('attractions', 'نافورة دبي', 'The Dubai Fountain', 'Burj Khalifa Lake, Downtown', 25.19520, 55.27500, '18:00 - 23:00', '', 4.8),
    v('attractions', 'حديقة الزهور', 'Dubai Miracle Garden', 'Al Barsha South 3', 25.06000, 55.24440, '09:00 - 21:00', '', 4.6),
    v('fuel', 'اينوك البرشاء', 'ENOC Al Barsha', 'Sheikh Zayed Road, Al Barsha', 25.11380, 55.20360, '24/7', '', 4.1),
    v('fuel', 'اد نوك المارينا', 'ADNOC Dubai Marina', 'Al Sufouh Road, Dubai Marina', 25.08060, 55.14020, '24/7', '', 4.1),
    v('transport', 'مترو برج خليفة', 'Burj Khalifa Dubai Mall Metro', 'Financial Centre Road, Downtown', 25.20110, 55.26950, '05:00 - 00:00', '', 4.6),
    v('bakeries', 'بول — مارينا', 'Paul Bakery Dubai Marina', 'Dubai Marina Mall', 25.07680, 55.14100, '08:00 - 00:00', '', 4.4),
  ],
  abudhabi: [
    v('hospitals', 'مستشفى الشيخ خليفة', 'Sheikh Khalifa Medical City', 'Al Karamah Street, Abu Dhabi', 24.46780, 54.38210, '24/7', '+971 2 819 0000', 4.5),
    v('hospitals', 'كليفلاند كلينك أبوظبي', 'Cleveland Clinic Abu Dhabi', 'Al Maryah Island, Abu Dhabi', 24.50190, 54.38860, '24/7', '+971 2 659 9999', 4.7),
    v('pharmacies', 'صيدلية لايف — الكورنيش', 'Life Pharmacy Corniche Abu Dhabi', 'Corniche Road, Al Khalidiyah', 24.47640, 54.32100, '24/7', '', 4.4),
    v('hotels', 'قصر الإمارات', 'Emirates Palace Mandarin Oriental', 'West Corniche Road, Abu Dhabi', 24.46170, 54.31720, '24/7', '+971 2 690 9000', 4.8),
    v('hotels', 'سانت ريجيس أبوظبي', 'The St. Regis Abu Dhabi', 'Nation Towers, Corniche', 24.46680, 54.32250, '24/7', '+971 2 694 4444', 4.7),
    v('mosques', 'جامع الشيخ زايد', 'Sheikh Zayed Grand Mosque', 'Sheikh Rashid Bin Saeed St, Abu Dhabi', 24.41280, 54.47500, '09:00 - 22:00', '+971 2 419 1919', 4.9),
    v('markets', 'ياس مول', 'Yas Mall', 'Yas Island, Abu Dhabi', 24.48860, 54.60890, '10:00 - 00:00', '', 4.6),
  ],
  riyadh: [
    v('hospitals', 'مستشفى الملك فيصل التخصصي', 'King Faisal Specialist Hospital Riyadh', 'Al Mathar Ash Shamali, Riyadh', 24.67090, 46.67740, '24/7', '+966 11 464 7272', 4.6),
    v('hospitals', 'الحرس الوطني — الرياض', 'King Abdulaziz Medical City Riyadh', 'Ar Rimayah, Riyadh', 24.74850, 46.85520, '24/7', '+966 11 801 1111', 4.5),
    v('pharmacies', 'صيدلية النهدي — العليا', 'Nahdi Pharmacy Olaya', 'Olaya Street, Riyadh', 24.71120, 46.67480, '24/7', '+966 9200 00600', 4.4),
    v('hotels', 'الفيصلية روزوود', 'Rosewood Riyadh', 'King Fahd Road, Al Olaya', 24.69030, 46.68540, '24/7', '+966 11 211 1111', 4.7),
    v('hotels', 'فور سيزونز الرياض', 'Four Seasons Hotel Riyadh', 'Kingdom Centre, Olaya', 24.71140, 46.67420, '24/7', '+966 11 211 5000', 4.7),
    v('markets', 'العليا مول', 'Al Olaya / Kingdom Centre Mall', 'Olaya Street, Riyadh', 24.71130, 46.67430, '10:00 - 00:00', '', 4.5),
    v('mosques', 'جامع الملك عبدالله المالي', 'King Abdullah Financial District Mosque', 'KAFD, Riyadh', 24.76300, 46.64050, '05:00 - 22:00', '', 4.7),
  ],
  jeddah: [
    v('hospitals', 'مستشفى الملك فهد — جدة', 'King Fahd General Hospital Jeddah', 'Al Hamra District, Jeddah', 21.54320, 39.17280, '24/7', '+966 12 665 5000', 4.4),
    v('hospitals', 'السعودي الألماني جدة', 'Saudi German Hospital Jeddah', 'Al Zahra District, Jeddah', 21.58240, 39.16690, '24/7', '+966 12 682 1800', 4.5),
    v('pharmacies', 'النهدي — الحمراء', 'Nahdi Pharmacy Al Hamra Jeddah', 'Al Hamra, Jeddah', 21.54300, 39.14800, '24/7', '+966 9200 00600', 4.4),
    v('hotels', 'فندق رِتز كارلتون جدة', 'The Ritz-Carlton Jeddah', 'Al Hamra District, Corniche', 21.55180, 39.11860, '24/7', '+966 12 511 7777', 4.7),
    v('hotels', 'هيلتون جدة', 'Hilton Jeddah', 'North Corniche Road', 21.61240, 39.10620, '24/7', '+966 12 653 1234', 4.5),
    v('markets', 'رد سي مول', 'Red Sea Mall Jeddah', 'King Abdulaziz Road, Jeddah', 21.63150, 39.11120, '10:00 - 00:00', '', 4.6),
  ],
  cairo: [
    v('hospitals', 'مستشفى دار الفؤاد', 'Dar Al Fouad Hospital Cairo', '26th of July Corridor, 6th of October', 30.02780, 31.00240, '24/7', '+20 2 3824 1000', 4.5),
    v('hospitals', 'القصر العيني', 'Kasr Al Ainy Hospital', 'Kasr Al Ainy Street, Garden City', 30.03060, 31.23690, '24/7', '+20 2 2364 8612', 4.4),
    v('pharmacies', 'صيدلية العزبي — الزمالك', 'El Ezaby Pharmacy Zamalek', '26th of July Street, Zamalek', 30.06180, 31.21940, '24/7', '+20 19600', 4.4),
    v('hotels', 'فور سيزونز نايل بلازا', 'Four Seasons Cairo at Nile Plaza', '1089 Corniche El Nil, Garden City', 30.03690, 31.23140, '24/7', '+20 2 2791 7000', 4.8),
    v('hotels', 'Marriott الزمالك', 'Cairo Marriott Hotel', 'Saray El Gezira, Zamalek', 30.05720, 31.22450, '24/7', '+20 2 2728 3000', 4.6),
    v('markets', 'مول مصر', 'Mall of Egypt', 'Al Wahat Road, 6th of October', 29.97240, 30.94180, '10:00 - 00:00', '', 4.5),
    v('attractions', 'المتحف المصري', 'The Egyptian Museum Tahrir', 'Tahrir Square, Cairo', 30.04780, 31.23360, '09:00 - 17:00', '', 4.7),
  ],
  amman: [
    v('hospitals', 'مستشفى الأردن', 'Jordan Hospital Amman', 'Queen Noor Street, Amman', 31.97360, 35.91080, '24/7', '+962 6 560 8080', 4.5),
    v('hospitals', 'الخالدي الطبي', 'Al Khalidi Hospital Amman', 'Ibn Khaldoun Street, Jabal Amman', 31.95300, 35.91020, '24/7', '+962 6 464 4281', 4.5),
    v('pharmacies', 'صيدلية روحي', 'Rouhi Pharmacy Abdoun', 'Abdoun, Amman', 31.95280, 35.89320, '24/7', '', 4.3),
    v('hotels', 'فيرمونت عمان', 'Fairmont Amman', '5th Circle, Amman', 31.96040, 35.86690, '24/7', '+962 6 510 6000', 4.7),
    v('hotels', 'فور سيزونز عمان', 'Four Seasons Hotel Amman', 'Al Kindy Street, Amman', 31.96180, 35.86950, '24/7', '+962 6 550 5555', 4.7),
    v('markets', 'مكة مول', 'Mecca Mall Amman', 'Mecca Street, Amman', 31.98440, 35.86170, '10:00 - 00:00', '', 4.5),
  ],
  doha: [
    v('hospitals', 'حمد العام', 'Hamad General Hospital', 'Al Rayyan Road, Doha', 25.28680, 51.50640, '24/7', '+974 4439 4444', 4.5),
    v('hospitals', 'سدرة للطب', 'Sidra Medicine', 'Al Gharrafa Street, Education City', 25.31120, 51.43480, '24/7', '+974 4003 3333', 4.6),
    v('pharmacies', 'صيدلية كويك — سيتي سنتر', 'Wellcare / Boots City Center Doha', 'City Center Mall, West Bay', 25.32650, 51.53080, '10:00 - 00:00', '', 4.4),
    v('hotels', 'شيراتون الدوحة', 'Sheraton Grand Doha', 'Al Corniche Street, West Bay', 25.32780, 51.53090, '24/7', '+974 4485 4444', 4.5),
    v('hotels', 'فور سيزونز الدوحة', 'Four Seasons Hotel Doha', 'The Corniche, West Bay', 25.34720, 51.53160, '24/7', '+974 4494 8888', 4.7),
    v('markets', 'سوق واقف', 'Souq Waqif Doha', 'Souq Waqif, Al Souq', 25.28664, 51.53305, '10:00 - 23:00', '', 4.7),
    v('mosques', 'مسجد الإمام محمد بن عبد الوهاب', 'Imam Muhammad ibn Abd al-Wahhab Mosque', 'Al Maamoura, Doha', 25.28600, 51.46100, '05:00 - 22:00', '', 4.8),
  ],
  baghdad: [
    v('hospitals', 'مدينة الطب', 'Medical City Baghdad', 'Bab Al Muadham, Baghdad', 33.34860, 44.37780, '24/7', '+964 1 416 0090', 4.3),
    v('hospitals', 'مستشفى الجراحة التخصصية', 'Baghdad Teaching Hospital', 'Medical City, Baghdad', 33.34920, 44.37850, '24/7', '', 4.3),
    v('pharmacies', 'صيدلية الكرادة', 'Karrada Pharmacy', 'Inner Karrada, Baghdad', 33.30200, 44.42300, '08:00 - 23:00', '', 4.2),
    v('hotels', 'بابلون روتانا', 'Babylon Rotana Baghdad', 'Al Jadiriya Bridge Road, Baghdad', 33.27840, 44.37720, '24/7', '+964 1 778 2000', 4.4),
    v('hotels', 'فندق فلسطين', 'Palestine Hotel Baghdad', 'Firdos Square, Baghdad', 33.31460, 44.42180, '24/7', '', 4.1),
    v('markets', 'شارع المتنبي', 'Al Mutanabbi Street', 'Rusafa, Baghdad', 33.33890, 44.38940, '09:00 - 21:00', '', 4.6),
  ],
  tehran: [
    v('hospitals', 'مستشفى مهراد', 'Mehrad Hospital Tehran', 'Mirdamad Boulevard, Tehran', 35.76080, 51.42760, '24/7', '+98 21 8874 7401', 4.4),
    v('hospitals', 'مستشفى طهران هارت', 'Tehran Heart Center', 'North Kargar Street, Tehran', 35.71540, 51.38190, '24/7', '', 4.5),
    v('pharmacies', 'صيدلية 29 فروردين', '29 Farvardin Pharmacy', 'Enghelab Street, Tehran', 35.70080, 51.39560, '24/7', '', 4.3),
    v('hotels', 'إسبيناس بالاس', 'Espinas Palace Hotel Tehran', 'Saadat Abad, Tehran', 35.78090, 51.37540, '24/7', '+98 21 7565 0000', 4.6),
    v('hotels', 'برج ميلاد الفندق', 'Espinas Persian Gulf Hotel / Milad', 'Gisha, Tehran', 35.74480, 51.37560, '24/7', '', 4.4),
    v('attractions', 'برج آزادي', 'Azadi Tower Tehran', 'Azadi Square, Tehran', 35.69970, 51.33800, '09:00 - 19:00', '', 4.7),
  ],
  mashhad: [
    v('hospitals', 'مستشفى الإمام الرضا', 'Imam Reza Hospital Mashhad', 'Ahmadabad Blvd, Mashhad', 36.28650, 59.61640, '24/7', '+98 51 3854 3031', 4.4),
    v('pharmacies', 'صيدلية حرم الإمام', 'Holy Shrine Area Pharmacy Mashhad', 'Imam Reza Holy Shrine vicinity', 36.28780, 59.61550, '24/7', '', 4.3),
    v('hotels', 'فندق قصر الذهب', 'Ghasr-e Talaee Hotel Mashhad', 'Imam Reza Street, Mashhad', 36.28620, 59.61480, '24/7', '+98 51 3222 0000', 4.5),
    v('hotels', 'فندق درويشي', 'Darvishi Hotel Mashhad', 'Imam Reza Blvd, Mashhad', 36.28540, 59.61290, '24/7', '', 4.5),
    v('mosques', 'حرم الإمام الرضا', 'Imam Reza Holy Shrine', 'Imam Reza Street, Mashhad', 36.28790, 59.61560, '00:00 - 24:00', '', 4.9),
    v('markets', 'بازار رضا', 'Reza Bazaar Mashhad', 'Imam Reza Street, Mashhad', 36.28680, 59.61690, '09:00 - 21:00', '', 4.6),
  ],
  muscat: [
    v('hospitals', 'المستشفى السلطاني', 'The Royal Hospital Muscat', 'Al Ghubra, Muscat', 23.58940, 58.39860, '24/7', '+968 2459 9000', 4.5),
    v('hospitals', 'مستشفى كريسنت', 'Muscat Private Hospital', 'Bawshar, Muscat', 23.58820, 58.38910, '24/7', '+968 2458 3600', 4.4),
    v('pharmacies', 'صيدلية مسقط — القرم', 'Muscat Pharmacy Qurum', 'Al Qurum, Muscat', 23.58800, 58.43300, '09:00 - 22:00', '', 4.3),
    v('hotels', 'قصر البستان', 'Al Bustan Palace Ritz-Carlton', 'Al Bustan, Muscat', 23.58240, 58.59480, '24/7', '+968 2479 9666', 4.8),
    v('hotels', 'جراند حياة مسقط', 'Grand Hyatt Muscat', 'Shatti Al Qurum', 23.61650, 58.47720, '24/7', '+968 2464 1234', 4.6),
    v('markets', 'سوق مطرح', 'Muttrah Souq', 'Muttrah Corniche, Muscat', 23.61630, 58.56620, '09:00 - 22:00', '', 4.6),
  ],
  kualalumpur: [
    v('hospitals', 'مستشفى غلين إيغلز KL', 'Gleneagles Hospital Kuala Lumpur', 'Jalan Ampang, Kuala Lumpur', 3.16120, 101.71780, '24/7', '+60 3 4141 3000', 4.6),
    v('pharmacies', 'جاردينيا — بوكيت بينتانغ', 'Guardian Pharmacy Bukit Bintang', 'Jalan Bukit Bintang, KL', 3.14660, 101.71100, '10:00 - 22:00', '', 4.3),
    v('hotels', 'Mandarin Oriental KL', 'Mandarin Oriental Kuala Lumpur', 'Kuala Lumpur City Centre', 3.15800, 101.71300, '24/7', '+60 3 2380 8888', 4.7),
    v('hotels', 'برج تريدرز', 'Traders Hotel Kuala Lumpur', 'Kuala Lumpur City Centre', 3.15740, 101.71190, '24/7', '', 4.5),
    v('markets', 'pavilion KL', 'Pavilion Kuala Lumpur', 'Jalan Bukit Bintang', 3.14900, 101.71340, '10:00 - 22:00', '', 4.7),
    v('attractions', 'البرجين التوأم', 'Petronas Twin Towers', 'Kuala Lumpur City Centre', 3.15790, 101.71160, '09:00 - 21:00', '', 4.8),
  ],
  bangkok: [
    v('hospitals', 'مستشفى بومرونجراد', 'Bumrungrad International Hospital', 'Sukhumvit Soi 3, Bangkok', 13.74650, 100.55280, '24/7', '+66 2 066 8888', 4.7),
    v('hospitals', 'ساميتيويت سوكومفيت', 'Samitivej Sukhumvit Hospital', 'Sukhumvit Soi 49, Bangkok', 13.73080, 100.57720, '24/7', '+66 2 022 2222', 4.6),
    v('pharmacies', 'boots سيام', 'Boots Siam Paragon', 'Siam Paragon, Bangkok', 13.74660, 100.53470, '10:00 - 22:00', '', 4.4),
    v('hotels', 'Mandarin Oriental Bangkok', 'Mandarin Oriental Bangkok', 'Charoen Krung Road, Bangkok', 13.72390, 100.51410, '24/7', '+66 2 659 9000', 4.8),
    v('hotels', 'سوكوثاي بانكوك', 'The Sukhothai Bangkok', 'South Sathorn Road, Bangkok', 13.72320, 100.53980, '24/7', '+66 2 344 8888', 4.7),
    v('markets', 'تشاتوتشاك', 'Chatuchak Weekend Market', 'Kamphaeng Phet Road, Bangkok', 13.79990, 100.55000, '09:00 - 18:00', '', 4.6),
  ],
  tokyo: [
    v('hospitals', 'مستشفى سانت لوك', 'St. Luke\'s International Hospital Tokyo', '9-1 Akashi-cho, Chuo-ku', 35.66750, 139.77750, '24/7', '+81 3 3541 5151', 4.7),
    v('pharmacies', 'ماتسوموتو كيوشي شيبويا', 'Matsumoto Kiyoshi Shibuya', 'Shibuya Center Gai, Tokyo', 35.65950, 139.70040, '10:00 - 22:00', '', 4.4),
    v('hotels', 'فندق إمبريال طوكيو', 'Imperial Hotel Tokyo', '1-1-1 Uchisaiwaicho, Chiyoda', 35.67240, 139.75800, '24/7', '+81 3 3504 1111', 4.7),
    v('hotels', 'بارك حياة طوكيو', 'Park Hyatt Tokyo', '3-7-1-2 Nishi Shinjuku', 35.68570, 139.69080, '24/7', '+81 3 5322 1234', 4.8),
    v('markets', 'دون كيهوت شيبويا', 'Don Quijote Shibuya', '2-11-2 Dogenzaka, Shibuya', 35.65900, 139.69880, '00:00 - 24:00', '', 4.5),
    v('attractions', 'معبد سينسوجي', 'Senso-ji Temple Asakusa', '2-3-1 Asakusa, Taito', 35.71480, 139.79670, '06:00 - 17:00', '', 4.8),
  ],
};

const TURKEY_CITY_KEYS = new Set([
  'istanbul', 'ankara', 'izmir', 'antalya', 'trabzon', 'bursa', 'bodrum',
  'nevsehir', 'gaziantep', 'adana', 'konya', 'alanya', 'samsun', 'mersin', 'kayseri',
]);

registerCuratedTurkeyPins([
  ...Object.entries(VERIFIED_BY_CITY).flatMap(([key, seeds]) => (
    TURKEY_CITY_KEYS.has(key)
      ? seeds.map((seed) => ({ category_key: seed.category_key, lat: seed.lat, lng: seed.lng }))
      : []
  )),
  ...turkeyAirportPins(),
]);

function categoryLabel(key: string): string {
  if (key === 'police') return 'شرطة';
  return CATEGORIES.find((c) => c.key === key)?.shortLabel || key;
}

function cityKeyFromLookup(en?: string): string | null {
  if (!en) return null;
  const map: Record<string, string> = {
    Istanbul: 'istanbul',
    Trabzon: 'trabzon',
    Antalya: 'antalya',
    Ankara: 'ankara',
    Izmir: 'izmir',
    Bursa: 'bursa',
    Bodrum: 'bodrum',
    Nevsehir: 'nevsehir',
    Gaziantep: 'gaziantep',
    Adana: 'adana',
    Konya: 'konya',
    Alanya: 'alanya',
    Samsun: 'samsun',
    Mersin: 'mersin',
    Kayseri: 'kayseri',
    'All Turkey': 'allturkey',
    Dubai: 'dubai',
    'Abu Dhabi': 'abudhabi',
    Riyadh: 'riyadh',
    Jeddah: 'jeddah',
    Cairo: 'cairo',
    Amman: 'amman',
    Doha: 'doha',
    Baghdad: 'baghdad',
    Tehran: 'tehran',
    Mashhad: 'mashhad',
    Muscat: 'muscat',
    'Kuala Lumpur': 'kualalumpur',
    Bangkok: 'bangkok',
    Tokyo: 'tokyo',
    Uzungol: 'trabzon',
  };
  return map[en] ?? en.toLowerCase().replace(/\s+/g, '');
}

export function toVerifiedListing(
  seed: VerifiedPlace,
  city: string,
  country: string,
  index: number,
): DirectoryListing | null {
  if (isGenericSeedName(seed.name_en, seed.name)) return null;
  if (!isAuthenticVenueName(seed.name, seed.category_key) && !isAuthenticVenueName(seed.name_en, seed.category_key)) {
    return null;
  }
  const kind = seed.place_kind || (seed.category_key === 'hotels' || seed.category_key === 'restaurants'
    ? resolvePlaceKind({ name: seed.name, description: seed.name_en, category_key: seed.category_key, place_kind: seed.place_kind })
    : undefined);
  const hotelTags = kind === 'resort'
    ? ['منتجع', 'مسبح', 'مساحات خضراء', 'موقع موثّق']
    : kind === 'hotel'
      ? ['فندق حضري', 'موقع موثّق']
      : kind === 'cafe'
        ? ['مقهى', 'قهوة مختصة', 'موقع موثّق']
        : kind === 'restaurant'
          ? ['مطعم', 'موقع موثّق']
          : ['موقع موثّق'];
  const listing: DirectoryListing = {
    id: seed.slug ? `verified-${city}-${seed.category_key}-${seed.slug}` : `verified-${city}-${seed.category_key}-${index}`,
    category_key: seed.category_key,
    category_label: kind && (seed.category_key === 'hotels' || seed.category_key === 'restaurants')
      ? placeKindLabel(kind)
      : categoryLabel(seed.category_key),
    name: seed.name,
    description: seed.name_en,
    country_name: country,
    city,
    address: seed.address,
    image: seed.images?.[0] || '',
    images: seed.images?.length ? [...seed.images] : [],
    place_kind: kind,
    rating: seed.rating || 0,
    price_level: '',
    tags: hotelTags,
    proximity_note: '',
    phone: normalizeTurkeyEmergencyPhone(seed.phone, country, city, seed.category_key, seed.address),
    hours: seed.hours,
    is_featured: true,
    sort_order: index,
    lat: seed.lat,
    lng: seed.lng,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: '',
    nav_query: `${Number(seed.lat.toFixed(7))},${Number(seed.lng.toFixed(7))}`,
    website: seed.website,
  };
  listing.images = placeGallery(listing);
  listing.image = listing.images[0] || '';
  return pinListing(listing);
}

export function getVerifiedPlaces(options: {
  origin?: { lat: number; lng: number } | null;
  city?: string;
  country?: string;
  district?: string;
  categories: string[];
}): DirectoryListing[] {
  const cityHit = resolveCatalogCity({
    city: options.city,
    country: options.country,
    district: options.district,
    lat: options.origin?.lat,
    lng: options.origin?.lng,
  }) || lookupCity(options.city) || lookupCity(options.country);
  const allTurkey = isAllTurkeyCity(cityHit) || isAllTurkeyCity(options.city);
  if (allTurkey) {
    const cats = options.categories.length ? options.categories : ['pharmacies', 'hospitals', 'hotels'];
    return getAllVerifiedPlaces().filter((item) => {
      if (item.country_name !== 'تركيا') return false;
      if (cats.includes(item.category_key)) return true;
      if (item.category_key === 'police' && cats.includes('embassy')) return true;
      return false;
    });
  }
  const key = cityKeyFromLookup(cityHit?.en);
  const seeds = (key ? VERIFIED_BY_CITY[key] : null) ?? [];
  const cats = options.categories.length ? options.categories : ['pharmacies', 'hospitals', 'hotels'];
  const cityName = cityHit?.name || options.city || '';
  const countryName = cityHit?.country || options.country || '';

  return seeds
    .filter((s) => {
      if (isGenericSeedName(s.name_en, s.name)) return false;
      if (cats.includes(s.category_key)) return true;
      if (s.category_key === 'police' && cats.includes('embassy')) return true;
      return false;
    })
    .map((seed, i) => toVerifiedListing(seed, cityName, countryName, i))
    .filter((item): item is DirectoryListing => Boolean(item));
}

export function getAllVerifiedPlaces(): DirectoryListing[] {
  const out: DirectoryListing[] = [];
  for (const [key, seeds] of Object.entries(VERIFIED_BY_CITY)) {
    const cityHit = lookupCity(key);
    const cityName = cityHit?.name || key;
    const countryName = cityHit?.country || '';
    seeds.forEach((seed, i) => {
      const listing = toVerifiedListing(seed, cityName, countryName, i);
      if (listing) out.push(listing);
    });
  }
  return [...out, ...turkeyAirportListings()];
}
