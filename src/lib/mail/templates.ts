import { COMPANY, SITE_URL, waLink } from '@/lib/company';
import { deliveryPromise } from '@/lib/delivery';
import { btn, esc, money, shell } from './layout';
import type { Mail } from './client';

type Line = { name: string; qty: number; unitCents: number };

const rows = (lines: Line[]) =>
  lines
    .map(
      (l) => `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #EFEFF1;font-size:14px">${esc(l.name)}<br>
      <span style="color:#6B7076;font-size:13px">${l.qty} × ${money(l.unitCents)}</span></td>
    <td style="padding:8px 0;border-bottom:1px solid #EFEFF1;text-align:right;font-size:14px;white-space:nowrap">${money(l.unitCents * l.qty)}</td>
  </tr>`,
    )
    .join('');

const plainLines = (lines: Line[]) =>
  lines.map((l) => `- ${l.qty} × ${l.name} — ${money(l.unitCents * l.qty)}`).join('\n');

/** 1 · Confirmación al cliente */
export function orderConfirmation(p: {
  to: string; name: string; number: string; lines: Line[];
  totalCents: number; zone: 'lima' | 'prov'; isExpress: boolean;
}): Mail {
  const promise = deliveryPromise();
  const entrega =
    p.zone === 'prov'
      ? 'Sale por Shalom u Olva y llega en 2 a 5 días hábiles. Te pasamos el código de rastreo apenas lo despachemos.'
      : p.isExpress
        ? 'Te lo mandamos en express hoy mismo. Coordinamos la hora por WhatsApp.'
        : promise.big;

  const pago =
    p.zone === 'lima' && !p.isExpress
      ? 'Pagas al motorizado cuando lo tengas en la mano: efectivo, Yape o Plin.'
      : 'Este pedido se paga por adelantado. Te escribimos por WhatsApp para coordinarlo.';

  const html = shell(
    `Pedido ${p.number}`,
    `<p style="margin:0 0 6px;font-size:13px;color:#6B7076;letter-spacing:.08em;text-transform:uppercase">Pedido ${p.number}</p>
     <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25">Gracias, ${esc(p.name)}. Ya lo tenemos.</h1>
     <p style="margin:0 0 18px;font-size:15px;line-height:1.6"><strong>${entrega}</strong><br>${pago}</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">
       ${rows(p.lines)}
       <tr><td style="padding:12px 0 0;font-weight:700;font-size:16px">Total</td>
           <td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px">${money(p.totalCents)}</td></tr>
     </table>
     <p style="margin:6px 0 20px;font-size:12px;color:#6B7076">Precio en soles, IGV incluido.</p>
     ${btn(waLink(`Hola, consulto por mi pedido ${p.number}`), 'Escribirnos por WhatsApp')}`,
    'Si algo de este pedido no cuadra, respóndenos este correo o escríbenos por WhatsApp. Lo corregimos antes de que salga.',
  );

  const text = `Pedido ${p.number}

Gracias, ${p.name}. Ya lo tenemos.

${entrega}
${pago}

${plainLines(p.lines)}
Total: ${money(p.totalCents)} (IGV incluido)

WhatsApp: ${COMPANY.whatsappPretty}
${SITE_URL}`;

  return { to: p.to, subject: `Pedido ${p.number} confirmado · Kallpa`, html, text, template: 'order_confirmation', ref: p.number };
}

/** 2 · Aviso interno. El que hace que el negocio funcione. */
export function orderInternal(p: {
  to: string; number: string; lines: Line[]; totalCents: number;
  zone: 'lima' | 'prov'; isExpress: boolean;
  customer: { name: string; phone: string; email: string };
  shipping: Record<string, string | undefined>;
}): Mail {
  const destino =
    p.zone === 'lima'
      ? `${p.shipping.district ?? '—'} · ${p.shipping.address ?? '—'}${p.shipping.reference ? ` (${p.shipping.reference})` : ''}`
      : `${p.shipping.city ?? '—'} · ${p.shipping.agency ?? '—'} · DNI ${p.shipping.dni ?? '—'}`;

  const modo = p.zone === 'prov' ? 'PROVINCIA (anticipado)' : p.isExpress ? 'EXPRESS (anticipado)' : 'LIMA contraentrega';

  const html = shell(
    `Nuevo pedido ${p.number}`,
    `<p style="margin:0 0 6px;font-size:13px;color:#E85D26;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${modo}</p>
     <h1 style="margin:0 0 16px;font-size:22px">Pedido ${p.number} — ${money(p.totalCents)}</h1>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7">
       <tr><td style="color:#6B7076;width:90px">Cliente</td><td><strong>${esc(p.customer.name)}</strong></td></tr>
       <tr><td style="color:#6B7076">Celular</td><td><a href="${waLink(`Hola ${p.customer.name}, confirmamos tu pedido ${p.number}`)}">${esc(p.customer.phone)}</a></td></tr>
       <tr><td style="color:#6B7076">Correo</td><td>${esc(p.customer.email)}</td></tr>
       <tr><td style="color:#6B7076;vertical-align:top">Destino</td><td>${esc(destino)}</td></tr>
     </table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0">${rows(p.lines)}</table>
     <p style="margin:18px 0 0">${btn(waLink(`Hola ${p.customer.name}, te escribo de Kallpa por tu pedido ${p.number}`), 'Confirmar por WhatsApp')}</p>`,
    'Confirma con el cliente antes de despachar: baja la tasa de rechazo en contraentrega.',
  );

  const text = `NUEVO PEDIDO ${p.number} — ${money(p.totalCents)} — ${modo}

${p.customer.name} · ${p.customer.phone} · ${p.customer.email}
Destino: ${destino}

${plainLines(p.lines)}`;

  return { to: p.to, subject: `🛵 ${modo} · ${p.number} · ${money(p.totalCents)}`, html, text, template: 'order_internal', ref: p.number };
}

/** 3 · Cupón de bienvenida */
export function couponWelcome(p: { to: string; code: string; days: number }): Mail {
  const html = shell(
    'Tu 10 % de bienvenida',
    `<h1 style="margin:0 0 12px;font-size:22px">Acá está tu 10 %</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6">Úsalo en el paso de pago. Es de un solo uso y vence en ${p.days} días.</p>
     <div style="background:#F4F4F5;border-radius:12px;padding:18px;text-align:center;margin:0 0 20px">
       <div style="font-size:12px;color:#6B7076;letter-spacing:.1em;text-transform:uppercase">Tu código</div>
       <div style="font-size:26px;font-weight:700;color:#E85D26;letter-spacing:1px;margin:6px 0">${p.code}</div>
     </div>
     ${btn(SITE_URL, 'Ver el catálogo')}`,
    'Te escribimos solo cuando entra stock nuevo o hay una oferta de verdad. Si prefieres que no, respóndenos y te sacamos.',
  );
  const text = `Acá está tu 10 %.\n\nCódigo: ${p.code}\nUn solo uso · vence en ${p.days} días.\n\n${SITE_URL}`;
  return { to: p.to, subject: 'Tu 10 % de bienvenida · Kallpa', html, text, template: 'coupon_welcome', ref: p.code };
}

/** 4 · Copia de la hoja del libro de reclamaciones. Obligatoria. */
export function claimCopy(p: {
  to: string; sheet: string; kind: 'reclamo' | 'queja'; name: string;
  product: string; detail: string; request: string; dueAt: Date; forCompany?: boolean;
}): Mail {
  const vence = p.dueAt.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const titulo = p.forCompany ? `Nueva hoja ${p.sheet}` : `Copia de tu ${p.kind}`;

  const html = shell(
    titulo,
    `<p style="margin:0 0 6px;font-size:13px;color:#6B7076;letter-spacing:.08em;text-transform:uppercase">Hoja ${p.sheet}</p>
     <h1 style="margin:0 0 14px;font-size:22px">${p.forCompany ? `${p.kind} registrado` : `Registramos tu ${p.kind}`}</h1>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7">
       <tr><td style="color:#6B7076;width:110px;vertical-align:top">Consumidor</td><td>${esc(p.name)}</td></tr>
       <tr><td style="color:#6B7076;vertical-align:top">Producto</td><td>${esc(p.product)}</td></tr>
       <tr><td style="color:#6B7076;vertical-align:top">Detalle</td><td>${esc(p.detail)}</td></tr>
       <tr><td style="color:#6B7076;vertical-align:top">Pedido</td><td>${esc(p.request)}</td></tr>
     </table>
     <div style="background:#F4F4F5;border-radius:12px;padding:16px;margin:20px 0 0;font-size:14px;line-height:1.6">
       <strong>Plazo de respuesta: 15 días hábiles</strong>, es decir hasta el <strong>${vence}</strong>.
       ${p.forCompany ? '' : ' Si necesitamos más tiempo te propondremos una solución antes de esa fecha, y el plazo puede ampliarse una sola vez por 5 días hábiles más.'}
     </div>
     ${p.forCompany ? '' : `<p style="margin:16px 0 0;font-size:13px;color:#6B7076">Registrar tu ${p.kind} acá no te impide acudir a Indecopi.</p>`}`,
    p.forCompany ? undefined : 'Guarda este correo: es tu constancia.',
  );

  const text = `Hoja ${p.sheet}\n${p.kind.toUpperCase()}\n\nConsumidor: ${p.name}\nProducto: ${p.product}\n\nDetalle:\n${p.detail}\n\nPedido del consumidor:\n${p.request}\n\nPlazo de respuesta: 15 días hábiles (hasta el ${vence}).`;

  return {
    to: p.to,
    subject: p.forCompany ? `📕 Nueva hoja ${p.sheet} · vence ${vence}` : `Copia de tu ${p.kind} · hoja ${p.sheet}`,
    html, text, template: p.forCompany ? 'claim_internal' : 'claim_copy', ref: p.sheet,
  };
}
