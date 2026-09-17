import type { DirectoryListing } from '@/types';

export type MissionKind = 'embassy' | 'consulate' | 'mission';

export interface IraqiMission {
  id: string;
  kind: MissionKind;
  countryAr: string;
  countryEn: string;
  cityAr: string;
  cityEn: string;
  nameAr: string;
  nameEn: string;
  address: string;
  phone: string;
  email?: string;
  lat: number;
  lng: number;
}

function mission(
  id: string,
  kind: MissionKind,
  countryAr: string,
  countryEn: string,
  cityAr: string,
  cityEn: string,
  address: string,
  phone: string,
  lat: number,
  lng: number,
  email?: string,
): IraqiMission {
  const title =
    kind === 'embassy'
      ? `سفارة جمهورية العراق في ${cityAr}`
      : kind === 'consulate'
        ? `القنصلية العامة لجمهورية العراق في ${cityAr}`
        : `الممثلية الدائمة لجمهورية العراق في ${cityAr}`;
  const titleEn =
    kind === 'embassy'
      ? `Embassy of the Republic of Iraq in ${cityEn}`
      : kind === 'consulate'
        ? `Consulate General of the Republic of Iraq in ${cityEn}`
        : `Permanent Mission of Iraq in ${cityEn}`;
  return { id, kind, countryAr, countryEn, cityAr, cityEn, nameAr: title, nameEn: titleEn, address, phone, email, lat, lng };
}

/** Active Iraqi diplomatic missions (MFA directory + published contact points). */
export const IRAQI_MISSIONS: IraqiMission[] = [
  mission('dz-algiers', 'embassy', 'الجزائر', 'Algeria', 'الجزائر', 'Algiers', '4 Chemin Abdelkader Gadouche, Hydra, Algiers', '+213 23 48 10 40', 36.7536, 3.0341),
  mission('eg-cairo', 'embassy', 'مصر', 'Egypt', 'القاهرة', 'Cairo', '9 Mohamed Mazhar St, Zamalek, Cairo', '+20 2 2736 1069', 30.0611, 31.2197, 'cairo@mofa.gov.iq'),
  mission('et-addis', 'embassy', 'إثيوبيا', 'Ethiopia', 'أديس أبابا', 'Addis Ababa', 'Bole Sub-City, Addis Ababa', '+251 11 662 2288', 8.9806, 38.7578),
  mission('ke-nairobi', 'embassy', 'كينيا', 'Kenya', 'نيروبي', 'Nairobi', 'Gigiri Diplomatic Enclave, Nairobi', '+254 20 712 0066', -1.2345, 36.8065),
  mission('ly-tripoli', 'embassy', 'ليبيا', 'Libya', 'طرابلس', 'Tripoli', 'Gargaresh, Tripoli', '+218 21 477 4531', 32.8872, 13.1913),
  mission('mr-nouakchott', 'embassy', 'موريتانيا', 'Mauritania', 'نواكشوط', 'Nouakchott', 'Tevragh-Zeina, Nouakchott', '+222 45 25 21 21', 18.0735, -15.9582),
  mission('ma-rabat', 'embassy', 'المغرب', 'Morocco', 'الرباط', 'Rabat', '10 Rue Idriss Al Akbar, Souissi, Rabat', '+212 537 75 51 59', 33.9716, -6.8498),
  mission('ng-abuja', 'embassy', 'نيجيريا', 'Nigeria', 'أبوجا', 'Abuja', 'Plot 351 Cadastral Zone A00, Central Area, Abuja', '+234 9 461 2400', 9.0579, 7.4951),
  mission('sn-dakar', 'embassy', 'السنغال', 'Senegal', 'داكار', 'Dakar', 'Almadies, Route de Ngor, Dakar', '+221 33 820 08 88', 14.744, -17.514),
  mission('za-pretoria', 'embassy', 'جنوب أفريقيا', 'South Africa', 'بريتوريا', 'Pretoria', '129 Murray St, Brooklyn, Pretoria', '+27 12 342 2940', -25.771, 28.237),
  mission('sd-khartoum', 'embassy', 'السودان', 'Sudan', 'الخرطوم', 'Khartoum', 'Street 15, New Extension, Khartoum', '+249 183 471 180', 15.5007, 32.5599),
  mission('tn-tunis', 'embassy', 'تونس', 'Tunisia', 'تونس', 'Tunis', '5 Rue de Genève, Mutuelleville, Tunis', '+216 71 780 755', 36.828, 10.18),

  mission('br-brasilia', 'embassy', 'البرازيل', 'Brazil', 'برازيليا', 'Brasília', 'SES Avenida das Nações, Qd 809, Lote 34, Brasília', '+55 61 3248 6066', -15.823, -47.874),
  mission('ca-ottawa', 'embassy', 'كندا', 'Canada', 'أوتاوا', 'Ottawa', '215 McLeod Street, Ottawa, ON K2P 0Z8', '+1 613 236 9177', 45.4176, -75.6891, 'ottawa@mofa.gov.iq'),
  mission('ca-montreal', 'consulate', 'كندا', 'Canada', 'مونتريال', 'Montreal', '2000 Peel Street, Suite 740, Montreal, QC', '+1 514 931 2300', 45.501, -73.575),
  mission('ca-toronto', 'consulate', 'كندا', 'Canada', 'تورونتو', 'Toronto', '239 Sheppard Ave East, North York, ON M2N 3A8', '+1 416 221 7575', 43.7615, -79.411),
  mission('mx-mexicocity', 'embassy', 'المكسيك', 'Mexico', 'مدينة مكسيكو', 'Mexico City', 'Paseo de la Reforma 389, Cuauhtémoc, CDMX', '+52 55 5207 9489', 19.424, -99.167),
  mission('us-washington', 'embassy', 'الولايات المتحدة', 'United States', 'واشنطن', 'Washington, D.C.', '1801 P Street NW, Washington, DC 20036', '+1 202 742 1600', 38.9096, -77.0417, 'washington@mofa.gov.iq'),
  mission('us-detroit', 'consulate', 'الولايات المتحدة', 'United States', 'ديترويت', 'Detroit', '1641 Porter St, Detroit, MI 48216', '+1 313 303 8000', 42.327, -83.065),
  mission('us-houston', 'consulate', 'الولايات المتحدة', 'United States', 'هيوستن', 'Houston', '4801 Woodway Dr, Suite 300E, Houston, TX 77056', '+1 713 963 9600', 29.757, -95.471),
  mission('us-losangeles', 'consulate', 'الولايات المتحدة', 'United States', 'لوس أنجلوس', 'Los Angeles', '4500 Wilshire Blvd, Los Angeles, CA 90010', '+1 323 931 4339', 34.0618, -118.308),
  mission('ve-caracas', 'embassy', 'فنزويلا', 'Venezuela', 'كاراكاس', 'Caracas', 'Av. El Parque, Urb. El Bosque, Caracas', '+58 212 731 3331', 10.498, -66.849),

  mission('am-yerevan', 'embassy', 'أرمينيا', 'Armenia', 'يريفان', 'Yerevan', '7 Demirchyan St, Yerevan', '+374 10 52 28 21', 40.181, 44.514),
  mission('az-baku', 'embassy', 'أذربيجان', 'Azerbaijan', 'باكو', 'Baku', '92 Haji Zeynalabdin Taghiyev St, Baku', '+994 12 492 2410', 40.372, 49.835),
  mission('bh-manama', 'embassy', 'البحرين', 'Bahrain', 'المنامة', 'Manama', 'Building 1090, Road 2833, Al Seef, Manama', '+973 1774 1499', 26.2285, 50.586),
  mission('bd-dhaka', 'embassy', 'بنغلاديش', 'Bangladesh', 'دكا', 'Dhaka', 'House 7, Road 47, Gulshan-2, Dhaka', '+880 2 988 2372', 23.794, 90.414),
  mission('cn-beijing', 'embassy', 'الصين', 'China', 'بكين', 'Beijing', '25 Guanghua Lu, Chaoyang, Beijing 100600', '+86 10 6532 3385', 39.914, 116.441),
  mission('cn-guangzhou', 'consulate', 'الصين', 'China', 'غوانغجو', 'Guangzhou', 'Tianhe District, Guangzhou', '+86 20 3886 4990', 23.1291, 113.2644),
  mission('ge-tbilisi', 'embassy', 'جورجيا', 'Georgia', 'تبليسي', 'Tbilisi', '6 Ivane Javakhishvili St, Tbilisi', '+995 32 293 3010', 41.7151, 44.8271),
  mission('in-delhi', 'embassy', 'الهند', 'India', 'نيودلهي', 'New Delhi', 'F-3/5 Vasant Vihar, New Delhi 110057', '+91 11 2611 1983', 28.557, 77.157),
  mission('in-mumbai', 'consulate', 'الهند', 'India', 'مومباي', 'Mumbai', 'Napean Sea Road, Mumbai', '+91 22 2363 1365', 18.955, 72.805),
  mission('id-jakarta', 'embassy', 'إندونيسيا', 'Indonesia', 'جاكرتا', 'Jakarta', 'Jalan Teuku Umar No. 38, Menteng, Jakarta', '+62 21 3190 8995', -6.194, 106.83),
  mission('ir-tehran', 'embassy', 'إيران', 'Iran', 'طهران', 'Tehran', 'Valiasr St, Tehran', '+98 21 8806 4370', 35.757, 51.41),
  mission('ir-ahvaz', 'consulate', 'إيران', 'Iran', 'الأهواز', 'Ahvaz', 'Kianpars, Ahvaz', '+98 61 3333 2020', 31.3203, 48.6692),
  mission('ir-isfahan', 'consulate', 'إيران', 'Iran', 'أصفهان', 'Isfahan', 'Chahar Bagh Bala, Isfahan', '+98 31 3624 4044', 32.6546, 51.668),
  mission('ir-kermanshah', 'consulate', 'إيران', 'Iran', 'كرمنشاه', 'Kermanshah', 'Kasra Blvd, Kermanshah', '+98 83 3836 2222', 34.3277, 47.0778),
  mission('ir-mashhad', 'consulate', 'إيران', 'Iran', 'مشهد', 'Mashhad', 'Ahmadabad Blvd, Mashhad', '+98 51 3844 1111', 36.297, 59.606),
  mission('jp-tokyo', 'embassy', 'اليابان', 'Japan', 'طوكيو', 'Tokyo', '2-9-14, Mita, Minato-ku, Tokyo 108-0073', '+81 3 3760 7711', 35.647, 139.741),
  mission('jo-amman', 'embassy', 'الأردن', 'Jordan', 'عمّان', 'Amman', 'Abdoun, Cairo St, Amman', '+962 6 592 0146', 31.9539, 35.9106),
  mission('kz-astana', 'embassy', 'كازاخستان', 'Kazakhstan', 'أستانا', 'Astana', 'Diplomatic Quarter, Astana', '+7 7172 24 16 81', 51.1694, 71.4491),
  mission('kw-kuwait', 'embassy', 'الكويت', 'Kuwait', 'مدينة الكويت', 'Kuwait City', 'Jabriya, Block 12, Street 1, Kuwait', '+965 2531 2600', 29.316, 48.028),
  mission('lb-beirut', 'embassy', 'لبنان', 'Lebanon', 'بيروت', 'Beirut', 'Baabda, Embassy Street, Beirut', '+961 5 920 000', 33.833, 35.544),
  mission('my-kl', 'embassy', 'ماليزيا', 'Malaysia', 'كوالالمبور', 'Kuala Lumpur', '2 Jalan Ampang Hilir, 55000 Kuala Lumpur', '+60 3 4251 2593', 3.161, 101.731),
  mission('om-muscat', 'embassy', 'عُمان', 'Oman', 'مسقط', 'Muscat', 'Shatti Al Qurum, Muscat', '+968 24 602 175', 23.603, 58.491),
  mission('pk-islamabad', 'embassy', 'باكستان', 'Pakistan', 'إسلام آباد', 'Islamabad', 'Plot 8-10, Diplomatic Enclave, Islamabad', '+92 51 283 2373', 33.729, 73.087),
  mission('pk-karachi', 'consulate', 'باكستان', 'Pakistan', 'كراتشي', 'Karachi', 'Clifton, Karachi', '+92 21 3583 1100', 24.813, 67.023),
  mission('ph-manila', 'embassy', 'الفلبين', 'Philippines', 'مانيلا', 'Manila', 'Makati Diplomatic Area, Metro Manila', '+63 2 8894 1234', 14.5547, 121.0244),
  mission('qa-doha', 'embassy', 'قطر', 'Qatar', 'الدوحة', 'Doha', 'West Bay, Doha', '+974 4483 2222', 25.326, 51.531),
  mission('sa-riyadh', 'embassy', 'السعودية', 'Saudi Arabia', 'الرياض', 'Riyadh', 'Diplomatic Quarter, Riyadh', '+966 11 488 0146', 24.682, 46.622),
  mission('sa-jeddah', 'consulate', 'السعودية', 'Saudi Arabia', 'جدة', 'Jeddah', 'Al Hamra District, Jeddah', '+966 12 667 0166', 21.5433, 39.1728),
  mission('kr-seoul', 'embassy', 'كوريا الجنوبية', 'South Korea', 'سيول', 'Seoul', '39 Dokseodang-ro, Yongsan-gu, Seoul', '+82 2 794 2882', 37.534, 126.986),
  mission('lk-colombo', 'embassy', 'سريلانكا', 'Sri Lanka', 'كولومبو', 'Colombo', '21 Horton Place, Colombo 07', '+94 11 269 2787', 6.9106, 79.8648),
  mission('sy-damascus', 'embassy', 'سوريا', 'Syria', 'دمشق', 'Damascus', 'Abu Rummaneh, Damascus', '+963 11 333 0415', 33.5138, 36.2765),
  mission('tr-ankara', 'embassy', 'تركيا', 'Turkey', 'أنقرة', 'Ankara', 'Turan Emeksiz Sokak No:11, Gaziosmanpaşa, Ankara', '+90 312 468 7421', 39.8924, 32.8627),
  mission('tr-istanbul', 'consulate', 'تركيا', 'Turkey', 'إسطنبول', 'Istanbul', 'Vali Konağı Cad. No:93, Nişantaşı, İstanbul', '+90 212 232 2112', 41.0488, 28.9945),
  mission('tr-gaziantep', 'consulate', 'تركيا', 'Turkey', 'غازي عنتاب', 'Gaziantep', 'İncili Pınar Mah., Gaziantep', '+90 342 220 1010', 37.0662, 37.3833),
  mission('tm-ashgabat', 'embassy', 'تركمانستان', 'Turkmenistan', 'عشق آباد', 'Ashgabat', 'Archabil Avenue, Ashgabat', '+993 12 48 03 21', 37.9601, 58.3261),
  mission('ae-abudhabi', 'embassy', 'الإمارات', 'United Arab Emirates', 'أبوظبي', 'Abu Dhabi', 'Diplomatic Area, Al Nahyan, Abu Dhabi', '+971 2 446 4444', 24.461, 54.378),
  mission('ae-dubai', 'consulate', 'الإمارات', 'United Arab Emirates', 'دبي', 'Dubai', 'Trade Centre Area, Sheikh Zayed Road, Dubai', '+971 4 398 2666', 25.217, 55.282),
  mission('vn-hanoi', 'embassy', 'فيتنام', 'Vietnam', 'هانوي', 'Hanoi', '2 Le Hong Phong, Ba Dinh, Hanoi', '+84 24 3845 4667', 21.035, 105.832),

  mission('at-vienna', 'embassy', 'النمسا', 'Austria', 'فيينا', 'Vienna', 'Johannesgasse 26, 1010 Vienna', '+43 1 713 8198', 48.204, 16.377),
  mission('be-brussels', 'embassy', 'بلجيكا', 'Belgium', 'بروكسل', 'Brussels', '189 Avenue Franklin Roosevelt, 1050 Brussels', '+32 2 672 5731', 50.807, 4.385),
  mission('bg-sofia', 'embassy', 'بلغاريا', 'Bulgaria', 'صوفيا', 'Sofia', '17 Frederic Joliot-Curie St, Sofia', '+359 2 973 3295', 42.67, 23.348),
  mission('hr-zagreb', 'embassy', 'كرواتيا', 'Croatia', 'زغرب', 'Zagreb', 'Pantovčak 125, Zagreb', '+385 1 457 8900', 45.832, 15.951),
  mission('cz-prague', 'embassy', 'التشيك', 'Czechia', 'براغ', 'Prague', 'Anny Letenské 5, Prague 2', '+420 222 511 590', 50.077, 14.44),
  mission('dk-copenhagen', 'embassy', 'الدنمارك', 'Denmark', 'كوبنهاغن', 'Copenhagen', 'Kristianiagade 16, 2100 Copenhagen', '+45 39 29 60 00', 55.7, 12.585),
  mission('fi-helsinki', 'embassy', 'فنلندا', 'Finland', 'هلسنكي', 'Helsinki', 'Kulosaarentie 36, Helsinki', '+358 9 684 8822', 60.185, 25.006),
  mission('fr-paris', 'embassy', 'فرنسا', 'France', 'باريس', 'Paris', '64 Avenue Foch, 75116 Paris', '+33 1 45 53 33 70', 48.8716, 2.2875, 'info@irak.fr'),
  mission('fr-cannes', 'consulate', 'فرنسا', 'France', 'كان', 'Cannes', 'Cannes, Alpes-Maritimes', '+33 4 93 39 10 10', 43.5528, 7.0174),
  mission('de-berlin', 'embassy', 'ألمانيا', 'Germany', 'برلين', 'Berlin', 'Pacelliallee 19-21, 14195 Berlin', '+49 30 8434 780', 52.456, 13.287),
  mission('de-frankfurt', 'consulate', 'ألمانيا', 'Germany', 'فرانكفورت', 'Frankfurt', 'Westendstraße 16-22, Frankfurt am Main', '+49 69 597 0840', 50.116, 8.662),
  mission('gr-athens', 'embassy', 'اليونان', 'Greece', 'أثينا', 'Athens', '4 Mavili Square, Athens 11521', '+30 210 671 3560', 37.983, 23.76),
  mission('va-rome', 'embassy', 'الفاتيكان', 'Holy See', 'روما', 'Rome', 'Via della Camilluccia 355, Rome', '+39 06 3534 4701', 41.93, 12.44),
  mission('hu-budapest', 'embassy', 'المجر', 'Hungary', 'بودابست', 'Budapest', 'Szabadság tér 7, Budapest', '+36 1 201 1577', 47.504, 19.05),
  mission('ie-dublin', 'embassy', 'أيرلندا', 'Ireland', 'دبلن', 'Dublin', '8 Raglan Road, Ballsbridge, Dublin 4', '+353 1 668 8146', 53.33, -6.236),
  mission('it-rome', 'embassy', 'إيطاليا', 'Italy', 'روما', 'Rome', 'Via della Camilluccia 355, 00135 Rome', '+39 06 3534 4700', 41.9295, 12.441),
  mission('nl-hague', 'embassy', 'هولندا', 'Netherlands', 'لاهاي', 'The Hague', 'Johan van Oldenbarneveltlaan 42, The Hague', '+31 70 363 4461', 52.089, 4.285),
  mission('no-oslo', 'embassy', 'النرويج', 'Norway', 'أوسلو', 'Oslo', 'Nedre Vollgate 8, Oslo', '+47 22 41 20 40', 59.911, 10.741),
  mission('pl-warsaw', 'embassy', 'بولندا', 'Poland', 'وارسو', 'Warsaw', 'Al. Róż 5, 00-556 Warsaw', '+48 22 621 51 44', 52.225, 21.022),
  mission('pt-lisbon', 'embassy', 'البرتغال', 'Portugal', 'لشبونة', 'Lisbon', 'Rua de São Caetano 10, Lisbon', '+351 21 397 6295', 38.711, -9.157),
  mission('ro-bucharest', 'embassy', 'رومانيا', 'Romania', 'بوخارست', 'Bucharest', 'Str. Emil Pangratti 16, Bucharest', '+40 21 230 7807', 44.466, 26.09),
  mission('ru-moscow', 'embassy', 'روسيا', 'Russia', 'موسكو', 'Moscow', '12 Pogodinskaya St, Moscow', '+7 499 246 5412', 55.73, 37.56),
  mission('rs-belgrade', 'embassy', 'صربيا', 'Serbia', 'بلغراد', 'Belgrade', 'Kneza Miloša 70, Belgrade', '+381 11 361 8330', 44.805, 20.462),
  mission('es-madrid', 'embassy', 'إسبانيا', 'Spain', 'مدريد', 'Madrid', 'Paseo de la Castellana 15, Madrid', '+34 91 310 1234', 40.428, -3.69),
  mission('se-stockholm', 'embassy', 'السويد', 'Sweden', 'ستوكهولم', 'Stockholm', 'Baldersgatan 6 A-B, 114 27 Stockholm', '+46 8 411 4443', 59.345, 18.071, 'iraqiconsul@iraqembassy.se'),
  mission('ch-bern', 'embassy', 'سويسرا', 'Switzerland', 'بيرن', 'Bern', 'Kirchenfeldstrasse 63, 3005 Bern', '+41 31 352 8080', 46.941, 7.451),
  mission('ua-kyiv', 'embassy', 'أوكرانيا', 'Ukraine', 'كييف', 'Kyiv', 'Mechnykova St 14, Kyiv', '+380 44 285 2200', 50.437, 30.531),
  mission('gb-london', 'embassy', 'المملكة المتحدة', 'United Kingdom', 'لندن', 'London', '21 Queen\'s Gate, London SW7 5JE', '+44 20 7584 7141', 51.5007, -0.1806),
  mission('gb-glasgow', 'consulate', 'المملكة المتحدة', 'United Kingdom', 'غلاسكو', 'Glasgow', '169 West George Street, Glasgow', '+44 141 221 1341', 55.861, -4.259),
  mission('gb-manchester', 'consulate', 'المملكة المتحدة', 'United Kingdom', 'مانشستر', 'Manchester', '77 Bloom Street, Manchester M1 6DP', '+44 161 236 5130', 53.477, -2.24),

  mission('au-canberra', 'embassy', 'أستراليا', 'Australia', 'كانبرا', 'Canberra', '48 Culgoa Circuit, O\'Malley ACT 2606', '+61 2 6286 4099', -35.351, 149.098),
  mission('au-melbourne', 'consulate', 'أستراليا', 'Australia', 'ملبورن', 'Melbourne', '343 Little Collins St, Melbourne VIC 3000', '+61 3 9642 1844', -37.815, 144.962),
  mission('au-sydney', 'consulate', 'أستراليا', 'Australia', 'سيدني', 'Sydney', '403 George Street, Sydney NSW 2000', '+61 2 9262 5335', -33.868, 151.207),
  mission('nz-wellington', 'embassy', 'نيوزيلندا', 'New Zealand', 'ويلينغتون', 'Wellington', 'Thorndon Diplomatic Area, Wellington', '+64 4 472 0900', -41.276, 174.777),

  mission('us-un-ny', 'mission', 'الولايات المتحدة', 'United States', 'نيويورك', 'New York', '14 East 79th Street, New York, NY 10075', '+1 212 737 4433', 40.776, -73.962),
  mission('ch-un-geneva', 'mission', 'سويسرا', 'Switzerland', 'جنيف', 'Geneva', 'Chemin des Corbillettes 8, 1218 Grand-Saconnex', '+41 22 918 0480', 46.232, 6.123),
  mission('fr-unesco', 'mission', 'فرنسا', 'France', 'باريس', 'Paris (UNESCO)', '1 Rue Miollis, 75015 Paris', '+33 1 45 68 33 70', 48.845, 2.306),
];

export function missionToListing(m: IraqiMission): DirectoryListing {
  return {
    id: `mission-${m.id}`,
    category_key: 'embassy',
    category_label: 'سفارة وشرطة',
    name: m.nameAr,
    description: `${m.nameEn} — ${m.address}`,
    country_name: m.countryAr,
    city: m.cityAr,
    address: m.address,
    image: '',
    rating: 5,
    price_level: '',
    tags: [m.kind === 'embassy' ? 'سفارة' : m.kind === 'consulate' ? 'قنصلية' : 'بعثة', 'خط طوارئ'],
    proximity_note: `${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}`,
    phone: m.phone,
    hours: 'راجع موقع وزارة الخارجية للمواعيد',
    is_featured: true,
    sort_order: 0,
    lat: m.lat,
    lng: m.lng,
    metro_station_name: '',
    metro_walk_minutes: 0,
    review_count: 0,
    created_at: '',
    nav_query: `${m.lat},${m.lng}`,
  };
}

const BY_ID = new Map(IRAQI_MISSIONS.map((m) => [m.id, m]));

export function getMissionById(id?: string | null) {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function missionsForCountry(country: string) {
  const q = country.trim().toLowerCase();
  if (!q) return [];
  return IRAQI_MISSIONS.filter(
    (m) =>
      m.countryAr === country ||
      m.countryAr.includes(country) ||
      m.countryEn.toLowerCase() === q ||
      m.countryEn.toLowerCase().includes(q) ||
      m.cityAr.includes(country) ||
      m.cityEn.toLowerCase().includes(q),
  );
}

export function missionSearchText(m: IraqiMission) {
  return `${m.nameAr} ${m.nameEn} ${m.cityAr} ${m.cityEn} ${m.countryAr} ${m.countryEn} ${m.kind}`.toLowerCase();
}
