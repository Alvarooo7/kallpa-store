import { NextResponse } from 'next/server';
import { bySlug } from '@/lib/catalog';
import { hasDb } from '@/lib/db';
import { createOrder } from '@/lib/db/orders';
import { clampQty, clean, isEmail, maskEmail, toE164Pe } from '@/lib/validation';
import { COMPANY } from '@/lib/company';

export const runtime = 'nodejs';

type Body = {
  zone?: 'lima' | 'prov';
  isExpress?: boolean;
  customer?: { name?: string; phone?: string; email?: string };
  shipping?: Record<string, string>;
  coupon?: string;
  items?: { id: string; q: number }[];
  idempotencyKey?: string;
};

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad('No pudimos leer el pedido.');
  }

  const zone = body.zone === 'prov' ? 'prov' : 'lima';
  const isExpress = Boolean(body.isExpress);

  // ── contacto ──
  const name = clean(body.customer?.name, 120);
  const email = clean(body.customer?.email, 254).toLowerCase();
  const phoneE164 = toE164Pe(body.customer?.phone);
  if (name.length < 3) return bad('Escribe tu nombre completo.');
  if (!isEmail(email)) return bad('Ese correo no parece válido.');
  if (!phoneE164) return bad('El celular debe ser un número peruano de 9 dígitos que empiece en 9.');

  // ── items ──
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return bad('Tu pedido está vacío.');
  if (items.length > 20) return bad('Demasiados productos en un solo pedido.');

  const unknown = items.filter((l) => !bySlug(l?.id));
  if (unknown.length) return bad('Hay un producto que ya no está disponible. Vuelve a armar tu pedido.');

  const sinPrecio = items.filter((l) => !bySlug(l.id)!.priceKnown);
  if (sinPrecio.length) {
    return bad('Consulta el precio y la disponibilidad de estos productos antes de pedir.');
  }

  const lines = items.map((l) => {
    const p = bySlug(l.id)!;
    const qty = clampQty(l.q);
    // El precio se toma SIEMPRE del catálogo del servidor, nunca del cliente.
    return { slug: p.id, name: p.short, qty, unitCents: Math.round(p.price * 100) };
  });

  // ── envío ──
  const s = body.shipping ?? {};
  const shipping =
    zone === 'lima'
      ? { district: clean(s.district, 80), address: clean(s.address, 200), reference: clean(s.reference, 200) }
      : { city: clean(s.city, 80), agency: clean(s.agency, 40), dni: clean(s.dni, 15) };

  if (zone === 'lima' && (!shipping.district || !shipping.address)) {
    return bad('Necesitamos tu distrito y tu dirección para llevarte el pedido.');
  }
  if (zone === 'prov' && (!shipping.city || !shipping.dni)) {
    return bad('Para provincia necesitamos tu ciudad y tu DNI: la agencia lo pide para entregar.');
  }

  // ── sin base no se finge un pedido ──
  if (!hasDb) {
    console.error('[pedido] DATABASE_URL no configurada: no se guardó nada');
    return NextResponse.json(
      {
        error: 'No pudimos registrar tu pedido en este momento.',
        whatsapp: `https://wa.me/${COMPANY.whatsapp}`,
      },
      { status: 503 },
    );
  }

  try {
    const result = await createOrder({
      customer: { name, email, phoneE164 },
      zone,
      isExpress,
      payMethod: zone === 'lima' && !isExpress ? 'cod' : 'yape',
      lines,
      shipping,
      idempotencyKey: clean(body.idempotencyKey, 64) || undefined,
    });

    if (!result.ok) {
      const p = bySlug(result.slug);
      return bad(`Nos quedamos sin stock de ${p?.short ?? 'un producto'}. Quítalo del pedido o escríbenos.`, 409);
    }

    // Nunca PII en los logs: el número de pedido basta para rastrear.
    console.info('[pedido]', { number: result.number, zone, items: lines.length, reused: result.reused });

    // TODO(correo): encolar confirmación al cliente y aviso interno.
    // TODO(pasarela): si es anticipado o express, generar el link de pago.

    return NextResponse.json({
      number: result.number,
      totalCents: result.totalCents,
      igvCents: result.igvCents,
      payment: zone === 'lima' && !isExpress ? 'contraentrega' : 'anticipado',
    });
  } catch (err) {
    console.error('[pedido] fallo al guardar', { customer: maskEmail(email), err: String(err) });
    return NextResponse.json(
      { error: 'Algo falló de nuestro lado. Escríbenos por WhatsApp y cerramos tu pedido ahí mismo.', whatsapp: `https://wa.me/${COMPANY.whatsapp}` },
      { status: 500 },
    );
  }
}
