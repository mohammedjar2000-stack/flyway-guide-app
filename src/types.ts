export interface Country {
  id: string;
  name: string;
  name_en: string;
  category: string;
  description: string;
  stay_duration: string;
  passport_validity: string;
  bank_statement_required: boolean;
  biometric_photo_guidelines: string;
  residency_laws: string;
  tips_before_travel: string;
  visa_price_iqd: number;
  image: string;
  trending: boolean;
  created_at: string;
}

export interface Hotel {
  id: string;
  country_id: string | null;
  country_name: string;
  name: string;
  star_rating: number;
  image: string;
  amenities: string[];
  cancellation_policy: string;
  nightly_extension_policy: string;
  price_per_night_iqd: number;
  created_at: string;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  type: string;
  image: string;
  discount_percentage: number;
  is_active: boolean;
  valid_until: string | null;
  created_at: string;
}

export interface DiscoverIraq {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  location: string;
  tips: string;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  contact_email: string;
  contact_phone: string;
  hero_image: string;
  updated_at: string;
}

export interface DirectoryListing {
  id: string;
  category_key: string;
  category_label: string;
  name: string;
  description: string;
  country_name: string;
  city: string;
  address: string;
  image: string;
  images?: string[];
  place_kind?: 'hotel' | 'resort' | 'restaurant' | 'cafe';
  rating: number;
  price_level: string;
  tags: string[];
  proximity_note: string;
  phone: string;
  hours: string;
  is_featured: boolean;
  sort_order: number;
  lat: number;
  lng: number;
  metro_station_name: string;
  metro_walk_minutes: number;
  review_count: number;
  created_at: string;
  nav_query?: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  name_en: string;
  city: string;
  country_name: string;
  lat: number;
  lng: number;
  zoom: number;
  sort_order: number;
  created_at: string;
}

export interface MetroStation {
  id: string;
  name: string;
  name_en: string;
  city: string;
  country_name: string;
  lines: string[];
  ticket_info: string;
  lat: number;
  lng: number;
  sort_order: number;
  train_type: string;
  frequency_minutes: string;
  fare_local: string;
  platform_directions: string;
  image: string;
  operating_hours: string;
  created_at: string;
}

export type PageKey =
  | 'home'
  | 'navigator'
  | 'directory'
  | 'visas'
  | 'hotels'
  | 'insurance'
  | 'rewards'
  | 'discover-iraq';

export const FLYWAY_URL = 'https://flyway.travel/';

export const visaCategoryLabels: Record<string, string> = {
  free: 'بدون فيزا مسبقة',
  arrival: 'فيزا عند الوصول',
  required: 'تحتاج فيزا مسبقة',
  evisa: 'فيزا إلكترونية',
};

export const filterOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'كل الدول' },
  { value: 'free', label: 'بدون فيزا مسبقة' },
  { value: 'arrival', label: 'فيزا عند الوصول' },
  { value: 'required', label: 'تحتاج فيزا مسبقة' },
  { value: 'evisa', label: 'فيزا إلكترونية' },
];

export interface CategoryDef {
  key: string;
  label: string;
  shortLabel: string;
  icon: string;
  filters: string[];
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'hotels', label: 'فنادق وشقق ومنتجعات', shortLabel: 'فنادق ومنتجعات', icon: 'Hotel', filters: ['5 نجوم', '4 نجوم', '3 نجوم', 'budget', 'mid-range', 'luxury'] },
  { key: 'restaurants', label: 'مطاعم ومقاهي وجلسات عائلية', shortLabel: 'مطاعم ومقاهي', icon: 'UtensilsCrossed', filters: ['حلال', 'قسم عائلي', 'واي فاي', 'موقف سيارات'] },
  { key: 'hospitals', label: 'مستشفيات طارئة ومراكز طبية', shortLabel: 'مستشفيات وطوارئ', icon: 'Stethoscope', filters: ['24/7', 'مترجم عربي', 'طوارئ'] },
  { key: 'pharmacies', label: 'صيدليات مناوبة 24/7', shortLabel: 'صيدليات 24/7', icon: 'Pill', filters: ['24/7', 'أدوية مستوردة', 'توصيل'] },
  { key: 'markets', label: 'أسواق تقليدية ومراكز تسوق', shortLabel: 'أسواق ومولات', icon: 'ShoppingBag', filters: ['تقليدي', 'حديث', 'موقف سيارات', 'مطاعم'] },
  { key: 'attractions', label: 'معالم سياحية وترفيهية', shortLabel: 'معالم سياحية', icon: 'Camera', filters: ['تاريخي', 'مناسب للأطفال', 'مساءً', 'مجاني'] },
  { key: 'exchange', label: 'مكاتب صرافة وخدمات مالية', shortLabel: 'صرافة ومالية', icon: 'Banknote', filters: ['أفضل الأسعار', 'عمولة منخفضة', 'تحويل دولي'] },
  { key: 'mosques', label: 'مساجد ومصليات', shortLabel: 'مساجد ومصليات', icon: 'Landmark', filters: ['مصلى نساء', 'قريب من الأسواق', 'تاريخي'] },
  { key: 'transport', label: 'شركات تأجير سيارات ونقل', shortLabel: 'تأجير ونقل', icon: 'Car', filters: ['رخصة دولية', 'تأمين شامل', 'سائق عربي'] },
  { key: 'embassy', label: 'مراكز شرطة وسفارة عراقية', shortLabel: 'سفارة وشرطة', icon: 'Shield', filters: ['خط طوارئ', 'متعدد اللغات'] },
  { key: 'telecom', label: 'مزودو اتصالات وبطاقات SIM', shortLabel: 'اتصالات وSIM', icon: 'Smartphone', filters: ['باقة سياحية', 'تفعيل فوري بالجواز'] },
  { key: 'nightlife', label: 'حياة ليلية وأنشطة مسائية', shortLabel: 'أنشطة مسائية', icon: 'Moon', filters: ['عائلي', 'مساءً', 'واجهة مائية'] },
  { key: 'salons', label: 'صالونات ومراكز عناية شخصية', shortLabel: 'صالونات وعناية', icon: 'Scissors', filters: ['حجز مسبق', 'أسعار منصفة', 'سيدات فقط'] },
  { key: 'fuel', label: 'محطات وقود وخدمات طرق ومخابز', shortLabel: 'وقود وطرق ومخابز', icon: 'Fuel', filters: ['استراحة', 'مقهى', 'صيانة سريعة', '24/7'] },
  { key: 'bakeries', label: 'مخبزات وسوبر ماركت', shortLabel: 'مخبزات وسوبر ماركت', icon: 'ShoppingCart', filters: ['حلال', '24/7', 'منتجات يومية', 'طازج'] },
];
