import { assertUniqueHotelImages, withUniqueHotelImages, type HotelPlaceKind } from '@/lib/hotelPhotos';

export type { HotelPlaceKind };

export interface IstanbulHotelSeed {
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
): IstanbulHotelSeed {
  return { slug, name, name_en, address, lat, lng, phone, rating, place_kind: kind };
}

/** 54 distinct Istanbul hotels and resorts with real coordinates across the metro area. */
const ISTANBUL_HOTEL_RAW: IstanbulHotelSeed[] = [
  h('hotel', 'pera-palace', 'فندق بيرا بالاس', 'Pera Palace Hotel Istanbul', 'Meşrutiyet Caddesi No:52, Tepebaşı, Beyoğlu', 41.03105, 28.97347, '+90 212 377 4000', 4.7),
  h('hotel', 'four-seasons-sultanahmet', 'فور سيزونز السلطان أحمد', 'Four Seasons Hotel Istanbul at Sultanahmet', 'Tevkifhane Sokak No:1, Sultanahmet', 41.00647, 28.98018, '+90 212 402 3000', 4.8),
  h('hotel', 'hilton-bosphorus', 'هيلتون إسطنبول البوسفور', 'Hilton Istanbul Bosphorus', 'Cumhuriyet Caddesi No:50, Harbiye', 41.04435, 28.98965, '+90 212 315 6000', 4.6),
  h('hotel', 'ritz-carlton', 'ريتز كارلتون إسطنبول', 'The Ritz-Carlton Istanbul', 'Suzer Plaza, Asker Ocağı Cad. No:15, Şişli', 41.04190, 28.98980, '+90 212 334 4444', 4.7),
  h('hotel', 'intercontinental', 'إنتركونتيننتال إسطنبول', 'InterContinental Istanbul', 'Asker Ocağı Caddesi No:1, Taksim', 41.04170, 28.98720, '+90 212 368 4444', 4.6),
  h('hotel', 'grand-hyatt-taksim', 'غراند حياة تقسيم', 'Grand Hyatt Istanbul', 'Taşkışla Caddesi No:1, Taksim', 41.04190, 28.98810, '+90 212 368 1234', 4.6),
  h('hotel', 'marmara-taksim', 'مرمرة تقسيم', 'The Marmara Taksim', 'Taksim Square, Beyoğlu', 41.03690, 28.98500, '+90 212 251 4696', 4.5),
  h('hotel', 'peninsula-karakoy', 'ذا بيننسولا قركوي', 'The Peninsula Istanbul', 'Kemankeş Karamustafa Paşa, Karaköy', 41.02560, 28.97390, '+90 212 244 2222', 4.8),
  h('hotel', 'raffles-zorlu', 'رافلز زورلو', 'Raffles Istanbul', 'Zorlu Center, Levazım, Beşiktaş', 41.06780, 29.01470, '+90 212 924 0200', 4.8),
  h('hotel', 'st-regis-nisantasi', 'سانت ريجيس نيشانتشي', 'The St. Regis Istanbul', 'Mim Kemal Öke Caddesi, Nişantaşı, Şişli', 41.04890, 28.99280, '+90 212 368 0000', 4.7),
  h('hotel', 'w-istanbul', 'دبليو إسطنبول', 'W Istanbul', 'Süleyman Seba Caddesi No:22, Beşiktaş', 41.04220, 29.00780, '+90 212 381 2121', 4.5),
  h('hotel', 'conrad-bosphorus', 'كونراد إسطنبول البوسفور', 'Conrad Istanbul Bosphorus', 'Cihannüma, Beşiktaş', 41.04300, 29.00900, '+90 212 310 2525', 4.6),
  h('hotel', 'divan-istanbul', 'ديوان إسطنبول', 'Divan Istanbul', 'Asker Ocağı Caddesi No:1, Taksim', 41.04280, 28.98800, '+90 212 315 5500', 4.5),
  h('hotel', 'fairmont-quasar', 'فيرمونت كوازار إسطنبول', 'Fairmont Quasar Istanbul', 'Büyükdere Caddesi, Şişli', 41.07850, 28.99250, '+90 212 403 8500', 4.6),
  h('hotel', 'marriott-sisli', 'ماريوت شيشلي', 'Istanbul Marriott Hotel Sisli', 'Halaskargazi Caddesi, Şişli', 41.06380, 28.98720, '+90 212 373 4444', 4.5),
  h('hotel', 'radisson-sisli', 'راديسون بلو شيشلي', 'Radisson Blu Hotel Istanbul Sisli', 'Halaskargazi Caddesi, Şişli', 41.06300, 28.98750, '+90 212 375 0000', 4.5),
  h('hotel', 'point-taksim', 'بوينت هوتيل تقسيم', 'Point Hotel Taksim', 'Topçu Caddesi, Taksim, Beyoğlu', 41.03850, 28.98650, '+90 212 313 5000', 4.4),
  h('hotel', 'soho-house', 'سوهو هاوس إسطنبول', 'Soho House Istanbul', 'Meşrutiyet Caddesi, Beyoğlu', 41.03180, 28.97450, '+90 212 377 7100', 4.6),
  h('hotel', 'georges-galata', 'جورجيس غلطة', 'Georges Hotel Galata', 'Serdar-ı Ekrem Caddesi, Galata, Beyoğlu', 41.02480, 28.97450, '+90 212 244 2424', 4.5),
  h('hotel', 'vault-karakoy', 'فولت قركوي', 'Vault Karakoy The House Hotel', 'Bankalar Caddesi, Karaköy', 41.02350, 28.97300, '+90 212 244 6400', 4.6),
  h('hotel', 'tomtom-suites', 'توم توم سويتس', 'Tomtom Suites', 'Boğazkesen Caddesi, Beyoğlu', 41.02950, 28.97700, '+90 212 292 1212', 4.5),
  h('hotel', 'ajwa-sultanahmet', 'أجوى السلطان أحمد', 'Ajwa Hotel Sultanahmet', 'Mimar Mehmet Ağa Caddesi, Sultanahmet', 41.00820, 28.97580, '+90 212 517 7173', 4.6),
  h('hotel', 'ibrahim-pasha', 'إبراهيم باشا', 'Ibrahim Pasha Hotel', 'Terzihane Sokak, Sultanahmet', 41.00620, 28.97550, '+90 212 518 0394', 4.6),
  h('hotel', 'armada-old-city', 'أرمادا المدينة القديمة', 'Armada Istanbul Old City Hotel', 'Ahırkapı Sokak, Cankurtaran, Fatih', 41.00480, 28.98200, '+90 212 455 4455', 4.5),
  h('hotel', 'sura-hagia-sophia', 'سورا آيا صوفيا', 'Hotel Sura Hagia Sophia', 'Ticarethane Sokak, Sultanahmet', 41.00550, 28.97800, '+90 212 516 3232', 4.5),
  h('hotel', 'neorion', 'نيوريون', 'Neorion Hotel', 'Orhaniye Caddesi, Sirkeci, Fatih', 41.01680, 28.97520, '+90 212 527 9090', 4.6),
  h('hotel', 'legacy-ottoman', 'ليغاسي عثماني', 'Legacy Ottoman Hotel', 'Hobyar Mahallesi, Eminönü, Fatih', 41.01620, 28.97080, '+90 212 528 0808', 4.5),
  h('hotel', 'celal-sultan', 'جلال سلطان', 'Celal Sultan Hotel', 'Salkımsöğüt Sokak, Sultanahmet', 41.00780, 28.97850, '+90 212 520 0670', 4.5),
  h('hotel', 'amira-istanbul', 'أميرة إسطنبول', 'Hotel Amira Istanbul', 'Küçük Ayasofya Caddesi, Fatih', 41.00510, 28.97390, '+90 212 458 4666', 4.6),
  h('hotel', 'crowne-plaza-harbiye', 'كراون بلازا حربية', 'Crowne Plaza Istanbul Harbiye', 'Harbiye, Şişli', 41.04700, 28.98850, '+90 212 373 3000', 4.4),
  h('hotel', 'dedeman-istanbul', 'ديديمان إسطنبول', 'Dedeman Istanbul', 'Yıldız Posta Caddesi, Esentepe, Şişli', 41.06000, 28.99200, '+90 212 337 4400', 4.4),
  h('hotel', 'doubletree-piyalepasa', 'دبل تري بيلالباشا', 'DoubleTree by Hilton Istanbul Piyalepasa', 'Piyalepaşa Bulvarı, Beyoğlu', 41.04550, 28.97100, '+90 212 313 7070', 4.5),
  h('hotel', 'hilton-garden-golden-horn', 'هيلتون غاردن القرن الذهبي', 'Hilton Garden Inn Istanbul Golden Horn', 'Haliç, Eyüpsultan', 41.03800, 28.94900, '+90 212 314 5050', 4.4),
  h('hotel', 'jw-marriott-bomonti', 'جي دبليو ماريوت بومونتي', 'JW Marriott Istanbul Bosphorus', 'Cendere Caddesi, Bomonti, Şişli', 41.05900, 28.97850, '+90 212 214 2060', 4.6),
  h('hotel', 'mercure-taksim', 'ميركيور تقسيم', 'Mercure Istanbul Taksim', 'Abide-i Hürriyet Caddesi, Taksim', 41.03750, 28.98400, '+90 212 313 2020', 4.4),
  h('hotel', 'ibis-taksim', 'إيبيس تقسيم', 'Ibis Istanbul Taksim', 'Eskişehir Caddesi, Taksim, Beyoğlu', 41.03900, 28.97950, '+90 212 393 8000', 4.3),
  h('resort', 'ciragan-kempinski', 'تشيراغان بالاس كمبينسكي', 'Ciragan Palace Kempinski Istanbul', 'Çırağan Caddesi No:32, Beşiktaş', 41.04355, 29.01695, '+90 212 326 4646', 4.8),
  h('resort', 'shangri-la-bosphorus', 'شانغريلا البوسفور', 'Shangri-La Bosphorus Istanbul', 'Hayrettin İskelesi Sokak, Beşiktaş', 41.04140, 29.01640, '+90 212 275 8888', 4.7),
  h('resort', 'swissotel-bosphorus', 'سويس أوتيل البوسفور', 'Swissotel The Bosphorus Istanbul', 'Bayıldım Caddesi No:2, Maçka, Beşiktaş', 41.04190, 29.01170, '+90 212 326 1100', 4.6),
  h('resort', 'four-seasons-bosphorus', 'فور سيزونز البوسفور', 'Four Seasons Hotel Istanbul at the Bosphorus', 'Çırağan Caddesi No:28, Beşiktaş', 41.04740, 29.01780, '+90 212 381 4000', 4.8),
  h('resort', 'cvk-park-bosphorus', 'سي في كيه بارك البوسفور', 'CVK Park Bosphorus Hotel Istanbul', 'Gümüşsuyu, Beyoğlu', 41.04110, 29.01080, '+90 212 372 4242', 4.6),
  h('resort', 'mandarin-oriental-bosphorus', 'ماندرين أورينتال البوسفور', 'Mandarin Oriental Bosphorus Istanbul', 'Salhane Sokak, Beşiktaş', 41.04780, 29.04300, '+90 212 371 1111', 4.8),
  h('resort', 'six-senses-kocatas', 'سيكس سنسز كوجاتاش', 'Six Senses Kocatas Mansions Istanbul', 'Sarıyer Caddesi, Sarıyer', 41.10850, 29.05720, '+90 212 363 6363', 4.8),
  h('resort', 'grand-tarabya', 'جراند طرابيا', 'Grand Tarabya Hotel', 'Kefeliköy Caddesi, Tarabya, Sarıyer', 41.13800, 29.04700, '+90 212 363 3300', 4.5),
  h('resort', 'sumahan-water', 'سوماهان على الماء', 'Sumahan on the Water', 'Kuleli Caddesi, Çengelköy, Üsküdar', 41.09020, 29.05540, '+90 216 422 8000', 4.7),
  h('resort', 'ajia-hotel', 'آجيا هوتيل', "A'jia Hotel", 'Çengelköy, Üsküdar', 41.08640, 29.05510, '+90 216 413 9300', 4.6),
  h('resort', 'les-ottomans', 'لي أوتومان', 'Hotel Les Ottomans', 'Muallim Naci Caddesi, Ortaköy, Beşiktaş', 41.05450, 29.03300, '+90 212 359 1500', 4.7),
  h('resort', 'wyndham-kalamis', 'ويندهام كالاميش مارينا', 'Wyndham Grand Istanbul Kalamis Marina', 'Fenerbahçe, Kadıköy', 40.97820, 29.03580, '+90 216 542 4343', 4.5),
  h('resort', 'renaissance-polat', 'رينيسانس بولات', 'Renaissance Polat Istanbul Hotel', 'Sahil Yolu, Yeşilköy, Bakırköy', 40.97180, 28.82150, '+90 212 414 1800', 4.5),
  h('resort', 'sheraton-atakoy', 'شيراتون أتاكوي', 'Sheraton Istanbul Atakoy', 'Ataköy, Bakırköy', 40.98250, 28.85100, '+90 212 414 0000', 4.5),
  h('resort', 'house-hotel-bosphorus', 'هاوس هوتيل أورتاكوي', 'The House Hotel Bosphorus', 'Salhane Sokak, Ortaköy, Beşiktaş', 41.04800, 29.02650, '+90 212 327 7780', 4.6),
  h('resort', 'adile-sultan', 'أديل سلطان', 'Adile Sultan Palace', 'Çengelköy, Üsküdar', 41.02620, 29.05580, '+90 216 422 1551', 4.5),
  h('resort', 'green-park-bostanci', 'غرين بارك بستانجي', 'The Green Park Bostanci', 'Bostancı, Kadıköy', 40.96380, 29.09450, '+90 216 571 1111', 4.4),
  h('resort', 'crowne-plaza-ortakoy', 'كراون بلازا أورتاكوي', 'Crowne Plaza Istanbul Ortakoy', 'Ortaköy, Beşiktaş', 41.04750, 29.02780, '+90 212 410 0404', 4.5),
];

export const ISTANBUL_HOTEL_SEEDS = withUniqueHotelImages(ISTANBUL_HOTEL_RAW);
assertUniqueHotelImages(ISTANBUL_HOTEL_SEEDS);
