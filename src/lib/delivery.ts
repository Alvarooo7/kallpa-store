/**
 * La promesa de entrega: corte 9:00 a.m., ventana 12–7 p.m., domingos sin despacho.
 * Función pura sobre la hora de Lima para poder testearla sin tocar el reloj.
 */
export type Promise_ = {
  open: boolean;
  headline: string;   // barra superior
  cut: string;        // sufijo con el contador
  big: string;        // línea principal en ficha y checkout
  small: string;      // detalle bajo la principal
  clock: string;      // HH:MM:SS o 09:00
  clockCap: string;
};

export type LimaTime = { dow: number; h: number; m: number; s: number };

export function limaNow(now: Date = new Date()): LimaTime {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima', hourCycle: 'h23',
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(
    f.formatToParts(now).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dow: days[p.weekday] ?? 1, h: +p.hour, m: +p.minute, s: +p.second };
}

const pad = (n: number) => String(n).padStart(2, '0');
const FREE_LINE = 'Delivery GRATIS en Lima, entrega de 12 a 7 p.m.';

export function nextCutoffSeconds(t: LimaTime): number {
  const elapsed = t.h * 3600 + t.m * 60 + t.s;
  const days = t.dow === 0 ? 1 : elapsed < 9 * 3600 ? 0 : t.dow === 6 ? 2 : 1;
  return days * 86400 + 9 * 3600 - elapsed;
}

export function deliveryPromise(t: LimaTime = limaNow()): Promise_ {
  const left = (9 - t.h) * 3600 - t.m * 60 - t.s;
  const remaining = nextCutoffSeconds(t);
  const countdown = `${pad(Math.floor(remaining / 3600))}:${pad(Math.floor((remaining % 3600) / 60))}:${pad(remaining % 60)}`;
  const cut = `· próximo: ${countdown}`;

  if (t.dow === 0) {
    return {
      open: false, headline: FREE_LINE, cut,
      big: 'Recíbelo el lunes entre 12 y 7 p.m.',
      small: 'Los domingos no despachamos, pero puedes dejar tu pedido listo hoy.',
      clock: countdown, clockCap: 'para el corte del lunes a las 9 a.m.',
    };
  }

  if (left > 0) {
    const c = `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
    return {
      open: true, headline: FREE_LINE, cut,
      big: 'Pídelo ahora y lo tienes HOY entre 12 y 7 p.m.',
      small: `Quedan ${c} para el corte de las 9:00 a.m.`,
      clock: c, clockCap: 'para el corte de hoy',
    };
  }

  const next = t.dow === 6 ? 'el lunes' : 'mañana';
  return {
    open: false, headline: FREE_LINE, cut,
    big: `Gratis, ${next} entre 12 y 7 p.m.`,
    small: '¿No puedes esperar? Express hoy mismo: gratis desde S/ 200 o desde S/ 10 según distrito.',
    clock: countdown, clockCap: `para el corte de ${t.dow === 6 ? 'lunes' : 'mañana'} a las 9 a.m.`,
  };
}

export const PROVINCE_PROMISE = {
  big: 'Envío gratis · 2 a 5 días hábiles',
  small: 'Shalom u Olva. A provincias el pago es anticipado.',
  fine: 'El envío por agencia no te cuesta nada. Solo se paga por adelantado.',
};

export const LIMA_FINE =
  'En la ventana de 12 a 7 p.m. el delivery es <b>gratis</b>. Express también es gratis desde <b>S/ 200</b>.';
