export interface PokemonSpecies {
  dexNumber: number;
  nameZh: string;
  nameEn: string;
  isLegendary: boolean;
  isUltraBeast: boolean;
}

export type InventoryStatus =
  | 'inventory'
  | 'wishlist'
  | 'scheduled_trade'
  | 'sold';

export type BallType =
  | ''
  | 'poke'
  | 'great'
  | 'ultra'
  | 'master'
  | 'premier'
  | 'beast'
  | 'safari'
  | 'incubator'
  | 'egg';

export type BackgroundStyle =
  | 'none'
  | 'mystic'
  | 'instinct'
  | 'valor'
  | 'location_park'
  | 'location_city'
  | 'wormhole'
  | 'special';

export interface PokemonStorageItem {
  id: string;
  dexNumber: number; // 1 ~ 1025
  nameZh: string;
  nameEn: string;
  account: string; // 所屬帳號標籤
  status: InventoryStatus; // 'inventory' | 'wishlist' | 'scheduled_trade' | 'sold'
  tradePartner: string; // 已排定交易對象（是誰）
  soldPrice: string; // 售出價格（預設 50NTD）
  screenshotUrl: string; // 實際遊戲截圖 Data URL 或圖片網址
  isShiny: boolean;
  isLegendary: boolean;
  isUltraBeast: boolean;
  isCostume: boolean;
  costumeName: string; // e.g. 'Party Hat', 'Pikachu Visor', etc.
  hasBackground: boolean;
  isLocationCard: boolean;
  backgroundStyle: BackgroundStyle;
  backgroundName: string; // e.g. 'Mystic Background', 'Location Card (Tokyo)', etc.
  isGigantamax: boolean;
  tags: string[]; // e.g. ['XXL', 'Male', 'Level 50']
  gblTags: string[]; // e.g. ['Legacy Move', 'CP<1500']
  ball: BallType;
  notes: string;
  createdAt: string;
}

export const SEARCH_FILTER_OPTIONS = [
  { id: 'Shiny', label: 'Shiny', labelZh: '異色' },
  { id: 'Legendary', label: 'Legendary', labelZh: '傳說/幻之' },
  { id: 'Ultra Beast', label: 'Ultra Beast', labelZh: '究極異獸' },
  { id: 'Costume', label: 'Costume', labelZh: '特殊裝扮' },
  { id: 'Background', label: 'Background', labelZh: '特殊背卡' },
  { id: 'Location Card', label: 'Location Card', labelZh: '地區背卡' },
  { id: 'Gigantamax', label: 'Gigantamax', labelZh: '超極巨化' },
] as const;

export const TAG_OPTIONS = [
  'XXL',
  'XXS',
  'Male',
  'Female',
  'Level 1',
  'Level 50',
  'Purified',
  'Dynamax',
  'Bulk',
] as const;

export const GBL_INFO_OPTIONS = [
  'Legacy Move',
  'Elite TM',
  '3rd TM',
  'CP<500',
  'CP<1500',
  'CP<2500',
  'CP>2500',
] as const;

export const BALL_OPTIONS: Array<{
  id: Exclude<BallType, ''>;
  nameEn: string;
  nameZh: string;
}> = [
  { id: 'poke', nameEn: 'Poké Ball', nameZh: '精靈球 (紅白球)' },
  { id: 'great', nameEn: 'Great Ball', nameZh: '超級球 (藍球)' },
  { id: 'ultra', nameEn: 'Ultra Ball', nameZh: '高級球 (黑黃球)' },
  { id: 'master', nameEn: 'Master Ball', nameZh: '大師球 (紫球)' },
  { id: 'premier', nameEn: 'Premier Ball', nameZh: '紀念球 (白球)' },
  { id: 'beast', nameEn: 'Beast Ball', nameZh: '究極球' },
  { id: 'safari', nameEn: 'Safari Ball', nameZh: '狩獵球' },
  { id: 'incubator', nameEn: 'Incubator', nameZh: '孵化器 (孵蛋)' },
  { id: 'egg', nameEn: 'Egg', nameZh: '寶可夢蛋' },
];

export const COSTUME_PRESETS: Array<{ value: string; label: string }> = [
  { value: '', label: '無裝扮 (None)' },
  { value: 'Party Hat', label: 'Party Hat (派對帽)' },
  { value: 'Pikachu Visor', label: 'Pikachu Visor (遮陽帽)' },
  { value: 'Crown', label: 'Crown (皇冠)' },
  { value: 'Straw Hat', label: 'Straw Hat (草帽)' },
  { value: 'Witch Hat', label: 'Witch Hat (魔女帽)' },
  { value: 'Santa Hat', label: 'Santa Hat (聖誕帽)' },
  { value: 'Flower Crown', label: 'Flower Crown (花冠)' },
  { value: 'Clone', label: 'Clone (複製體)' },
  { value: 'Armored', label: 'Armored (裝甲)' },
  { value: 'Fashion', label: 'Fashion (時裝週)' },
  { value: 'Halloween', label: 'Halloween (萬聖節)' },
];

export const BACKGROUND_PRESETS: Array<{
  style: BackgroundStyle;
  name: string;
  label: string;
  isLocationCard: boolean;
}> = [
  { style: 'none', name: '', label: '無背卡 (None)', isLocationCard: false },
  {
    style: 'mystic',
    name: 'Mystic Background',
    label: 'Mystic Background (藍隊急凍鳥背卡)',
    isLocationCard: false,
  },
  {
    style: 'instinct',
    name: 'Instinct Background',
    label: 'Instinct Background (黃隊閃電鳥背卡)',
    isLocationCard: false,
  },
  {
    style: 'valor',
    name: 'Valor Background',
    label: 'Valor Background (紅隊火焰鳥背卡)',
    isLocationCard: false,
  },
  {
    style: 'location_park',
    name: 'Location Card (Park)',
    label: 'Location Card - Park / GO Fest (自然公園地區背卡)',
    isLocationCard: true,
  },
  {
    style: 'location_city',
    name: 'Location Card (City)',
    label: 'Location Card - City / Tower (城市地標地區背卡)',
    isLocationCard: true,
  },
  {
    style: 'wormhole',
    name: 'Wormhole Background',
    label: 'Wormhole Background (究極空間背卡)',
    isLocationCard: false,
  },
  {
    style: 'special',
    name: 'Special Background',
    label: 'Special Background (特殊活動背卡)',
    isLocationCard: false,
  },
];
