import { money, pctOff } from '@/lib/format';
import type { Product } from '@/lib/types';

export function ProductPrice({ p }: { p: Product }) {
  if (!p.priceKnown) return <span className="now">Consultar precio</span>;
  return <><span className="now">{money(p.price)}</span>{p.list > p.price && <>
    <span className="was">{money(p.list)}</span><span className="sv">−{pctOff(p.price, p.list)}%</span>
  </>}</>;
}
