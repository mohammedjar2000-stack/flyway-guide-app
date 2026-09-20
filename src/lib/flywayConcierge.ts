import type { DirectoryListing, PageKey } from '@/types';
import { CATEGORIES } from '@/types';
import { detectLocaleInText, lookupCity, normalizeName, type CityCoordinate, type LocaleHit } from '@/lib/cityCoordinates';
import { haversineKm } from '@/lib/geo';
import { listingMatchesProvince } from '@/lib/turkeyScope';
import { canonicalFuelBakeryKey, listingMatchesCategory, sanitizePin } from '@/lib/placePrecision';
import { isFuelCoordinateClean } from '@/lib/fuelGuard';
import { isCuratedTurkeyFuelPin } from '@/lib/turkeyFuelStations';
import { isCuratedTurkeyPin } from '@/lib/turkeyCuratedGuard';
import { parseHours } from '@/lib/hours';
import { IRAQI_MISSIONS, type IraqiMission } from '@/lib/iraqiMissions';
import { getVaultSnapshot } from '@/lib/placeVault';

export interface ConciergePlace {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  hours: string;
  hoursLabel: string;
  city: string;
  country: string;
  category_key: string;
  category_label: string;
  rating: number;
  lat: number;
  lng: number;
  distanceKm: number;
  distanceLabel: string;
}

export interface ConciergeAction {
  label: string;
  page?: PageKey;
  category?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}

export interface ConciergeLocale {
  city: string;
  country: string;
  district?: string;
  lat: number;
  lng: number;
  zoom: number;
  label: string;
  category?: string;
  poiId?: string;
}

export interface ConciergeReply {
  text: string;
  cityName: string;
  places: ConciergePlace[];
  actions: ConciergeAction[];
  locale?: ConciergeLocale;
}

export interface ConciergeContext {
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  rememberedCity?: string | null;
  rememberedDistrict?: string | null;
}

const CATEGORY_HINTS: Array<{ key: string; pattern: RegExp }> = [
  { key: 'pharmacies', pattern: /صيدل|مناوبه|مناوبة|eczane|pharmacy/i },
  { key: 'hospitals', pattern: /مستشفى|مستشفيات|طوارئ طبي|عيادة|hastane|hospital|acil/i },
  { key: 'police', pattern: /شرط[ةه]|كركول|karakol|polis|police/i },
  { key: 'embassy', pattern: /سفار[ةه]|قنصلي|consulat|embassy|بعث[ةه]/i },
  { key: 'fuel', pattern: /وقود|محط[ةه]\s*وقود|بنزين|opet|shell|petrol/i },
  { key: 'bakeries', pattern: /مخبز|مخابز|سوبر\s*ماركت|بقاله|بقالة|firin|fırın|migros|\bbim\b|a101/i },
  { key: 'hotels', pattern: /فندق|فنادق|منتجع|otel|hotel/i },
  { key: 'restaurants', pattern: /مطعم|مطاعم|مقهى|حلال|restoran/i },
  { key: 'exchange', pattern: /صراف[ةه]|دولار|لير[ةه]|دinar|دينار|döviz|doviz|exchange/i },
  { key: 'telecom', pattern: /شريح[ةه]|esim|e-sim|sim\b|تركسل|فودافون|اتصالات/i },
  { key: 'transport', pattern: /تاجير|تأجير|سيار[ةه]|istanbulkart|مترو|ترام|موصلات|نقل|avis|garenta/i },
  { key: 'mosques', pattern: /مسجد|جامع|مصلى|cami/i },
  { key: 'markets', pattern: /مول|سوق(?!\s*ماركت)|avm/i },
  { key: 'airports', pattern: /مطار|ist\b|saw\b|airport/i },
  { key: 'attractions', pattern: /معلم|سياح[ةه]|متحف/i },
];

function fold(value: string): string {
  return normalizeName(value || '');
}

export function detectCityInText(text: string): CityCoordinate | null {
  return detectLocaleInText(text)?.city || null;
}

function resolveLocale(text: string, ctx: ConciergeContext): LocaleHit | null {
  const fromText = detectLocaleInText(text, ctx.rememberedCity || ctx.city);
  if (fromText?.district) return fromText;
  if (ctx.rememberedDistrict) {
    const remembered = detectLocaleInText(
      `${ctx.rememberedDistrict} ${ctx.rememberedCity || ctx.city || ''}`,
      ctx.rememberedCity || ctx.city,
    );
    if (remembered?.district && !detectLocaleInText(text)?.city) return remembered;
    if (remembered?.district && fromText && fromText.city.en === remembered.city.en) return remembered;
  }
  if (fromText) return fromText;
  return detectLocaleInText(ctx.rememberedCity || ctx.city || '', ctx.city);
}

function detectCategories(text: string): string[] {
  const keys: string[] = [];
  for (const hint of CATEGORY_HINTS) {
    if (hint.pattern.test(text) && !keys.includes(hint.key)) keys.push(hint.key);
  }
  return keys;
}

function wantsNearest(text: string): boolean {
  return /اقرب|أقرب|وين|أين|اريد|أريد|دلني|دلّني|nearest|قريب/i.test(text);
}

function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} م`;
  return `${km.toFixed(1)} كم`;
}

function listingKey(item: DirectoryListing): string {
  return item.category_key === 'police' ? 'embassy' : canonicalFuelBakeryKey(item);
}

function toPlace(item: DirectoryListing, origin: { lat: number; lng: number }): ConciergePlace {
  const km = haversineKm(origin.lat, origin.lng, item.lat, item.lng);
  const hours = parseHours(item.hours || '');
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    address: item.address || `${item.city}، ${item.country_name}`,
    phone: item.phone || '',
    hours: item.hours || '',
    hoursLabel: hours.label,
    city: item.city,
    country: item.country_name,
    category_key: canonicalFuelBakeryKey(item) === 'fuel' || canonicalFuelBakeryKey(item) === 'bakeries'
      ? canonicalFuelBakeryKey(item)
      : item.category_key,
    category_label: item.category_label,
    rating: Number(item.rating) || 0,
    lat: item.lat,
    lng: item.lng,
    distanceKm: km,
    distanceLabel: formatDistance(km),
  };
}

function scopedListings(
  city: CityCoordinate | null,
  origin: { lat: number; lng: number },
  district: boolean,
): DirectoryListing[] {
  const radiusKm = district ? 16 : 48;
  const allTurkey = !city;
  return getVaultSnapshot().filter((item) => {
    if (!sanitizePin(item.lat, item.lng)) return false;
    const near = haversineKm(origin.lat, origin.lng, item.lat, item.lng) <= radiusKm;
    if (district) return near;
    if (!listingMatchesProvince(item, city, allTurkey)) return false;
    return true;
  });
}

function nearestInCategory(
  items: DirectoryListing[],
  category: string,
  origin: { lat: number; lng: number },
  limit: number,
  prefer247 = false,
): ConciergePlace[] {
  const matched = items.filter((item) => {
    if (category === 'embassy' && item.category_key !== 'embassy' && item.category_key !== 'police') return false;
    const hay = `${item.name} ${item.description || ''}`;
    if (!isCuratedTurkeyPin(item.lat, item.lng, item.category_key, hay)) return false;
    if (category === 'fuel') {
      return canonicalFuelBakeryKey(item) === 'fuel'
        && listingMatchesCategory(item, 'fuel')
        && isFuelCoordinateClean(item.lat, item.lng)
        && isCuratedTurkeyFuelPin(item.lat, item.lng, `${item.name} ${item.description || ''}`);
    }
    if (category === 'bakeries') {
      return canonicalFuelBakeryKey(item) === 'bakeries' && listingMatchesCategory(item, 'bakeries');
    }
    if (category === 'hospitals' || category === 'pharmacies') {
      return item.category_key === category && listingMatchesCategory(item, category);
    }
    if (category === 'embassy') {
      return item.category_key === 'embassy' || item.category_key === 'police';
    }
    return item.category_key === category && listingMatchesCategory(item, category);
  });
  const ranked = matched
    .map((item) => ({ item, place: toPlace(item, origin) }))
    .sort((a, b) => {
      if (prefer247) {
        const a247 = /24\/7/.test(a.item.hours) ? 0 : 1;
        const b247 = /24\/7/.test(b.item.hours) ? 0 : 1;
        if (a247 !== b247) return a247 - b247;
      }
      return a.place.distanceKm - b.place.distanceKm;
    })
    .slice(0, limit)
    .map((row) => row.place);
  return ranked;
}

function turkeyMissions(city: CityCoordinate | null): IraqiMission[] {
  const all = IRAQI_MISSIONS.filter((m) => m.countryEn === 'Turkey');
  if (!city) return all;
  const local = all.filter((m) => fold(m.cityAr) === fold(city.name) || fold(m.cityEn) === fold(city.en));
  return local.length ? local : all;
}

function formatPlaceLine(place: ConciergePlace, index: number): string {
  const phone = place.phone ? ` · الهاتف: ${place.phone}` : '';
  const hours = place.hoursLabel ? ` · ${place.hoursLabel}` : '';
  const dist = place.distanceLabel ? ` · ${place.distanceLabel}` : '';
  return `${index + 1}) ${place.name}\n${place.address}${phone}${hours}${dist}`;
}

function attachLocale(reply: ConciergeReply, locale?: ConciergeLocale): ConciergeReply {
  if (!locale) return reply;
  return {
    ...reply,
    locale,
    actions: reply.actions.map((action) => (
      action.page === 'navigator'
        ? {
          ...action,
          city: locale.city,
          district: locale.district,
          lat: locale.lat,
          lng: locale.lng,
          zoom: locale.zoom,
        }
        : action
    )),
  };
}

function knowledgeReply(text: string, city: CityCoordinate | null): ConciergeReply | null {
  const cityName = city?.name || 'تركيا';

  if (/فيزا|تاشير|تأشير|visa/i.test(text) && /ماليز/i.test(text)) {
    return {
      text: `أخوي، العراقي يسافر ماليزيا بدون فيزا مسبقة لفترة سياحية قصيرة، بس لازم تعبّي بطاقة MDAC الإلكترونية قبل السفر بثلاثة أيام تقريباً. الجواز لازم يكون ساري، وراجع قسم التأشيرات بالتطبيق قبل الإقلاع حتى تتأكد من آخر التحديثات.`,
      cityName,
      places: [],
      actions: [{ label: 'قسم التأشيرات', page: 'visas' }],
    };
  }

  if (/فيزا|تاشير|تأشير|visa/i.test(text)) {
    return {
      text: `لفيزا تركيا: الجواز لازم يسري ستة أشهر على الأقل، صورة بيومترية، وكشف حساب أو إثبات سفر حسب نوع الطلب. التقديم يتم عبر المكاتب المعتمدة أو النظام الإلكتروني المعتمد. افتح قسم التأشيرات بالتطبيق للتفاصيل حسب جوازك العراقي، وما تعتمد على معلومات المطار فقط.`,
      cityName,
      places: [],
      actions: [{ label: 'قسم التأشيرات', page: 'visas' }],
    };
  }

  if (/istanbulkart|مترو|ترام|موصلات|كيف اتنقل|كيف أتنقل/i.test(text)) {
    return {
      text: `في ${cityName === 'إسطنبول' || !city ? 'إسطنبول' : cityName}: بطاقة Istanbulkart هي الأسهل للمترو والترام والحافلات والعبّارات. تشتريها من الأكشاك أو أجهزة المحطات، وتعبّيها حسب حاجتك. خط T1 يخدم السلطان أحمد، والمترو يربط المطارات والمراكز التجارية. لتأجير سيارة اعتمد الشركات الموثقة داخل دليل النقل — رخصة دولية وتأمين شامل أفضل لك.`,
      cityName: city?.name || 'إسطنبول',
      places: [],
      actions: [
        { label: 'تأجير ونقل على الخريطة', page: 'navigator', category: 'transport', city: city?.name || 'إسطنبول' },
      ],
    };
  }

  if (/esim|e-sim|شريح|sim\b|تركسل|فودافون/i.test(text)) {
    return {
      text: `لشريحة تركيا: خذ جوازك للمحل. تركسل وفودافون وترك تيليكوم عندهم باقات سياحية، وفي eSIM يتفعل بالجواز بدون انتظار طويل. ابتعد عن البائعين العشوائيين بالمطار إذا السعر مبالغ فيه، وافتح فئة الاتصالات بالتطبيق حتى تشوف الفروع القريبة منك في ${cityName}.`,
      cityName,
      places: [],
      actions: [{ label: 'اتصالات و eSIM', page: 'navigator', category: 'telecom', city: city?.name }],
    };
  }

  if (/دولار|لير|صراف|دinar|دينار|صرف/i.test(text) && !wantsNearest(text)) {
    return {
      text: `أفضل سعر عادة بمكاتب الصرافة المرخّصة مو بالفندق ولا بالمطار. احمل هوية للمبالغ الكبيرة، وعدّ الفلوس قبل ما تمشي. الليرة التركية هي التعامل اليومي، والدينار العراقي ما ينصرف بسهولة بكل مكان. بالتطبيق فئة «صرافة ومالية» تعرض المكاتب القريبة في ${cityName}.`,
      cityName,
      places: [],
      actions: [{ label: 'مكاتب الصرافة', page: 'navigator', category: 'exchange', city: city?.name }],
    };
  }

  if (/112|طوارئ|رقم الطوار|اسعاف|إسعاف|امان|أمان/i.test(text) && !detectCategories(text).length) {
    return {
      text: `رقم الطوارئ الموحّد في تركيا هو 112 للشرطة والإسعاف والإطفاء. احفظه بالجوال، وخذ نسخة من الجواز. القنصلية العراقية بإسطنبول: Vali Konağı Cad. No:93 نيشانتشي — هاتف ‎+90 212 232 2112. السفارة بأنقرة: Turan Emeksiz Sokak No:11 — هاتف ‎+90 312 468 7421. أقدر أدلك على أقرب مستشفى وكركول حسب مدينتك.`,
      cityName,
      places: [],
      actions: [
        { label: 'مستشفيات وطوارئ', page: 'navigator', category: 'hospitals', city: city?.name },
        { label: 'سفارة وشرطة', page: 'navigator', category: 'embassy', city: city?.name },
      ],
    };
  }

  if (/نصيح[ةه]|سلام[ةه]|ثقاف[ةه]|ادب|أدب|حلال/i.test(text)) {
    return {
      text: `نصيحة سريعة للمسافر العراقي في ${cityName}: خلّ جوازك بنسخة بالهاتف، استخدم 112 لأي طارئ، غيّر الفلوس بمكتب مرخّص، والمطاعم الحلال منتشرة بس اسأل إذا مو واضح. بالمساجد والمصليات conservatively البس محتشم. وإذا احتجت كركول سياحي أو مستشفى، اكتب لي اسم المدينة وأدلّك فوراً.`,
      cityName,
      places: [],
      actions: [],
    };
  }

  return null;
}

function missionPlaces(city: CityCoordinate | null, origin: { lat: number; lng: number }): ConciergePlace[] {
  return turkeyMissions(city).map((m) => {
    const km = haversineKm(origin.lat, origin.lng, m.lat, m.lng);
    return {
      id: `mission-${m.id}`,
      name: m.nameAr,
      description: m.nameEn,
      address: m.address,
      phone: m.phone,
      hours: m.id === 'tr-istanbul' ? '09:00 - 15:00' : '09:00 - 15:00',
      hoursLabel: m.id === 'tr-istanbul' ? '09:00 - 15:00' : 'راجع المواعيد',
      city: m.cityAr,
      country: m.countryAr,
      category_key: 'embassy',
      category_label: m.kind === 'embassy' ? 'سفارة' : 'قنصلية',
      rating: 4.6,
      lat: m.lat,
      lng: m.lng,
      distanceKm: km,
      distanceLabel: formatDistance(km),
    };
  });
}

function originFor(locale: LocaleHit | null, ctx: ConciergeContext): { lat: number; lng: number } {
  if (locale?.district) return { lat: locale.lat, lng: locale.lng };
  if (
    Number.isFinite(ctx.lat)
    && Number.isFinite(ctx.lng)
    && locale?.city
    && lookupCity(ctx.city)?.en === locale.city.en
  ) {
    return { lat: ctx.lat as number, lng: ctx.lng as number };
  }
  if (locale) return { lat: locale.lat, lng: locale.lng };
  if (Number.isFinite(ctx.lat) && Number.isFinite(ctx.lng)) {
    return { lat: ctx.lat as number, lng: ctx.lng as number };
  }
  return { lat: 41.0082, lng: 28.9784 };
}

function localePayload(
  locale: LocaleHit | null,
  origin: { lat: number; lng: number },
  category?: string,
): ConciergeLocale | undefined {
  if (!locale) return undefined;
  return {
    city: locale.city.name,
    country: locale.city.country,
    district: locale.districtName || undefined,
    lat: origin.lat,
    lng: origin.lng,
    zoom: locale.district ? locale.zoom : locale.city.zoom,
    label: locale.label,
    category,
  };
}

function mapAction(label: string, category: string, locale: LocaleHit | null, origin: { lat: number; lng: number }): ConciergeAction {
  return {
    label,
    page: 'navigator',
    category,
    city: locale?.city.name,
    district: locale?.districtName || undefined,
    lat: origin.lat,
    lng: origin.lng,
    zoom: locale?.district ? locale.zoom : locale?.city.zoom,
  };
}

function categoryLabel(key: string): string {
  if (key === 'police') return 'كركول / شرطة';
  return CATEGORIES.find((c) => c.key === key)?.shortLabel || key;
}

export function conciergePlaceToListing(place: ConciergePlace): DirectoryListing {
  const pin = sanitizePin(place.lat, place.lng);
  return {
    id: place.id,
    category_key: place.category_key,
    category_label: place.category_label,
    name: place.name,
    description: place.description,
    country_name: place.country,
    city: place.city,
    address: place.address,
    image: '',
    rating: place.rating,
    price_level: '',
    tags: [place.category_label, place.distanceLabel].filter(Boolean),
    proximity_note: pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : '',
    phone: place.phone,
    hours: place.hours,
    is_featured: true,
    sort_order: -50,
    lat: pin?.lat ?? place.lat,
    lng: pin?.lng ?? place.lng,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: '',
    nav_query: pin ? `${pin.lat},${pin.lng}` : undefined,
  };
}

export function makeConciergeGreeting(ctx: ConciergeContext): string {
  const locale = detectLocaleInText(
    [ctx.rememberedDistrict, ctx.rememberedCity || ctx.city].filter(Boolean).join(' '),
    ctx.city,
  );
  const where = locale?.label ? `في ${locale.label}` : (lookupCity(ctx.city)?.name ? `في ${lookupCity(ctx.city)?.name}` : 'بتركيا');
  return `هلا بيك أخوي، أنا مساعد Flyway الذكي ${where}. اسألني عن أقرب صيدلية 24/7، مستشفى، كركول، وقود، أو فيزا تركيا وماليزيا — وأجاوبك من دليل المسافر مباشرة.`;
}

export function answerConcierge(text: string, ctx: ConciergeContext): ConciergeReply {
  const trimmed = text.trim();
  const localeHit = resolveLocale(trimmed, ctx);
  const city = localeHit?.city || null;
  const cityName = localeHit?.label || city?.name || ctx.city || 'تركيا';
  const origin = originFor(localeHit, ctx);
  const cats = detectCategories(trimmed);
  const locale = localePayload(localeHit, origin, cats[0] === 'police' ? 'embassy' : cats[0]);
  const knownReply = knowledgeReply(trimmed, city);

  if (cats.includes('embassy') || /قنصلي|سفار/i.test(trimmed)) {
    const places = missionPlaces(city, origin);
    const police = nearestInCategory(scopedListings(city, origin, Boolean(localeHit?.district)), 'police', origin, 2);
    const merged = [...places, ...police].slice(0, 4);
    const lines = merged.map((p, i) => formatPlaceLine(p, i)).join('\n\n');
    return {
      text: `للعراقي بـ${cityName}: رقم الطوارئ 112. أقرب بعثة وكركول حسب موقعك:\n\n${lines}\n\nاضغط «الخريطة» حتى أنقلك لنفس الإحداثيات مع تعليم النقطة.`,
      cityName,
      places: merged,
      actions: [mapAction('سفارة وشرطة على الخريطة', 'embassy', localeHit, origin)],
      locale,
    };
  }

  if (cats.length && (wantsNearest(trimmed) || cats.some((key) => ['pharmacies', 'hospitals', 'police', 'fuel', 'bakeries'].includes(key)))) {
    const items = scopedListings(city, origin, Boolean(localeHit?.district));
    const prefer247 = /24\/7|مناوبه|مناوبة/.test(trimmed);
    const places: ConciergePlace[] = [];
    const queryCats = cats.length ? cats : ['pharmacies'];
    const per = queryCats.length > 1 ? 2 : 4;
    for (const key of queryCats) {
      places.push(...nearestInCategory(items, key, origin, per, key === 'pharmacies' && prefer247));
    }
    if (places.length === 0 && knownReply) return attachLocale(knownReply, locale);
    if (places.length === 0) {
      return {
        text: `ما لقيت نتيجة بهالتصنيف داخل ${cityName} بهاللحظة. جرّب الخريطة الذكية أو غيّر الحي/المدينة — البيانات المحفوظة ترجع فوراً من الخزنة المحلية.`,
        cityName,
        places: [],
        actions: [{ label: 'افتح الدليل', page: 'directory', city: city?.name }],
        locale,
      };
    }
    const title = queryCats.map(categoryLabel).join(' و');
    const lines = places.map((p, i) => formatPlaceLine(p, i)).join('\n\n');
    const where = localeHit?.district ? localeHit.label : cityName;
    return {
      text: `تمام، هذي أقرب نتائج «${title}» من ${where} — مرتّبة حسب المسافة الحقيقية، بإحداثيات وأرقام موثّقة:\n\n${lines}`,
      cityName,
      places,
      actions: queryCats.slice(0, 2).map((key) => mapAction(
        `افتح ${categoryLabel(key)}`,
        key === 'police' ? 'embassy' : key,
        localeHit,
        origin,
      )),
      locale,
    };
  }

  if (knownReply) return attachLocale(knownReply, locale);

  if (/كم|عداد|عدد|شنو عندكم|شنو بيكم/i.test(trimmed)) {
    const items = scopedListings(city, origin, Boolean(localeHit?.district));
    const counts = CATEGORIES.map((cat) => {
      const n = items.filter((item) => listingKey(item) === cat.key || item.category_key === cat.key).length;
      return n > 0 ? `${cat.shortLabel}: ${n}` : '';
    }).filter(Boolean).slice(0, 8);
    return {
      text: `بدليل ${cityName} حالياً عندك تغطية كثيفة عبر 16 فئة. نماذج العدّاد:\n${counts.join('\n')}\n\nالأرقام تتحدث مع الخزنة المحلية والخريطة بدون إعادة تحميل.`,
      cityName,
      places: [],
      actions: [{ label: 'الدليل الشامل', page: 'directory', city: city?.name }],
      locale,
    };
  }

  return {
    text: `حاضر أخوي. أقدر أدلك على أقرب صيدلية 24/7، مستشفى، كركول، محطة وقود، أو قنصلية العراق${localeHit ? ` في ${cityName}` : ''}. اكتب الحي أو الشارع (تقسيم، كونالتي، أوزنجول…) حتى أنقل الخريطة لنفس النقطة.`,
    cityName,
    places: [],
    actions: [],
    locale,
  };
}

export const CONCIERGE_SHORTCUTS: Array<{ id: string; label: string; prompt: string }> = [
  { id: 'visas', label: 'التأشيرات', prompt: 'ما هي شروط فيزا تركيا وماليزيا للعراقيين؟' },
  { id: 'emergency', label: 'طوارئ 112', prompt: 'أحتاج أقرب مستشفى ومركز شرطة ورقم الطوارئ 112' },
  { id: 'transport', label: 'النقل والمترو', prompt: 'كيف أتنقل في إسطنبول؟ Istanbulkart والمترو' },
  { id: 'pharmacy', label: 'صيدلية 24/7', prompt: 'أين أقرب صيدلية 24/7؟' },
];
