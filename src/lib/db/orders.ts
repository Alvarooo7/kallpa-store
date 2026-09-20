import { db } from './index';

export type NewOrderLine = { slug: string; name: string; qty: number; unitCents: number };

export type NewOrder = {
  customer: { name: string; email: string; phoneE164: string };
  zone: 'lima' | 'prov';
  isExpress: boolean;
  payMethod: 'cod' | 'yape' | 'transfer' | 'card';
  lines: NewOrderLine[];
  shipping: {
    district?: string; address?: string; reference?: string;
    city?: string; agency?: string; dni?: string;
  };
  idempotencyKey?: string;
};

export type OrderResult =
  | { ok: true; number: string; id: number; totalCents: number; igvCents: number; reused: boolean }
  | { ok: false; reason: 'no_stock'; slug: string };

type OrderRpc =
  | { ok: true; number: string; id: number; total_cents: number; igv_cents: number; reused: boolean }
  | { ok: false; reason: 'no_stock'; slug: string };

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
      customer: { name: input.customer.name, email: input.customer.email, phone_e164: input.customer.phoneE164 },
      zone: input.zone,
      is_express: input.isExpress,
      pay_method: input.payMethod,
      subtotal_cents: subtotalCents,
      igv_cents: igvCents,
      idempotency_key: input.idempotencyKey ?? null,
      lines: input.lines.map((l) => ({ slug: l.slug, name: l.name, qty: l.qty, unit_cents: l.unitCents })),
      shipping: input.shipping,
    },
  });
  if (error) throw new Error(error.message);

  const r = data as OrderRpc;
  if (!r.ok) return r;
  return { ok: true, id: r.id, number: r.number, totalCents: r.total_cents, igvCents: r.igv_cents, reused: r.reused };
}

/** Libera la reserva cuando un pedido se cancela o se rechaza. */
export async function releaseStock(orderId: number) {
  if (!db) return;
  const { error } = await db.rpc('release_stock', { p_order_id: orderId });
  if (error) throw new Error(error.message);
}
