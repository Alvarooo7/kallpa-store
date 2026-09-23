import { NextResponse, after } from 'next/server';
import { bySlug, productLineName, productPriceKnown, productUnitPrice, variantById } from '@/lib/catalog';
import { hasDb } from '@/lib/db';
import { createOrder } from '@/lib/db/orders';
import { clampQty, clean, isEmail, toE164Pe } from '@/lib/validation';
import { FREE_EXPRESS_FROM, expressFeeForDistrict } from '@/lib/shipping';
import { COMPANY, waLink } from '@/lib/company';
import { sendMail } from '@/lib/mail/client';
import { orderConfirmation, orderInternal } from '@/lib/mail/templates';

export const runtime = 'nodejs';

type Body = {
  zone?: 'lima' | 'prov';
  isExpress?: boolean;
  customer?: { name?: string; phone?: string; email?: string; marketingOk?: boolean };
  shipping?: Record<string, string>;
  coupon?: string;
  items?: { id: string; q: number; variantId?: string }[];
  idempotencyKey?: string;
};

const bad = (error: string, status = 400, field?: string) => NextResponse.json({ error, field }, { status });

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
  const phoneE164 = toE164Pe(body.customer?.phone);
  const email = clean(body.customer?.email, 254).toLowerCase();
  const marketingOk = body.customer?.marketingOk === true;
  if (name.length < 3) return bad('Escribe tu nombre completo (mínimo 3 caracteres).', 400, 'name');
  if (!phoneE164) return bad('Ingresa un celular peruano de 9 dígitos que empiece en 9.', 400, 'phone');
  if (!isEmail(email)) return bad('Escribe un correo electrónico válido.', 400, 'email');

  // ── items ──
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return bad('Tu pedido está vacío.');
  if (items.length > 20) return bad('Demasiados productos en un solo pedido.');

  const unknown = items.filter((l) => !bySlug(l?.id));
  if (unknown.length) return bad('Hay un producto que ya no está disponible. Vuelve a armar tu pedido.');

  const invalidVariant = items.find((l) => {
    const p = bySlug(l.id)!;
    return p.variants?.length && (!l.variantId || !variantById(p, l.variantId));
  });
  if (invalidVariant) return bad('Elige una opción disponible para cada producto.');

  const sinPrecio = items.filter((l) => !productPriceKnown(bySlug(l.id)!, l.variantId));
  if (sinPrecio.length) {
    return bad('Consulta el precio y la disponibilidad de estos productos antes de pedir.');
  }

  const lines = items.map((l) => {
    const p = bySlug(l.id)!;
    const variant = variantById(p, l.variantId);
    const qty = clampQty(l.q);
    // El precio se toma SIEMPRE del catálogo del servidor, nunca del cliente.
    return {
      slug: p.id,
      name: productLineName(p, l.variantId),
      qty,
      unitCents: Math.round(productUnitPrice(p, l.variantId) * 100),
      variantId: variant?.id,
      variantSku: variant?.sku,
      variantLabel: variant?.label,
      variantAttributes: variant ? {
        ...(variant.color ? { color: variant.color } : {}),
        ...(variant.flavor ? { flavor: variant.flavor } : {}),
        ...(variant.size ? { size: variant.size } : {}),
        ...(variant.presentation ? { presentation: variant.presentation } : {}),
      } : {},
    };
  });

  // ── envío ──
  const s = body.shipping ?? {};
  const shipping =
    zone === 'lima'
      ? { district: clean(s.district, 80), address: clean(s.address, 200), reference: clean(s.reference, 200) }
      : { city: clean(s.city, 80), agency: clean(s.agency, 40), dni: clean(s.dni, 15) };

  if (zone === 'lima' && !shipping.district) return bad('Elige tu distrito.', 400, 'district');
  if (zone === 'lima' && !shipping.address) return bad('Ingresa tu dirección y referencia.', 400, 'address');
  if (zone === 'prov' && !shipping.city) return bad('Ingresa tu ciudad.', 400, 'city');
  if (zone === 'prov' && !shipping.dni) return bad('Ingresa el DNI para el recojo en agencia.', 400, 'dni');
  const merchandiseCents = lines.reduce((sum, line) => sum + line.unitCents * line.qty, 0);
  const districtExpressFee = zone === 'lima' && isExpress ? expressFeeForDistrict(shipping.district) : 0;
  if (zone === 'lima' && isExpress && districtExpressFee === null) {
    return bad('No pudimos calcular el express para ese distrito. Escríbenos por WhatsApp.');
  }
  const freeExpress = merchandiseCents >= FREE_EXPRESS_FROM * 100;
  const expressFee = freeExpress ? 0 : districtExpressFee;
  const shippingCents = (expressFee ?? 0) * 100;

  // ── sin base no se finge un pedido ──
  if (!hasDb) {
    console.error('[pedido] Supabase no configurado: no se guardó nada');
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
      customer: { name, phoneE164, email, marketingOk },
      zone,
      isExpress,
      shippingCents,
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

    // Los correos salen después de responder: un fallo del proveedor no puede
    // deshacer un pedido que ya quedó guardado.
    if (!result.reused) {
      const mailLines = lines.map((l) => ({ name: l.name, qty: l.qty, unitCents: l.unitCents }));
      after(async () => {
        await sendMail(orderConfirmation({
          to: email, name, number: result.number, lines: mailLines, totalCents: result.totalCents,
          zone, isExpress,
        }));
        const internal = process.env.MAIL_INTERNAL;
        if (internal) {
          await sendMail(orderInternal({
            to: internal, number: result.number, lines: mailLines, totalCents: result.totalCents,
            zone, isExpress,
            customer: { name, phone: phoneE164, email },
            shipping,
          }));
        }
      });
    }

    const deliveryLabel = zone === 'prov'
      ? `Envío a ${shipping.city} por ${shipping.agency}`
      : `${isExpress ? 'Express' : 'Entrega programada'} en ${shipping.district}`;
  const paymentLabel = zone === 'lima' && !isExpress
      ? 'Pagaré al recibir.'
      : `Quiero coordinar el pago anticipado por Yape o Plin al ${COMPANY.yapePlinPhone} (${COMPANY.yapePlinHolder}), transferencia bancaria o tarjeta.`;
    const whatsapp = waLink([
      `Hola Kallpa, soy ${name}. Quiero confirmar mi pedido ${result.number}.`,
      '',
      ...lines.map((line) => `• ${line.qty} × ${line.name}`),
      `Total: S/ ${(result.totalCents / 100).toFixed(2)}`,
      `Entrega: ${deliveryLabel}.`,
      paymentLabel,
    ].join('\n'));

    // TODO(pasarela): si se incorpora pago en línea, generar el link de pago.

    return NextResponse.json({
      number: result.number,
      totalCents: result.totalCents,
      igvCents: result.igvCents,
      payment: zone === 'lima' && !isExpress ? 'contraentrega' : 'anticipado',
      shippingCents,
      whatsapp,
    });
  } catch (err) {
    console.error('[pedido] fallo al guardar', { err: String(err) });
    return NextResponse.json(
      { error: 'Algo falló de nuestro lado. Escríbenos por WhatsApp y cerramos tu pedido ahí mismo.', whatsapp: `https://wa.me/${COMPANY.whatsapp}` },
      { status: 500 },
    );
  }
}
