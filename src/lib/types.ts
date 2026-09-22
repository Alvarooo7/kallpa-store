export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'coming_soon' | 'inactive';

export type StockState = {
  status: StockStatus;
  available: number | null;
};

export type ProductAvailability = StockState & {
  productId: string;
  variants: Record<string, StockState>;
};

export type Product = {
  id: string;
  cat: string;
  art: 'buds' | 'swim' | 'watch' | 'glasses' | 'lingo' | 'supplement' | 'goggles' | 'swimcap';
  bg: string;
  name: string;
  short: string;
  claim: string;
  price: number;
  list: number;
  rate: number;
  revs: number;
  stock: number;
  stockTracked: boolean;
  availability: StockStatus;
  flag: string;
  ben: string[];
  specs: Record<string, string>;
  compat: string;
  warr: string;
  images: { src: string; width: number; height: number; alt: string }[];
  description: string;
  priceKnown: boolean;
  sources: { title: string; url: string }[];
  note?: string;
  video?: string;
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  label: string;
  color?: string;
  flavor?: string;
  size?: string;
  presentation?: string;
  swatch?: string;
  price?: number;
  priceKnown?: boolean;
  imageIndex?: number;
  stock?: number;
  availability?: StockStatus;
};

export type Pain = { pain: string; to: string; fix: string };
export type Use = { t: string; image: string; alt: string; n: string; href: string };

export type CartLine = { id: string; q: number; variantId?: string; max?: number | null };
export type Zone = 'lima' | 'prov';
