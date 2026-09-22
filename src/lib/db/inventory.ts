import 'server-only';

import { PRODUCTS } from '@/lib/catalog';
import { aggregateVariantAvailability, fallbackProductAvailability } from '@/lib/availability';
import type { ProductAvailability, StockState, StockStatus } from '@/lib/types';
import { db } from './index';

type AvailabilityRow = {
  product_slug: string;
  variant_id: string | null;
  available: number;
  status: StockStatus;
};

export async function getCatalogAvailability(): Promise<Record<string, ProductAvailability>> {
  const fallback = Object.fromEntries(PRODUCTS.map(product => [product.id, fallbackProductAvailability(product)]));
  if (!db) return fallback;

  const { data, error } = await db.from('catalog_availability').select('product_slug,variant_id,available,status');
  if (error || !data) return fallback;

  const variantGroups: Record<string, Record<string, StockState>> = {};
  for (const raw of data as AvailabilityRow[]) {
    if (!fallback[raw.product_slug]) continue;
    const state = { status: raw.status, available: raw.available } satisfies StockState;
    if (raw.variant_id) {
      (variantGroups[raw.product_slug] ??= {})[raw.variant_id] = state;
    } else {
      fallback[raw.product_slug] = { ...fallback[raw.product_slug], ...state };
    }
  }

  for (const [productId, variants] of Object.entries(variantGroups)) {
    fallback[productId] = aggregateVariantAvailability(productId, {
      ...fallback[productId].variants,
      ...variants,
    });
  }
  return fallback;
}
