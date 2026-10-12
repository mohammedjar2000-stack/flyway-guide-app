export interface IstanbulMallRecord {
  id: string;
  name: string;
  nameEn: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
}

export const ISTANBUL_MALLS_DATA: IstanbulMallRecord[];
export const ISTANBUL_MALLS_VERSION: number;
