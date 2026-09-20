export interface TurkeyHotelRecord {
  id: string;
  kind: 'hotel' | 'resort';
  name: string;
  nameEn: string;
  city: string;
  cityAr: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  rating: number;
  images: string[];
}

export const TURKEY_HOTELS_DATA: TurkeyHotelRecord[];
export const TURKEY_HOTELS_DATASET_VERSION: number;
