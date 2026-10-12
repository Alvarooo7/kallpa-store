import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { verifiedAccount } from '@/lib/reward-auth';
import { clean, toE164Pe } from '@/lib/validation';
export const runtime = 'nodejs';
async function handle(req: Request, spin: boolean) {
  const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (process.env.REWARDS_ENABLED !== 'true' || !db) return reply({ error: 'Estamos preparando los regalos. Pronto podrás jugar.' }, 503);
  const user = await verifiedAccount(req);
  if (!user) return reply({ error: 'Ingresa y confirma tu correo para guardar tu regalo.' }, 401);
  let body: { name?: string; phone?: string; family?: string } = {};
  if (spin) { try { body = await req.json(); } catch { return reply({ error: 'Datos inválidos.' }, 400); } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Datos inválidos.' }, 400);
  const name = clean(body.name, 120), phone = toE164Pe(body.phone), family = body.family ?? 'style';
  if (spin && (name.length < 3 || !phone || !['style', 'practical'].includes(family))) return reply({ error: 'Completa tu nombre, celular peruano y tipo de regalo.' }, 400);
  const { data, error } = await db.rpc('welcome_reward', { p_user: user.id, p_name: name, p_phone: phone, p_spin: spin, p_roll: spin ? randomInt(100) : 0, p_family: family });
  if (error) return reply({ error: 'No pudimos consultar tu regalo. Inténtalo nuevamente.' }, 503);
  return reply(data);
}
export const GET = (req: Request) => handle(req, false);
export const POST = (req: Request) => handle(req, true);
