import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifiedAccount } from '@/lib/reward-auth';

export const runtime = 'nodejs';

export type AccountOrder = {
  number: string; status: string; createdAt: string; totalCents: number; discountCents: number;
  items: { name: string; qty: number; variant: string | null }[];
};

/** Pedidos de la cuenta verificada: solo los hechos con su mismo correo (con o sin sesión). */
export async function GET(req: Request) {
  const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!db) return reply({ error: 'No pudimos cargar tu cuenta en este momento.' }, 503);
  const user = await verifiedAccount(req);
  if (!user?.email) return reply({ error: 'Ingresa para ver tu cuenta.' }, 401);
  const email = user.email.toLowerCase();
  const { data: customer } = await db.from('customers').select('id').eq('email', email).maybeSingle();
  let query = db.from('orders')
    .select('number,status,created_at,total_cents,discount_cents,checkout_phone,order_items(product_name,qty,variant_label)')
    .order('created_at', { ascending: false })
    .limit(30);
  query = customer ? query.or(`checkout_email.eq."${email}",customer_id.eq.${customer.id}`) : query.eq('checkout_email', email);
  const { data, error } = await query;
  if (error) return reply({ error: 'No pudimos cargar tus pedidos. Inténtalo nuevamente.' }, 503);
  const orders: AccountOrder[] = (data ?? []).map(order => ({
    number: order.number, status: order.status, createdAt: order.created_at, totalCents: order.total_cents, discountCents: order.discount_cents,
    items: (order.order_items ?? []).map(item => ({ name: item.product_name, qty: item.qty, variant: item.variant_label })),
  }));
  return reply({ email, phone: data?.find(order => order.checkout_phone)?.checkout_phone ?? null, orders });
}
