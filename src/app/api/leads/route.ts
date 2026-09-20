import { NextResponse, after } from 'next/server';
import { db, hasDb } from '@/lib/db';
import { isEmail, clean } from '@/lib/validation';
import { sendMail } from '@/lib/mail/client';
import { couponWelcome } from '@/lib/mail/templates';

export const runtime = 'nodejs';

const WELCOME_CODE = 'BIENVENIDA10';

/**
 * Captura de correo para el cupón de bienvenida.
 * El código que devolvemos existe de verdad en la tabla `coupons`: si no
 * existiera, no habría forma de canjearlo al momento de pagar.
 */
export async function POST(req: Request) {
  const { email: rawEmail } = (await req.json().catch(() => ({}))) as { email?: string };
  const email = clean(rawEmail, 254).toLowerCase();

  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Ese correo no parece válido.' }, { status: 400 });
  }

  if (!hasDb || !db) {
    console.error('[lead] Supabase no configurado: el suscriptor no se guardó');
    return NextResponse.json({ error: 'No pudimos registrarte ahora. Inténtalo en un momento.' }, { status: 503 });
  }

  try {
    const { data: coupon, error: couponError } = await db
      .from('coupons')
      .select('id, code')
      .eq('code', WELCOME_CODE)
      .maybeSingle();
    if (couponError) throw new Error(couponError.message);
    if (!coupon) {
      console.error('[lead] falta el cupón', WELCOME_CODE, '— corre supabase/migrations/0002_seed_inventory.sql');
      return NextResponse.json({ error: 'La promoción no está activa ahora mismo.' }, { status: 503 });
    }

    const { data: created, error: subError } = await db
      .from('subscribers')
      .upsert({ email, source: 'popup', coupon_id: coupon.id }, { onConflict: 'email', ignoreDuplicates: true })
      .select('id');
    if (subError) throw new Error(subError.message);

    // Solo a suscriptores nuevos: si no, cualquiera podría usar esta ruta para
    // llenar de correos la bandeja de un tercero y gastar la cuota de envío.
    if (created && created.length > 0) {
      after(() => sendMail(couponWelcome({ to: email, code: coupon.code, days: 7 })));
    }

    return NextResponse.json({ code: coupon.code, expiresInDays: 7 });
  } catch (err) {
    console.error('[lead] fallo al registrar', String(err));
    return NextResponse.json({ error: 'No pudimos registrarte ahora.' }, { status: 500 });
  }
}
