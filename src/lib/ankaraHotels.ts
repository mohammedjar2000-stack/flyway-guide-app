import { assertUniqueHotelImages, withUniqueHotelImages, type HotelPlaceKind } from '@/lib/hotelPhotos';

interface AnkaraHotelSeed {
  slug: string;
  name: string;
  name_en: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  rating: number;
  place_kind: HotelPlaceKind;
  images?: string[];
}

function h(
  kind: HotelPlaceKind,
  slug: string,
  name: string,
  name_en: string,
  address: string,
  lat: number,
  lng: number,
  phone: string,
  rating: number,
): AnkaraHotelSeed {
  return { slug, name, name_en, address, lat, lng, phone, rating, place_kind: kind };
}

/** 54 distinct Ankara hotels and resorts with real coordinates, including New Park, Abro, and Radisson Blu. */
const ANKARA_HOTEL_RAW: AnkaraHotelSeed[] = [
  h('hotel', 'new-park-ankara', 'نيو بارك أنقرة', 'New Park Hotel Ankara', 'Ziya Gökalp Bulvarı No:58, Çankaya', 39.92035, 32.85905, '+90 312 431 2020', 4.4),
  h('hotel', 'abro-necatibey', 'أبرو نجاتي باي', 'Hotel Abro Necatibey', 'Necatibey Caddesi No:28, Kızılay, Çankaya', 39.92195, 32.85415, '+90 312 419 4848', 4.3),
  h('hotel', 'abro-sezenler', 'أبرو سيزنلر', 'Hotel Abro Sezenler', 'Sezenler Caddesi No:5, Kızılay, Çankaya', 39.92315, 32.85505, '+90 312 419 1010', 4.3),
  h('hotel', 'radisson-blu-cankaya', 'راديسون بلو تشانكايا', 'Radisson Blu Hotel Ankara', 'Çukurambar Mahallesi, 1480. Cadde No:2, Çankaya', 39.90092, 32.80968, '+90 312 248 0000', 4.6),
  h('hotel', 'hyatt-regency-ankara', 'هيات ريجنسي أنقرة', 'Hyatt Regency Ankara', 'Gaziosmanpaşa, Çankaya', 39.89870, 32.87560, '+90 312 444 1234', 4.6),
  h('hotel', 'marriott-ankara', 'ماريوت أنقرة', 'Ankara Marriott Hotel', 'Dikmen Caddesi, Çankaya', 39.89120, 32.85940, '', 4.5),
  h('hotel', 'jw-marriott-ankara', 'جي دبليو ماريوت أنقرة', 'JW Marriott Hotel Ankara', 'Kızılırmak Mah. Ufuk Üniversitesi Cad. No:8, Söğütözü', 39.91015, 32.80135, '+90 312 220 0000', 4.6),
  h('hotel', 'sheraton-ankara', 'شيراتون أنقرة', 'Sheraton Ankara Hotel & Convention Center', 'Noktalı Sokak No:1, Kavaklıdere, Çankaya', 39.90885, 32.86045, '+90 312 457 6000', 4.5),
  h('hotel', 'hilton-ankara', 'هيلتون أنقرة', 'Hilton Ankara', 'Tahran Caddesi No:12, Kavaklıdere, Çankaya', 39.90350, 32.86080, '+90 312 455 0000', 4.5),
  h('hotel', 'swissotel-ankara', 'سويس أوتيل أنقرة', 'Swissotel Ankara', 'Yıldızevler Mah. Jose Marti Cad. No:2, Çankaya', 39.88690, 32.85580, '+90 312 409 3000', 4.6),
  h('hotel', 'crowne-plaza-ankara', 'كراون بلازا أنقرة', 'Crowne Plaza Ankara', 'Hipodrom Caddesi No:11, Yenimahalle', 39.93690, 32.84720, '+90 312 310 0000', 4.4),
  h('hotel', 'divan-cukurambar', 'ديوان تشوكورامبار', 'Divan Ankara', 'Çukurambar Mahallesi, 1476. Sokak, Çankaya', 39.90105, 32.80915, '+90 312 551 0000', 4.5),
  h('hotel', 'dedeman-ankara', 'ديديمان أنقرة', 'Dedeman Ankara', 'Büklüm Sokak No:1, Kavaklıdere, Çankaya', 39.91715, 32.85985, '+90 312 410 6400', 4.4),
  h('hotel', 'point-hotel-ankara', 'بوينت هوتيل أنقرة', 'Point Hotel Ankara', 'Meşrutiyet Caddesi, Kızılay, Çankaya', 39.92005, 32.85435, '+90 312 416 0000', 4.4),
  h('hotel', 'ickale-ankara', 'إتشكاله أنقرة', 'Hotel Ickale Ankara', 'Kalealtı Sokak, Ulus, Altındağ', 39.94115, 32.86305, '+90 312 309 1111', 4.3),
  h('hotel', 'movenpick-ankara', 'موفنبيك أنقرة', 'Movenpick Hotel Ankara', 'Söğütözü Mahallesi, Çankaya', 39.91045, 32.80185, '+90 312 570 0000', 4.5),
  h('hotel', 'buyuk-anadolu-ankara', 'بيوك أناضول أنقرة', 'Ankara Buyuk Anadolu Hotel', 'Opera Meydanı, Altındağ', 39.93750, 32.85910, '+90 312 309 5050', 4.3),
  h('hotel', 'gordion-ankara', 'غورديون أنقرة', 'Gordion Hotel Ankara', 'Büklüm Sokak, Kavaklıdere, Çankaya', 39.90835, 32.85965, '+90 312 427 8080', 4.4),
  h('hotel', 'midas-ankara', 'ميداس أنقرة', 'Hotel Midas Ankara', 'Opera Meydanı, Altındağ', 39.93620, 32.85740, '+90 312 310 5050', 4.3),
  h('hotel', 'holiday-inn-kavaklidere', 'هوليداي إن كافاكلديره', 'Holiday Inn Ankara Kavaklidere', 'Bestekar Sokak, Kavaklıdere, Çankaya', 39.90515, 32.85935, '+90 312 409 0000', 4.4),
  h('hotel', 'hampton-downtown-ankara', 'هامبتون داون تاون أنقرة', 'Hampton by Hilton Ankara Downtown', 'Ziya Gökalp Caddesi, Kızılay, Çankaya', 39.91940, 32.85405, '+90 312 416 1616', 4.4),
  h('hotel', 'ibis-esenboga', 'إيبيس أسنبوغا', 'ibis Ankara Airport', 'Esenboğa Havalimanı, Akyurt', 40.11990, 33.00740, '+90 312 590 0000', 4.2),
  h('hotel', 'novotel-ankara', 'نوفوتيل أنقرة', 'Novotel Ankara', 'Söğütözü Mahallesi, Çankaya', 39.91005, 32.80040, '+90 312 219 0000', 4.4),
  h('hotel', 'anemon-ankara', 'أنيمون أنقرة', 'Anemon Ankara Hotel', 'Kızılay, Çankaya', 39.91985, 32.85455, '+90 312 417 0080', 4.3),
  h('hotel', 'president-ankara', 'ذا برزيدنت أنقرة', 'The President Hotel Ankara', 'Gazi Mustafa Kemal Bulvarı, Kızılay', 39.92055, 32.85365, '+90 312 417 0000', 4.3),
  h('hotel', 'bera-ankara', 'بيرا أنقرة', 'Bera Ankara Hotel', 'Kızılay, Çankaya', 39.91885, 32.85275, '+90 312 418 1818', 4.3),
  h('hotel', 'neva-palas', 'نيفا بالاس', 'Neva Palas Hotel Ankara', 'İzmir Caddesi, Kızılay, Çankaya', 39.92135, 32.85515, '+90 312 419 1234', 4.3),
  h('hotel', 'tunali-hotel', 'تونالي هوتيل', 'Hotel Tunali Ankara', 'Tunalı Hilmi Caddesi, Kavaklıdere', 39.90975, 32.86005, '+90 312 467 4440', 4.4),
  h('hotel', 'aldino-ankara', 'ألدينو أنقرة', 'Aldino Hotel Ankara', 'Kızılay, Çankaya', 39.92105, 32.85595, '+90 312 418 3030', 4.2),
  h('hotel', 'dafne-sultan', 'دافني سلطان', 'Hotel Dafne Sultan Ankara', 'Kızılay, Çankaya', 39.92025, 32.85545, '+90 312 419 0909', 4.3),
  h('hotel', 'cinel-ankara', 'سينيل أنقرة', 'Hotel Cinel Ankara', 'Kızılay, Çankaya', 39.92065, 32.85425, '+90 312 417 2727', 4.2),
  h('hotel', 'cp-ankara', 'سي بي أنقرة', 'CP Ankara Hotel', 'Kızılay, Çankaya', 39.91915, 32.85385, '+90 312 418 4040', 4.2),
  h('hotel', 'gold-ankara', 'غولد أنقرة', 'Hotel Gold Ankara', 'Kızılay, Çankaya', 39.92155, 32.85705, '+90 312 431 3131', 4.2),
  h('hotel', 'ustay-ankara', 'أوستاي أنقرة', 'Ustay Hotel Ankara', 'Kızılay, Çankaya', 39.92205, 32.85635, '+90 312 419 2220', 4.2),
  h('hotel', 'eyuboglu-ankara', 'أيوب أوغلو أنقرة', 'Hotel Eyuboglu Ankara', 'Kızılay, Çankaya', 39.91835, 32.85575, '+90 312 417 1515', 4.2),
  h('hotel', 'check-inn-ankara', 'تشيك إن أنقرة', 'Check Inn Hotel Ankara', 'Kızılay, Çankaya', 39.91895, 32.85485, '+90 312 418 0808', 4.2),
  h('hotel', 'verida-ankara', 'فيريدا أنقرة', 'Verida Hotel Ankara', 'Kavaklıdere, Çankaya', 39.90885, 32.85875, '+90 312 468 0000', 4.3),
  h('hotel', 'ankara-plaza', 'أنقرة بلازا', 'Ankara Plaza Hotel', 'Kızılay, Çankaya', 39.92025, 32.85345, '+90 312 417 7000', 4.3),
  h('hotel', 'best-western-ankara', 'بست ويسترن أنقرة', 'Best Western Plus Hotel Ankara', 'Kızılay, Çankaya', 39.91775, 32.85445, '+90 312 417 8800', 4.3),
  h('hotel', 'ibis-styles-cukurambar', 'إيبيس ستايلز تشوكورامبار', 'ibis Styles Ankara Cukurambar', 'Çukurambar, Çankaya', 39.90145, 32.81035, '+90 312 220 2020', 4.3),
  h('hotel', 'wyndham-ankara', 'ويندهام أنقرة', 'Wyndham Ankara', 'Çukurambar, Çankaya', 39.90035, 32.80855, '+90 312 248 0808', 4.4),
  h('hotel', 'lugal-ankara', 'لوغال أنقرة', 'The Lugal a Luxury Collection Hotel Ankara', 'Kavaklıdere, Çankaya', 39.91075, 32.86015, '+90 312 457 8000', 4.6),
  h('resort', 'green-park-ankara', 'غرين بارك أنقرة', 'The Green Park Hotel Ankara', 'Eskişehir Yolu 7. km, Çankaya', 39.90760, 32.77690, '+90 312 219 0000', 4.4),
  h('resort', 'limak-thermal-kizilcahamam', 'ليماك ثيرمال قزلجه حمام', 'Limak Thermal Boutique Hotel Kizilcahamam', 'Kızılcahamam, Ankara', 40.46980, 32.65040, '+90 312 736 0000', 4.5),
  h('resort', 'cam-hotel-thermal', 'تشام هوتيل ثيرمال', 'Cam Hotel Thermal Kizilcahamam', 'Kızılcahamam, Ankara', 40.47220, 32.64780, '+90 312 736 1212', 4.4),
  h('resort', 'patalya-thermal', 'باتاليا ثيرمال', 'Patalya Thermal Resort Hotel', 'Kızılcahamam, Ankara', 40.47050, 32.65210, '+90 312 736 2020', 4.5),
  h('resort', 'sahinler-thermal', 'شاهينلر ثيرمال', 'Sahinler Thermal Hotel Kizilcahamam', 'Kızılcahamam, Ankara', 40.46890, 32.64920, '+90 312 736 3030', 4.3),
  h('resort', 'kizilcahamam-thermal', 'قزلجه حمام ثيرمال', 'Kizilcahamam Thermal Hotel', 'Kızılcahamam, Ankara', 40.47100, 32.65100, '+90 312 736 4040', 4.3),
  h('resort', 'camlica-thermal', 'تشاملجا ثيرمال', 'Camlica Thermal Hotel Kizilcahamam', 'Kızılcahamam, Ankara', 40.47350, 32.64650, '+90 312 736 5050', 4.3),
  h('resort', 'mogan-golbasi', 'موغان غولباشي', 'Mogan Lake Hotel Golbasi', 'Gölbaşı, Ankara', 39.78300, 32.80500, '+90 312 484 0000', 4.3),
  h('resort', 'doubletree-incek', 'دبل تري إنجك', 'DoubleTree by Hilton Ankara Incek', 'İncek, Gölbaşı', 39.81840, 32.73650, '+90 312 970 0000', 4.5),
  h('resort', 'eliz-inn-kizilcahamam', 'إليز إن قزلجه حمام', 'Eliz Inn Thermal Hotel Kizilcahamam', 'Kızılcahamam, Ankara', 40.46920, 32.65180, '+90 312 736 6060', 4.3),
  h('resort', 'asya-thermal-kizilcahamam', 'آسيا ثيرمال', 'Asya Thermal Hotel Kizilcahamam', 'Kızılcahamam, Ankara', 40.47080, 32.64840, '+90 312 736 7070', 4.3),
  h('resort', 'basak-thermal', 'باشاك ثيرمال', 'Basak Thermal Hotel Kizilcahamam', 'Kızılcahamam, Ankara', 40.47280, 32.65020, '+90 312 736 8080', 4.2),
];

export const ANKARA_HOTEL_SEEDS = withUniqueHotelImages(ANKARA_HOTEL_RAW);
assertUniqueHotelImages(ANKARA_HOTEL_SEEDS);
