import { NextResponse } from 'next/server';

/**
 * Captura de correo para el cupón de bienvenida.
 * PENDIENTE: guardar el suscriptor, generar el cupón en la base con
 * un solo uso y vencimiento a 7 días, y enviarlo por correo.
 */
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
  }
  const code = `VD10-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  console.info('[lead]', { email, code });
  return NextResponse.json({ code, expiresInDays: 7 });
}
