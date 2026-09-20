import { db } from '@/lib/db';

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.MAIL_FROM ?? 'Kallpa <pedidos@example.com>';
const REPLY_TO = process.env.MAIL_REPLY_TO;

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  ref?: string;
};

/**
 * Envía y deja rastro en la tabla `emails`.
 *
 * Nunca lanza: un fallo de correo no puede tumbar un pedido que ya se guardó.
 * Si algo sale mal queda registrado con status 'failed' y el error, para
 * reintentarlo aparte.
 */
export async function sendMail(mail: Mail): Promise<{ ok: boolean; id?: string }> {
  const log = async (status: 'sent' | 'failed', providerId?: string, error?: string) => {
    if (!db) return;
    try {
      const { error: dbError } = await db.from('emails').insert({
        to_email: mail.to, template: mail.template, ref: mail.ref ?? null,
        provider_id: providerId ?? null, status, error: error ?? null,
      });
      if (dbError) throw new Error(dbError.message);
    } catch (e) {
      console.error('[correo] no se pudo registrar el envío', String(e));
    }
  };

  if (!KEY) {
    console.warn('[correo] RESEND_API_KEY ausente — no se envió', mail.template, mail.ref ?? '');
    await log('failed', undefined, 'RESEND_API_KEY ausente');
    return { ok: false };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      console.error('[correo] rechazado', mail.template, res.status, data.message);
      await log('failed', undefined, `${res.status} ${data.message ?? ''}`.trim());
      return { ok: false };
    }

    await log('sent', data.id);
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[correo] fallo de red', mail.template, String(err));
    await log('failed', undefined, String(err));
    return { ok: false };
  }
}
