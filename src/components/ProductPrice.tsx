import { money, pctOff } from '@/lib/format';
import { productPriceKnown, productUnitPrice } from '@/lib/catalog';
import type { Product } from '@/lib/types';

export function ProductPrice({ p, variantId }: { p: Product; variantId?: string }) {
  const price = productUnitPrice(p, variantId);
  if (!productPriceKnown(p, variantId)) return <span className="now">Consultar precio</span>;
  return <><span className="now">{money(price)}</span>{p.list > price && <>
    <span className="was">{money(p.list)}</span><span className="sv">−{pctOff(price, p.list)}%</span>
  </>}</>;
}
