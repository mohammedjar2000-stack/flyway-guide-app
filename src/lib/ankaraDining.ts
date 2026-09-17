import { assertUniqueDiningImages, withUniqueDiningImages, type DiningKind } from '@/lib/diningPhotos';

export type { DiningKind };

export interface DiningSeed {
  slug: string;
  name: string;
  name_en: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  rating: number;
  hours: string;
  place_kind: DiningKind;
  images?: string[];
}

function r(
  slug: string, name: string, name_en: string, address: string,
  lat: number, lng: number, phone: string, rating: number, hours = '11:00 - 23:00',
): DiningSeed {
  return { slug, name, name_en, address, lat, lng, phone, rating, hours, place_kind: 'restaurant' };
}

function c(
  slug: string, name: string, name_en: string, address: string,
  lat: number, lng: number, phone: string, rating: number, hours = '08:00 - 22:00',
): DiningSeed {
  return { slug, name, name_en, address, lat, lng, phone, rating, hours, place_kind: 'cafe' };
}

const ANKARA_DINING_RAW: DiningSeed[] = [
  r('trilye', 'تريليه', 'Trilye Restaurant', 'Tunalı Hilmi Caddesi No:82, Kavaklıdere', 39.91085, 32.86035, '+90 312 447 1200', 4.6),
  r('zenger-pasa', 'زنغر باشا كوناغي', 'Zenger Pasa Konagi', 'Doyran Sokak No:13, Kale, Altındağ', 39.93855, 32.86548, '+90 312 311 7070', 4.5),
  r('kizilkayalar', 'قزيل كيالر', 'Kizilkayalar Bufe', 'Atatürk Bulvarı, Kızılay', 39.92028, 32.85432, '+90 312 417 7070', 4.4),
  r('tunaman', 'تونامان باليك', 'Tunaman Balik Evi', 'Bestekar Sokak No:94, Kavaklıdere', 39.90892, 32.85910, '+90 312 426 2020', 4.6),
  r('uludag-kebap', 'أولو داغ كباب', 'Uludag Kebapcisi Kavaklidere', 'Tunalı Hilmi Caddesi, Kavaklıdere', 39.90940, 32.86090, '+90 312 426 2211', 4.5),
  r('haci-arif', 'حاجي عارف بك', 'Haci Arif Bey Restaurant', 'İzmir Caddesi, Kızılay', 39.91880, 32.85320, '+90 312 419 0040', 4.4),
  r('doyuranlar', 'دويرانلار بيده', 'Doyuranlar Pidecisi Ulus', 'Anafartalar Caddesi, Ulus', 39.94120, 32.85490, '+90 312 311 4040', 4.5),
  r('cigerci-selim', 'جيغرجي سليم أوستا', 'Cigerci Selim Usta', 'Kızılay, Çankaya', 39.91950, 32.85580, '+90 312 418 1818', 4.5),
  r('divan-cukurhan', 'ديوان تشوكورهان', 'Divan Cukurhan Restaurant', 'Necatibey Mahallesi, Ulus', 39.93780, 32.86020, '+90 312 306 6400', 4.6),
  r('washington-kale', 'واشنطن قلعة', 'Washington Restaurant Kale', 'Kale, Altındağ', 39.93740, 32.86410, '+90 312 311 4343', 4.5),
  r('nusret-ankara', 'نُصرِت أنقرة', 'Nusr-Et Steakhouse Ankara', 'Taurus AVM, Söğütözü', 39.91020, 32.77640, '+90 312 220 2020', 4.5),
  r('gunaydin-nextlevel', 'غونيدين نكست ليفل', 'Gunaydin Steakhouse Next Level', 'Next Level, Söğütözü', 39.90880, 32.77520, '+90 312 220 3030', 4.5),
  r('bigchefs-tunali', 'بيغ شيفز تونالي', 'BigChefs Tunali', 'Tunalı Hilmi Caddesi, Kavaklıdere', 39.91160, 32.86180, '+90 312 426 6262', 4.4),
  r('kitchenette-tepe', 'كيتشنِت تيبه برايم', 'Kitchenette Tepe Prime', 'Tepe Prime, Eskişehir Yolu', 39.90180, 32.77690, '+90 312 285 8585', 4.5),
  r('leman-kultur', 'ليمان كولتور', 'Leman Kultur Tunali', 'Tunalı Hilmi Caddesi, Çankaya', 39.91240, 32.86270, '+90 312 468 0808', 4.4),
  r('hayyami', 'حيامي', 'Hayyami Wine House', 'Kırkkonaklar, Çankaya', 39.89840, 32.86820, '+90 312 440 0707', 4.6),
  r('ispanak', 'إسباناق', 'Ispanak Restaurant', 'Gaziosmanpaşa, Çankaya', 39.90220, 32.87340, '+90 312 447 1717', 4.5),
  r('sushico-armada', 'سوشي كو أرمادا', 'SushiCo Armada', 'Armada AVM, Söğütözü', 39.91190, 32.77980, '+90 312 219 1919', 4.4),
  r('loft-tahran', 'لوفت طهران', 'Loft Ankara', 'Tahran Caddesi, Kavaklıdere', 39.90770, 32.85820, '+90 312 468 6868', 4.5),
  r('casper', 'كاسبر', 'Casper Restaurant Ankara', 'Gaziosmanpaşa, Çankaya', 39.90110, 32.87120, '+90 312 436 3636', 4.4),
  r('abidinin-yeri', 'مكان عبيدين', 'Abidinin Yeri', 'Ulus, Altındağ', 39.94260, 32.85640, '+90 312 311 2121', 4.5),
  r('cigerci-aydin', 'جيغرجي أيدن', 'Cigerci Aydin Usta', 'Siteler, Altındağ', 39.94820, 32.88210, '+90 312 348 4848', 4.4),
  r('haci-dayi', 'حاجي دايي', 'Haci Dayi Kebap', 'Kızılay, Çankaya', 39.92160, 32.85240, '+90 312 417 1717', 4.4),
  r('bogazici-lokanta', 'بوغازيتشي لوكانتا', 'Bogazici Lokantasi', 'Kızılay, Çankaya', 39.91790, 32.85610, '+90 312 419 1919', 4.3),
  r('konya-mutfagi', 'مطبخ قونية', 'Konya Mutfagi Ankara', 'Bahçelievler, Çankaya', 39.92740, 32.82580, '+90 312 213 1313', 4.4),
  r('gaziantep-sofrasi', 'مائدة غازي عنتاب', 'Gaziantep Sofrasi Cankaya', 'Çankaya', 39.90480, 32.85940, '+90 312 440 4040', 4.5),
  r('hatay-medeniyet', 'مائدة حضارات هاتاي', 'Hatay Medeniyetler Sofrasi Ankara', 'Çankaya', 39.90620, 32.86210, '+90 312 468 4680', 4.5),
  r('develi-ankara', 'ديفلي أنقرة', 'Develi Restaurant Ankara', 'Gaziosmanpaşa, Çankaya', 39.89980, 32.86980, '+90 312 446 4646', 4.5),
  r('borsa-ankara', 'بورصة أنقرة', 'Borsa Restaurant Ankara', 'Atatürk Bulvarı, Ulus', 39.93620, 32.85420, '+90 312 309 4090', 4.6),
  r('kofteci-ramiz', 'كوفته جي رامز', 'Kofteci Ramiz Kizilay', 'Ziya Gökalp Caddesi, Kızılay', 39.92240, 32.85520, '+90 312 431 3131', 4.3),
  r('midpoint-tunali', 'ميدبوينت تونالي', 'Midpoint Tunali', 'Tunalı Hilmi Caddesi, Kavaklıdere', 39.91320, 32.86120, '+90 312 426 2626', 4.3),
  r('happy-moons', 'هابي مونز', 'Happy Moons Kizilay', 'Kızılay AVM, Çankaya', 39.92010, 32.85180, '+90 312 417 4747', 4.3),
  r('paper-moon', 'بيبر مون', 'Paper Moon Ankara', 'Çankaya', 39.90340, 32.86680, '+90 312 447 4747', 4.5),
  r('villa-park', 'فيلا بارك', 'Villa Park Restaurant', 'Oran, Çankaya', 39.88640, 32.86890, '+90 312 491 9191', 4.4),
  r('green-house-ank', 'غرين هاوس', 'The Green House Ankara', 'Gaziosmanpaşa, Çankaya', 39.90040, 32.87510, '+90 312 446 1616', 4.4),
  r('meşhur-tavaci', 'طباخي رجب أوستا', 'Meshur Tavaci Recep Usta', 'Etlik, Keçiören', 39.96680, 32.83740, '+90 312 325 2525', 4.5),
  r('donerci-sahin', 'دونرجي شاهين أوستا', 'Donerci Sahin Usta', 'Kızılay, Çankaya', 39.91820, 32.85470, '+90 312 418 0808', 4.4),
  r('aspava', 'أسبافا', 'Aspava Kebap', 'Abidinpaşa, Mamak', 39.92780, 32.90640, '+90 312 366 1616', 4.4),
  r('cengelhan', 'تشنغل هان', 'Cengelhan Rahmi Koc Museum Cafe-Restaurant', 'Kale, Altındağ', 39.93690, 32.86480, '+90 312 309 1200', 4.6),
  r('trilye-gazi', 'تريليه غازي', 'Trilye Gazi Osman Pasa', 'Reşit Galip Caddesi, Gazi Osman Paşa', 39.89810, 32.87040, '+90 312 446 1212', 4.5),
  r('sushico-panora', 'سوشي كو بانورا', 'SushiCo Panora', 'Panora AVM, Oran', 39.88720, 32.83210, '+90 312 490 9090', 4.4),
  r('bigchefs-panora', 'بيغ شيفز بانورا', 'BigChefs Panora', 'Panora AVM, Oran', 39.88680, 32.83120, '+90 312 490 8080', 4.3),
  r('gunaydin-cankaya', 'غونيدين تشانكايا', 'Gunaydin Cankaya', 'Çankaya', 39.90510, 32.85880, '+90 312 442 4242', 4.5),
  r('kebapci-tatos', 'كبابجي تاتوس', 'Kebapci Tatos', 'Ulus, Altındağ', 39.94010, 32.85310, '+90 312 311 1515', 4.4),
  r('pideci-saban', 'بيدجي شعبان', 'Pideci Saban Usta', 'Yenimahalle', 39.96620, 32.81140, '+90 312 315 1515', 4.3),
  r('balikcim', 'باليقچيم', 'Balikcim Restaurant', 'Gölbaşı Sahil', 39.78740, 32.80520, '+90 312 485 8585', 4.4),
  r('goksu-lokanta', 'غوكسو لوكانتا', 'Goksu Lokantasi', 'Bahçelievler, Çankaya', 39.92880, 32.82840, '+90 312 213 2323', 4.3),
  r('antep-sofrasi-bahceli', 'مائدة عنتاب بهتشلي', 'Antep Sofrasi Bahcelievler', 'Bahçelievler, Çankaya', 39.92620, 32.82210, '+90 312 212 1212', 4.4),
  r('sakaoglu', 'صقا أوغلو', 'Sakaoglu Restaurant', 'Kızılay, Çankaya', 39.92310, 32.85740, '+90 312 431 4141', 4.3),
  r('ocakbasi-ali', 'أوجاق باشي علي', 'Ocakbasi Ali Usta', 'Çankaya', 39.90710, 32.86440, '+90 312 440 3030', 4.4),
  r('et-mangal', 'إت منغال', 'Et Mangal Ankara', 'Çayyolu, Çankaya', 39.88420, 32.70480, '+90 312 241 4141', 4.4),
  r('beyti-ankara', 'بيتي أنقرة', 'Beyti Ankara', 'Bilkent, Çankaya', 39.86880, 32.74820, '+90 312 266 2662', 4.5),
  r('kavaklidere-meyhane', 'ميخانه كافاكلديره', 'Kavaklidere Meyhanesi', 'Kavaklıdere, Çankaya', 39.90980, 32.85740, '+90 312 426 4242', 4.4),
  r('meze-by-lemon-tree', 'ميزه ليمون تري', 'Meze by Lemon Tree Ankara', 'Çankaya', 39.90280, 32.86080, '+90 312 468 1818', 4.5),
  r('tike-ankara', 'تيكه أنقرة', 'Tike Restaurant Ankara', 'Tunalı Hilmi Caddesi, Kavaklıdere', 39.91010, 32.85940, '+90 312 426 1111', 4.5),
  r('kofteci-yusuf', 'كوفته جي يوسف', 'Kofteci Yusuf Ankara', 'Etimesgut', 39.95240, 32.66880, '+90 312 244 2442', 4.4),
  r('pide-by-pide', 'بيده باي بيده', 'Pide by Pide', 'Çayyolu, Çankaya', 39.88210, 32.71040, '+90 312 241 2424', 4.3),
  r('adana-sofram', 'مائدتي أضنة', 'Adana Sofram', 'Keçiören', 39.98420, 32.86280, '+90 312 381 8181', 4.4),
  r('sultanahmet-kofte-ank', 'كفته السلطان أحمد أنقرة', 'Tarihi Sultanahmet Koftecisi Ankara', 'Kızılay', 39.91920, 32.85080, '+90 312 417 2727', 4.3),
  r('cankaya-ocakbasi', 'أوجاق باشي تشانكايا', 'Cankaya Ocakbasi', 'Cevizlidere, Çankaya', 39.89120, 32.81840, '+90 312 472 7272', 4.4),
  r('gordion-restaurant', 'غورديون', 'Gordion Restaurant', 'Çayyolu, Çankaya', 39.87940, 32.69820, '+90 312 241 8181', 4.4),
  r('bilkent-center-rest', 'مطعم بيلkent سنتر', 'Bilkent Center Restaurant', 'Bilkent Center', 39.87020, 32.74710, '+90 312 266 1212', 4.3),

  c('kronotrop-ankara', 'كرونوتروب أنقرة', 'Kronotrop Ankara', 'Tunalı Hilmi Caddesi, Kavaklıdere', 39.91110, 32.86010, '+90 312 426 3030', 4.6, '08:00 - 22:00'),
  c('petra-ankara', 'بترا روستينغ أنقرة', 'Petra Roasting Co Ankara', 'Çankaya', 39.90420, 32.86140, '+90 312 440 2020', 4.6, '08:00 - 21:30'),
  c('federal-ankara', 'فيدرال كوفي', 'Federal Coffee Company Ankara', 'Kızılay', 39.92090, 32.85370, '+90 312 417 3030', 4.5, '08:00 - 21:00'),
  c('espresso-lab-tunali', 'إسبريسو لاب تونالي', 'Espressolab Tunali', 'Tunalı Hilmi Caddesi', 39.91280, 32.86190, '+90 312 426 4040', 4.4, '07:30 - 22:00'),
  c('kahve-dunyasi-kizilay', 'قهوة دنياسي قزيل أي', 'Kahve Dunyasi Kizilay', 'Kızılay Meydanı', 39.92040, 32.85480, '+90 312 419 1910', 4.4, '08:00 - 22:00'),
  c('starbucks-tunali', 'ستاربكس تونالي', 'Starbucks Tunali Hilmi', 'Tunalı Hilmi Caddesi', 39.91040, 32.86110, '+90 312 426 5050', 4.3, '07:00 - 23:00'),
  c('cafe-nero-kizilay', 'كافيه نيرو قزيل أي', 'Caffe Nero Kizilay', 'Atatürk Bulvarı, Kızılay', 39.92120, 32.85400, '+90 312 417 5050', 4.3, '07:30 - 22:00'),
  c('house-cafe-armada', 'هاوس كافيه أرمادا', 'The House Cafe Armada', 'Armada AVM, Söğütözü', 39.91140, 32.78040, '+90 312 219 2121', 4.4, '09:00 - 23:00'),
  c('midpoint-cafe-kizilay', 'ميدبوينت كافيه', 'Midpoint Cafe Kizilay', 'Kızılay', 39.91980, 32.85220, '+90 312 417 6060', 4.3, '08:00 - 23:00'),
  c('mado-tunali', 'مادو تونالي', 'Mado Tunali', 'Tunalı Hilmi Caddesi', 39.91190, 32.86070, '+90 312 426 7070', 4.5, '09:00 - 00:00'),
  c('sutis-ankara', 'سوتيش أنقرة', 'Sutis Ankara', 'Çankaya', 39.90580, 32.86380, '+90 312 440 8080', 4.4, '08:00 - 00:00'),
  c('gloria-jeans-panora', 'غلوريا جينز بانورا', 'Gloria Jeans Panora', 'Panora AVM, Oran', 39.88760, 32.83180, '+90 312 490 7070', 4.3, '10:00 - 22:00'),
  c('coffeeshop-company', 'كوفي شوب كومباني', 'Coffeeshop Company Cankaya', 'Çankaya', 39.90380, 32.85810, '+90 312 442 9090', 4.4, '08:00 - 22:00'),
  c('cup-of-joy-ank', 'كاب أوف جوي', 'Cup of Joy Ankara', 'Kavaklıdere', 39.90840, 32.86040, '+90 312 426 8080', 4.5, '08:30 - 21:30'),
  c('walter-coffee-ank', 'والترز كوفي', 'Walters Coffee Roastery Ankara', 'Çankaya', 39.90160, 32.86240, '+90 312 440 9090', 4.6, '08:00 - 21:00'),
  c('geyik-ankara', 'غَييك كوفي', 'Geyik Coffee Roastery Ankara', 'Kızılay', 39.91740, 32.85340, '+90 312 419 8080', 4.5, '09:00 - 21:00'),
  c('journey-ankara', 'جورني كافيه', 'Journey Coffee Ankara', 'Bahçelievler', 39.92710, 32.82720, '+90 312 213 3030', 4.4, '09:00 - 22:00'),
  c('karabatak-ank', 'قراباتاق أنقرة', 'Karabatak Ankara', 'Ulus', 39.93880, 32.85520, '+90 312 311 6060', 4.4, '09:00 - 21:00'),
  c('bebek-kahve-ank', 'بيهك قهوة', 'Bebek Kahve Ankara', 'Gölbaşı', 39.78920, 32.80740, '+90 312 485 4040', 4.3, '09:00 - 00:00'),
  c('espresso-lab-cankaya', 'إسبريسو لاب تشانكايا', 'Espressolab Cankaya', 'Çankaya', 39.90680, 32.86020, '+90 312 440 5050', 4.4, '07:30 - 22:00'),
  c('kahve-dunyasi-bahceli', 'قهوة دنياسي بهتشلي', 'Kahve Dunyasi Bahcelievler', '7. Cadde, Bahçelievler', 39.92820, 32.82440, '+90 312 212 3030', 4.4, '08:00 - 22:00'),
  c('starbucks-kentpark', 'ستاربكس كنتبارك', 'Starbucks Kentpark', 'Kentpark AVM', 39.90040, 32.77540, '+90 312 219 3030', 4.3, '08:00 - 22:00'),
  c('cafe-nero-armada', 'كافيه نيرو أرمادا', 'Caffe Nero Armada', 'Armada AVM', 39.91220, 32.77920, '+90 312 219 4040', 4.3, '08:00 - 22:00'),
  c('petra-tunali', 'بترا تونالي', 'Petra Tunali', 'Tunalı Hilmi Caddesi', 39.91360, 32.86040, '+90 312 426 9090', 4.6, '08:00 - 21:30'),
  c('kronotrop-gazi', 'كرونوتروب غازي', 'Kronotrop GOP', 'Gaziosmanpaşa', 39.89920, 32.87220, '+90 312 446 3030', 4.5, '08:30 - 21:30'),
  c('espresso-lab-cayyolu', 'إسبريسو لاب تشايولو', 'Espressolab Cayyolu', 'Çayyolu', 39.88340, 32.70620, '+90 312 241 3030', 4.4, '08:00 - 22:00'),
  c('mado-bahceli', 'مادو بهتشلي', 'Mado Bahcelievler', 'Bahçelievler', 39.92540, 32.82640, '+90 312 213 4040', 4.4, '09:00 - 00:00'),
  c('sutis-gazi', 'سوتيش غازي', 'Sutis GOP', 'Gaziosmanpaşa', 39.90080, 32.87420, '+90 312 446 4040', 4.4, '08:00 - 00:00'),
  c('gloria-kentpark', 'غلوريا جينز كنتبارك', 'Gloria Jeans Kentpark', 'Kentpark AVM', 39.89980, 32.77620, '+90 312 219 5050', 4.3, '10:00 - 22:00'),
  c('house-cafe-nextlevel', 'هاوس كافيه نكست ليفل', 'The House Cafe Next Level', 'Next Level AVM', 39.90820, 32.77480, '+90 312 220 4040', 4.4, '10:00 - 23:00'),
  c('federal-cankaya', 'فيدرال تشانكايا', 'Federal Coffee Cankaya', 'Çankaya', 39.90490, 32.85720, '+90 312 442 3030', 4.5, '08:00 - 21:00'),
  c('walter-kizilay', 'والترز قزيل أي', 'Walters Coffee Kizilay', 'Kızılay', 39.91860, 32.85140, '+90 312 417 7070', 4.5, '08:30 - 21:00'),
  c('geyik-tunali', 'غَييك تونالي', 'Geyik Tunali', 'Tunalı Hilmi Caddesi', 39.91070, 32.85880, '+90 312 426 1010', 4.5, '09:00 - 21:00'),
  c('journey-cankaya', 'جورني تشانكايا', 'Journey Cankaya', 'Çankaya', 39.90760, 32.86180, '+90 312 440 1010', 4.4, '09:00 - 22:00'),
  c('espresso-lab-ulus', 'إسبريسو لاب أولوس', 'Espressolab Ulus', 'Ulus', 39.93960, 32.85480, '+90 312 311 7070', 4.3, '08:00 - 21:00'),
  c('kahve-dunyasi-ulus', 'قهوة دنياسي أولوس', 'Kahve Dunyasi Ulus', 'Anafartalar, Ulus', 39.94180, 32.85560, '+90 312 311 8080', 4.3, '08:00 - 21:30'),
  c('starbucks-bilkent', 'ستاربكس بيلkent', 'Starbucks Bilkent', 'Bilkent Center', 39.86960, 32.74640, '+90 312 266 3030', 4.3, '08:00 - 22:00'),
  c('cafe-nero-panora', 'كافيه نيرو بانورا', 'Caffe Nero Panora', 'Panora AVM', 39.88790, 32.83260, '+90 312 490 6060', 4.3, '10:00 - 22:00'),
  c('mado-oran', 'مادو أوران', 'Mado Oran', 'Oran', 39.88840, 32.83420, '+90 312 491 3030', 4.4, '09:00 - 00:00'),
  c('petra-cayyolu', 'بترا تشايولو', 'Petra Cayyolu', 'Çayyolu', 39.88120, 32.70880, '+90 312 241 5050', 4.5, '08:00 - 21:30'),
  c('kronotrop-cankaya', 'كرونوتروب تشانكايا', 'Kronotrop Cankaya', 'Çankaya', 39.90240, 32.85920, '+90 312 440 6060', 4.6, '08:00 - 21:30'),
  c('espresso-lab-gazi', 'إسبريسو لاب غازي', 'Espressolab GOP', 'Gaziosmanpaşa', 39.89880, 32.86880, '+90 312 446 5050', 4.4, '08:00 - 22:00'),
  c('kahve-dunyasi-gazi', 'قهوة دنياسي غازي', 'Kahve Dunyasi GOP', 'Gaziosmanpaşa', 39.90010, 32.87180, '+90 312 446 6060', 4.4, '08:00 - 22:00'),
  c('starbucks-nextlevel', 'ستاربكس نكست ليفل', 'Starbucks Next Level', 'Next Level AVM', 39.90920, 32.77580, '+90 312 220 5050', 4.3, '08:00 - 22:00'),
  c('house-cafe-tunali', 'هاوس كافيه تونالي', 'The House Cafe Tunali', 'Tunalı Hilmi Caddesi', 39.91220, 32.85960, '+90 312 426 2021', 4.4, '09:00 - 00:00'),
  c('federal-ulus', 'فيدرال أولوس', 'Federal Coffee Ulus', 'Ulus', 39.93720, 32.85340, '+90 312 311 9090', 4.4, '08:30 - 20:30'),
  c('walter-cankaya', 'والترز تشانكايا', 'Walters Cankaya', 'Çankaya', 39.90540, 32.86520, '+90 312 440 7070', 4.5, '08:30 - 21:00'),
  c('geyik-cankaya', 'غَييك تشانكايا', 'Geyik Cankaya', 'Çankaya', 39.90320, 32.86420, '+90 312 442 7070', 4.5, '09:00 - 21:00'),
  c('journey-bahceli', 'جورني بهتشلي', 'Journey Bahcelievler', 'Bahçelievler', 39.92680, 32.82320, '+90 312 213 5050', 4.4, '09:00 - 22:00'),
  c('espresso-lab-bahceli', 'إسبريسو لاب بهتشلي', 'Espressolab Bahcelievler', 'Bahçelievler', 39.92480, 32.82140, '+90 312 212 4040', 4.4, '08:00 - 22:00'),
  c('mado-kizilay', 'مادو قزيل أي', 'Mado Kizilay', 'Kızılay', 39.92180, 32.85560, '+90 312 417 8080', 4.4, '09:00 - 00:00'),
  c('sutis-tunali', 'سوتيش تونالي', 'Sutis Tunali', 'Tunalı Hilmi Caddesi', 39.90960, 32.86150, '+90 312 426 3031', 4.4, '08:00 - 00:00'),
  c('gloria-armada', 'غلوريا جينز أرمادا', 'Gloria Jeans Armada', 'Armada AVM', 39.91110, 32.77860, '+90 312 219 6060', 4.3, '10:00 - 22:00'),
  c('kahve-dunyasi-cayyolu', 'قهوة دنياسي تشايولو', 'Kahve Dunyasi Cayyolu', 'Çayyolu', 39.88480, 32.70280, '+90 312 241 6060', 4.4, '08:00 - 22:00'),
  c('starbucks-cayyolu', 'ستاربكس تشايولو', 'Starbucks Cayyolu', 'Çayyolu', 39.88280, 32.70520, '+90 312 241 7070', 4.3, '07:30 - 22:00'),
  c('petra-gazi', 'بترا غازي', 'Petra GOP', 'Gaziosmanpaşa', 39.89740, 32.86920, '+90 312 446 7070', 4.5, '08:00 - 21:30'),
  c('kronotrop-kizilay', 'كرونوتروب قزيل أي', 'Kronotrop Kizilay', 'Kızılay', 39.91710, 32.85540, '+90 312 419 9090', 4.5, '08:00 - 21:30'),
  c('espresso-lab-oran', 'إسبريسو لاب أوران', 'Espressolab Oran', 'Oran', 39.88920, 32.83340, '+90 312 491 4040', 4.4, '08:00 - 22:00'),
  c('house-cafe-cankaya', 'هاوس كافيه تشانكايا', 'The House Cafe Cankaya', 'Çankaya', 39.90640, 32.86640, '+90 312 440 2021', 4.4, '09:00 - 00:00'),
  c('federal-tunali', 'فيدرال تونالي', 'Federal Coffee Tunali', 'Tunalı Hilmi Caddesi', 39.91390, 32.86220, '+90 312 426 4041', 4.5, '08:00 - 21:00'),
  c('walter-bahceli', 'والترز بهتشلي', 'Walters Bahcelievler', 'Bahçelievler', 39.92920, 32.82680, '+90 312 213 6060', 4.4, '08:30 - 21:00'),
  c('geyik-ulus', 'غَييك أولوس', 'Geyik Ulus', 'Ulus', 39.94080, 32.85720, '+90 312 311 1010', 4.4, '09:00 - 20:30'),
  c('mado-cayyolu', 'مادو تشايولو', 'Mado Cayyolu', 'Çayyolu', 39.88080, 32.70740, '+90 312 241 8080', 4.4, '09:00 - 00:00'),
];

export const ANKARA_DINING_SEEDS = withUniqueDiningImages(ANKARA_DINING_RAW, new Set());
assertUniqueDiningImages(ANKARA_DINING_SEEDS);
