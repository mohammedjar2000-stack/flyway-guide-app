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

const ISTANBUL_DINING_RAW: DiningSeed[] = [
  r('hamdi-eminonu', 'مطعم حمدي', 'Hamdi Restaurant Eminonu', 'Kalçın Sokak No:17, Eminönü', 41.01672, 28.97088, '+90 212 528 0390', 4.5),
  r('ciya-sofrasi', 'چيا صوفراسي', 'Ciya Sofrasi Kadikoy', 'Güneşli Bahariye Cad. No:43, Kadıköy', 40.98972, 29.02562, '+90 216 330 3190', 4.6),
  r('mikla', 'ميكلا', 'Mikla Restaurant', 'The Marmara Pera, Meşrutiyet Cad., Beyoğlu', 41.03142, 28.97462, '+90 212 293 5656', 4.7),
  r('pandeli', 'باندلي', 'Pandeli Restaurant', 'Mısır Çarşısı No:1, Eminönü', 41.01695, 28.97022, '+90 212 527 3909', 4.4),
  r('haci-abdullah', 'مطعم حجي عبد الله', 'Haci Abdullah Restaurant', 'Ağa Camii, Atıf Yılmaz Cad. No:9/A, Beyoğlu', 41.03492, 28.97982, '+90 212 293 8561', 4.5),
  r('neolokal', 'نيولوكال', 'Neolokal', 'Bomontiada, Şişli', 41.05840, 28.97820, '+90 212 373 1616', 4.7),
  r('nusret-etiler', 'نُصرِت إتيلر', 'Nusr-Et Steakhouse Etiler', 'Nispetiye Caddesi, Etiler', 41.08120, 29.03480, '+90 212 358 3000', 4.5),
  r('sunset-grill', 'سانست غريل', 'Sunset Grill & Bar', 'Yol Sokak, Ulus, Beşiktaş', 41.06880, 29.03320, '+90 212 287 0357', 4.6),
  r('ulus-29', 'أولوس 29', 'Ulus 29', 'Adnan Saygun Caddesi, Ulus Parkı', 41.06640, 29.03140, '+90 212 358 2929', 4.6),
  r('balikci-sabahattin', 'باليقچي صباح الدين', 'Balikci Sabahattin', 'Seyit Hasan Kuyu Sokak, Cankurtaran', 41.00380, 28.98140, '+90 212 458 1824', 4.6),
  r('sultanahmet-kofte', 'كفته السلطان أحمد', 'Tarihi Sultanahmet Koftecisi', 'Divan Yolu Caddesi No:12, Sultanahmet', 41.00720, 28.97640, '+90 212 520 0566', 4.5),
  r('develi-samatya', 'ديفلي سماتيا', 'Develi Samatya', 'Gümüşyüzük Sokak, Samatya', 41.00240, 28.93380, '+90 212 529 0833', 4.6),
  r('asitane', 'آسيتانه', 'Asitane Restaurant', 'Kariye, Edirnekapı', 41.03110, 28.93920, '+90 212 635 7997', 4.6),
  r('karakoy-lokantasi', 'قركوي لوكانتاسي', 'Karakoy Lokantasi', 'Kemankeş Caddesi, Karaköy', 41.02460, 28.97920, '+90 212 292 4455', 4.5),
  r('murver', 'مورفر', 'Murver Restaurant', 'Ahırkapı Sokak, Cankurtaran', 41.00420, 28.98310, '+90 212 517 4333', 4.5),
  r('nicole', 'نيكول', 'Nicole Restaurant', 'Tomtom Kaptan Sokak, Beyoğlu', 41.02980, 28.97840, '+90 212 292 4440', 4.6),
  r('spago-istanbul', 'سباغو', 'Spago Istanbul', 'The St. Regis, Nişantaşı', 41.04880, 28.99320, '+90 212 368 0000', 4.6),
  r('tugra', 'طغرا', 'Tugra Restaurant', 'Çırağan Palace Kempinski', 41.04360, 29.01710, '+90 212 326 4646', 4.7),
  r('seasons-fs', 'سيزنز فور سيزونز', 'Seasons Restaurant Four Seasons Sultanahmet', 'Tevkifhane Sokak, Sultanahmet', 41.00650, 28.98020, '+90 212 402 3000', 4.6),
  r('gunaydin-nisantasi', 'غونيدين نيشانتشي', 'Gunaydin Nisantasi', 'Abdi İpekçi Caddesi, Nişantaşı', 41.04940, 28.99440, '+90 212 241 4141', 4.5),
  r('michelin-neolokal2', 'نيو لوكال بومونتي', 'Neolokal Bomonti', 'Tarihi Bomonti Bira Fabrikası', 41.05890, 28.97880, '+90 212 373 1616', 4.7),
  r('ciya-kebap', 'چيا كباب', 'Ciya Kebap Kadikoy', 'Caferağa Mahallesi, Kadıköy', 40.98890, 29.02480, '+90 216 336 3013', 4.5),
  r('surreya', 'ثريا', 'Surreya Restoran', 'Asmalımescit, Beyoğlu', 41.03220, 28.97480, '+90 212 245 6070', 4.4),
  r('mabeyin', 'مابين', 'Mabeyin Restaurant', 'Yıldız, Beşiktaş', 41.04920, 29.01040, '+90 212 258 9585', 4.5),
  r('banyan', 'بانيان', 'Banyan Restaurant', 'Muallim Naci Caddesi, Ortaköy', 41.04760, 29.02720, '+90 212 259 9060', 4.5),
  r('house-of-ara', 'هاوس أوف آرا', 'House of Ara', 'Asmalımescit, Beyoğlu', 41.03160, 28.97520, '+90 212 245 1515', 4.4),
  r('kosebasi', 'كوسه باشي', 'Kosebasi Etiler', 'Nispetiye Caddesi, Etiler', 41.08040, 29.03360, '+90 212 270 2424', 4.5),
  r('hatay-medeniyet-ist', 'مائدة حضارات هاتاي', 'Hatay Medeniyetler Sofrasi Beyoglu', 'İstiklal Caddesi, Beyoğlu', 41.03420, 28.98120, '+90 212 251 1515', 4.5),
  r('antep-sofrasi-fatih', 'مائدة عنتاب', 'Antep Sofrasi Fatih', 'Fatih', 41.01840, 28.94920, '+90 212 531 3131', 4.4),
  r('kanaat-lokantasi', 'قناعت لوكانتاسي', 'Kanaat Lokantasi Uskudar', 'Selman-ı Pak Caddesi, Üsküdar', 41.02280, 29.01580, '+90 216 553 3791', 4.5),
  r('cengel-lokanta', 'تشنغل كوي', 'Cengelköy İsmailağa', 'Çengelköy, Üsküdar', 41.05120, 29.05180, '+90 216 422 2020', 4.4),
  r('filizler-kofte', 'فيليزلر كوفته', 'Filizler Koftecisi Kadikoy', 'Moda Caddesi, Kadıköy', 40.98640, 29.02680, '+90 216 336 1616', 4.4),
  r('midpoint-nisantasi', 'ميدبوينت نيشانتشي', 'Midpoint Nisantasi', 'Teşvikiye, Nişantaşı', 41.05120, 28.99360, '+90 212 219 1919', 4.3),
  r('bigchefs-kadikoy', 'بيغ شيفز كاديكوي', 'BigChefs Kadikoy', 'Bahariye Caddesi, Kadıköy', 40.99020, 29.02380, '+90 216 337 3737', 4.3),
  r('kitchenette-levent', 'كيتشنِت ليفنت', 'Kitchenette Levent', 'Levent, Beşiktaş', 41.07920, 29.01240, '+90 212 280 8080', 4.4),
  r('gunaydin-kadikoy', 'غونيدين كاديكوي', 'Gunaydin Kadikoy', 'Caferağa, Kadıköy', 40.98780, 29.02520, '+90 216 330 3030', 4.4),
  r('sushico-nisantasi', 'سوشي كو نيشانتشي', 'SushiCo Nisantasi', 'Abdi İpekçi Caddesi', 41.05020, 28.99520, '+90 212 224 2424', 4.4),
  r('paper-moon-etiler', 'بيبر مون إتيلر', 'Paper Moon Etiler', 'Etiler, Beşiktaş', 41.08240, 29.03620, '+90 212 358 0808', 4.5),
  r('lacivert', 'لاجيفرت', 'Lacivert Restaurant', 'Körfez Caddesi, Anadolu Hisarı', 41.08360, 29.06640, '+90 216 413 4545', 4.6),
  r('kuzey-marina', 'كوزي مارينا', 'Kuzey Marina', 'Tarabya, Sarıyer', 41.13840, 29.04820, '+90 212 262 6262', 4.5),
  r('parlez', 'بارليز', 'Parlez Karakoy', 'Karaköy', 41.02320, 28.97420, '+90 212 244 2425', 4.4),
  r('michelin-turk-fatih', 'مطبخ عثماني فاتح', 'Ottoman Restaurant Fatih', 'Fatih', 41.01920, 28.95080, '+90 212 521 2121', 4.4),
  r('pandeli-2', 'حمدي أمينونو السمك', 'Hamdi Balik Eminonu', 'Eminönü', 41.01720, 28.97160, '+90 212 528 0391', 4.5),
  r('zurich-karakoy', 'مطعم كاراكوي السمك', 'Karakoy Balikcisi', 'Karaköy iskele', 41.02240, 28.97620, '+90 212 251 1516', 4.4),
  r('bebek-balik', 'بيهك باليق', 'Bebek Balikcisi', 'Cevdet Paşa Caddesi, Bebek', 41.07720, 29.04380, '+90 212 263 3447', 4.5),
  r('adalari-rest', 'مطاعم الجزر', 'Buyukada Aya Nikola Restaurant', 'Büyükada', 40.85520, 29.12040, '+90 216 382 2424', 4.4),
  r('ortakoy-kumpir', 'كومبير أورتاكوي', 'Ortakoy Kumpir', 'Mecidiye Köprüsü Sokak, Ortaköy', 41.04720, 29.02640, '+90 212 259 1515', 4.3),
  r('taksim-ocakbasi', 'أوجاق باشي تقسيم', 'Taksim Ocakbasi', 'Sıraselviler Caddesi, Beyoğlu', 41.03540, 28.98440, '+90 212 249 4949', 4.4),
  r('kadikoy-meyhane', 'ميخانه كاديكوي', 'Kadikoy Meyhanesi', 'Kadıköy', 40.99140, 29.02720, '+90 216 336 3636', 4.4),
  r('beyoglu-meyhane', 'ميخانه بيوغلو', 'Beyoglu Meyhanesi', 'Nevizade Sokak, Beyoğlu', 41.03460, 28.97880, '+90 212 244 1414', 4.4),
  r('nisantasi-italyan', 'إيطالي نيشانتشي', 'Trattoria Nisantasi', 'Nişantaşı', 41.04780, 28.99240, '+90 212 231 3131', 4.4),
  r('levent-steak', 'ستيك ليفنت', 'Levent Steak House', 'Levent', 41.08160, 29.01480, '+90 212 269 6969', 4.5),
  r('sisli-kebap', 'كباب شيشلي', 'Sisli Kebap Evi', 'Halaskargazi Caddesi, Şişli', 41.06240, 28.98780, '+90 212 230 3030', 4.3),
  r('besiktas-balik', 'سمك بشكطاش', 'Besiktas Balik Pazari Restaurant', 'Beşiktaş Çarşı', 41.04340, 29.00760, '+90 212 261 0101', 4.4),
  r('uskudar-kanaat2', 'قناعت أسكودار 2', 'Kanaat Uskudar Balik', 'Üsküdar sahil', 41.02440, 29.01640, '+90 216 341 4141', 4.4),
  r('fatih-pide', 'بيده الفاتح', 'Fatih Pidecisi', 'Fevzi Paşa Caddesi, Fatih', 41.01880, 28.94840, '+90 212 523 2323', 4.3),
  r('bakirkoy-ocakbasi', 'أوجاق باشي باكركوي', 'Bakirkoy Ocakbasi', 'İstanbul Caddesi, Bakırköy', 40.98180, 28.87340, '+90 212 571 7171', 4.3),
  r('atasehir-kitchenette', 'كيتشنِت أتاشهير', 'Kitchenette Atasehir', 'Ataşehir', 40.99240, 29.12380, '+90 216 572 7272', 4.4),
  r('kadikoy-ciya3', 'چيا كاديكوي السوق', 'Ciya Sofrasi Market Kadikoy', 'Güneşli Bahçe Sokak, Kadıköy', 40.99040, 29.02640, '+90 216 330 3191', 4.6),
  r('sariyer-balik', 'سمك ساريير', 'Sariyer Balikcisi', 'Sarıyer sahil', 41.16680, 29.05720, '+90 212 242 4242', 4.4),
  r('eminonu-pandeli-tatl', 'حلويات أمينونو بجانب باندلي', 'Eminonu Ottoman Kitchen', 'Eminönü', 41.01620, 28.97120, '+90 212 522 2222', 4.3),
  r('galata-rest', 'مطعم غلطة', 'Galata Restaurant', 'Galata, Beyoğlu', 41.02540, 28.97440, '+90 212 245 4545', 4.4),

  c('mandabatmaz', 'ماندا باتماز', 'Mandabatmaz', 'Olivia Geçidi, Beyoğlu', 41.03380, 28.97940, '+90 212 250 4314', 4.6, '09:00 - 00:00'),
  c('kronotrop-karakoy', 'كرونوتروب قركوي', 'Kronotrop Karakoy', 'Kılıç Ali Paşa, Karaköy', 41.02580, 28.98020, '+90 212 243 4313', 4.6, '08:00 - 20:00'),
  c('petra-cihangir', 'بترا جيهانجير', 'Petra Roasting Cihangir', 'Cihangir, Beyoğlu', 41.03120, 28.98520, '+90 212 243 2020', 4.6, '08:00 - 21:00'),
  c('federal-karakoy', 'فيدرال قركوي', 'Federal Coffee Karakoy', 'Karaköy', 41.02380, 28.97360, '+90 212 243 3030', 4.5, '08:00 - 20:30'),
  c('geyik-cihangir', 'غَييك جيهانجير', 'Geyik Coffee Cihangir', 'Cihangir', 41.03240, 28.98420, '+90 212 251 5151', 4.5, '09:00 - 21:00'),
  c('walters-kadikoy', 'والترز كاديكوي', 'Walters Coffee Kadikoy', 'Caferağa, Kadıköy', 40.98840, 29.02340, '+90 216 336 2020', 4.5, '08:30 - 21:00'),
  c('espressolab-istiklal', 'إسبريسو لاب الاستقلال', 'Espressolab Istiklal', 'İstiklal Caddesi, Beyoğlu', 41.03520, 28.98140, '+90 212 244 4040', 4.4, '08:00 - 23:00'),
  c('kahve-dunyasi-istiklal', 'قهوة دنياسي الاستقلال', 'Kahve Dunyasi Istiklal', 'İstiklal Caddesi', 41.03440, 28.98020, '+90 212 249 4948', 4.4, '08:00 - 23:00'),
  c('starbucks-galata', 'ستاربكس غلطة', 'Starbucks Galata', 'Galata Kulesi Meydanı', 41.02560, 28.97410, '+90 212 243 5050', 4.3, '07:30 - 22:00'),
  c('pierre-loti', 'بيير لوتي', 'Pierre Loti Kahvesi', 'Pierre Loti Tepesi, Eyüpsultan', 41.05380, 28.93320, '+90 212 581 2696', 4.5, '08:00 - 00:00'),
  c('fazil-bey', 'فاضل بك', 'Fazil Bey Turk Kahvesi', 'Kadıköy Çarşı', 40.99080, 29.02500, '+90 216 336 0626', 4.6, '08:00 - 23:00'),
  c('karabatak', 'قراباتاق', 'Karabatak Cafe', 'Kara Ali Kaptan Sokak, Karaköy', 41.02420, 28.97800, '+90 212 243 5051', 4.5, '09:00 - 00:00'),
  c('unter', 'أونتر', 'Unter Karakoy', 'Karaköy', 41.02280, 28.97540, '+90 212 244 5151', 4.4, '09:00 - 00:00'),
  c('house-cafe-ortakoy', 'هاوس كافيه أورتاكوي', 'The House Cafe Ortakoy', 'Salhane Sokak, Ortaköy', 41.04740, 29.02680, '+90 212 227 2699', 4.5, '08:00 - 01:00'),
  c('midpoint-levent', 'ميدبوينت ليفنت', 'Midpoint Levent', 'Levent', 41.08020, 29.01320, '+90 212 282 8282', 4.3, '08:00 - 23:00'),
  c('cafe-nero-nisantasi', 'كافيه نيرو نيشانتشي', 'Caffe Nero Nisantasi', 'Teşvikiye', 41.04980, 28.99300, '+90 212 232 3232', 4.3, '07:30 - 22:00'),
  c('mado-nisantasi', 'مادو نيشانتشي', 'Mado Nisantasi', 'Abdi İpekçi Caddesi', 41.04860, 28.99480, '+90 212 231 3132', 4.5, '09:00 - 00:00'),
  c('sutis-emirgan', 'سوتيش إميرغان', 'Sutis Emirgan', 'Emirgan, Sarıyer', 41.10820, 29.05380, '+90 212 277 6565', 4.5, '08:00 - 00:00'),
  c('gloria-istiklal', 'غلوريا جينز الاستقلال', 'Gloria Jeans Istiklal', 'İstiklal Caddesi', 41.03320, 28.97780, '+90 212 251 6161', 4.3, '09:00 - 23:00'),
  c('coffeeshop-kadikoy', 'كوفي شوب كاديكوي', 'Coffeeshop Company Kadikoy', 'Bahariye, Kadıköy', 40.98940, 29.02420, '+90 216 337 3738', 4.3, '08:00 - 22:00'),
  c('cup-of-joy-cihangir', 'كاب أوف جوي جيهانجير', 'Cup of Joy Cihangir', 'Cihangir', 41.03080, 28.98340, '+90 212 243 6161', 4.5, '08:30 - 21:30'),
  c('journey-kadikoy', 'جورني كاديكوي', 'Journey Kadikoy', 'Moda, Kadıköy', 40.98480, 29.02620, '+90 216 330 4040', 4.4, '09:00 - 22:00'),
  c('kronotrop-cibali', 'كرونوتروب جيب علي', 'Kronotrop Cibali', 'Cibali, Fatih', 41.02520, 28.95840, '+90 212 531 3030', 4.5, '08:00 - 20:00'),
  c('petra-kadikoy', 'بترا كاديكوي', 'Petra Kadikoy', 'Kadıköy', 40.98720, 29.02280, '+90 216 336 5050', 4.5, '08:00 - 21:00'),
  c('federal-nisantasi', 'فيدرال نيشانتشي', 'Federal Coffee Nisantasi', 'Nişantaşı', 41.05100, 28.99420, '+90 212 241 7070', 4.5, '08:00 - 21:00'),
  c('geyik-kadikoy', 'غَييك كاديكوي', 'Geyik Kadikoy', 'Kadıköy', 40.99100, 29.02840, '+90 216 336 6060', 4.4, '09:00 - 21:00'),
  c('espressolab-kadikoy', 'إسبريسو لاب كاديكوي', 'Espressolab Kadikoy', 'Bahariye Caddesi', 40.99060, 29.02240, '+90 216 337 7070', 4.4, '07:30 - 22:00'),
  c('kahve-dunyasi-kadikoy', 'قهوة دنياسي كاديكوي', 'Kahve Dunyasi Kadikoy', 'Kadıköy', 40.99180, 29.02460, '+90 216 336 8080', 4.4, '08:00 - 23:00'),
  c('starbucks-bagdat', 'ستاربكس بغداد', 'Starbucks Bagdat Caddesi', 'Bağdat Caddesi, Kadıköy', 40.97420, 29.07540, '+90 216 411 1111', 4.3, '07:30 - 23:00'),
  c('house-cafe-teşvikiye', 'هاوس كافيه تشفيقيه', 'The House Cafe Tesvikiye', 'Teşvikiye', 41.05060, 28.99180, '+90 212 227 2698', 4.4, '08:00 - 00:00'),
  c('mado-bagdat', 'مادو بغداد', 'Mado Bagdat Caddesi', 'Bağdat Caddesi', 40.97280, 29.07720, '+90 216 411 2121', 4.4, '09:00 - 00:00'),
  c('sutis-besiktas', 'سوتيش بشكطاش', 'Sutis Besiktas', 'Beşiktaş', 41.04280, 29.00840, '+90 212 258 5858', 4.4, '08:00 - 00:00'),
  c('cafe-nero-levent', 'كافيه نيرو ليفنت', 'Caffe Nero Levent', 'Levent', 41.07840, 29.01160, '+90 212 280 9090', 4.3, '07:30 - 22:00'),
  c('gloria-nisantasi', 'غلوريا جينز نيشانتشي', 'Gloria Jeans Nisantasi', 'Nişantaşı', 41.04720, 28.99580, '+90 212 232 4242', 4.3, '09:00 - 22:00'),
  c('espressolab-levent', 'إسبريسو لاب ليفنت', 'Espressolab Levent', 'Levent', 41.08220, 29.01560, '+90 212 269 1010', 4.4, '07:30 - 22:00'),
  c('kronotrop-besiktas', 'كرونوتروب بشكطاش', 'Kronotrop Besiktas', 'Beşiktaş', 41.04420, 29.00620, '+90 212 259 2020', 4.5, '08:00 - 20:30'),
  c('petra-ortakoy', 'بترا أورتاكوي', 'Petra Ortakoy', 'Ortaköy', 41.04820, 29.02540, '+90 212 259 3030', 4.5, '08:30 - 21:00'),
  c('federal-kadikoy', 'فيدرال كاديكوي', 'Federal Coffee Kadikoy', 'Kadıköy', 40.98680, 29.02780, '+90 216 336 9090', 4.4, '08:00 - 21:00'),
  c('walter-cihangir', 'والترز جيهانجير', 'Walters Cihangir', 'Cihangir', 41.03340, 28.98280, '+90 212 243 7070', 4.5, '08:30 - 21:00'),
  c('geyik-karakoy', 'غَييك قركوي', 'Geyik Karakoy', 'Karaköy', 41.02480, 28.97680, '+90 212 244 8080', 4.5, '09:00 - 21:00'),
  c('journey-cihangir', 'جورني جيهانجير', 'Journey Cihangir', 'Cihangir', 41.02940, 28.98480, '+90 212 243 8080', 4.4, '09:00 - 22:00'),
  c('karabatak-galata', 'قراباتاق غلطة', 'Karabatak Galata', 'Galata', 41.02620, 28.97380, '+90 212 243 9090', 4.4, '09:00 - 00:00'),
  c('espressolab-besiktas', 'إسبريسو لاب بشكطاش', 'Espressolab Besiktas', 'Barbaros Bulvarı, Beşiktaş', 41.04380, 29.00920, '+90 212 259 4040', 4.4, '07:30 - 22:00'),
  c('kahve-dunyasi-besiktas', 'قهوة دنياسي بشكطاش', 'Kahve Dunyasi Besiktas', 'Beşiktaş Çarşı', 41.04240, 29.00680, '+90 212 258 3030', 4.4, '08:00 - 23:00'),
  c('starbucks-istiklal', 'ستاربكس الاستقلال', 'Starbucks Istiklal', 'İstiklal Caddesi', 41.03620, 28.98520, '+90 212 244 1010', 4.3, '07:30 - 23:00'),
  c('house-cafe-teşvikiye2', 'هاوس كافيه نيشانتشي', 'The House Cafe Nisantasi', 'Nişantaşı', 41.05220, 28.99280, '+90 212 227 2700', 4.4, '08:00 - 00:00'),
  c('mado-kadikoy', 'مادو كاديكوي', 'Mado Kadikoy', 'Bahariye Caddesi', 40.98900, 29.02320, '+90 216 337 2121', 4.4, '09:00 - 00:00'),
  c('sutis-ortakoy', 'سوتيش أورتاكوي', 'Sutis Ortakoy', 'Ortaköy', 41.04680, 29.02780, '+90 212 259 5959', 4.4, '08:00 - 00:00'),
  c('cafe-nero-kadikoy', 'كافيه نيرو كاديكوي', 'Caffe Nero Kadikoy', 'Kadıköy', 40.99220, 29.02580, '+90 216 336 1112', 4.3, '07:30 - 22:00'),
  c('gloria-levent', 'غلوريا جينز ليفنت', 'Gloria Jeans Levent', 'Levent', 41.07980, 29.01420, '+90 212 282 4242', 4.3, '09:00 - 22:00'),
  c('espressolab-nisantasi', 'إسبريسو لاب نيشانتشي', 'Espressolab Nisantasi', 'Nişantaşı', 41.04820, 28.99380, '+90 212 232 5050', 4.4, '07:30 - 22:00'),
  c('kronotrop-kadikoy', 'كرونوتروب كاديكوي', 'Kronotrop Kadikoy', 'Kadıköy', 40.98800, 29.02440, '+90 216 336 1212', 4.5, '08:00 - 20:00'),
  c('petra-besiktas', 'بترا بشكطاش', 'Petra Besiktas', 'Beşiktaş', 41.04520, 29.00800, '+90 212 259 5151', 4.5, '08:00 - 21:00'),
  c('federal-besiktas', 'فيدرال بشكطاش', 'Federal Coffee Besiktas', 'Beşiktaş', 41.04160, 29.00540, '+90 212 258 6161', 4.4, '08:00 - 21:00'),
  c('walter-kadikoy2', 'والترز مودا', 'Walters Moda', 'Moda, Kadıköy', 40.98520, 29.02560, '+90 216 336 1313', 4.5, '08:30 - 21:00'),
  c('geyik-nisantasi', 'غَييك نيشانتشي', 'Geyik Nisantasi', 'Nişantaşı', 41.05080, 28.99640, '+90 212 241 1414', 4.5, '09:00 - 21:00'),
  c('journey-karakoy', 'جورني قركوي', 'Journey Karakoy', 'Karaköy', 41.02340, 28.97740, '+90 212 244 1515', 4.4, '09:00 - 22:00'),
  c('mandabatmaz-2', 'ماندا باتماز غلطة', 'Mandabatmaz Galata', 'Galata', 41.02680, 28.97500, '+90 212 245 1616', 4.5, '09:00 - 00:00'),
  c('pierre-loti-eyup', 'قهوة أيوب', 'Eyup Sultan Kahve', 'Eyüpsultan', 41.04820, 28.93380, '+90 212 581 1818', 4.4, '08:00 - 23:00'),
  c('fazil-bey-uskudar', 'فاضل بك أسكودار', 'Fazil Bey Uskudar', 'Üsküdar', 41.02320, 29.01420, '+90 216 334 1717', 4.5, '08:00 - 23:00'),
  c('kahve-dunyasi-levent', 'قهوة دنياسي ليفنت', 'Kahve Dunyasi Levent', 'Levent', 41.07760, 29.01280, '+90 212 280 1818', 4.4, '08:00 - 22:00'),
  c('starbucks-kadikoy', 'ستاربكس كاديكوي', 'Starbucks Kadikoy', 'Kadıköy iskele', 40.99260, 29.02300, '+90 216 336 1919', 4.3, '07:00 - 23:00'),
  c('house-cafe-emirgan', 'هاوس كافيه إميرغان', 'The House Cafe Emirgan', 'Emirgan', 41.10940, 29.05520, '+90 212 277 2727', 4.4, '09:00 - 00:00'),
  c('mado-levent', 'مادو ليفنت', 'Mado Levent', 'Levent', 41.08100, 29.01680, '+90 212 282 2828', 4.4, '09:00 - 00:00'),
  c('sutis-bebek', 'سوتيش بيهك', 'Sutis Bebek', 'Bebek', 41.07640, 29.04460, '+90 212 263 6363', 4.4, '08:00 - 00:00'),
  c('espressolab-uskudar', 'إسبريسو لاب أسكودار', 'Espressolab Uskudar', 'Üsküdar', 41.02180, 29.01520, '+90 216 334 2020', 4.4, '07:30 - 22:00'),
];

export const ISTANBUL_DINING_SEEDS = withUniqueDiningImages(ISTANBUL_DINING_RAW, new Set());
assertUniqueDiningImages(ISTANBUL_DINING_SEEDS);
