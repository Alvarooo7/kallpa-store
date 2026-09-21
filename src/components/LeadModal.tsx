'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useShop } from './Providers';
import { track } from '@/lib/analytics';

const KEY = 'vd_lead_v1';
const seen = () => {
  try {
    const v = localStorage.getItem(KEY);
    return Boolean(v) && Date.now() - Number(v) < 30 * 24 * 3600 * 1000;
  } catch { return false; }
};
const mark = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignorar */ } };

export function LeadModal() {
  const { ui, openUI, closeUI } = useShop();
  const [code, setCode] = useState<string | null>(null);
  const [mail, setMail] = useState('');
  const [copied, setCopied] = useState(false);
  const on = ui === 'lead';

  // Tres disparadores: tiempo, scroll y salida. Una vez cada 30 días.
  useEffect(() => {
    if (seen()) return;
    let fired = false;
    const fire = () => { if (!fired) { fired = true; mark(); openUI('lead'); } };
    const t = setTimeout(fire, 20000);
    const onScroll = () => {
      if (scrollY / (document.body.scrollHeight - innerHeight) > 0.45) fire();
    };
    const onOut = (e: MouseEvent) => { if (!e.relatedTarget && e.clientY <= 0) fire(); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('mouseout', onOut);
    return () => { clearTimeout(t); removeEventListener('scroll', onScroll); removeEventListener('mouseout', onOut); };
  }, [openUI]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    mark();
    const res = await fetch('/api/leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail }),
    }).then((r) => r.json() as Promise<{ code?: string }>).catch(() => ({ code: undefined }));
    track('Lead', { content_name: 'cupon_10' });
    setCode(res.code ?? 'VD10-0000');
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const field = document.createElement('textarea');
      field.value = code;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!on) return null;

  return (
    <div className="modal on" role="dialog" aria-modal="true" aria-label="Cupón de bienvenida">
      <div className="sheet nr" style={{ width: 'min(620px,100%)' }}>
        <div className="lead">
          <div className="side">
            <div style={{ textAlign: 'center' }}>
              <div className="big">10%</div>
              <small>{code ? 'ya es tuyo' : 'en tu primera compra'}</small>
            </div>
          </div>
          <div className="body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span className="eb">{code ? 'Listo' : 'Solo para nuevos'}</span>
                <h3>{code ? 'Tu cupón está activo' : 'Déjanos tu correo y te mandamos el cupón'}</h3>
              </div>
              <button className="x" onClick={closeUI} aria-label="Cerrar">×</button>
            </div>

            {code ? (
              <>
                <p>Te lo mandamos también a <b style={{ color: 'var(--t)' }}>{mail}</b>. Úsalo en el paso de pago.</p>
                <button className="ok coupon-copy" type="button" onClick={copyCode} aria-label={`Copiar código ${code}`}>
                  <span style={{ fontSize: '.76rem', color: 'var(--t2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Tu código</span>
                  <div className="code">{code}</div>
                  <span className="coupon-copy-help" role="status">{copied ? '✓ Código copiado' : 'Toca para copiar'}</span>
                  <span style={{ fontSize: '.78rem', color: 'var(--t2)' }}>Un solo uso · vence en 7 días</span>
                </button>
                <Link className="btn acc block" href="/catalogo" style={{ marginTop: 14 }} onClick={closeUI}>Ver el catálogo</Link>
              </>
            ) : (
              <>
                <p>Un código de un solo uso, válido 7 días, para cualquier equipo de la tienda. También te avisamos cuando entra stock nuevo — sin spam.</p>
                <form onSubmit={submit}>
                  <div className="field">
                    <label htmlFor="lead-mail">Tu correo</label>
                    <input id="lead-mail" type="email" required placeholder="tucorreo@gmail.com" value={mail} onChange={(e) => setMail(e.target.value)} />
                  </div>
                  <button className="btn acc block" type="submit">Quiero mi 10%</button>
                </form>
                <p className="fine">No compartimos tu correo con nadie. Puedes salirte cuando quieras.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
