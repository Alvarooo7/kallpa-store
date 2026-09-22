import type { Product, ProductAvailability, StockState, StockStatus } from './types';

export const LOW_STOCK_MAX = 2;

export function statusFromQuantity(available: number): StockStatus {
  if (available <= 0) return 'out_of_stock';
  if (available <= LOW_STOCK_MAX) return 'low_stock';
  return 'in_stock';
}

export function fallbackProductAvailability(product: Product): ProductAvailability {
  const variants = Object.fromEntries((product.variants ?? []).map(variant => {
    const available = variant.stock ?? null;
    const status = variant.availability ?? (available === null ? product.availability : statusFromQuantity(available));
    return [variant.id, { status, available } satisfies StockState];
  }));

  if (product.variants?.length) {
    return aggregateVariantAvailability(product.id, variants);
  }

  const available = product.stockTracked ? product.stock : null;
  return { productId: product.id, status: product.availability, available, variants };
}

export function aggregateVariantAvailability(productId: string, variants: Record<string, StockState>): ProductAvailability {
  const states = Object.values(variants);
  const active = states.filter(state => state.status !== 'inactive');
  const available = active.some(state => state.available === null)
    ? null
    : active.reduce((sum, state) => sum + (state.available ?? 0), 0);

  let status: StockStatus;
  if (!active.length) status = 'inactive';
  else if (active.some(state => state.status === 'in_stock')) status = 'in_stock';
  else if (active.some(state => state.status === 'low_stock')) status = 'low_stock';
  else if (active.some(state => state.status === 'coming_soon')) status = 'coming_soon';
  else status = 'out_of_stock';

  return { productId, status, available, variants };
}

export function selectedAvailability(stock: ProductAvailability, variantId?: string): StockState {
  return variantId && stock.variants[variantId] ? stock.variants[variantId] : stock;
}

export function canAddToCart(stock: StockState) {
  return stock.status === 'in_stock' || stock.status === 'low_stock';
}

export function stockLabel(stock: StockState): string | null {
  if (stock.status === 'low_stock') {
    if (stock.available === 1) return 'Última unidad';
    if (stock.available !== null) return `Últimas ${stock.available} unidades`;
    return 'Últimas unidades';
  }
  if (stock.status === 'out_of_stock') return 'Agotado por ahora';
  if (stock.status === 'coming_soon') return 'Próximamente';
  return null;
}

export function stockButtonLabel(stock: StockState, defaultLabel: string): string {
  if (stock.status === 'out_of_stock') return 'Agotado por ahora';
  if (stock.status === 'coming_soon') return 'Próximamente';
  return defaultLabel;
}
