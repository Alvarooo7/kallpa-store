import { NextResponse } from 'next/server';

/**
 * Libro de Reclamaciones virtual (D.S. 011-2011-PCM, Ley 31435).
 *
 * OBLIGATORIO al conectar la base:
 *  - Guardar cada hoja con numeración CORRELATIVA (no aleatoria como acá).
 *  - Enviar copia al consumidor y al correo de la empresa.
 *  - Conservar el registro y dejar trazabilidad de la respuesta.
 *  - Responder en un máximo de 15 días hábiles.
 */
export async function POST(req: Request) {
  const data = (await req.json().catch(() => ({}))) as Record<string, string>;
  const required = ['nombre', 'dni', 'email', 'telefono', 'producto', 'detalle', 'pedidoConsumidor'];
  const missing = required.filter((k) => !data[k]);
  if (missing.length) {
    return NextResponse.json({ error: `Faltan campos: ${missing.join(', ')}` }, { status: 400 });
  }

  // TODO: reemplazar por un contador correlativo en base de datos.
  const numero = `LR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  console.info('[libro-de-reclamaciones]', { numero, tipo: data.tipo, email: data.email });

  return NextResponse.json({ numero, plazoDiasHabiles: 15 });
}
