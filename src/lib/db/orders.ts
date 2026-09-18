import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import { customers, inventory, orderItems, orders, shippingDetails, stockMoves } from './schema';

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

const IGV_RATE = 0.18;

/**
 * Crea el pedido en una sola transacción: correlativo, cliente, líneas con el
 * precio congelado, reserva de stock y datos de envío.
 *
 * Si la reserva de stock falla, la transacción entera se deshace: no queda un
 * pedido huérfano de un producto que no tenemos.
 */
export async function createOrder(input: NewOrder): Promise<OrderResult> {
  if (!db) throw new Error('DATABASE_URL no está configurada');

  // Idempotencia: el mismo doble clic devuelve el pedido ya creado.
  if (input.idempotencyKey) {
    const prev = await db.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
    if (prev[0]) {
      return { ok: true, id: prev[0].id, number: prev[0].number, totalCents: prev[0].totalCents, igvCents: prev[0].igvCents, reused: true };
    }
  }

  const subtotalCents = input.lines.reduce((s, l) => s + l.unitCents * l.qty, 0);
  // Los precios ya incluyen IGV: lo desagregamos para tenerlo en columna propia.
  const igvCents = Math.round(subtotalCents - subtotalCents / (1 + IGV_RATE));

  return db.transaction(async (tx) => {
    for (const l of input.lines) {
      const [row] = await tx.execute<{ reserve_stock: boolean }>(
        sql`select reserve_stock(${l.slug}, ${l.qty}) as reserve_stock`,
      );
      if (!row?.reserve_stock) {
        tx.rollback();
        return { ok: false, reason: 'no_stock', slug: l.slug } as const;
      }
    }

    const [customer] = await tx
      .insert(customers)
      .values({ email: input.customer.email, name: input.customer.name, phoneE164: input.customer.phoneE164 })
      .onConflictDoUpdate({
        target: customers.email,
        set: { name: input.customer.name, phoneE164: input.customer.phoneE164 },
      })
      .returning({ id: customers.id });

    const [{ number }] = await tx.execute<{ number: string }>(
      sql`select 'VD-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
                 lpad(nextval('order_seq')::text, 6, '0') as number`,
    );

    const [order] = await tx
      .insert(orders)
      .values({
        number,
        customerId: customer.id,
        zone: input.zone,
        isExpress: input.isExpress,
        payMethod: input.payMethod,
        subtotalCents,
        igvCents,
        totalCents: subtotalCents,
        idempotencyKey: input.idempotencyKey ?? null,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      input.lines.map((l) => ({
        orderId: order.id,
        productSlug: l.slug,
        productName: l.name,
        qty: l.qty,
        unitCents: l.unitCents,
        lineCents: l.unitCents * l.qty,
      })),
    );

    await tx.insert(stockMoves).values(
      input.lines.map((l) => ({ productSlug: l.slug, delta: -l.qty, reason: 'venta', orderId: order.id })),
    );

    await tx.insert(shippingDetails).values({ orderId: order.id, ...input.shipping });

    return { ok: true, id: order.id, number, totalCents: subtotalCents, igvCents, reused: false } as const;
  });
}

/** Libera la reserva cuando un pedido se cancela o se rechaza. */
export async function releaseStock(orderId: number) {
  if (!db) return;
  const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const l of lines) {
    await db
      .update(inventory)
      .set({ reserved: sql`greatest(0, ${inventory.reserved} - ${l.qty})`, updatedAt: new Date() })
      .where(eq(inventory.productSlug, l.productSlug));
  }
}
