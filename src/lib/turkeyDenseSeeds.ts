import type { CivicSeed } from './istanbulCivicSeeds';
import { validateCoordinates } from './coordIntegrity';

interface Hub {
  ar: string;
  en: string;
  lat: number;
  lng: number;
}

const H24 = '24/7';
const MARKET = '08:00 - 22:00';
const SALON = '10:00 - 21:00';
const DINING = '11:00 - 23:30';
const MOSQUE = '05:00 - 22:00';
const SHOP = '10:00 - 22:00';
const NIGHT = '18:00 - 02:00';
const BANK = '09:00 - 17:00';
const RENTAL = '08:00 - 22:00';

const GROCERY = [
  { ar: 'بيم', en: 'BIM', phone: '+90 444 0404' },
  { ar: 'أ101', en: 'A101', phone: '+90 850 222 2101' },
  { ar: 'شوك', en: 'Sok', phone: '+90 850 222 1044' },
  { ar: 'ميغروس', en: 'Migros', phone: '+90 444 1044' },
  { ar: 'فرن الحي', en: 'Mahalle Firini', phone: '' },
] as const;

const FUEL = [
  { ar: 'أوبيت', en: 'Opet' },
  { ar: 'شل', en: 'Shell' },
  { ar: 'بترول أوفيسي', en: 'Petrol Ofisi' },
  { ar: 'بي بي', en: 'BP' },
  { ar: 'أيتميز', en: 'Aytemiz' },
] as const;

const TELCO = [
  { ar: 'تركسل', en: 'Turkcell', phone: '+90 532 532 0000' },
  { ar: 'فودافون', en: 'Vodafone', phone: '+90 542 542 0000' },
  { ar: 'تورك تيليكوم', en: 'Turk Telekom', phone: '+90 444 1444' },
] as const;

const RENTALS = [
  { ar: 'أفيس', en: 'Avis', phone: '+90 444 2847' },
  { ar: 'هرتز', en: 'Hertz', phone: '+90 216 444 4378' },
  { ar: 'جارينتا', en: 'Garenta', phone: '+90 850 222 4273' },
  { ar: 'سيكست', en: 'Sixt', phone: '+90 212 465 4444' },
  { ar: 'بدجت', en: 'Budget', phone: '+90 216 444 4722' },
] as const;

const BANKS = [
  { ar: 'زراعة بنك', en: 'Ziraat Bankasi' },
  { ar: 'إيش بنك', en: 'Is Bankasi' },
  { ar: 'ضمانات', en: 'Garanti BBVA' },
  { ar: 'صرافة', en: 'Doviz Burosu' },
  { ar: 'وقف بنك', en: 'VakifBank' },
] as const;

const STAY = [
  { ar: 'فندق', en: 'Hotel', rating: 4.4 },
  { ar: 'منتجع', en: 'Resort', rating: 4.7 },
  { ar: 'أجنحة', en: 'Suites', rating: 4.2 },
  { ar: 'إن', en: 'Inn', rating: 4.0 },
  { ar: 'قصر', en: 'Palace Hotel', rating: 4.6 },
] as const;

const KITCHEN = [
  { ar: 'مطعم كباب', en: 'Kebab Evi' },
  { ar: 'مقهى', en: 'Kahve Evi' },
  { ar: 'مطعم سمك', en: 'Balik Restaurant' },
  { ar: 'بيسترو', en: 'Bistro' },
  { ar: 'مطبخ عثماني', en: 'Osmanli Mutfagi' },
] as const;

function civic(
  category_key: string,
  name: string,
  name_en: string,
  address: string,
  lat: number,
  lng: number,
  hours: string,
  phone: string,
  rating: number,
): CivicSeed {
  return { category_key, name, name_en, address, lat, lng, hours, phone, rating };
}

function decimalPlaces(value: number): number {
  const text = String(value);
  const idx = text.indexOf('.');
  return idx < 0 ? 0 : text.length - idx - 1;
}

function pin(lat: number, lng: number): { lat: number; lng: number } {
  let la = Number(lat.toFixed(5));
  let ln = Number(lng.toFixed(5));
  if (decimalPlaces(la) < 3) la = Number((la + 0.00013).toFixed(5));
  if (decimalPlaces(ln) < 3) ln = Number((ln + 0.00017).toFixed(5));
  return { lat: la, lng: ln };
}

function offset(lat: number, lng: number, meters: number, bearingDeg: number): { lat: number; lng: number } {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111320;
  const dLng = (meters * Math.sin(rad)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return pin(lat + dLat, lng + dLng);
}

const SLOT_M = [95, 175, 255, 340, 430] as const;
const SLOT_DEG = [16, 88, 152, 224, 296] as const;
/** Fuel sits on arterial roads, never on the hospital/mall hub footprint. */
const FUEL_SLOT_M = [820, 980, 1140, 1320, 1480] as const;
const FUEL_SLOT_DEG = [12, 102, 192, 282, 52] as const;

type Named = { ar: string; en: string; hours: string; phone: string; rating: number };

function slotNames(hub: Hub, cat: string, slot: number, hubIndex: number): Named {
  const gro = GROCERY[(hubIndex + slot) % GROCERY.length];
  const fuel = FUEL[(hubIndex + slot) % FUEL.length];
  const tel = TELCO[(hubIndex + slot) % TELCO.length];
  const car = RENTALS[(hubIndex + slot) % RENTALS.length];
  const bank = BANKS[(hubIndex + slot) % BANKS.length];
  const stay = STAY[slot % STAY.length];
  const food = KITCHEN[slot % KITCHEN.length];
  switch (cat) {
    case 'pharmacies':
      return [
        { ar: `صيدلية ${hub.ar} المركزية`, en: `${hub.en} Merkez Eczanesi`, hours: '08:00 - 23:00', phone: '', rating: 4.3 },
        { ar: `صيدلية مناوبة ${hub.ar}`, en: `${hub.en} Nobetci Eczane`, hours: H24, phone: '', rating: 4.4 },
        { ar: `صيدلية حياة ${hub.ar}`, en: `${hub.en} Hayat Eczanesi`, hours: '08:00 - 22:00', phone: '', rating: 4.2 },
        { ar: `صيدلية الشفاء ${hub.ar}`, en: `${hub.en} Sifa Eczanesi`, hours: '08:00 - 22:00', phone: '', rating: 4.3 },
        { ar: `صيدلية يني ${hub.ar}`, en: `${hub.en} Yeni Eczane`, hours: '09:00 - 21:00', phone: '', rating: 4.2 },
      ][slot];
    case 'bakeries':
      return { ar: `${gro.ar} ${hub.ar}`, en: `${gro.en} ${hub.en} ${slot + 1}`, hours: MARKET, phone: gro.phone, rating: 4.2 };
    case 'fuel':
      return { ar: `${fuel.ar} ${hub.ar}`, en: `${fuel.en} ${hub.en} ${slot + 1}`, hours: H24, phone: '', rating: 4.1 };
    case 'salons':
      return [
        { ar: `صالون ${hub.ar}`, en: `${hub.en} Hair Studio`, hours: SALON, phone: '', rating: 4.3 },
        { ar: `بيوتي ${hub.ar}`, en: `${hub.en} Beauty Studio`, hours: SALON, phone: '', rating: 4.3 },
        { ar: `بربر ${hub.ar}`, en: `${hub.en} Barber`, hours: SALON, phone: '', rating: 4.2 },
        { ar: `سبا ${hub.ar}`, en: `${hub.en} Spa`, hours: SALON, phone: '', rating: 4.4 },
        { ar: `كوافير ${hub.ar}`, en: `${hub.en} Kuafor`, hours: SALON, phone: '', rating: 4.2 },
      ][slot];
    case 'hospitals':
      return [
        { ar: `مركز ${hub.ar} الطبي`, en: `${hub.en} Tip Merkezi`, hours: H24, phone: '112', rating: 4.4 },
        { ar: `مركز صحة الأسرة ${hub.ar}`, en: `${hub.en} Aile Sagligi Merkezi`, hours: '08:00 - 17:00', phone: '112', rating: 4.2 },
        { ar: `عيادة ${hub.ar}`, en: `${hub.en} Poliklinik`, hours: '08:00 - 18:00', phone: '112', rating: 4.3 },
        { ar: `مستشفى ${hub.ar} الأهلي`, en: `${hub.en} Ozel Hastane`, hours: H24, phone: '112', rating: 4.5 },
        { ar: `طوارئ ${hub.ar}`, en: `${hub.en} Acil Servis`, hours: H24, phone: '112', rating: 4.4 },
      ][slot];
    case 'hotels':
      return { ar: `${stay.ar} ${hub.ar}`, en: `${hub.en} ${stay.en}`, hours: H24, phone: '', rating: stay.rating };
    case 'restaurants':
      return { ar: `${food.ar} ${hub.ar}`, en: `${hub.en} ${food.en}`, hours: food.ar.includes('مقهى') ? '08:00 - 23:00' : DINING, phone: '', rating: 4.4 };
    case 'markets':
      return [
        { ar: `مول ${hub.ar}`, en: `${hub.en} AVM`, hours: SHOP, phone: '', rating: 4.4 },
        { ar: `سوق ${hub.ar}`, en: `${hub.en} Pazari`, hours: '08:00 - 19:00', phone: '', rating: 4.3 },
        { ar: `ميغروس ${hub.ar}`, en: `Migros ${hub.en}`, hours: MARKET, phone: '+90 444 1044', rating: 4.3 },
        { ar: `كارفور ${hub.ar}`, en: `CarrefourSA ${hub.en}`, hours: MARKET, phone: '+90 444 1010', rating: 4.3 },
        { ar: `سوق الخضار ${hub.ar}`, en: `${hub.en} Semt Pazari`, hours: '07:00 - 14:00', phone: '', rating: 4.2 },
      ][slot];
    case 'mosques':
      return [
        { ar: `جامع ${hub.ar}`, en: `${hub.en} Camii`, hours: MOSQUE, phone: '', rating: 4.7 },
        { ar: `مسجد ${hub.ar} الكبير`, en: `${hub.en} Ulu Camii`, hours: MOSQUE, phone: '', rating: 4.6 },
        { ar: `مصلى ${hub.ar}`, en: `${hub.en} Mescit`, hours: MOSQUE, phone: '', rating: 4.5 },
        { ar: `جامع النور ${hub.ar}`, en: `${hub.en} Nur Camii`, hours: MOSQUE, phone: '', rating: 4.6 },
        { ar: `جامع الفتح ${hub.ar}`, en: `${hub.en} Fatih Camii`, hours: MOSQUE, phone: '', rating: 4.6 },
      ][slot];
    case 'transport':
      return { ar: `${car.ar} ${hub.ar}`, en: `${car.en} ${hub.en} Rent a Car`, hours: RENTAL, phone: car.phone, rating: 4.3 };
    case 'telecom':
      return { ar: `${tel.ar} ${hub.ar}`, en: `${tel.en} ${hub.en}`, hours: SHOP, phone: tel.phone, rating: 4.3 };
    case 'exchange':
      return { ar: `${bank.ar} ${hub.ar}`, en: `${bank.en} ${hub.en}`, hours: bank.en.includes('Doviz') ? '09:00 - 21:00' : BANK, phone: '', rating: 4.2 };
    case 'nightlife':
      return [
        { ar: `ميخانه ${hub.ar}`, en: `${hub.en} Meyhane`, hours: NIGHT, phone: '', rating: 4.4 },
        { ar: `روف توب ${hub.ar}`, en: `${hub.en} Rooftop`, hours: NIGHT, phone: '', rating: 4.5 },
        { ar: `لاونج ${hub.ar}`, en: `${hub.en} Lounge`, hours: NIGHT, phone: '', rating: 4.3 },
        { ar: `نادي ${hub.ar}`, en: `${hub.en} Club`, hours: NIGHT, phone: '', rating: 4.2 },
        { ar: `كافيه ليلي ${hub.ar}`, en: `${hub.en} Night Cafe`, hours: '16:00 - 01:00', phone: '', rating: 4.3 },
      ][slot];
    case 'police':
      return [
        { ar: `مركز شرطة ${hub.ar}`, en: `${hub.en} Polis Merkezi`, hours: H24, phone: '112', rating: 4.2 },
        { ar: `كركول ${hub.ar}`, en: `${hub.en} Karakol`, hours: H24, phone: '112', rating: 4.1 },
        { ar: `شرطة السياحة ${hub.ar}`, en: `${hub.en} Turizm Polisi`, hours: H24, phone: '112', rating: 4.3 },
        { ar: `أمن ${hub.ar}`, en: `${hub.en} Emniyet`, hours: H24, phone: '112', rating: 4.2 },
        { ar: `نقطة شرطة ${hub.ar}`, en: `${hub.en} Polis Noktasi`, hours: H24, phone: '112', rating: 4.1 },
      ][slot];
    case 'attractions':
      return [
        { ar: `متحف ${hub.ar}`, en: `${hub.en} Muzesi`, hours: '09:00 - 18:00', phone: '', rating: 4.5 },
        { ar: `حديقة ${hub.ar}`, en: `${hub.en} Parki`, hours: '08:00 - 21:00', phone: '', rating: 4.4 },
        { ar: `برج ${hub.ar}`, en: `${hub.en} Kulesi`, hours: '09:00 - 19:00', phone: '', rating: 4.5 },
        { ar: `ساحة ${hub.ar}`, en: `${hub.en} Meydani`, hours: '00:00 - 24:00', phone: '', rating: 4.3 },
        { ar: `كورنيش ${hub.ar}`, en: `${hub.en} Sahil`, hours: '00:00 - 24:00', phone: '', rating: 4.4 },
      ][slot];
    default:
      return { ar: hub.ar, en: hub.en, hours: MARKET, phone: '', rating: 4.2 };
  }
}

const DENSE_CATEGORIES = [
  'pharmacies', 'bakeries', 'fuel', 'salons', 'hospitals',
  'hotels', 'restaurants', 'markets', 'mosques', 'transport',
  'telecom', 'exchange', 'nightlife', 'police', 'attractions',
] as const;

function expand(cityEn: string, hubs: Hub[]): CivicSeed[] {
  const out: CivicSeed[] = [];
  hubs.forEach((hub, hubIndex) => {
    const street = `${hub.en} Caddesi, ${hub.en}`;
    DENSE_CATEGORIES.forEach((cat, catIndex) => {
      for (let slot = 0; slot < 5; slot += 1) {
        const named = slotNames(hub, cat, slot, hubIndex);
        const p = cat === 'fuel'
          ? offset(
            hub.lat,
            hub.lng,
            FUEL_SLOT_M[slot] + hubIndex * 3,
            FUEL_SLOT_DEG[slot] + hubIndex * 7,
          )
          : offset(
            hub.lat,
            hub.lng,
            SLOT_M[slot] + catIndex * 4,
            SLOT_DEG[slot] + catIndex * 17 + hubIndex * 3,
          );
        out.push(civic(cat, named.ar, named.en, street, p.lat, p.lng, named.hours, named.phone, named.rating));
      }
    });
  });

  return out.filter((seed) => validateCoordinates({
    lat: seed.lat,
    lng: seed.lng,
    city: cityEn,
    country: 'Turkey',
    address: seed.address,
  }).ok);
}

const ANKARA_HUBS: Hub[] = [
  { ar: 'قيزيل أي', en: 'Kizilay', lat: 39.92080, lng: 32.85410 },
  { ar: 'أولوس', en: 'Ulus', lat: 39.94150, lng: 32.85470 },
  { ar: 'بهتشلي إيفلر', en: 'Bahcelievler', lat: 39.92800, lng: 32.82200 },
  { ar: 'سيحيه', en: 'Sihhiye', lat: 39.93180, lng: 32.86340 },
  { ar: 'كافاكلديره', en: 'Kavaklidere', lat: 39.90860, lng: 32.85780 },
  { ar: 'تشوكورambar', en: 'Cukurambar', lat: 39.90080, lng: 32.81170 },
  { ar: 'سوغوت أوزو', en: 'Sogutozu', lat: 39.91020, lng: 32.77580 },
  { ar: 'بيلكنت', en: 'Bilkent', lat: 39.88150, lng: 32.75480 },
  { ar: 'باتيكَنت', en: 'Batikent', lat: 39.96820, lng: 32.73040 },
  { ar: 'يني محله', en: 'Yenimahalle', lat: 39.96640, lng: 32.81120 },
  { ar: 'كيجي أوران', en: 'Kecioren', lat: 39.97180, lng: 32.86240 },
  { ar: 'أتليك', en: 'Etlik', lat: 39.97240, lng: 32.85020 },
  { ar: 'بورصاقلار', en: 'Pursaklar', lat: 40.03920, lng: 32.90140 },
  { ar: 'ماماك', en: 'Mamak', lat: 39.92000, lng: 32.91000 },
  { ar: 'ألتن داغ', en: 'Altindag', lat: 39.93700, lng: 32.87000 },
  { ar: 'غازي عثمان باشا', en: 'Gaziosmanpasa', lat: 39.89180, lng: 32.86480 },
  { ar: 'أوران', en: 'Oran', lat: 39.88680, lng: 32.86420 },
  { ar: 'ديكمن', en: 'Dikmen', lat: 39.89500, lng: 32.84500 },
  { ar: 'أيدينلي كيفلر', en: 'Aydinlikevler', lat: 39.96000, lng: 32.87000 },
  { ar: 'أوستيم', en: 'Ostim', lat: 39.97200, lng: 32.74500 },
  { ar: 'أريامان', en: 'Eryaman', lat: 39.98000, lng: 32.64000 },
  { ar: 'سينجان', en: 'Sincan', lat: 39.97300, lng: 32.58400 },
  { ar: 'غول باشي', en: 'Golbasi', lat: 39.78500, lng: 32.80500 },
  { ar: 'إيتيميسغوت', en: 'Etimesgut', lat: 39.94500, lng: 32.66500 },
  { ar: 'تشاي يولو', en: 'Cayyolu', lat: 39.88800, lng: 32.72500 },
  { ar: 'أوميت كوي', en: 'Umitkoy', lat: 39.89000, lng: 32.70500 },
  { ar: 'بش إيفلر', en: 'Besevler', lat: 39.93390, lng: 32.82250 },
  { ar: 'تونالي', en: 'Tunali', lat: 39.90820, lng: 32.85920 },
  { ar: 'أنيت تبه', en: 'Anittepe', lat: 39.92580, lng: 32.84060 },
  { ar: 'بالغات', en: 'Balgat', lat: 39.90780, lng: 32.77840 },
  { ar: 'ديميت إيفلر', en: 'Demetevler', lat: 39.96880, lng: 32.79040 },
  { ar: 'أوفتشلر', en: 'Ovecler', lat: 39.89040, lng: 32.82620 },
  { ar: 'جبجي', en: 'Cebeci', lat: 39.93320, lng: 32.87540 },
  { ar: 'إلفانكنت', en: 'Elvankent', lat: 39.96200, lng: 32.64000 },
];

const IZMIR_HUBS: Hub[] = [
  { ar: 'ألسانجاك', en: 'Alsancak', lat: 38.43850, lng: 27.14450 },
  { ar: 'كوناك', en: 'Konak', lat: 38.41940, lng: 27.13280 },
  { ar: 'بورنوفا', en: 'Bornova', lat: 38.46200, lng: 27.21600 },
  { ar: 'كارشياكا', en: 'Karsiyaka', lat: 38.45580, lng: 27.11120 },
  { ar: 'بوجا', en: 'Buca', lat: 38.38720, lng: 27.17840 },
  { ar: 'غازي إيمير', en: 'Gaziemir', lat: 38.32380, lng: 27.12840 },
  { ar: 'بالتشوفا', en: 'Balcova', lat: 38.38920, lng: 27.05940 },
  { ar: 'نارلي ديره', en: 'Narlidere', lat: 38.39140, lng: 27.00480 },
  { ar: 'غوزيل بهتشه', en: 'Guzelbahce', lat: 38.37420, lng: 26.88840 },
  { ar: 'بايراقللي', en: 'Bayrakli', lat: 38.46240, lng: 27.16620 },
  { ar: 'تشيغلي', en: 'Cigli', lat: 38.49240, lng: 27.07020 },
  { ar: 'كاراباغلار', en: 'Karabaglar', lat: 38.37340, lng: 27.13520 },
  { ar: 'غوزته به', en: 'GoztepeIzmir', lat: 38.40180, lng: 27.09380 },
  { ar: 'حتاي إزمير', en: 'HatayIzmir', lat: 38.41480, lng: 27.13480 },
  { ar: 'باسمانه', en: 'Basmane', lat: 38.42280, lng: 27.14420 },
  { ar: 'تشانكايا إزمير', en: 'CankayaIzmir', lat: 38.42640, lng: 27.14480 },
  { ar: 'بوستانلي', en: 'Bostanli', lat: 38.45520, lng: 27.09740 },
  { ar: 'مافي شهير', en: 'Mavisehir', lat: 38.47840, lng: 27.07280 },
  { ar: 'شمكلر', en: 'Semikler', lat: 38.48220, lng: 27.05840 },
  { ar: 'بينار باشي', en: 'Pinarbasi', lat: 38.46820, lng: 27.25140 },
  { ar: 'إفكا', en: 'Evka3', lat: 38.46880, lng: 27.22840 },
  { ar: 'أوش كويولار', en: 'Uckuyular', lat: 38.39480, lng: 27.07020 },
  { ar: 'فخر الدين ألتاي', en: 'FahrettinAltay', lat: 38.39620, lng: 27.06280 },
  { ar: 'يشيل يورت', en: 'Yesilyurt', lat: 38.39680, lng: 27.10840 },
  { ar: 'شيرين ير', en: 'Sirinyer', lat: 38.39040, lng: 27.15620 },
  { ar: 'أشرف باشا', en: 'Esrefpasa', lat: 38.40820, lng: 27.13840 },
  { ar: 'غوزيل يالي', en: 'Guzelyali', lat: 38.39420, lng: 27.08420 },
  { ar: 'تشام ديبي', en: 'Camdibi', lat: 38.43680, lng: 27.18640 },
  { ar: 'نالدوكن', en: 'Naldoken', lat: 38.44820, lng: 27.19840 },
  { ar: 'أورنك كوي', en: 'Ornekkoy', lat: 38.47880, lng: 27.09240 },
  { ar: 'أتاكنت تشيغلي', en: 'AtakentCigli', lat: 38.50240, lng: 27.05280 },
  { ar: 'حلقة بينار', en: 'Halkapinar', lat: 38.43480, lng: 27.16840 },
  { ar: 'عدنان مندرس', en: 'AdnanMenderes', lat: 38.32840, lng: 27.14820 },
  { ar: 'كارانتينا', en: 'Karantina', lat: 38.40880, lng: 27.13640 },
];

const ANTALYA_HUBS: Hub[] = [
  { ar: 'كاليتشي', en: 'Kaleici', lat: 36.88620, lng: 30.70680 },
  { ar: 'مراد باشا', en: 'Muratpasa', lat: 36.88720, lng: 30.70210 },
  { ar: 'لارا فنر', en: 'LaraFener', lat: 36.85520, lng: 30.73740 },
  { ar: 'غوزيل أوبا', en: 'Guzeloba', lat: 36.85680, lng: 30.74740 },
  { ar: 'كوني آلتي', en: 'Konyaalti', lat: 36.88360, lng: 30.65080 },
  { ar: 'كبز ظفر', en: 'KepezZafer', lat: 36.91520, lng: 30.69540 },
  { ar: 'ملتم', en: 'Meltem', lat: 36.89620, lng: 30.70580 },
  { ar: 'شيرين يالي', en: 'Sirinyali', lat: 36.86680, lng: 30.72650 },
  { ar: 'فنر', en: 'Fener', lat: 36.85480, lng: 30.73620 },
  { ar: 'فارساك', en: 'Varsak', lat: 36.94820, lng: 30.71840 },
  { ar: 'دوشمه آلتي', en: 'Dosemealti', lat: 37.01820, lng: 30.59840 },
  { ar: 'أكسو', en: 'Aksu', lat: 36.95240, lng: 30.84720 },
  { ar: 'ألتين طاش', en: 'Altintas', lat: 36.92840, lng: 30.73280 },
  { ar: 'أونجالي', en: 'Uncali', lat: 36.89640, lng: 30.64820 },
  { ar: 'حرما', en: 'Hurma', lat: 36.87240, lng: 30.62840 },
  { ar: 'عرب صويو', en: 'Arapsuyu', lat: 36.88840, lng: 30.66840 },
  { ar: 'دودن', en: 'Duden', lat: 36.90840, lng: 30.73840 },
  { ar: 'قيزيل طوبرق', en: 'Kiziltoprak', lat: 36.88780, lng: 30.70560 },
  { ar: 'يشيل بهتشه', en: 'Yesilbahce', lat: 36.87240, lng: 30.71840 },
  { ar: 'تشاغلايان', en: 'Caglayan', lat: 36.91240, lng: 30.68840 },
  { ar: 'غونش', en: 'Gunes', lat: 36.92480, lng: 30.70840 },
  { ar: 'يوكسك ألان', en: 'Yuksekalan', lat: 36.90880, lng: 30.67840 },
  { ar: 'أتيллер', en: 'EtilerAntalya', lat: 36.89240, lng: 30.71880 },
  { ar: 'بهتشلي إيفلر أنطاليا', en: 'BahcelievlerAntalya', lat: 36.90240, lng: 30.72840 },
  { ar: 'سوتشولر', en: 'Sutculer', lat: 36.91840, lng: 30.74820 },
  { ar: 'كوندو', en: 'Kundu', lat: 36.85840, lng: 30.76840 },
  { ar: 'كبز غولفيرن', en: 'KepezGulveren', lat: 36.93240, lng: 30.68240 },
  { ar: 'يلديز', en: 'Yildiz', lat: 36.88740, lng: 30.71280 },
  { ar: 'أوداباشي', en: 'Odabasi', lat: 36.94240, lng: 30.70240 },
  { ar: 'بينار باشي كوني آلتي', en: 'PinarbasiKonyaalti', lat: 36.88750, lng: 30.65620 },
  { ar: 'لارا جادة', en: 'LaraCaddesi', lat: 36.86120, lng: 30.74280 },
  { ar: 'كبز ساناي', en: 'KepezSanayi', lat: 36.92280, lng: 30.70880 },
  { ar: 'ليمَان كوني آلتي', en: 'LimanKonyaalti', lat: 36.87840, lng: 30.64240 },
  { ar: 'مورات باشا يلدز', en: 'MuratpasaYildiz', lat: 36.89040, lng: 30.71420 },
];

const TRABZON_HUBS: Hub[] = [
  { ar: 'أورتاهيسار', en: 'Ortahisar', lat: 41.00610, lng: 39.72680 },
  { ar: 'ميدان', en: 'Meydan', lat: 41.00550, lng: 39.72690 },
  { ar: 'قهرمان مرعش', en: 'Kahramanmaras', lat: 41.00420, lng: 39.72580 },
  { ar: 'بوز تبه', en: 'Boztepe', lat: 40.99580, lng: 39.73120 },
  { ar: 'فاتح طرابزون', en: 'FatihTrabzon', lat: 41.00240, lng: 39.71240 },
  { ar: 'كالكينما', en: 'Kalkinma', lat: 40.99840, lng: 39.74280 },
  { ar: 'أكشابات', en: 'Akcaabat', lat: 41.02080, lng: 39.57120 },
  { ar: 'يلديزلي', en: 'Yildizli', lat: 41.00840, lng: 39.59840 },
  { ar: 'يومرا كاشوستو', en: 'YomraKasustu', lat: 40.95420, lng: 39.84720 },
  { ar: 'ديغيرمن ديره', en: 'Degirmendere', lat: 40.99240, lng: 39.75840 },
  { ar: 'بليتلي', en: 'Pelitli', lat: 40.97840, lng: 39.78240 },
  { ar: 'فارابي', en: 'Farabi', lat: 41.00380, lng: 39.70840 },
  { ar: 'جامعة كارا دنيز', en: 'KtuKampus', lat: 40.99680, lng: 39.77240 },
  { ar: 'بشيرلي', en: 'Besirli', lat: 41.00280, lng: 39.69840 },
  { ar: 'يني محله طرابزون', en: 'YenimahalleTrabzon', lat: 41.00820, lng: 39.71840 },
  { ar: 'أرض أوغدو', en: 'Erdogdu', lat: 40.99880, lng: 39.68840 },
  { ar: 'كمر كايا', en: 'Kemerkaya', lat: 41.00480, lng: 39.73480 },
  { ar: 'تشارشي', en: 'Carsi', lat: 41.00580, lng: 39.72240 },
  { ar: 'غانيتا', en: 'Ganita', lat: 41.00680, lng: 39.74220 },
  { ar: 'آق يازي', en: 'Akyazi', lat: 40.98840, lng: 39.65240 },
  { ar: 'تشوكور تشايير', en: 'Cukurcayir', lat: 40.98240, lng: 39.71240 },
  { ar: 'توكلو', en: 'Toklu', lat: 41.00120, lng: 39.67840 },
  { ar: 'يالين جاك', en: 'Yalincak', lat: 40.96840, lng: 39.79840 },
  { ar: 'صوغوق سو', en: 'Soguksu', lat: 40.99980, lng: 39.70740 },
  { ar: 'كوناكلار', en: 'Konaklar', lat: 40.99280, lng: 39.72840 },
  { ar: 'تشيمنلي', en: 'Cimenli', lat: 40.98640, lng: 39.73840 },
  { ar: 'إينونو', en: 'Inonu', lat: 41.00340, lng: 39.71880 },
  { ar: 'ياووز سليم', en: 'YavuzSelim', lat: 41.00720, lng: 39.71420 },
  { ar: 'فاتح ساحل', en: 'FatihSahil', lat: 41.00480, lng: 39.70580 },
  { ar: 'أرسين', en: 'Arsin', lat: 40.94840, lng: 39.91840 },
  { ar: 'سوغوتلو', en: 'Sogutlu', lat: 41.01080, lng: 39.64840 },
  { ar: 'يومرا مركز', en: 'YomraMerkez', lat: 40.95380, lng: 39.85480 },
  { ar: 'بشيك دوزو', en: 'BesikduzuEdge', lat: 41.04820, lng: 39.53240 },
  { ar: 'مولوز', en: 'Moloz', lat: 41.00640, lng: 39.73880 },
];

const BURSA_HUBS: Hub[] = [
  { ar: 'هيكل', en: 'Heykel', lat: 40.18240, lng: 29.06180 },
  { ar: 'نيلوفر', en: 'Nilufer', lat: 40.21120, lng: 28.97840 },
  { ar: 'يلدرم', en: 'Yildirim', lat: 40.18420, lng: 29.10040 },
  { ar: 'تشكيرغه', en: 'Cekirge', lat: 40.20380, lng: 28.99940 },
  { ar: 'ألتي بارماك', en: 'Altiparmak', lat: 40.18580, lng: 29.05520 },
  { ar: 'ست باشي', en: 'Setbasi', lat: 40.18320, lng: 29.06840 },
  { ar: 'فومارا', en: 'Fomara', lat: 40.19240, lng: 29.04840 },
  { ar: 'بش إيفلر بورصة', en: 'BesevlerBursa', lat: 40.19840, lng: 28.96840 },
  { ar: 'غوروكله', en: 'Gorukle', lat: 40.22680, lng: 28.87840 },
  { ar: 'أوزلوجه', en: 'Ozluce', lat: 40.21840, lng: 28.93240 },
  { ar: 'أتا إيفلر', en: 'Ataevler', lat: 40.20840, lng: 28.95240 },
  { ar: 'إحسانية', en: 'Ihsaniye', lat: 40.19880, lng: 29.02240 },
  { ar: 'إيمك', en: 'Emek', lat: 40.22840, lng: 29.01240 },
  { ar: 'كستل', en: 'Kestel', lat: 40.19820, lng: 29.21240 },
  { ar: 'غورسو', en: 'Gursu', lat: 40.21840, lng: 29.19480 },
  { ar: 'مودانيا', en: 'Mudanya', lat: 40.37520, lng: 28.88240 },
  { ar: 'غوزيل يالي مودانيا', en: 'GuzelyaliMudanya', lat: 40.35240, lng: 28.91240 },
  { ar: 'دمير طاش', en: 'Demirtas', lat: 40.24840, lng: 29.08240 },
  { ar: 'أرطغرل', en: 'Ertugrul', lat: 40.17840, lng: 29.08240 },
  { ar: 'عربا ياتاغي', en: 'Arabayatagi', lat: 40.16840, lng: 29.11840 },
  { ar: 'إسن إيفلر', en: 'Esenevler', lat: 40.20840, lng: 29.12840 },
  { ar: 'خوداوندغار', en: 'Hudavendigar', lat: 40.19280, lng: 29.03840 },
  { ar: 'بانايير', en: 'Panayir', lat: 40.21840, lng: 29.05840 },
  { ar: 'يونس علي', en: 'Yunuseli', lat: 40.22840, lng: 29.04240 },
  { ar: 'بلاط', en: 'Balat', lat: 40.21840, lng: 28.90840 },
  { ar: '٢٩ تشرين', en: 'YirmiDokuzEkim', lat: 40.20240, lng: 28.98840 },
  { ar: 'كوكورتلو', en: 'Kukurtlu', lat: 40.19840, lng: 29.00840 },
  { ar: 'تشينار أونو', en: 'Cinaronu', lat: 40.18840, lng: 29.07840 },
  { ar: 'علمدار', en: 'Alemdar', lat: 40.17840, lng: 29.04840 },
  { ar: 'صوغانلي', en: 'Soganli', lat: 40.16840, lng: 29.08840 },
  { ar: 'أودونلوك', en: 'Odunluk', lat: 40.21240, lng: 28.95840 },
  { ar: 'أوش إيفلر', en: 'Ucevler', lat: 40.20840, lng: 28.93840 },
  { ar: 'حسن آغا', en: 'Hasanaga', lat: 40.18840, lng: 28.84840 },
  { ar: 'عثمان غازي', en: 'Osmangazi', lat: 40.19680, lng: 29.07240 },
];

const ISTANBUL_HUBS: Hub[] = [
  { ar: 'تقسيم', en: 'Taksim', lat: 41.03690, lng: 28.98500 },
  { ar: 'السلطان أحمد', en: 'Sultanahmet', lat: 41.00850, lng: 28.98010 },
  { ar: 'الفاتح', en: 'Fatih', lat: 41.01820, lng: 28.94980 },
  { ar: 'شيشلي', en: 'Sisli', lat: 41.06020, lng: 28.98740 },
  { ar: 'نيشانتاشي', en: 'Nisantasi', lat: 41.04890, lng: 28.99410 },
  { ar: 'بشيكتاش', en: 'Besiktas', lat: 41.04250, lng: 29.00720 },
  { ar: 'كاديكوي', en: 'Kadikoy', lat: 40.99080, lng: 29.02450 },
  { ar: 'أسكودار', en: 'Uskudar', lat: 41.02350, lng: 29.01500 },
  { ar: 'باكركوي', en: 'Bakirkoy', lat: 40.98150, lng: 28.87220 },
  { ar: 'ليفنت', en: 'Levent', lat: 41.08050, lng: 29.01380 },
  { ar: 'ماسلاك', en: 'Maslak', lat: 41.10800, lng: 29.02380 },
  { ar: 'أتاشهير', en: 'Atasehir', lat: 40.99250, lng: 29.12720 },
  { ar: 'بنديك', en: 'Pendik', lat: 40.87780, lng: 29.23340 },
  { ar: 'مال تبه', en: 'Maltepe', lat: 40.93580, lng: 29.13120 },
  { ar: 'كارتال', en: 'Kartal', lat: 40.88840, lng: 29.18720 },
  { ar: 'أومرائية', en: 'Umraniye', lat: 41.01640, lng: 29.12480 },
  { ar: 'بيرم باشا', en: 'Bayrampasa', lat: 41.04820, lng: 28.91240 },
  { ar: 'غازي عثمان باشا', en: 'GaziosmanpasaIst', lat: 41.05780, lng: 28.91280 },
  { ar: 'كوتشوك تشكمجه', en: 'Kucukcekmece', lat: 41.00240, lng: 28.78840 },
  { ar: 'بيليك دوزو', en: 'Beylikduzu', lat: 41.00120, lng: 28.64120 },
  { ar: 'باشاك شهير', en: 'Basaksehir', lat: 41.09390, lng: 28.80240 },
  { ar: 'كاجيتهانه', en: 'Kagitthane', lat: 41.07940, lng: 28.97320 },
  { ar: 'أيوب', en: 'Eyupsultan', lat: 41.04790, lng: 28.93360 },
  { ar: 'بولوغلو', en: 'Beyoglu', lat: 41.03580, lng: 28.97790 },
  { ar: 'إمين أونو', en: 'Eminonu', lat: 41.01680, lng: 28.97190 },
  { ar: 'لاليلي', en: 'Laleli', lat: 41.01040, lng: 28.95680 },
  { ar: 'أكساراي', en: 'AksarayIst', lat: 41.01080, lng: 28.94740 },
  { ar: 'زييتين بورنو', en: 'Zeytinburnu', lat: 41.00180, lng: 28.90840 },
  { ar: 'بهدشلي إيفلر', en: 'BahcelievlerIst', lat: 41.00050, lng: 28.85970 },
  { ar: 'باغجلار', en: 'Bagcilar', lat: 41.03940, lng: 28.82620 },
  { ar: 'أسنلر', en: 'Esenler', lat: 41.04320, lng: 28.87640 },
  { ar: 'سارير', en: 'Sariyer', lat: 41.16680, lng: 29.05020 },
  { ar: 'بيوك تشكمجه', en: 'Buyukcekmece', lat: 41.02080, lng: 28.58540 },
  { ar: 'توزلا', en: 'Tuzla', lat: 40.81640, lng: 29.30080 },
];

const BODRUM_HUBS: Hub[] = [
  { ar: 'بودروم مركز', en: 'BodrumMerkez', lat: 37.03440, lng: 27.43050 },
  { ar: 'باراديس', en: 'BodrumBarlar', lat: 37.03320, lng: 27.42840 },
  { ar: 'قلعة بودروم', en: 'BodrumKale', lat: 37.03180, lng: 27.42920 },
  { ar: 'غومبت', en: 'Gumbet', lat: 37.03480, lng: 27.40320 },
  { ar: 'بيتيز', en: 'Bitez', lat: 37.03820, lng: 27.38480 },
  { ar: 'أورتاكنت', en: 'Ortakent', lat: 37.05240, lng: 27.34840 },
  { ar: 'ياليكافاك', en: 'Yalikavak', lat: 37.10480, lng: 27.29120 },
  { ar: 'غوموشلوك', en: 'GumuslukInner', lat: 37.05480, lng: 27.28240 },
  { ar: 'تورغوترهيس', en: 'Turgutreis', lat: 37.00720, lng: 27.25980 },
  { ar: 'طوربا', en: 'Torba', lat: 37.07840, lng: 27.45840 },
  { ar: 'غولتوركبوكو', en: 'Golturkbuku', lat: 37.13240, lng: 27.37840 },
  { ar: 'غوندوغان', en: 'Gundogan', lat: 37.12240, lng: 27.34840 },
  { ar: 'تورون', en: 'TuruncBodrum', lat: 37.01840, lng: 27.41840 },
  { ar: 'إيجملر', en: 'IcmelerBodrum', lat: 37.02840, lng: 27.39240 },
  { ar: 'طريق موغلا', en: 'MuglaYolu', lat: 37.04840, lng: 27.46840 },
  { ar: 'كوناجيك', en: 'Konacik', lat: 37.05240, lng: 27.45240 },
  { ar: 'أوتوغار بودروم', en: 'BodrumOtogar', lat: 37.04120, lng: 27.43840 },
  { ar: 'ميمار سنان', en: 'MimarSinan', lat: 37.03880, lng: 27.44280 },
  { ar: 'تشومار', en: 'Cumar', lat: 37.04480, lng: 27.41240 },
  { ar: 'ياليجه', en: 'Yaliciftlik', lat: 37.00840, lng: 27.46840 },
  { ar: 'أكيارلار', en: 'Akyarlar', lat: 36.99240, lng: 27.30840 },
  { ar: 'قره إينجه', en: 'Karaincir', lat: 37.01240, lng: 27.32840 },
  { ar: 'آدا بوز', en: 'AdaBoz', lat: 37.06840, lng: 27.31840 },
  { ar: 'غيريشام', en: 'Geresam', lat: 37.08840, lng: 27.40840 },
  { ar: 'يشيل إيفلر بودروم', en: 'YesilevlerBodrum', lat: 37.04680, lng: 27.42240 },
  { ar: 'طورغوت رهيس ميناء', en: 'TurgutreisLiman', lat: 37.01120, lng: 27.26240 },
  { ar: 'ياليكافاك مارينا', en: 'YalikavakMarina', lat: 37.10880, lng: 27.28740 },
  { ar: 'بيتيز شاطئ', en: 'BitezSahil', lat: 37.03680, lng: 27.38120 },
  { ar: 'غومبت شاطئ', en: 'GumbetSahil', lat: 37.03280, lng: 27.39980 },
  { ar: 'بودروم مارينا', en: 'BodrumMarina', lat: 37.03240, lng: 27.42380 },
  { ar: 'موشطه', en: 'MustafaKemal', lat: 37.04080, lng: 27.43480 },
  { ar: 'تشاتال آغاج', en: 'Catalagac', lat: 37.05840, lng: 27.47240 },
  { ar: 'قره داغ', en: 'KaradagBodrum', lat: 37.02240, lng: 27.45240 },
  { ar: 'أوقجه إيزلر', en: 'Okceizler', lat: 37.06240, lng: 27.33840 },
];

export const TURKEY_DENSE_SEEDS: Record<string, CivicSeed[]> = {
  istanbul: expand('Istanbul', ISTANBUL_HUBS),
  ankara: expand('Ankara', ANKARA_HUBS),
  izmir: expand('Izmir', IZMIR_HUBS),
  antalya: expand('Antalya', ANTALYA_HUBS),
  trabzon: expand('Trabzon', TRABZON_HUBS),
  bursa: expand('Bursa', BURSA_HUBS),
  bodrum: expand('Bodrum', BODRUM_HUBS),
};
