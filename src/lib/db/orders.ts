import { db } from './index';

export type NewOrderLine = {
  slug: string; name: string; qty: number; unitCents: number;
  variantId?: string; variantSku?: string; variantLabel?: string;
  variantAttributes: Record<string, string>;
};

export type NewOrder = {
  customer: { name: string; phoneE164: string; email: string; marketingOk: boolean };
  zone: 'lima' | 'prov';
  isExpress: boolean;
  shippingCents: number;
  payMethod: 'cod' | 'yape' | 'transfer' | 'card';
  lines: NewOrderLine[];
  shipping: {
    district?: string; address?: string; reference?: string;
    city?: string; agency?: string; dni?: string;
  };
  couponCode?: string;
  idempotencyKey?: string;
};

export type CouponIssue = 'not_found' | 'expired' | 'min_subtotal' | 'exhausted' | 'already_used';

export type OrderResult =
  | { ok: true; number: string; id: number; totalCents: number; igvCents: number; discountCents: number; reused: boolean }
  | { ok: false; reason: 'no_stock'; slug: string }
  | { ok: false; reason: 'invalid_coupon'; detail: CouponIssue; minSubtotalCents?: number };

type OrderRpc =
  | { ok: true; number: string; id: number; total_cents: number; igv_cents: number; discount_cents: number; reused: boolean }
  | { ok: false; reason: 'no_stock'; slug: string }
  | { ok: false; reason: 'invalid_coupon'; detail: CouponIssue; min_subtotal_cents?: number };

const IGV_RATE = 0.18;

/**
 * Crea el pedido con la función `create_order` (supabase/migrations/0003):
 * correlativo, cliente, líneas con el precio congelado, reserva de stock y
 * datos de envío, todo en una sola transacción.
 *
 * Si la reserva de stock falla, la transacción entera se deshace: no queda un
 * pedido huérfano de un producto que no tenemos.
 */
export async function createOrder(input: NewOrder): Promise<OrderResult> {
  if (!db) throw new Error('Supabase no está configurado');

  const subtotalCents = input.lines.reduce((s, l) => s + l.unitCents * l.qty, 0);
  // Los precios ya incluyen IGV: lo desagregamos para tenerlo en columna propia.
  const igvCents = Math.round(subtotalCents - subtotalCents / (1 + IGV_RATE));

  const { data, error } = await db.rpc('create_order', {
    p: {
      customer: {
        name: input.customer.name,
        phone_e164: input.customer.phoneE164,
        email: input.customer.email,
        marketing_ok: input.customer.marketingOk,
      },
      zone: input.zone,
      is_express: input.isExpress,
      pay_method: input.payMethod,
      subtotal_cents: subtotalCents,
      shipping_cents: input.shippingCents,
      igv_cents: igvCents,
      idempotency_key: input.idempotencyKey ?? null,
      coupon_code: input.couponCode ?? null,
      lines: input.lines.map((l) => ({
        slug: l.slug,
        name: l.name,
        qty: l.qty,
        unit_cents: l.unitCents,
        variant_id: l.variantId ?? null,
        variant_sku: l.variantSku ?? null,
        variant_label: l.variantLabel ?? null,
        variant_attributes: l.variantAttributes,
      })),
      shipping: input.shipping,
    },
  });
  if (error) throw new Error(error.message);

  const r = data as OrderRpc;
  if (!r.ok) {
    if (r.reason === 'invalid_coupon') return { ...r, minSubtotalCents: r.min_subtotal_cents };
    return r;
  }
  return {
    ok: true, id: r.id, number: r.number, totalCents: r.total_cents,
    igvCents: r.igv_cents, discountCents: r.discount_cents, reused: r.reused,
  };
}

/** Libera la reserva cuando un pedido se cancela o se rechaza. */
export async function releaseStock(orderId: number) {
  if (!db) return;
  const { error } = await db.rpc('release_stock', { p_order_id: orderId });
  if (error) throw new Error(error.message);
}
