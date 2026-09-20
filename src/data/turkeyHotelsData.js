/**
 * Local Turkey hotels & resorts catalog.
 * Real named properties with published coordinates — no live API required.
 */

function wiki(file) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`;
}

function h(id, kind, name, nameEn, city, cityAr, address, lat, lng, phone, rating, images = []) {
  return { id, kind, name, nameEn, city, cityAr, address, lat, lng, phone, rating, images };
}

const IST = 'Istanbul';
const IST_AR = 'إسطنبول';
const ANK = 'Ankara';
const ANK_AR = 'أنقرة';
const ANT = 'Antalya';
const ANT_AR = 'أنطاليا';
const TRB = 'Trabzon';
const TRB_AR = 'ترابزون';
const NEV = 'Nevsehir';
const NEV_AR = 'كابادوكيا';
const BOD = 'Bodrum';
const BOD_AR = 'بودروم';
const IZM = 'Izmir';
const IZM_AR = 'إزمير';
const ALA = 'Alanya';
const ALA_AR = 'ألانية';
const FET = 'Fethiye';
const FET_AR = 'فتحية';

/** @type {Array<{id:string,kind:'hotel'|'resort',name:string,nameEn:string,city:string,cityAr:string,address:string,lat:number,lng:number,phone:string,rating:number,images:string[]}>} */
export const TURKEY_HOTELS_DATA = [
  // Istanbul
  h('pera-palace', 'hotel', 'فندق بيرا بالاس', 'Pera Palace Hotel Istanbul', IST, IST_AR, 'Meşrutiyet Caddesi No:52, Tepebaşı, Beyoğlu', 41.03105, 28.97347, '+90 212 377 4000', 4.7, [wiki('Istanbul asv2020-02 img39 Pera Palace Hotel.jpg')]),
  h('four-seasons-sultanahmet', 'hotel', 'فور سيزونز السلطان أحمد', 'Four Seasons Hotel Istanbul at Sultanahmet', IST, IST_AR, 'Tevkifhane Sokak No:1, Sultanahmet', 41.00647, 28.98018, '+90 212 402 3000', 4.8, [wiki('Four Seasons Sultanahmet March 2008.JPG')]),
  h('hilton-bosphorus', 'hotel', 'هيلتون إسطنبول البوسفور', 'Hilton Istanbul Bosphorus', IST, IST_AR, 'Cumhuriyet Caddesi No:50, Harbiye', 41.04435, 28.98965, '+90 212 315 6000', 4.6, [wiki('Hilton Istanbul Bosphorus.jpg')]),
  h('ritz-carlton', 'hotel', 'ريتز كارلتون إسطنبول', 'The Ritz-Carlton Istanbul', IST, IST_AR, 'Suzer Plaza, Asker Ocağı Cad. No:15, Şişli', 41.04190, 28.98980, '+90 212 334 4444', 4.7, [wiki('Ritz-Carlton, Istanbul.jpg')]),
  h('intercontinental', 'hotel', 'إنتركونتيننتال إسطنبول', 'InterContinental Istanbul', IST, IST_AR, 'Asker Ocağı Caddesi No:1, Taksim', 41.04170, 28.98720, '+90 212 368 4444', 4.6, [wiki('Intercontinental Hotel Istanbul.jpg')]),
  h('grand-hyatt-taksim', 'hotel', 'غراند حياة تقسيم', 'Grand Hyatt Istanbul', IST, IST_AR, 'Taşkışla Caddesi No:1, Taksim', 41.04190, 28.98810, '+90 212 368 1234', 4.6, [wiki('Grand Hyatt Istanbul.jpg')]),
  h('marmara-taksim', 'hotel', 'مرمرة تقسيم', 'The Marmara Taksim', IST, IST_AR, 'Taksim Square, Beyoğlu', 41.03690, 28.98500, '+90 212 251 4696', 4.5, [wiki('The Marmara Istanbul 1.jpg')]),
  h('peninsula-karakoy', 'hotel', 'ذا بيننسولا قركوي', 'The Peninsula Istanbul', IST, IST_AR, 'Kemankeş Karamustafa Paşa, Karaköy', 41.02560, 28.97390, '+90 212 244 2222', 4.8),
  h('raffles-zorlu', 'hotel', 'رافلز زورلو', 'Raffles Istanbul', IST, IST_AR, 'Zorlu Center, Levazım, Beşiktaş', 41.06780, 29.01470, '+90 212 924 0200', 4.8),
  h('st-regis-nisantasi', 'hotel', 'سانت ريجيس نيشانتشي', 'The St. Regis Istanbul', IST, IST_AR, 'Mim Kemal Öke Caddesi, Nişantaşı, Şişli', 41.04890, 28.99280, '+90 212 368 0000', 4.7),
  h('w-istanbul', 'hotel', 'دبليو إسطنبول', 'W Istanbul', IST, IST_AR, 'Süleyman Seba Caddesi No:22, Beşiktaş', 41.04220, 29.00780, '+90 212 381 2121', 4.5),
  h('conrad-bosphorus', 'hotel', 'كونراد إسطنبول البوسفور', 'Conrad Istanbul Bosphorus', IST, IST_AR, 'Cihannüma, Beşiktaş', 41.04300, 29.00900, '+90 212 310 2525', 4.6, [wiki('Conrad Istanbul Bosphorus.jpg')]),
  h('divan-istanbul', 'hotel', 'ديوان إسطنبول', 'Divan Istanbul', IST, IST_AR, 'Asker Ocağı Caddesi No:1, Taksim', 41.04280, 28.98800, '+90 212 315 5500', 4.5),
  h('fairmont-quasar', 'hotel', 'فيرمونت كوازار إسطنبول', 'Fairmont Quasar Istanbul', IST, IST_AR, 'Büyükdere Caddesi, Şişli', 41.07850, 28.99250, '+90 212 403 8500', 4.6, [wiki('Quasar Istanbul and Fairmont.jpg')]),
  h('marriott-sisli', 'hotel', 'ماريوت شيشلي', 'Istanbul Marriott Hotel Sisli', IST, IST_AR, 'Halaskargazi Caddesi, Şişli', 41.06380, 28.98720, '+90 212 373 4444', 4.5),
  h('radisson-sisli', 'hotel', 'راديسون بلو شيشلي', 'Radisson Blu Hotel Istanbul Sisli', IST, IST_AR, 'Halaskargazi Caddesi, Şişli', 41.06300, 28.98750, '+90 212 375 0000', 4.5),
  h('point-taksim', 'hotel', 'بوينت هوتيل تقسيم', 'Point Hotel Taksim', IST, IST_AR, 'Topçu Caddesi, Taksim, Beyoğlu', 41.03850, 28.98650, '+90 212 313 5000', 4.4),
  h('soho-house', 'hotel', 'سوهو هاوس إسطنبول', 'Soho House Istanbul', IST, IST_AR, 'Meşrutiyet Caddesi, Beyoğlu', 41.03180, 28.97450, '+90 212 377 7100', 4.6, [wiki('Garden of Soho House Istanbul.jpg')]),
  h('georges-galata', 'hotel', 'جورجيس غلطة', 'Georges Hotel Galata', IST, IST_AR, 'Serdar-ı Ekrem Caddesi, Galata, Beyoğlu', 41.02480, 28.97450, '+90 212 244 2424', 4.5),
  h('vault-karakoy', 'hotel', 'فولت قركوي', 'Vault Karakoy The House Hotel', IST, IST_AR, 'Bankalar Caddesi, Karaköy', 41.02350, 28.97300, '+90 212 244 6400', 4.6),
  h('tomtom-suites', 'hotel', 'توم توم سويتس', 'Tomtom Suites', IST, IST_AR, 'Boğazkesen Caddesi, Beyoğlu', 41.02950, 28.97700, '+90 212 292 1212', 4.5),
  h('ajwa-sultanahmet', 'hotel', 'أجوى السلطان أحمد', 'Ajwa Hotel Sultanahmet', IST, IST_AR, 'Mimar Mehmet Ağa Caddesi, Sultanahmet', 41.00820, 28.97580, '+90 212 517 7173', 4.6),
  h('ibrahim-pasha', 'hotel', 'إبراهيم باشا', 'Ibrahim Pasha Hotel', IST, IST_AR, 'Terzihane Sokak, Sultanahmet', 41.00620, 28.97550, '+90 212 518 0394', 4.6),
  h('armada-old-city', 'hotel', 'أرمادا المدينة القديمة', 'Armada Istanbul Old City Hotel', IST, IST_AR, 'Ahırkapı Sokak, Cankurtaran, Fatih', 41.00480, 28.98200, '+90 212 455 4455', 4.5),
  h('sura-hagia-sophia', 'hotel', 'سورا آيا صوفيا', 'Hotel Sura Hagia Sophia', IST, IST_AR, 'Ticarethane Sokak, Sultanahmet', 41.00550, 28.97800, '+90 212 516 3232', 4.5),
  h('neorion', 'hotel', 'نيوريون', 'Neorion Hotel', IST, IST_AR, 'Orhaniye Caddesi, Sirkeci, Fatih', 41.01680, 28.97520, '+90 212 527 9090', 4.6),
  h('legacy-ottoman', 'hotel', 'ليغاسي عثماني', 'Legacy Ottoman Hotel', IST, IST_AR, 'Hobyar Mahallesi, Eminönü, Fatih', 41.01620, 28.97080, '+90 212 528 0808', 4.5),
  h('celal-sultan', 'hotel', 'جلال سلطان', 'Celal Sultan Hotel', IST, IST_AR, 'Salkımsöğüt Sokak, Sultanahmet', 41.00780, 28.97850, '+90 212 520 0670', 4.5),
  h('amira-istanbul', 'hotel', 'أميرة إسطنبول', 'Hotel Amira Istanbul', IST, IST_AR, 'Küçük Ayasofya Caddesi, Fatih', 41.00510, 28.97390, '+90 212 458 4666', 4.6),
  h('crowne-plaza-harbiye', 'hotel', 'كراون بلازا حربية', 'Crowne Plaza Istanbul Harbiye', IST, IST_AR, 'Harbiye, Şişli', 41.04700, 28.98850, '+90 212 373 3000', 4.4),
  h('dedeman-istanbul', 'hotel', 'ديديمان إسطنبول', 'Dedeman Istanbul', IST, IST_AR, 'Yıldız Posta Caddesi, Esentepe, Şişli', 41.06000, 28.99200, '+90 212 337 4400', 4.4),
  h('doubletree-piyalepasa', 'hotel', 'دبل تري بيلالباشا', 'DoubleTree by Hilton Istanbul Piyalepasa', IST, IST_AR, 'Piyalepaşa Bulvarı, Beyoğlu', 41.04550, 28.97100, '+90 212 313 7070', 4.5),
  h('hilton-garden-golden-horn', 'hotel', 'هيلتون غاردن القرن الذهبي', 'Hilton Garden Inn Istanbul Golden Horn', IST, IST_AR, 'Haliç, Eyüpsultan', 41.03800, 28.94900, '+90 212 314 5050', 4.4),
  h('jw-marriott-bomonti', 'hotel', 'جي دبليو ماريوت بومونتي', 'JW Marriott Istanbul Bosphorus', IST, IST_AR, 'Cendere Caddesi, Bomonti, Şişli', 41.05900, 28.97850, '+90 212 214 2060', 4.6),
  h('mercure-taksim', 'hotel', 'ميركيور تقسيم', 'Mercure Istanbul Taksim', IST, IST_AR, 'Abide-i Hürriyet Caddesi, Taksim', 41.03750, 28.98400, '+90 212 313 2020', 4.4),
  h('ibis-taksim', 'hotel', 'إيبيس تقسيم', 'Ibis Istanbul Taksim', IST, IST_AR, 'Eskişehir Caddesi, Taksim, Beyoğlu', 41.03900, 28.97950, '+90 212 393 8000', 4.3),
  h('ciragan-kempinski', 'resort', 'تشيراغان بالاس كمبينسكي', 'Ciragan Palace Kempinski Istanbul', IST, IST_AR, 'Çırağan Caddesi No:32, Beşiktaş', 41.04355, 29.01695, '+90 212 326 4646', 4.8, [wiki('Ciragan Palace 2014.JPG')]),
  h('shangri-la-bosphorus', 'resort', 'شانغريلا البوسفور', 'Shangri-La Bosphorus Istanbul', IST, IST_AR, 'Hayrettin İskelesi Sokak, Beşiktaş', 41.04140, 29.01640, '+90 212 275 8888', 4.7),
  h('swissotel-bosphorus', 'resort', 'سويس أوتيل البوسفور', 'Swissotel The Bosphorus Istanbul', IST, IST_AR, 'Bayıldım Caddesi No:2, Maçka, Beşiktaş', 41.04190, 29.01170, '+90 212 326 1100', 4.6, [wiki('Swissotel Istanbul.jpg')]),
  h('four-seasons-bosphorus', 'resort', 'فور سيزونز البوسفور', 'Four Seasons Hotel Istanbul at the Bosphorus', IST, IST_AR, 'Çırağan Caddesi No:28, Beşiktaş', 41.04740, 29.01780, '+90 212 381 4000', 4.8),
  h('cvk-park-bosphorus', 'resort', 'سي في كيه بارك البوسفور', 'CVK Park Bosphorus Hotel Istanbul', IST, IST_AR, 'Gümüşsuyu, Beyoğlu', 41.04110, 29.01080, '+90 212 372 4242', 4.6, [wiki('CVK Park Bosphorus Hotel, 2022.jpg')]),
  h('mandarin-oriental-bosphorus', 'resort', 'ماندرين أورينتال البوسفور', 'Mandarin Oriental Bosphorus Istanbul', IST, IST_AR, 'Salhane Sokak, Beşiktaş', 41.04780, 29.04300, '+90 212 371 1111', 4.8, [wiki('Mandarin Oriental Hotel and Residences.jpg')]),
  h('six-senses-kocatas', 'resort', 'سيكس سنسز كوجاتاش', 'Six Senses Kocatas Mansions Istanbul', IST, IST_AR, 'Sarıyer Caddesi, Sarıyer', 41.10850, 29.05720, '+90 212 363 6363', 4.8),
  h('grand-tarabya', 'resort', 'جراند طرابيا', 'Grand Tarabya Hotel', IST, IST_AR, 'Kefeliköy Caddesi, Tarabya, Sarıyer', 41.13800, 29.04700, '+90 212 363 3300', 4.5),
  h('sumahan-water', 'resort', 'سوماهان على الماء', 'Sumahan on the Water', IST, IST_AR, 'Kuleli Caddesi, Çengelköy, Üsküdar', 41.09020, 29.05540, '+90 216 422 8000', 4.7, [wiki('Sumahan on the Water, Cengelköy - panoramio.jpg')]),
  h('ajia-hotel', 'resort', 'آجيا هوتيل', "A'jia Hotel", IST, IST_AR, 'Çengelköy, Üsküdar', 41.08640, 29.05510, '+90 216 413 9300', 4.6),
  h('les-ottomans', 'resort', 'لي أوتومان', 'Hotel Les Ottomans', IST, IST_AR, 'Muallim Naci Caddesi, Ortaköy, Beşiktaş', 41.05450, 29.03300, '+90 212 359 1500', 4.7),
  h('wyndham-kalamis', 'resort', 'ويندهام كالاميش مارينا', 'Wyndham Grand Istanbul Kalamis Marina', IST, IST_AR, 'Fenerbahçe, Kadıköy', 40.97820, 29.03580, '+90 216 542 4343', 4.5),
  h('renaissance-polat', 'resort', 'رينيسانس بولات', 'Renaissance Polat Istanbul Hotel', IST, IST_AR, 'Sahil Yolu, Yeşilköy, Bakırköy', 40.97180, 28.82150, '+90 212 414 1800', 4.5),
  h('sheraton-atakoy', 'resort', 'شيراتون أتاكوي', 'Sheraton Istanbul Atakoy', IST, IST_AR, 'Ataköy, Bakırköy', 40.98250, 28.85100, '+90 212 414 0000', 4.5),
  h('house-hotel-bosphorus', 'resort', 'هاوس هوتيل أورتاكوي', 'The House Hotel Bosphorus', IST, IST_AR, 'Salhane Sokak, Ortaköy, Beşiktaş', 41.04800, 29.02650, '+90 212 327 7780', 4.6),
  h('adile-sultan', 'resort', 'أديل سلطان', 'Adile Sultan Palace', IST, IST_AR, 'Çengelköy, Üsküdar', 41.02620, 29.05580, '+90 216 422 1551', 4.5),
  h('green-park-bostanci', 'resort', 'غرين بارك بستانجي', 'The Green Park Bostanci', IST, IST_AR, 'Bostancı, Kadıköy', 40.96380, 29.09450, '+90 216 571 1111', 4.4),
  h('crowne-plaza-ortakoy', 'resort', 'كراون بلازا أورتاكوي', 'Crowne Plaza Istanbul Ortakoy', IST, IST_AR, 'Ortaköy, Beşiktaş', 41.04750, 29.02780, '+90 212 410 0404', 4.5),

  // Ankara
  h('new-park-ankara', 'hotel', 'نيو بارك أنقرة', 'New Park Hotel Ankara', ANK, ANK_AR, 'Ziya Gökalp Bulvarı No:58, Çankaya', 39.92035, 32.85905, '+90 312 431 2020', 4.4),
  h('jw-marriott-ankara', 'hotel', 'جي دبليو ماريوت أنقرة', 'JW Marriott Hotel Ankara', ANK, ANK_AR, 'Kızılırmak Mah. Ufuk Üniversitesi Cad. No:8, Söğütözü', 39.91015, 32.80135, '+90 312 220 0000', 4.6, [wiki('JW Marriott Hotel Ankara.jpg')]),
  h('sheraton-ankara', 'hotel', 'شيراتون أنقرة', 'Sheraton Ankara Hotel & Convention Center', ANK, ANK_AR, 'Noktalı Sokak No:1, Kavaklıdere', 39.90885, 32.86045, '+90 312 457 6000', 4.5, [wiki('Sheraton Ankara Hotel.jpg')]),
  h('hilton-ankara', 'hotel', 'هيلتون أنقرة', 'Hilton Ankara', ANK, ANK_AR, 'Tahran Caddesi No:12, Kavaklıdere', 39.90350, 32.86080, '+90 312 455 0000', 4.5, [wiki('Hilton, Sheraton Ve Karum - panoramio.jpg')]),
  h('swissotel-ankara', 'hotel', 'سويس أوتيل أنقرة', 'Swissotel Ankara', ANK, ANK_AR, 'Yıldızevler Mah. Jose Marti Cad. No:2, Çankaya', 39.88690, 32.85580, '+90 312 409 3000', 4.6),
  h('crowne-plaza-ankara', 'hotel', 'كراون بلازا أنقرة', 'Crowne Plaza Ankara', ANK, ANK_AR, 'Hipodrom Caddesi No:11, Yenimahalle', 39.93690, 32.84720, '+90 312 310 0000', 4.4, [wiki('Crowne Plaza Ankara.JPG')]),
  h('movenpick-ankara', 'hotel', 'موفنبيك أنقرة', 'Movenpick Hotel Ankara', ANK, ANK_AR, 'Söğütözü Mahallesi, Çankaya', 39.91045, 32.80185, '+90 312 570 0000', 4.5, [wiki('Mövenpick.JPG')]),
  h('ickale-ankara', 'hotel', 'إتشكاله أنقرة', 'Hotel Ickale Ankara', ANK, ANK_AR, 'Kalealtı Sokak, Ulus, Altındağ', 39.94115, 32.86305, '+90 312 309 1111', 4.3, [wiki('Ankara Ickale.JPG')]),
  h('buyuk-anadolu-ankara', 'hotel', 'بيوك أناضول أنقرة', 'Ankara Buyuk Anadolu Hotel', ANK, ANK_AR, 'Opera Meydanı, Altındağ', 39.93750, 32.85910, '+90 312 309 5050', 4.3, [wiki('Ankara Büyük Anadolu.JPG')]),
  h('hyatt-regency-ankara', 'hotel', 'هيات ريجنسي أنقرة', 'Hyatt Regency Ankara', ANK, ANK_AR, 'Gaziosmanpaşa, Çankaya', 39.89870, 32.87560, '+90 312 444 1234', 4.6),
  h('radisson-blu-cankaya', 'hotel', 'راديسون بلو تشانكايا', 'Radisson Blu Hotel Ankara', ANK, ANK_AR, 'Çukurambar Mahallesi, 1480. Cadde No:2', 39.90092, 32.80968, '+90 312 248 0000', 4.6),
  h('lugal-ankara', 'hotel', 'لوغال أنقرة', 'The Lugal a Luxury Collection Hotel Ankara', ANK, ANK_AR, 'Kavaklıdere, Çankaya', 39.91075, 32.86015, '+90 312 457 8000', 4.6),
  h('divan-cukurambar', 'hotel', 'ديوان تشوكورامبار', 'Divan Ankara', ANK, ANK_AR, 'Çukurambar Mahallesi, 1476. Sokak', 39.90105, 32.80915, '+90 312 551 0000', 4.5),
  h('dedeman-ankara', 'hotel', 'ديديمان أنقرة', 'Dedeman Ankara', ANK, ANK_AR, 'Büklüm Sokak No:1, Kavaklıdere', 39.91715, 32.85985, '+90 312 410 6400', 4.4),
  h('green-park-ankara', 'resort', 'غرين بارك أنقرة', 'The Green Park Hotel Ankara', ANK, ANK_AR, 'Eskişehir Yolu 7. km, Çankaya', 39.90760, 32.77690, '+90 312 219 0000', 4.4),
  h('doubletree-incek', 'resort', 'دبل تري إنجك', 'DoubleTree by Hilton Ankara Incek', ANK, ANK_AR, 'İncek, Gölbaşı', 39.81840, 32.73650, '+90 312 970 0000', 4.5),
  h('limak-thermal-kizilcahamam', 'resort', 'ليماك ثيرمال قزلجه حمام', 'Limak Thermal Boutique Hotel Kizilcahamam', ANK, ANK_AR, 'Kızılcahamam, Ankara', 40.46980, 32.65040, '+90 312 736 0000', 4.5),

  // Antalya / Lara / Belek / Kemer
  h('rixos-downtown-antalya', 'hotel', 'ريكسوس داون تاون أنطاليا', 'Rixos Downtown Antalya', ANT, ANT_AR, 'Sakıp Sabancı Bulvarı, Muratpaşa', 36.88420, 30.67080, '+90 242 249 4949', 4.6),
  h('marmara-antalya', 'hotel', 'مارمارا أنطاليا', 'The Marmara Antalya', ANT, ANT_AR, 'Lara Caddesi, Muratpaşa', 36.85180, 30.75240, '+90 242 249 3600', 4.5),
  h('crowne-plaza-antalya', 'hotel', 'كراون بلازا أنطاليا', 'Crowne Plaza Antalya', ANT, ANT_AR, 'Lara Caddesi, Muratpaşa', 36.85440, 30.74120, '+90 242 249 0505', 4.5),
  h('akra-hotel', 'hotel', 'أكرا أنطاليا', 'Akra Hotel Antalya', ANT, ANT_AR, 'Lara Caddesi, Muratpaşa', 36.86240, 30.73410, '+90 242 249 4949', 4.7),
  h('dedeman-antalya', 'hotel', 'ديديمان أنطاليا', 'Dedeman Antalya', ANT, ANT_AR, 'Lara Caddesi, Muratpaşa', 36.85880, 30.73240, '+90 242 247 0800', 4.4),
  h('hilton-garden-antalya', 'hotel', 'هيلتون غاردن أنطاليا', 'Hilton Garden Inn Antalya Downtown', ANT, ANT_AR, 'Meltem, Muratpaşa', 36.89640, 30.70520, '', 4.4),
  h('teras-city-antalya', 'hotel', 'تيرا سيتي أنطاليا', 'Teras City Hotel Antalya', ANT, ANT_AR, 'Şirinyalı Mahallesi, Muratpaşa', 36.86680, 30.72650, '', 4.4),
  h('titanic-mardan-palace', 'resort', 'تيتانيك مردان بالاس', 'Titanic Mardan Palace', ANT, ANT_AR, 'Kundu, Aksu, Antalya', 36.85140, 30.87750, '+90 242 310 3030', 4.6),
  h('titanic-beach-lara', 'resort', 'تيتانيك بيتش لارا', 'Titanic Beach Lara', ANT, ANT_AR, 'Lara, Muratpaşa', 36.85260, 30.76380, '+90 242 352 1010', 4.5),
  h('delphin-imperial-lara', 'resort', 'دلفين إمبريال لارا', 'Delphin Imperial Hotel Lara', ANT, ANT_AR, 'Lara, Muratpaşa', 36.85340, 30.77020, '+90 242 352 2727', 4.5),
  h('lara-barut-collection', 'resort', 'لارا باروت كولكشن', 'Lara Barut Collection', ANT, ANT_AR, 'Lara Caddesi, Muratpaşa', 36.85120, 30.74840, '+90 242 352 2000', 4.6),
  h('rixos-premium-belek', 'resort', 'ريكسوس بريميوم بيلك', 'Rixos Premium Belek', ANT, ANT_AR, 'Belek, Serik', 36.86200, 31.07020, '+90 242 710 4000', 4.7),
  h('maxx-royal-belek', 'resort', 'ماكس رويال بيلك', 'Maxx Royal Belek Golf Resort', ANT, ANT_AR, 'Belek, Serik', 36.85720, 31.07840, '+90 242 710 1700', 4.8),
  h('calista-luxury-belek', 'resort', 'كاليستا لاكشري بيلك', 'Calista Luxury Resort Belek', ANT, ANT_AR, 'Belek, Serik', 36.86310, 31.05560, '+90 242 710 0101', 4.6),
  h('susesi-luxury-belek', 'resort', 'سوسيسي لاكشري بيلك', 'Susesi Luxury Resort Belek', ANT, ANT_AR, 'Belek, Serik', 36.86040, 31.06280, '+90 242 710 2424', 4.6),
  h('paloma-grida-belek', 'resort', 'بالوما غريدا بيلك', 'Paloma Grida Resort & Spa Belek', ANT, ANT_AR, 'Belek, Serik', 36.85880, 31.04860, '+90 242 715 2525', 4.5),
  h('regnum-carya-belek', 'resort', 'ريغنوم كاريا بيلك', 'Regnum Carya Golf & Spa Resort', ANT, ANT_AR, 'Belek, Serik', 36.85840, 31.06640, '+90 242 710 0808', 4.6),
  h('limak-atlantis-belek', 'resort', 'ليماك أتلانتس بيلك', 'Limak Atlantis Deluxe Resort Belek', ANT, ANT_AR, 'Belek, Serik', 36.86120, 31.05220, '+90 242 710 0505', 4.5),
  h('kaya-palazzo-belek', 'resort', 'كايا بالازو بيلك', 'Kaya Palazzo Golf Resort Belek', ANT, ANT_AR, 'Belek, Serik', 36.85660, 31.07180, '+90 242 710 2000', 4.5),
  h('orange-county-kemer', 'resort', 'أورانج كاونتي كيمير', 'Orange County Resort Hotel Kemer', ANT, ANT_AR, 'Kemer, Antalya', 36.60280, 30.56040, '+90 242 824 0000', 4.5),
  h('rixos-tekirova', 'resort', 'ريكسوس تيكيروفا', 'Rixos Premium Tekirova', ANT, ANT_AR, 'Tekirova, Kemer', 36.51680, 30.52740, '+90 242 821 4400', 4.6),
  h('amara-dolce-vita', 'resort', 'أمارا دولتشي فيتا', 'Amara Dolce Vita Luxury', ANT, ANT_AR, 'Kemer, Antalya', 36.59840, 30.55820, '+90 242 814 4100', 4.5),

  // Alanya
  h('granada-luxury-okurcalar', 'resort', 'غرناطة لاكشري أوكورجلار', 'Granada Luxury Okurcalar', ALA, ALA_AR, 'Okurcalar, Alanya', 36.57580, 31.98060, '+90 242 527 4040', 4.5),
  h('delphin-deluxe-alanya', 'resort', 'دلفين ديلوكس ألانية', 'Delphin Deluxe Resort Alanya', ALA, ALA_AR, 'Mahmutlar, Alanya', 36.50120, 32.08940, '+90 242 533 2020', 4.5),
  h('kleopatra-royal-alanya', 'hotel', 'كليوباترا رويال ألانية', 'Kleopatra Royal Palm Hotel', ALA, ALA_AR, 'Kleopatra Beach, Alanya', 36.54980, 31.98860, '+90 242 513 1010', 4.3),
  h('goldcity-alanya', 'resort', 'غولد سيتي ألانية', 'Goldcity Hotel Alanya', ALA, ALA_AR, 'Kargıcak, Alanya', 36.48060, 32.12080, '+90 242 518 1818', 4.4),
  h('sunset-resort-alanya', 'resort', 'صن ست ألانية', 'Alanya Sunset Resort', ALA, ALA_AR, 'Oba, Alanya', 36.54420, 32.01240, '', 4.3),

  // Trabzon / Uzungol
  h('hilton-garden-trabzon', 'hotel', 'هيلتون غاردن طرابزون', 'Hilton Garden Inn Trabzon', TRB, TRB_AR, 'Kahramanmaraş Caddesi, Ortahisar', 41.00500, 39.72740, '', 4.4),
  h('park-dedeman-trabzon', 'hotel', 'بارك ديديمان طرابزون', 'Park Dedeman Trabzon', TRB, TRB_AR, 'Yomra / Kaşüstü', 40.96840, 39.83820, '', 4.3),
  h('radisson-blu-boztepe', 'hotel', 'راديسون بلو بوز تبه', 'Radisson Blu Hotel Trabzon', TRB, TRB_AR, 'Boztepe Çamlık Sokak, Ortahisar', 40.99708, 39.72997, '+90 462 455 0000', 4.4),
  h('zorlu-grand-trabzon', 'hotel', 'زورلو جراند طرابزون', 'Zorlu Grand Hotel Trabzon', TRB, TRB_AR, 'Maraş Caddesi, Ortahisar', 41.00640, 39.72860, '+90 462 326 8400', 4.5),
  h('novotel-trabzon', 'hotel', 'نوفوتيل طرابزون', 'Novotel Trabzon', TRB, TRB_AR, 'Yomra, Trabzon', 40.97380, 39.85240, '+90 462 455 2000', 4.4),
  h('grand-yavuz-trabzon', 'hotel', 'غراند ياوز طرابزون', 'Grand Yavuz Hotel Trabzon', TRB, TRB_AR, 'Ortahisar, Trabzon', 41.00580, 39.71650, '+90 462 326 4000', 4.3),
  h('inan-kardesler-uzungol', 'hotel', 'إينان كارداشلر أوزونغول', 'Inan Kardesler Hotel Uzungol', TRB, TRB_AR, 'Uzungöl, Çaykara', 40.62140, 40.29760, '+90 462 656 6322', 4.5),
  h('grand-uzungol', 'hotel', 'غراند أوزونغول', 'Grand Uzungol Hotel', TRB, TRB_AR, 'Uzungöl Göl Kenarı, Çaykara', 40.61790, 40.29380, '+90 462 656 6200', 4.4),
  h('natura-lodge-uzungol', 'hotel', 'ناتورا لودج أوزونغول', 'Natura Lodge Uzungol', TRB, TRB_AR, 'Uzungöl, Çaykara', 40.62310, 40.29880, '', 4.5),
  h('onur-uzungol', 'hotel', 'أونور أوزونغول', 'Uzungol Onur Hotel', TRB, TRB_AR, 'Uzungöl Merkez, Çaykara', 40.61920, 40.29490, '', 4.4),
  h('ayanis-uzungol', 'hotel', 'أيانش أوزونغول', 'Ayanis Hotel Uzungol', TRB, TRB_AR, 'Uzungöl, Çaykara', 40.62060, 40.29620, '', 4.3),
  h('sera-lake-trabzon', 'resort', 'سيرا ليك طرابزون', 'Sera Lake Resort Hotel Trabzon', TRB, TRB_AR, 'Sera Gölü, Ortahisar', 40.99540, 39.70380, '+90 462 223 0000', 4.4),

  // Cappadocia (Goreme / Urgup / Uchisar / Avanos)
  h('museum-hotel-uchisar', 'hotel', 'ميوزيوم هوتيل أوتشيسار', 'Museum Hotel Cappadocia', NEV, NEV_AR, 'Tekelli Mahallesi, Uçhisar', 38.62940, 34.81190, '+90 384 219 2220', 4.8),
  h('argos-cappadocia', 'hotel', 'أرغوس كابادوكيا', 'Argos in Cappadocia', NEV, NEV_AR, 'Uçhisar, Nevşehir', 38.63140, 34.80780, '+90 384 219 3130', 4.8),
  h('sultan-cave-suites', 'hotel', 'سلطان كيف سويتس', 'Sultan Cave Suites Goreme', NEV, NEV_AR, 'Aydınlı Mahallesi, Göreme', 38.64470, 34.82830, '+90 384 271 3029', 4.7),
  h('kelebek-cave-hotel', 'hotel', 'كيلبيك كيف هوتيل', 'Kelebek Special Cave Hotel', NEV, NEV_AR, 'Göreme, Nevşehir', 38.64280, 34.82720, '+90 384 271 2532', 4.6),
  h('cappadocia-cave-suites', 'hotel', 'كابادوكيا كيف سويتس', 'Cappadocia Cave Suites', NEV, NEV_AR, 'Göreme, Nevşehir', 38.64350, 34.82950, '+90 384 271 2800', 4.6),
  h('anatolian-houses', 'hotel', 'أناضوليان هاوسز', 'Anatolian Houses Goreme', NEV, NEV_AR, 'Göreme, Nevşehir', 38.64580, 34.83440, '+90 384 271 2463', 4.6),
  h('heritage-cave-suites', 'hotel', 'هيريتج كيف سويتس', 'Heritage Cave Suites Goreme', NEV, NEV_AR, 'Göreme, Nevşehir', 38.64410, 34.83080, '', 4.5),
  h('local-cave-house', 'hotel', 'لوكال كيف هاوس', 'Local Cave House Hotel', NEV, NEV_AR, 'Göreme, Nevşehir', 38.64220, 34.82910, '', 4.5),
  h('travellers-cave', 'hotel', 'ترافلرز كيف', 'Travellers Cave Hotel Goreme', NEV, NEV_AR, 'Göreme, Nevşehir', 38.64390, 34.82680, '', 4.4),
  h('goreme-inn', 'hotel', 'غوريم إن', 'Goreme Inn Hotel', NEV, NEV_AR, 'Göreme Merkez', 38.64310, 34.82890, '', 4.4),
  h('taskonaklar-uchisar', 'hotel', 'طاشكوناكلار أوتشيسار', 'Taskonaklar Hotel Uchisar', NEV, NEV_AR, 'Uçhisar, Nevşehir', 38.62780, 34.80560, '+90 384 219 2001', 4.7),
  h('kayakapi-urgup', 'hotel', 'كايا كابي أورغوب', 'Kayakapi Premium Caves Cappadocia', NEV, NEV_AR, 'Kayakapı, Ürgüp', 38.62900, 34.91100, '+90 384 341 8877', 4.7),
  h('yunak-evleri', 'hotel', 'يوناك إيفلري', 'Yunak Evleri Urgup', NEV, NEV_AR, 'Ürgüp, Nevşehir', 38.63100, 34.91250, '+90 384 341 6920', 4.6),
  h('sacred-house-urgup', 'hotel', 'ساكرد هاوس أورغوب', 'Sacred House Hotel Urgup', NEV, NEV_AR, 'Ürgüp, Nevşehir', 38.62980, 34.91380, '+90 384 341 7102', 4.6),
  h('esbelli-evi', 'hotel', 'إسبللي إيفي', 'Esbelli Evi Cave Hotel', NEV, NEV_AR, 'Esbelli Mahallesi, Ürgüp', 38.63240, 34.90860, '+90 384 341 4511', 4.7),
  h('dinler-urgup', 'hotel', 'دينلر أورغوب', 'Dinler Hotel Urgup', NEV, NEV_AR, 'Ürgüp, Nevşehir', 38.63140, 34.91190, '+90 384 341 4646', 4.4),
  h('suhan-avanos', 'hotel', 'سوهان أفانوس', 'Suhan Cappadocia Hotel & Spa', NEV, NEV_AR, 'Avanos, Nevşehir', 38.71520, 34.84680, '+90 384 511 5577', 4.6),
  h('cappadocia-cave-resort', 'resort', 'كابادوكيا كيف ريزورت', 'Cappadocia Cave Resort & Spa', NEV, NEV_AR, 'Uçhisar, Nevşehir', 38.62820, 34.80940, '+90 384 219 3131', 4.6),

  // Bodrum / Yalikavak / Torba / Turgutreis
  h('mandarin-oriental-bodrum', 'resort', 'ماندرين أورينتال بودروم', 'Mandarin Oriental Bodrum', BOD, BOD_AR, 'Cennet Koyu, Göltürkbükü', 37.12306, 27.35389, '+90 252 311 1888', 4.8),
  h('kempinski-barbaros-bay', 'resort', 'كمبينسكي بارباروس باي', 'Kempinski Hotel Barbaros Bay Bodrum', BOD, BOD_AR, 'Kızılağaç, Bodrum', 37.01170, 27.48720, '+90 252 311 0303', 4.7),
  h('bodrum-edition', 'resort', 'ذا بودروم إديشن', 'The Bodrum EDITION', BOD, BOD_AR, 'Yalıkavak, Bodrum', 37.10560, 27.29500, '+90 252 311 0000', 4.7),
  h('lujo-bodrum', 'resort', 'لوجو بودروم', 'Lujo Hotel Bodrum', BOD, BOD_AR, 'Torba, Bodrum', 37.08250, 27.45860, '+90 252 311 2020', 4.7),
  h('titanic-deluxe-bodrum', 'resort', 'تيتانيك ديلوكس بودروم', 'Titanic Deluxe Bodrum', BOD, BOD_AR, 'Yalıkavak, Bodrum', 37.10420, 27.28840, '+90 252 311 1212', 4.6),
  h('marmara-bodrum', 'hotel', 'مارمارا بودروم', 'The Marmara Bodrum', BOD, BOD_AR, 'Yokuşbaşı, Bodrum', 37.03860, 27.42940, '+90 252 313 8130', 4.5),
  h('paloma-foresta', 'resort', 'بالوما فوريستا', 'Paloma Foresta Resort & Spa', BOD, BOD_AR, 'Turgutreis, Bodrum', 37.01580, 27.25960, '+90 252 382 2525', 4.5),
  h('voyage-torba', 'resort', 'فواياج توربا', 'Voyage Torba', BOD, BOD_AR, 'Torba, Bodrum', 37.07980, 27.46120, '+90 252 311 3131', 4.5),
  h('kefaluka-resort', 'resort', 'كيفالوكا ريزورت', 'Kefaluka Resort Bodrum', BOD, BOD_AR, 'Akyarlar, Bodrum', 36.97280, 27.30340, '+90 252 393 8080', 4.5),
  h('casa-dellarte-bodrum', 'hotel', 'كاسا ديل آرتي بودروم', "Casa Dell'Arte Bodrum", BOD, BOD_AR, 'Bitez, Bodrum', 37.03380, 27.39860, '+90 252 377 6390', 4.6),
  h('bitez-garden-life', 'hotel', 'بيتز غاردن لايف', 'Bitez Garden Life Hotel', BOD, BOD_AR, 'Bitez, Bodrum', 37.03800, 27.40000, '', 4.4),
  h('yalihan-bodrum', 'hotel', 'ياليهان بودروم', 'Yalihan Bodrum Hotel', BOD, BOD_AR, 'Bodrum Merkez', 37.03440, 27.43050, '', 4.3),

  // Izmir
  h('hilton-izmir', 'hotel', 'هيلتون إزمير', 'Hilton Izmir', IZM, IZM_AR, 'Gazi Osman Paşa Bulvarı, Alsancak', 38.43080, 27.14160, '+90 232 497 6060', 4.5),
  h('movenpick-izmir', 'hotel', 'موفنبيك إزمير', 'Movenpick Hotel Izmir', IZM, IZM_AR, 'Mithatpaşa Caddesi, Konak', 38.41420, 27.12840, '+90 232 488 1414', 4.5),
  h('key-hotel-izmir', 'hotel', 'كي هوتيل إزمير', 'Key Hotel Izmir', IZM, IZM_AR, 'Mimar Kemalettin Caddesi, Konak', 38.41860, 27.13360, '+90 232 482 1111', 4.6),
  h('crowne-plaza-izmir', 'hotel', 'كراون بلازا إزمير', 'Crowne Plaza Izmir', IZM, IZM_AR, 'İnciraltı, Balçova', 38.39280, 27.03840, '+90 232 292 1300', 4.4),
  h('ramada-inciralti', 'hotel', 'رامادا إنجيرألتي', 'Ramada Izmir Inciralti', IZM, IZM_AR, 'İnciraltı, Balçova', 38.39360, 27.03580, '', 4.3),
  h('park-inn-karsiyaka', 'hotel', 'بارك إن كارشياكا', 'Park Inn by Radisson Izmir', IZM, IZM_AR, 'Karşıyaka', 38.45620, 27.10980, '', 4.3),
  h('anemon-izmir', 'hotel', 'أنيمون إزمير', 'Anemon Izmir Hotel', IZM, IZM_AR, 'Alsancak, Konak', 38.43640, 27.14320, '+90 232 446 0606', 4.4),
  h('wyndham-izmir-ozdilek', 'hotel', 'ويندهام إزمير أوزديلك', 'Wyndham Grand Izmir Ozdilek', IZM, IZM_AR, 'Çınarlı, Konak', 38.42840, 27.16820, '+90 232 455 4455', 4.4),
  h('ibis-alsancak', 'hotel', 'إيبيس ألسانجاك', 'ibis Izmir Alsancak', IZM, IZM_AR, 'Alsancak, Konak', 38.43480, 27.14280, '', 4.3),
  h('doubletree-bayrakli', 'hotel', 'دبل تري بايراقللي', 'DoubleTree by Hilton Izmir Bayrakli', IZM, IZM_AR, 'Bayraklı', 38.46280, 27.16680, '', 4.4),
  h('swissotel-buyuk-efes', 'hotel', 'سويس أوتيل بويوك أفسس', 'Swissotel Buyuk Efes Izmir', IZM, IZM_AR, 'Alsancak, Konak', 38.43160, 27.14020, '+90 232 414 0000', 4.6),

  // Fethiye / Oludeniz
  h('hillside-beach-club', 'resort', 'هيلسايد بيتش كلوب', 'Hillside Beach Club Fethiye', FET, FET_AR, 'Kalemya Koyu, Fethiye', 36.64080, 29.10240, '+90 252 614 8360', 4.8),
  h('liberty-lykia', 'resort', 'ليبرتي ليكيا', 'Liberty Hotels Lykia', FET, FET_AR, 'Ölüdeniz, Fethiye', 36.54860, 29.12180, '+90 252 617 0404', 4.5),
  h('jiva-beach-resort', 'resort', 'جيفا بيتش ريزورت', 'Jiva Beach Resort Fethiye', FET, FET_AR, 'Çalış Beach, Fethiye', 36.65840, 29.11620, '+90 252 622 0000', 4.5),
  h('letoonia-hotel', 'resort', 'ليتونيا هوتيل', 'Club & Hotel Letoonia', FET, FET_AR, 'Letoonia Peninsula, Fethiye', 36.64320, 29.10860, '+90 252 614 4966', 4.5),
  h('yonca-lodge', 'hotel', 'يونجا لودج', 'Yonca Lodge Fethiye', FET, FET_AR, 'Kayaköy, Fethiye', 36.57480, 29.09120, '', 4.6),
];

export const TURKEY_HOTELS_DATASET_VERSION = 2;
