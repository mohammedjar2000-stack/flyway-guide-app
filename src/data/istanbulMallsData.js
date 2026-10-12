/**
 * Named Istanbul malls and department stores with published coordinates.
 * Merged into the local vault as core-* records — never fetched at runtime.
 */
function m(id, name, nameEn, address, lat, lng, phone = '', hours = '10:00 - 22:00') {
  return { id, name, nameEn, address, lat, lng, phone, hours };
}

export const ISTANBUL_MALLS_DATA = [
  m('istinye-park', 'إيستيني بارك', 'IstinyePark', 'İstinye Bayırı Caddesi, Sarıyer', 41.11060, 29.03470, '+90 212 345 5555'),
  m('cevahir', 'مول جواهر', 'Istanbul Cevahir', 'Büyükdere Caddesi No:22, Şişli', 41.05970, 28.98780, '+90 212 380 0818'),
  m('kanyon', 'كانيون', 'Kanyon Shopping Mall', 'Büyükdere Caddesi No:185, Levent', 41.07830, 29.01140, '+90 212 353 5300'),
  m('zorlu', 'زورلو سنتر', 'Zorlu Center', 'Koruhkıran Caddesi, Beşiktaş', 41.06720, 29.01640, '+90 212 924 0000'),
  m('forum-istanbul', 'فورم إسطنبول', 'Forum Istanbul', 'Kocatepe Mah. Paşa Cad., Bayrampaşa', 41.04830, 28.89670, '+90 212 444 60 60'),
  m('mall-of-istanbul', 'مول أوف إسطنبول', 'Mall of Istanbul', 'Mahmutbey, Başakşehir', 41.06280, 28.80750, '+90 212 801 01 01'),
  m('capacity', 'كاباسيتي', 'Capacity Shopping', 'Zeytinlik Mah., Bakırköy', 40.98170, 28.87140),
  m('aqua-florya', 'أكوا فلوريا', 'Aqua Florya', 'Şenlikköy, Bakırköy', 40.96780, 28.79750, '+90 212 574 1010'),
  m('akasya', 'أكاسيا', 'Akasya Acibadem', 'Acıbadem, Üsküdar', 41.00140, 29.05530, '+90 216 999 0101'),
  m('palladium', 'بالاديوم أتاشهير', 'Palladium Ataşehir', 'Barbaros Mah., Ataşehir', 40.98360, 29.12750, '+90 216 579 0700'),
  m('capitol', 'كابيتول', 'Capitol Shopping Center', 'Altunizade, Üsküdar', 41.02140, 29.04030, '+90 216 325 8585'),
  m('metrocity', 'مترو سيتي', 'Metrocity', 'Büyükdere Caddesi, Levent', 41.07640, 29.01310, '+90 212 344 0660'),
  m('ozdilekpark-levent', 'أوزديلك بارك ليفنت', 'OzdilekPark Levent', 'Levent, Beşiktaş', 41.08100, 29.01200),
  m('olivium', 'أوليفيوم', 'Olivium Outlet Center', 'Zeytinburnu', 41.01700, 28.92800),
  m('marmara-forum', 'مارمارا فورم', 'Marmara Forum', 'Osmaniye, Bakırköy', 40.99640, 28.89080, '+90 212 466 1010'),
  m('citys-nisantasi', 'سيتيز نيشانتشي', "City's Nisantasi", 'Teşvikiye, Şişli', 41.05200, 28.99300, '+90 212 373 3333'),
  m('emaar-square', 'إعمار سكوير', 'Emaar Square Mall', 'Ünalan, Üsküdar', 41.00470, 29.07060, '+90 216 629 0000'),
  m('hilltown', 'هيلتاون كوزيأتاغي', 'Hilltown Kozyatagi', 'Kozyatağı, Kadıköy', 40.96600, 29.10300),
  m('watergarden', 'واتر غاردن', 'Watergarden', 'Ataşehir', 40.99200, 29.12300),
  m('vadi-istanbul', 'وادي إسطنبول', 'Vadi Istanbul', 'Ayazağa, Sarıyer', 41.10700, 28.98700, '+90 212 807 0000'),
  m('venezia', 'فينيسيا ميغا', 'Venezia Mega Outlet', 'Bayrampaşa', 41.06600, 28.87000),
  m('axis-kagithane', 'أكسيس كاغِتهانه', 'Axis Istanbul', 'Kağıthane', 41.07900, 28.97300),
  m('trump-towers', 'ترامب تاورز', 'Trump Towers Istanbul', 'Mecidiyeköy, Şişli', 41.06100, 28.99200),
  m('profilo', 'بروفيلو', 'Profilo Shopping Center', 'Mecidiyeköy, Şişli', 41.06600, 28.98800),
  m('tepe-nautilus', 'تيبه نوتيلوس', 'Tepe Nautilus', 'Acıbadem, Kadıköy', 40.98600, 29.04000, '+90 216 548 2400'),
  m('carousel', 'كاروسيل', 'Carousel Shopping Center', 'Bakırköy', 40.98000, 28.87500),
  m('galleria', 'غاليريا أتاقوي', 'Galleria Atakoy', 'Ataköy, Bakırköy', 40.97400, 28.87700),
  m('a-plus', 'أتاقوي إيه بلس', 'Atakoy A Plus', 'Ataköy, Bakırköy', 40.97900, 28.85000),
  m('212-istanbul', '212 إسطنبول', '212 Istanbul Power Outlet', 'Mahmutbey, Bağcılar', 41.06000, 28.81000),
  m('torium', 'توريوم', 'Torium', 'Esenyurt', 41.00600, 28.64000),
  m('marmara-park', 'مارمارا بارك', 'Marmara Park', 'Beylikdüzü', 41.00600, 28.67000, '+90 212 866 2020'),
  m('pelican', 'بيليكان مول', 'Pelican Mall', 'Avcılar', 41.00000, 28.72000),
  m('flyinn', 'فلايين', 'Flyinn Shopping Center', 'Florya, Bakırköy', 40.98000, 28.82000),
  m('historia', 'هستوريا', 'Historia Shopping', 'Fatih', 41.01000, 28.94000),
  m('grand-pera', 'غراند بيرا', 'Grand Pera', 'İstiklal Caddesi, Beyoğlu', 41.03500, 28.97900),
  m('demiroren', 'دمير أورن الاستقلال', 'Demiroren Istiklal', 'İstiklal Caddesi, Beyoğlu', 41.03600, 28.97900),
  m('optimum-istanbul', 'أوبتيموم إسطنبول', 'Optimum Istanbul', 'Ataşehir', 40.98000, 28.72000),
  m('brandium', 'برانديوم', 'Brandium AVM', 'Ataşehir', 40.98000, 29.09000),
  m('buyaka', 'بوياكا', 'Buyaka', 'Tepeüstü, Ümraniye', 41.02000, 29.13000),
  m('akbati', 'أكباتي', 'Akbati Shopping Mall', 'Esenyurt', 41.05000, 28.69000),
  m('canpark', 'جان بارك', 'Canpark', 'Ümraniye', 41.02500, 29.11500),
  m('neomarin', 'نيومارين', 'Neomarin', 'Pendik', 40.87800, 29.23500),
  m('viaport-asia', 'فيا بورت آسيا', 'Viaport Asia', 'Pendik', 40.87000, 29.29000),
  m('viaport-tuzla', 'فيا بورت توزلا', 'Viaport Tuzla', 'Tuzla', 40.82200, 29.30000),
  m('maltepe-park', 'مالتبه بارك', 'Maltepe Park', 'Cevizli, Maltepe', 40.93400, 29.13400),
  m('ceva-gunesli', 'سيفا غونشلي', 'CEVA / Gunesli Outlet', 'Güneşli, Bağcılar', 41.03800, 28.82500),
  m('istanbul-airport-city', 'إسطنبول إيربورت سيتي', 'Istanbul Airport City Galleria', 'Arnavutköy / IGA', 41.26000, 28.74200),
  m('galataport', 'غالاطا بورت', 'Galataport Istanbul', 'Karaköy, Beyoğlu', 41.02420, 28.97880, '+90 212 372 0202'),
  m('bebek-bazaar', 'سوق بيبك', 'Bebek Neighborhood Market', 'Cevdet Paşa Caddesi, Bebek', 41.07740, 29.04380, '', '08:00 - 20:00'),
  m('kadikoy-bulls', 'سوق كاديكوي الأسبوعي', 'Kadikoy Tuesday Market', 'Hasanpaşa, Kadıköy', 40.99600, 29.05000, '', '07:00 - 18:00'),
];

export const ISTANBUL_MALLS_VERSION = 1;
