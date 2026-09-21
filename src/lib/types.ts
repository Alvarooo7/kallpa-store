export type Product = {
  id: string;
  cat: string;
  art: 'buds' | 'swim' | 'watch' | 'glasses' | 'lingo';
  bg: string;
  name: string;
  short: string;
  claim: string;
  price: number;
  list: number;
  rate: number;
  revs: number;
  stock: number;
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
};

export type Pain = { pain: string; to: string; fix: string };
export type Use = { t: string; image: string; alt: string; n: string; href: string };

export type CartLine = { id: string; q: number };
export type Zone = 'lima' | 'prov';
