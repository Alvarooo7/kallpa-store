import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { createClaim } from '@/lib/db/claims';
import { clean, isEmail, maskEmail, toE164Pe } from '@/lib/validation';
import { COMPANY } from '@/lib/company';

export const runtime = 'nodejs';

/**
 * Libro de Reclamaciones virtual (D.S. 011-2011-PCM, Ley 31435).
 * La hoja se numera de forma correlativa y se conserva: ambas cosas las exige
 * la norma. El plazo de respuesta es de 15 días hábiles.
 */
export async function POST(req: Request) {
  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data = {
    kind: raw.tipo === 'Queja' ? ('queja' as const) : ('reclamo' as const),
    name: clean(raw.nombre, 120),
    docId: clean(raw.dni, 15),
    email: clean(raw.email, 254).toLowerCase(),
    phone: clean(raw.telefono, 20),
    address: clean(raw.domicilio, 200) || undefined,
    guardian: clean(raw.apoderado, 120) || undefined,
    product: clean(raw.producto, 160),
    orderNumber: clean(raw.pedido, 40) || undefined,
    detail: clean(raw.detalle, 4000),
    request: clean(raw.pedidoConsumidor, 2000),
    amountCents: Number.isFinite(Number(raw.monto)) && Number(raw.monto) > 0
      ? Math.round(Number(raw.monto) * 100)
      : undefined,
  };

  const missing = (['name', 'docId', 'email', 'phone', 'product', 'detail', 'request'] as const)
    .filter((k) => !data[k]);
  if (missing.length) {
    return NextResponse.json({ error: 'Faltan datos obligatorios en el formulario.' }, { status: 400 });
  }
  if (!isEmail(data.email)) {
    return NextResponse.json({ error: 'Necesitamos un correo válido para enviarte la copia.' }, { status: 400 });
  }
  data.phone = toE164Pe(data.phone) ?? data.phone;

  if (!hasDb) {
    console.error('[libro] DATABASE_URL no configurada: la hoja NO se registró');
    return NextResponse.json(
      {
        error: 'No pudimos registrar tu hoja en este momento. Escríbenos y la registramos contigo.',
        email: COMPANY.email,
        whatsapp: `https://wa.me/${COMPANY.whatsapp}`,
      },
      { status: 503 },
    );
  }

  try {
    const claim = await createClaim(data);
    console.info('[libro]', { sheet: claim.sheetNumber, kind: data.kind });

    // TODO(correo): copia al consumidor y a la empresa. Es obligatorio.

    return NextResponse.json({
      numero: claim.sheetNumber,
      plazoDiasHabiles: 15,
      venceEl: claim.dueAt,
    });
  } catch (err) {
    console.error('[libro] fallo al registrar', { consumidor: maskEmail(data.email), err: String(err) });
    return NextResponse.json({ error: 'No pudimos registrar tu hoja. Vuelve a intentarlo.' }, { status: 500 });
  }
}
