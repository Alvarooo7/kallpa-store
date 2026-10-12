import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { verifiedAccount } from '@/lib/reward-auth';
export const runtime = 'nodejs';
async function handle(req: Request, spin: boolean) {
  if (process.env.REWARDS_ENABLED !== 'true' || !db) return NextResponse.json({ error: 'Los premios todavía no están disponibles.' }, { status: 503 });
  const user = await verifiedAccount(req);
  if (!user) return NextResponse.json({ error: 'Verifica tu correo para continuar.' }, { status: 401 });
  const url = new URL(req.url);
  let body: { orderId?: unknown; family?: unknown } = {};
  if (spin) {
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }); }
  }
  const orderId = Number(spin ? body.orderId : url.searchParams.get('order'));
  const family = (spin ? body.family : url.searchParams.get('family')) ?? 'style';
  if (!['style','practical'].includes(String(family))) return NextResponse.json({ error: 'Elige el tipo de regalo.' }, { status: 400 });
  const { data: rows, error: listError } = await db.from('orders')
    .select('id,number,status,subtotal_cents,discount_cents,checkout_phone')
    .eq('checkout_email', user.email!.toLowerCase()).order('created_at', { ascending: false }).limit(30);
  if (listError) return NextResponse.json({ error: 'El juego todavía está en preparación.' }, { status: 503 });
  const orders = (rows ?? []).map(row => ({ id: row.id, number: row.number, status: row.status,
    net: row.subtotal_cents - row.discount_cents, phone: row.checkout_phone ? `•••••${row.checkout_phone.slice(-4)}` : null }));
  const selected = orderId || orders[0]?.id;
  if (spin && (!Number.isSafeInteger(orderId) || orderId <= 0)) return NextResponse.json({ error: 'Elige tu pedido.' }, { status: 400 });
  if (!selected) return NextResponse.json({ state: 'pending', orders }, { headers: { 'Cache-Control': 'no-store' } });
  const { data, error } = await db.rpc('order_reward_game', { p_user: user.id, p_order: selected, p_spin: spin, p_roll: spin ? randomInt(100) : 0, p_family: family });
  if (error) return NextResponse.json({ error: 'No pudimos consultar tu premio. Inténtalo de nuevo.' }, { status: 503 });
  return NextResponse.json({ ...data, orders }, { headers: { 'Cache-Control': 'no-store' } });
}
export const GET = (req: Request) => handle(req, false);
export const POST = (req: Request) => handle(req, true);
