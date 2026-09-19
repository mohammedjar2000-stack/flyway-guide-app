export const PLACE_CATEGORIES = [
  'hotels',
  'hospitals',
  'pharmacies',
  'police',
  'restaurants',
  'transport',
  'markets',
  'attractions',
  'exchange',
  'mosques',
  'embassy',
  'telecom',
  'nightlife',
  'salons',
  'fuel',
  'bakeries',
  'airports',
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export interface CategoryImportSpec {
  category: PlaceCategory;
  subcategory: string;
  geoapify: string;
  labelAr: string;
}

/** Limited Istanbul phase-1 import map. Keys stay aligned with the frontend directory. */
export const ISTANBUL_IMPORT_SPECS: CategoryImportSpec[] = [
  { category: 'hotels', subcategory: 'hotel', geoapify: 'accommodation.hotel,accommodation.resort', labelAr: 'فندق' },
  { category: 'hospitals', subcategory: 'hospital', geoapify: 'healthcare.hospital', labelAr: 'مستشفى' },
  { category: 'pharmacies', subcategory: 'pharmacy', geoapify: 'healthcare.pharmacy', labelAr: 'صيدلية' },
  { category: 'police', subcategory: 'police', geoapify: 'service.police', labelAr: 'مركز شرطة' },
  { category: 'restaurants', subcategory: 'restaurant', geoapify: 'catering.restaurant', labelAr: 'مطعم' },
  { category: 'transport', subcategory: 'rental', geoapify: 'rental.car,public_transport.subway', labelAr: 'تأجير ونقل' },
  { category: 'markets', subcategory: 'supermarket', geoapify: 'commercial.supermarket,commercial.shopping_mall,commercial.marketplace', labelAr: 'سوق' },
  { category: 'attractions', subcategory: 'attraction', geoapify: 'tourism.sights', labelAr: 'معلم سياحي' },
  { category: 'exchange', subcategory: 'exchange', geoapify: 'service.financial.exchange,service.financial.atm,service.financial.bank', labelAr: 'صرافة ومالية' },
  { category: 'mosques', subcategory: 'mosque', geoapify: 'religion.place_of_worship', labelAr: 'مسجد' },
  { category: 'embassy', subcategory: 'embassy', geoapify: 'office.diplomatic', labelAr: 'سفارة' },
  { category: 'telecom', subcategory: 'mobile', geoapify: 'office.telecommunication,commercial.electronic', labelAr: 'اتصالات و eSIM' },
  { category: 'nightlife', subcategory: 'bar', geoapify: 'catering.bar', labelAr: 'أنشطة مسائية' },
  { category: 'salons', subcategory: 'hairdresser', geoapify: 'service.beauty.hairdresser', labelAr: 'صالون' },
  { category: 'fuel', subcategory: 'fuel', geoapify: 'automotive.gas_station', labelAr: 'وقود' },
  { category: 'bakeries', subcategory: 'supermarket', geoapify: 'commercial.supermarket,commercial.bakery', labelAr: 'مخابز وسوبر ماركت' },
  { category: 'airports', subcategory: 'airport', geoapify: 'airport', labelAr: 'مطار' },
];

export const ISTANBUL_SEED = {
  city: 'Istanbul',
  localName: 'İstanbul',
  country: 'Turkey',
  countryCode: 'TR',
  latitude: 41.0082,
  longitude: 28.9784,
  radiusMeters: 25000,
  limitPerCategory: 200,
} as const;

export function isPlaceCategory(value: string): value is PlaceCategory {
  return (PLACE_CATEGORIES as readonly string[]).includes(value);
}
