import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { verifiedAccount } from '@/lib/reward-auth';
import { TIERS } from '@/lib/rewards';
export const runtime = 'nodejs';
async function handle(req: Request, spin: boolean) {
  const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (process.env.REWARDS_ENABLED !== 'true' || !db) return reply({ error: 'Estamos preparando los regalos. Pronto podrás jugar.' }, 503);
  const user = await verifiedAccount(req);
  if (!user) return reply({ error: 'Ingresa y confirma tu correo para guardar tu regalo.' }, 401);
  let body: { family?: string; pick?: string } = {};
  if (spin) { try { body = await req.json(); } catch { return reply({ error: 'Datos inválidos.' }, 400); } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Datos inválidos.' }, 400);
  // Nombre y celular no se piden aquí: se completan en el checkout y se vinculan al usar el premio.
  const family = body.family ?? 'style';
  const pick = TIERS[0].prizes.find(prize => prize.id === body.pick)?.id ?? null;
  if (spin && !['style', 'practical'].includes(family)) return reply({ error: 'Elige el tipo de regalo.' }, 400);
  // El servidor sortea sobre 10 000 (centésimas de punto); la carta con poder suma 2 puntos a su premio.
  const { data, error } = await db.rpc('welcome_reward', { p_user: user.id, p_name: null, p_phone: null, p_spin: spin, p_roll: spin ? randomInt(10000) : 0, p_family: family, p_pick: spin ? pick : null });
  if (error) return reply({ error: 'No pudimos consultar tu regalo. Inténtalo nuevamente.' }, 503);
  return reply(data);
}
export const GET = (req: Request) => handle(req, false);
export const POST = (req: Request) => handle(req, true);
