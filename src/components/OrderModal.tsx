'use client';

import { useState } from 'react';
import { useShop } from './Providers';
import { DeliveryPromise } from './DeliveryPromise';
import { money } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { Zone } from '@/lib/types';

const DISTRITOS = ['Miraflores', 'Surco', 'San Isidro', 'San Miguel', 'Los Olivos', 'Ate', 'Jesús María', 'Lince', 'Magdalena', 'Pueblo Libre'];

export function OrderModal() {
  const { ui, closeUI, cart, subtotal } = useShop();
  const [zone, setZone] = useState<Zone>('lima');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const on = ui === 'order';

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      zone,
      customer: {
        name: String(fd.get('name') ?? ''),
        phone: String(fd.get('phone') ?? ''),
        email: String(fd.get('email') ?? ''),
      },
      shipping: zone === 'lima'
        ? { district: String(fd.get('district') ?? ''), address: String(fd.get('address') ?? '') }
        : { city: String(fd.get('city') ?? ''), agency: String(fd.get('agency') ?? ''), dni: String(fd.get('dni') ?? '') },
      coupon: String(fd.get('coupon') ?? ''),
      items: cart,
    };

    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await r.json()) as { number?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? 'No pudimos registrar el pedido');
      track('Purchase', { value: subtotal, currency: 'PEN', contents: cart });
      setDone(data.number ?? 'VD-0000');
    } catch {
      setDone('error');
    } finally {
      setSending(false);
    }
  }

  if (!on) return null;

  return (
    <div className="modal on" role="dialog" aria-modal="true" aria-label="Confirmar pedido">
      <div className="sheet nr">
        <div style={{ padding: '24px 26px 26px' }}>
          {done ? (
            <>
              <div className="dh" style={{ padding: '0 0 15px', marginBottom: 15 }}>
                <h3>{done === 'error' ? 'No pudimos registrarlo' : '¡Pedido registrado!'}</h3>
                <button className="x" onClick={closeUI}>×</button>
              </div>
              {done === 'error' ? (
                <p className="mini2">Algo falló de nuestro lado. Escríbenos por WhatsApp y lo cerramos ahí mismo, sin que pierdas el pedido.</p>
              ) : (
                <>
                  <p className="mini2">Tu número de pedido es <b style={{ color: 'var(--t)' }}>{done}</b>. Te escribimos por WhatsApp para confirmar la entrega.</p>
                  <DeliveryPromise zone={zone} />
                </>
              )}
              <button className="btn block" style={{ marginTop: 14 }} onClick={closeUI}>Cerrar</button>
            </>
          ) : (
            <>
              <div className="dh" style={{ padding: '0 0 15px', marginBottom: 15 }}>
                <h3>Ingresa tus datos</h3>
                <button className="x" onClick={closeUI} aria-label="Cerrar">×</button>
              </div>

              <div className="seg" role="group" aria-label="Zona de entrega">
                <button type="button" className={zone === 'lima' ? 'on' : ''} onClick={() => setZone('lima')}>Lima</button>
                <button type="button" className={zone === 'prov' ? 'on' : ''} onClick={() => setZone('prov')}>Provincia</button>
              </div>

              <div style={{ marginBottom: 17 }}><DeliveryPromise zone={zone} /></div>

              <form onSubmit={submit}>
                <div className="field"><label htmlFor="o-name">Nombre completo</label><input id="o-name" name="name" required placeholder="Como figura en tu DNI" /></div>
                <div className="field"><label htmlFor="o-phone">Celular con WhatsApp</label><input id="o-phone" name="phone" required inputMode="numeric" placeholder="9XX XXX XXX" /></div>
                <div className="field"><label htmlFor="o-mail">Correo</label><input id="o-mail" name="email" type="email" required placeholder="para enviarte la boleta" /></div>

                {zone === 'lima' ? (
                  <>
                    <div className="field">
                      <label htmlFor="o-dist">Distrito</label>
                      <select id="o-dist" name="district" required defaultValue="">
                        <option value="" disabled>Elige tu distrito</option>
                        {DISTRITOS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="field"><label htmlFor="o-addr">Dirección y referencia</label><input id="o-addr" name="address" required placeholder="Av. ... / al frente de ..." /></div>
                  </>
                ) : (
                  <>
                    <div className="field"><label htmlFor="o-city">Ciudad</label><input id="o-city" name="city" required placeholder="Arequipa, Trujillo, Cusco..." /></div>
                    <div className="field">
                      <label htmlFor="o-ag">Agencia</label>
                      <select id="o-ag" name="agency" defaultValue="Shalom"><option>Shalom</option><option>Olva Courier</option></select>
                    </div>
                    <div className="field"><label htmlFor="o-dni">DNI</label><input id="o-dni" name="dni" required inputMode="numeric" placeholder="La agencia lo pide para entregar" /></div>
                  </>
                )}

                <div className="two">
                  <div className="field" style={{ margin: 0 }}><label htmlFor="o-cup">Cupón</label><input id="o-cup" name="coupon" placeholder="opcional" /></div>
                  <button className="btn out sm" type="button" style={{ height: 44 }}>Aplicar</button>
                </div>

                <div style={{ margin: '16px 0 0' }}>
                  <div className="sl"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  <div className="sl"><span>{zone === 'lima' ? 'Envío en Lima' : 'Envío a provincia'}</span><span>{zone === 'lima' ? 'Incluido' : 'Gratis'}</span></div>
                  <div className="sl t"><span>Total</span><span>{money(subtotal)}</span></div>
                </div>

                <button className="btn acc block" style={{ marginTop: 14 }} disabled={sending}>
                  {sending ? 'Registrando…' : zone === 'lima' ? 'Confirmar — pago al recibir' : 'Ir a pagar — envío gratis'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
