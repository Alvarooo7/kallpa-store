'use client';

import { useRef, useState } from 'react';
import { useShop } from './Providers';
import { DeliveryPromise } from './DeliveryPromise';
import { money } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { Zone } from '@/lib/types';
import { EXPRESS_TIERS, FREE_EXPRESS_FROM, expressFeeForDistrict, expressTierForDistrict, type LimaDeliveryMode } from '@/lib/shipping';
import { COMPANY, waLink } from '@/lib/company';
import { isEmail, toE164Pe } from '@/lib/validation';

export function OrderModal() {
  const { ui, closeUI, cart, subtotal } = useShop();
  const [zone, setZone] = useState<Zone>('lima');
  const [deliveryMode, setDeliveryMode] = useState<LimaDeliveryMode>('scheduled');
  const [district, setDistrict] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [result, setResult] = useState<{ totalCents: number; discountCents: number } | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const on = ui === 'order';
  const isExpress = zone === 'lima' && deliveryMode === 'express';
  const freeExpress = subtotal >= FREE_EXPRESS_FROM;
  const expressFee = isExpress && !freeExpress ? expressFeeForDistrict(district) ?? 0 : 0;
  const expressTier = isExpress ? expressTierForDistrict(district) : null;
  const total = subtotal + expressFee;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    const fd = new FormData(e.currentTarget);
    const fieldValues = (name: string) => String(fd.get(name) ?? '').trim();
    const errors: Record<string, string> = {};
    if (fieldValues('name').length < 3) errors.name = 'Escribe tu nombre completo (mínimo 3 caracteres).';
    if (!toE164Pe(fieldValues('phone'))) errors.phone = 'Ingresa un celular peruano de 9 dígitos que empiece en 9.';
    if (!isEmail(fieldValues('email'))) errors.email = 'Escribe un correo electrónico válido.';
    if (zone === 'lima') {
      if (!fieldValues('district')) errors.district = 'Elige tu distrito.';
      if (!fieldValues('address')) errors.address = 'Ingresa tu dirección y referencia.';
    } else {
      if (!fieldValues('city')) errors.city = 'Ingresa tu ciudad.';
      if (!fieldValues('dni')) errors.dni = 'Ingresa el DNI para el recojo en agencia.';
    }
    if (isExpress && fd.get('expressConsent') !== 'yes') errors.expressConsent = 'Confirma que el pago express se coordina antes del despacho.';
    setFieldErrors(errors);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
      return;
    }
    setSending(true);
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
      coupon: String(fd.get('coupon') ?? '').trim() || undefined,
      items: cart.map(({ id, q, variantId }) => ({ id, q, ...(variantId ? { variantId } : {}) })),
    };

    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await r.json()) as {
        number?: string; error?: string; field?: string; whatsapp?: string;
        totalCents?: number; discountCents?: number;
      };
      if (!r.ok) {
        if (r.status === 400 || r.status === 409) {
          const message = data.error ?? 'Revisa los datos del pedido e inténtalo nuevamente.';
          if (data.field) {
            setFieldErrors({ [data.field]: message });
            formRef.current?.querySelector<HTMLElement>(`[name="${data.field}"]`)?.focus();
          } else {
            setFormError(message);
          }
          return;
        }
        throw new Error(data.error ?? 'No pudimos registrar el pedido');
      }
      track('Lead', { value: total, currency: 'PEN', contents: cart, shipping: expressFee });
      if (data.totalCents != null) setResult({ totalCents: data.totalCents, discountCents: data.discountCents ?? 0 });
      setDone(data.number ?? 'VD-0000');
      if (data.whatsapp) {
        setWhatsapp(data.whatsapp);
        window.location.assign(data.whatsapp);
      }
    } catch {
      setWhatsapp(waLink('Hola Kallpa, intenté hacer un pedido en la web, pero no pude terminar. ¿Me ayudan a confirmarlo?'));
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
                <p className="mini2">No se registró el pedido. Podemos ayudarte a confirmarlo por WhatsApp.</p>
              ) : (
                <>
                  <p className="mini2">Tu pedido <b style={{ color: 'var(--t)' }}>{done}</b> ya está registrado. Continúa en WhatsApp para confirmar la entrega{zone === 'prov' || isExpress ? ' y coordinar el pago anticipado' : ' y pagar al recibir'}.</p>
                  {result && (
                    <div className="sl t" style={{ margin: '2px 0 14px' }}>
                      <span>{result.discountCents > 0 ? 'Total con cupón aplicado' : 'Total'}</span>
                      <span>{money(result.totalCents)}</span>
                    </div>
                  )}
                  {zone === 'prov' ? <DeliveryPromise zone="prov" /> : (
                    <div className="promise">
                      <div className="big">{isExpress ? 'Entrega express solicitada' : 'Entrega programada gratis'}</div>
                      <div className="sm">{isExpress ? `${freeExpress ? 'Express gratis por superar S/ 200.' : `Recargo: ${money(expressFee)}.`} Te confirmamos la hora por WhatsApp.` : 'Te confirmamos la ventana de entrega por WhatsApp.'}</div>
                    </div>
                  )}
                </>
              )}
              {whatsapp && <a className="btn acc block" style={{ marginTop: 14 }} href={whatsapp}>Abrir WhatsApp para confirmar</a>}
              <button className="btn block" style={{ marginTop: 14 }} onClick={closeUI}>Cerrar</button>
            </>
          ) : (
            <>
              <div className="dh" style={{ padding: '0 0 15px', marginBottom: 15 }}>
                <h3>Terminemos tu pedido</h3>
                <button className="x" onClick={closeUI} aria-label="Cerrar">×</button>
              </div>
              <p className="mini2">Cuéntanos dónde lo recibirás. Al confirmar, abrirás WhatsApp con el resumen listo para que te atienda una persona de Kallpa.</p>

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

              <form ref={formRef} onSubmit={submit} noValidate onChange={(event) => {
                const target = event.nativeEvent.target;
                const name = target instanceof HTMLInputElement || target instanceof HTMLSelectElement ? target.name : '';
                if (name && fieldErrors[name]) setFieldErrors((current) => { const next = { ...current }; delete next[name]; return next; });
              }}>
                <div className="field"><label htmlFor="o-name">Nombre completo</label><input id="o-name" name="name" required aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? 'o-name-error' : undefined} placeholder="Como figura en tu DNI" />{fieldErrors.name && <span className="field-error" id="o-name-error">{fieldErrors.name}</span>}</div>
                <div className="field"><label htmlFor="o-phone">Celular con WhatsApp</label><input id="o-phone" name="phone" required inputMode="tel" autoComplete="tel" aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? 'o-phone-error' : undefined} placeholder="9XX XXX XXX" />{fieldErrors.phone && <span className="field-error" id="o-phone-error">{fieldErrors.phone}</span>}</div>
                <div className="field"><label htmlFor="o-email">Correo electrónico</label><input id="o-email" name="email" type="email" required autoComplete="email" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? 'o-email-error' : undefined} placeholder="tucorreo@gmail.com" />{fieldErrors.email && <span className="field-error" id="o-email-error">{fieldErrors.email}</span>}</div>
                <label className="marketing-optin">
                  <input type="checkbox" name="marketingOk" value="yes" />
                  <span>Enviarme novedades y ofertas por correo electrónico.</span>
                </label>

                {zone === 'lima' ? (
                  <>
                    <div className="field">
                      <label htmlFor="o-dist">Distrito</label>
                      <select id="o-dist" name="district" required value={district} aria-invalid={!!fieldErrors.district} aria-describedby={fieldErrors.district ? 'o-dist-error' : undefined} onChange={(event) => setDistrict(event.target.value)}>
                        <option value="" disabled>Elige tu distrito</option>
                        {EXPRESS_TIERS.map(tier => (
                          <optgroup key={tier.fee} label={isExpress ? `${money(tier.fee)} · ${tier.distance}` : `Rango ${tier.distance}`}>
                            {tier.districts.map(name => <option key={name} value={name}>{name}{isExpress ? freeExpress ? ' — express gratis' : ` — ${money(tier.fee)}` : ''}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      {fieldErrors.district && <span className="field-error" id="o-dist-error">{fieldErrors.district}</span>}
                    </div>
                    <div className="field"><label htmlFor="o-addr">Dirección y referencia</label><input id="o-addr" name="address" required aria-invalid={!!fieldErrors.address} aria-describedby={fieldErrors.address ? 'o-addr-error' : undefined} placeholder="Av. ... / al frente de ..." />{fieldErrors.address && <span className="field-error" id="o-addr-error">{fieldErrors.address}</span>}</div>
                    {isExpress && (
                      <div className="shipping-note" aria-live="polite">
                        {district ? <><b>Express a {district}: {freeExpress ? 'gratis' : money(expressFee)}</b><span>{freeExpress ? 'Beneficio activado por superar S/ 200. ' : `Rango ${expressTier?.distance} desde Pueblo Libre. `}El pago del pedido es anticipado; coordinamos el pago, la disponibilidad y la hora por WhatsApp antes del despacho.</span></> : <><b>Express: pago anticipado obligatorio</b><span>{freeExpress ? 'Tu envío express ya es gratis. Selecciona tu distrito.' : 'Selecciona tu distrito para ver el recargo antes de confirmar.'}</span></>}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="field"><label htmlFor="o-city">Ciudad</label><input id="o-city" name="city" required aria-invalid={!!fieldErrors.city} aria-describedby={fieldErrors.city ? 'o-city-error' : undefined} placeholder="Arequipa, Trujillo, Cusco..." />{fieldErrors.city && <span className="field-error" id="o-city-error">{fieldErrors.city}</span>}</div>
                    <div className="field">
                      <label htmlFor="o-ag">Agencia</label>
                      <select id="o-ag" name="agency" defaultValue="Shalom"><option>Shalom</option><option>Olva Courier</option></select>
                    </div>
                    <div className="field"><label htmlFor="o-dni">DNI</label><input id="o-dni" name="dni" required inputMode="numeric" aria-invalid={!!fieldErrors.dni} aria-describedby={fieldErrors.dni ? 'o-dni-error' : undefined} placeholder="La agencia lo pide para entregar" />{fieldErrors.dni && <span className="field-error" id="o-dni-error">{fieldErrors.dni}</span>}</div>
                  </>
                )}

                <div className="field"><label htmlFor="o-cup">Cupón</label><input id="o-cup" name="coupon" placeholder="opcional" aria-invalid={!!fieldErrors.coupon} aria-describedby={fieldErrors.coupon ? 'o-cup-error' : undefined} />{fieldErrors.coupon && <span className="field-error" id="o-cup-error">{fieldErrors.coupon}</span>}</div>

                <div style={{ margin: '16px 0 0' }}>
                  <div className="sl"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  <div className="sl"><span>{zone === 'prov' ? 'Envío a provincia' : isExpress ? 'Envío express' : 'Entrega programada'}</span><span>{isExpress ? district ? freeExpress ? 'Gratis' : money(expressFee) : 'Elige distrito' : 'Gratis'}</span></div>
                  <div className="sl t"><span>Total</span><span>{money(total)}</span></div>
                </div>

                {(zone === 'prov' || isExpress) && <div className="shipping-note" style={{ marginTop: 14 }}>
                  <b>Opciones de pago anticipado</b>
                  <span>Yape o Plin: {COMPANY.yapePlinPhone} · {COMPANY.yapePlinHolder}. También aceptamos transferencia bancaria o tarjeta; coordinamos los datos o el enlace por WhatsApp. Espera nuestra confirmación antes de pagar.</span>
                </div>}

                {isExpress && (
                  <label className="express-consent">
                    <input type="checkbox" name="expressConsent" value="yes" required aria-invalid={!!fieldErrors.expressConsent} />
                    <span><b>Entiendo que el envío express se paga por adelantado.</b> Kallpa me contactará por WhatsApp para coordinar el pago antes de enviar el pedido.</span>
                  </label>
                )}
                {fieldErrors.expressConsent && <span className="field-error">{fieldErrors.expressConsent}</span>}

                {formError && <p className="order-form-error" role="alert">{formError}</p>}

                <button className="btn acc block" style={{ marginTop: 14 }} disabled={sending}>
                  {sending ? 'Registrando…' : zone === 'prov' ? 'Confirmar y coordinar pago por WhatsApp' : isExpress ? 'Confirmar express por WhatsApp' : 'Confirmar por WhatsApp · pago al recibir'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
