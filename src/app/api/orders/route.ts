import { NextResponse } from 'next/server';
import { bySlug } from '@/lib/catalog';

/**
 * Registra un pedido.
 *
 * PENDIENTE al conectar la base:
 *  1. Guardar el pedido con estado `pending` y congelar el precio en order_items.
 *  2. Reservar stock.
 *  3. Si la zona es provincia o el envío es express, generar el link de pago
 *     (Izipay / Culqi / Mercado Pago) y devolverlo en la respuesta.
 *  4. Mandar el correo de confirmación y el mensaje de WhatsApp.
 *  5. Reenviar el evento Purchase a la Conversions API de Meta.
 *
 * El precio NUNCA se toma del cliente: se recalcula acá desde el catálogo.
 */
type Body = {
  zone: 'lima' | 'prov';
  customer: { name: string; phone: string; email: string };
  shipping: Record<string, string>;
  coupon?: string;
  items: { id: string; q: number }[];
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { customer, items, zone } = body;
  if (!customer?.name || !customer?.phone || !customer?.email) {
    return NextResponse.json({ error: 'Faltan tus datos de contacto' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'El pedido está vacío' }, { status: 400 });
  }

  if (items.some(l => !bySlug(l.id)?.priceKnown)) {
    return NextResponse.json({ error: 'Consulta el precio y disponibilidad de estos productos antes de pedir.' }, { status: 400 });
  }
  const lines = items.map((l) => {
    const p = bySlug(l.id);
    if (!p) throw new Error(`Producto desconocido: ${l.id}`);
    const q = Math.max(1, Math.min(10, Math.floor(l.q)));
    return { id: p.id, name: p.short, qty: q, unitCents: Math.round(p.price * 100) };
  });

  const subtotalCents = lines.reduce((s, l) => s + l.unitCents * l.qty, 0);
  const number = `VD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  console.info('[pedido]', { number, zone, lines, subtotalCents, customer: { email: customer.email } });

  return NextResponse.json({
    number,
    subtotalCents,
    payment: zone === 'lima' ? 'contraentrega' : 'anticipado',
    // payUrl: '...'  ← acá va el link de la pasarela cuando la conectes
  });
}
