import { COMPANY, SITE_URL } from '@/lib/company';

/** Envoltura común. Estilos en línea: es lo único que respetan los clientes de correo. */
export function shell(title: string, body: string, footerNote?: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title></head>
<body style="margin:0;padding:24px 12px;background:#F4F4F5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#101112">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">
    <tr><td style="padding:0 0 18px">
      <span style="font-size:20px;font-weight:700;letter-spacing:-.5px">Vendemia<span style="color:#E85D26">.</span></span>
    </td></tr>
    <tr><td style="background:#fff;border:1px solid #E6E6E8;border-radius:14px;padding:26px">
      ${body}
    </td></tr>
    <tr><td style="padding:16px 4px 0;font-size:12px;line-height:1.6;color:#6B7076">
      ${footerNote ? `<p style="margin:0 0 10px">${footerNote}</p>` : ''}
      <p style="margin:0">${COMPANY.legalName} · RUC ${COMPANY.ruc}<br>
      ${COMPANY.address}, ${COMPANY.city}<br>
      WhatsApp ${COMPANY.whatsappPretty} · <a href="${SITE_URL}" style="color:#6B7076">${SITE_URL.replace(/^https?:\/\//, '')}</a></p>
    </td></tr>
  </table>
</body></html>`;
}

export const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#E85D26;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:99px">${label}</a>`;

export const money = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;
