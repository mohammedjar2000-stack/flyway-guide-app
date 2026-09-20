/** Real hotel/resort search hubs across Turkey. Coordinates are city or district centers. */
export interface TurkeyHotelHub {
  en: string;
  ar: string;
  lat: number;
  lng: number;
  radius: number;
  limit: number;
  priority?: boolean;
}

export const TURKEY_HOTEL_HUBS: TurkeyHotelHub[] = [
  { en: 'Istanbul', ar: 'إسطنبول', lat: 41.0082, lng: 28.9784, radius: 22000, limit: 400, priority: true },
  { en: 'Istanbul', ar: 'إسطنبول', lat: 41.0369, lng: 28.985, radius: 14000, limit: 250, priority: true },
  { en: 'Istanbul', ar: 'إسطنبول', lat: 40.9881, lng: 29.025, radius: 16000, limit: 250, priority: true },
  { en: 'Antalya', ar: 'أنطاليا', lat: 36.8969, lng: 30.7133, radius: 22000, limit: 350, priority: true },
  { en: 'Antalya', ar: 'أنطاليا', lat: 36.855, lng: 30.736, radius: 12000, limit: 180, priority: true },
  { en: 'Alanya', ar: 'ألانية', lat: 36.5444, lng: 31.9954, radius: 16000, limit: 200, priority: true },
  { en: 'Trabzon', ar: 'ترابزون', lat: 41.0027, lng: 39.7168, radius: 16000, limit: 200, priority: true },
  { en: 'Trabzon', ar: 'ترابزون', lat: 40.6186, lng: 40.2947, radius: 8000, limit: 80, priority: true },
  { en: 'Nevsehir', ar: 'كابادوكيا', lat: 38.6431, lng: 34.8289, radius: 18000, limit: 250, priority: true },
  { en: 'Nevsehir', ar: 'كابادوكيا', lat: 38.6314, lng: 34.9119, radius: 10000, limit: 120, priority: true },
  { en: 'Ankara', ar: 'أنقرة', lat: 39.9334, lng: 32.8597, radius: 18000, limit: 250, priority: true },
  { en: 'Izmir', ar: 'إزمير', lat: 38.4237, lng: 27.1428, radius: 18000, limit: 250, priority: true },
  { en: 'Bodrum', ar: 'بودروم', lat: 37.0344, lng: 27.4305, radius: 16000, limit: 200, priority: true },
  { en: 'Fethiye', ar: 'فتحية', lat: 36.6592, lng: 29.127, radius: 14000, limit: 150 },
  { en: 'Mugla', ar: 'مارماريس', lat: 36.8549, lng: 28.2705, radius: 12000, limit: 140 },
  { en: 'Izmir', ar: 'كوشاداسي', lat: 37.8579, lng: 27.261, radius: 12000, limit: 120 },
  { en: 'Bursa', ar: 'بورصة', lat: 40.1885, lng: 29.061, radius: 14000, limit: 150 },
  { en: 'Denizli', ar: 'باموكالي', lat: 37.9244, lng: 29.1187, radius: 10000, limit: 80 },
  { en: 'Antalya', ar: 'بيلك', lat: 36.8625, lng: 31.0556, radius: 10000, limit: 120 },
  { en: 'Antalya', ar: 'سايد', lat: 36.7667, lng: 31.3889, radius: 10000, limit: 120 },
  { en: 'Antalya', ar: 'كيمر', lat: 36.5978, lng: 30.5606, radius: 12000, limit: 140 },
  { en: 'Gaziantep', ar: 'غازي عنتاب', lat: 37.0662, lng: 37.3781, radius: 12000, limit: 100 },
  { en: 'Mersin', ar: 'مرسين', lat: 36.8121, lng: 34.6415, radius: 12000, limit: 100 },
  { en: 'Adana', ar: 'أضنة', lat: 37.0, lng: 35.3213, radius: 12000, limit: 100 },
  { en: 'Konya', ar: 'قونية', lat: 37.8746, lng: 32.4932, radius: 12000, limit: 100 },
];
