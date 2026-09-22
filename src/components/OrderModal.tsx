'use client';

import { useState } from 'react';
import { useShop } from './Providers';
import { DeliveryPromise } from './DeliveryPromise';
import { money } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { Zone } from '@/lib/types';
import { EXPRESS_TIERS, FREE_EXPRESS_FROM, expressFeeForDistrict, expressTierForDistrict, type LimaDeliveryMode } from '@/lib/shipping';

export function OrderModal() {
  const { ui, closeUI, cart, subtotal } = useShop();
  const [zone, setZone] = useState<Zone>('lima');
  const [deliveryMode, setDeliveryMode] = useState<LimaDeliveryMode>('scheduled');
  const [district, setDistrict] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const on = ui === 'order';
  const isExpress = zone === 'lima' && deliveryMode === 'express';
  const freeExpress = subtotal >= FREE_EXPRESS_FROM;
  const expressFee = isExpress && !freeExpress ? expressFeeForDistrict(district) ?? 0 : 0;
  const expressTier = isExpress ? expressTierForDistrict(district) : null;
  const total = subtotal + expressFee;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      zone,
      isExpress,
      customer: {
        name: String(fd.get('name') ?? ''),
        phone: String(fd.get('phone') ?? ''),
        email: String(fd.get('email') ?? ''),
        marketingOk: fd.get('marketingOk') === 'yes',
      },
      shipping: zone === 'lima'
        ? { district: String(fd.get('district') ?? ''), address: String(fd.get('address') ?? '') }
        : { city: String(fd.get('city') ?? ''), agency: String(fd.get('agency') ?? ''), dni: String(fd.get('dni') ?? '') },
      coupon: String(fd.get('coupon') ?? ''),
      items: cart.map(({ id, q, variantId }) => ({ id, q, ...(variantId ? { variantId } : {}) })),
    };

    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await r.json()) as { number?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? 'No pudimos registrar el pedido');
      track('Purchase', { value: total, currency: 'PEN', contents: cart, shipping: expressFee });
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
                  {zone === 'prov' ? <DeliveryPromise zone="prov" /> : (
                    <div className="promise">
                      <div className="big">{isExpress ? 'Entrega express solicitada' : 'Entrega programada gratis'}</div>
                      <div className="sm">{isExpress ? `${freeExpress ? 'Express gratis por superar S/ 200.' : `Recargo: ${money(expressFee)}.`} Te confirmamos la hora por WhatsApp.` : 'Te confirmamos la ventana de entrega por WhatsApp.'}</div>
                    </div>
                  )}
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

              {zone === 'prov' ? <div style={{ marginBottom: 17 }}><DeliveryPromise zone="prov" /></div> : (
                <div className="delivery-choice" role="group" aria-label="Tipo de entrega en Lima">
                  <button type="button" className={deliveryMode === 'scheduled' ? 'on' : ''} onClick={() => setDeliveryMode('scheduled')}>
                    <b>Programada · gratis</b>
                    <span>Ventana de 12 a 7 p.m. Pagas al recibir.</span>
                  </button>
                  <button type="button" className={deliveryMode === 'express' ? 'on' : ''} onClick={() => setDeliveryMode('express')}>
                    <b>Express · gratis desde S/ 200</b>
                    <span>Pago anticipado obligatorio. Coordinación por WhatsApp.</span>
                  </button>
                </div>
              )}

              <form onSubmit={submit}>
                <div className="field"><label htmlFor="o-name">Nombre completo</label><input id="o-name" name="name" required placeholder="Como figura en tu DNI" /></div>
                <div className="field"><label htmlFor="o-phone">Celular con WhatsApp</label><input id="o-phone" name="phone" required inputMode="numeric" placeholder="9XX XXX XXX" /></div>
                <div className="field"><label htmlFor="o-email">Correo electrónico</label><input id="o-email" name="email" type="email" required autoComplete="email" placeholder="tucorreo@gmail.com" /></div>
                <label className="marketing-optin">
                  <input type="checkbox" name="marketingOk" value="yes" />
                  <span>Enviarme novedades y ofertas por correo electrónico.</span>
                </label>

                {zone === 'lima' ? (
                  <>
                    <div className="field">
                      <label htmlFor="o-dist">Distrito</label>
                      <select id="o-dist" name="district" required value={district} onChange={(event) => setDistrict(event.target.value)}>
                        <option value="" disabled>Elige tu distrito</option>
                        {EXPRESS_TIERS.map(tier => (
                          <optgroup key={tier.fee} label={isExpress ? `${money(tier.fee)} · ${tier.distance}` : `Rango ${tier.distance}`}>
                            {tier.districts.map(name => <option key={name} value={name}>{name}{isExpress ? freeExpress ? ' — express gratis' : ` — ${money(tier.fee)}` : ''}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="field"><label htmlFor="o-addr">Dirección y referencia</label><input id="o-addr" name="address" required placeholder="Av. ... / al frente de ..." /></div>
                    {isExpress && (
                      <div className="shipping-note" aria-live="polite">
                        {district ? <><b>Express a {district}: {freeExpress ? 'gratis' : money(expressFee)}</b><span>{freeExpress ? 'Beneficio activado por superar S/ 200. ' : `Rango ${expressTier?.distance} desde Pueblo Libre. `}El pago del pedido es anticipado; coordinamos el pago, la disponibilidad y la hora por WhatsApp antes del despacho.</span></> : <><b>Express: pago anticipado obligatorio</b><span>{freeExpress ? 'Tu envío express ya es gratis. Selecciona tu distrito.' : 'Selecciona tu distrito para ver el recargo antes de confirmar.'}</span></>}
                      </div>
                    )}
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
                  <div className="sl"><span>{zone === 'prov' ? 'Envío a provincia' : isExpress ? 'Envío express' : 'Entrega programada'}</span><span>{isExpress ? district ? freeExpress ? 'Gratis' : money(expressFee) : 'Elige distrito' : 'Gratis'}</span></div>
                  <div className="sl t"><span>Total</span><span>{money(total)}</span></div>
                </div>

                {isExpress && (
                  <label className="express-consent">
                    <input type="checkbox" required />
                    <span><b>Entiendo que el envío express se paga por adelantado.</b> Kallpa me contactará por WhatsApp para coordinar el pago antes de enviar el pedido.</span>
                  </label>
                )}

                <button className="btn acc block" style={{ marginTop: 14 }} disabled={sending}>
                  {sending ? 'Registrando…' : zone === 'prov' ? 'Confirmar pedido — pago anticipado' : isExpress ? `Confirmar express · pago anticipado · ${money(total)}` : 'Confirmar — pago al recibir'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
