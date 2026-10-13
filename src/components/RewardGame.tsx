'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { accountHeaders } from '@/lib/auth-browser';
import { REWARD_MINIMUM, TIERS, type RewardFamily, type WelcomeReward } from '@/lib/rewards';
import { toE164Pe } from '@/lib/validation';
import { RewardDeck } from './RewardDeck';
import { CheckoutAccount } from './CheckoutAccount';
import { useShop } from './Providers';

const PRIZES = TIERS[0].prizes;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

export function RewardGame({ embedded = false, beforeRedirect, onReward, onAccount }: { embedded?: boolean; beforeRedirect?: () => void; onReward?: (reward: WelcomeReward) => void; onAccount?: (email: string) => void }) {
  const { cart, openUI, setReward } = useShop();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [family, setFamily] = useState<RewardFamily>('style');
  const [result, setResult] = useState<WelcomeReward | null>(null);
  const [busy, setBusy] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const epoch = useRef(0);
  const callback = useRef(onReward); callback.current = onReward;
  const accountCallback = useRef(onAccount); accountCallback.current = onAccount;
  const dialog = useRef<HTMLDialogElement>(null);
  const ready = Boolean(email) && name.trim().length >= 3 && Boolean(toE164Pe(phone));
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (showAccount && !node.open) node.showModal();
    if (!showAccount && node.open) node.close();
    if (!showAccount) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [showAccount]);
  const accountChanged = useCallback((value: string, fullName?: string) => {
    setEmail(value);
    if (fullName) setName(current => current || fullName);
    accountCallback.current?.(value);
  }, []);
  const publish = useCallback((data: WelcomeReward) => {
    setResult(data);
    if (data.label) setReward(data);
    callback.current?.(data);
  }, [setReward]);
  async function request(spin: boolean) {
    const response = await fetch('/api/rewards', { method: spin ? 'POST' : 'GET', headers: { ...await accountHeaders(), 'Content-Type': 'application/json' }, cache: 'no-store', ...(spin ? { body: JSON.stringify({ name, phone, family }) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'No pudimos consultar tu regalo.');
    return data as WelcomeReward;
  }
  useEffect(() => {
    const version = ++epoch.current;
    setResult(null);
    if (!email) return;
    void request(false).then(data => {
      if (version !== epoch.current) return;
      publish(data);
      if (data.name) setName(data.name);
      if (data.phone) setPhone(data.phone);
      if (data.label) setShowAccount(false);
    }).catch(error => { if (version === epoch.current) setMessage(error.message); });
    return () => { epoch.current++; };
  }, [email]);
  function saveDetails() {
    if (name.trim().length < 3) { setMessage('Escribe tu nombre completo.'); return; }
    if (!toE164Pe(phone)) { setMessage('Ingresa un celular peruano de 9 dígitos que empiece en 9.'); return; }
    setShowAccount(false);
    setMessage('¡Listo! Ahora arrastra tu carta hacia el brillo para activarla.');
  }
  async function play() {
    if (lock.current) return;
    if (!ready) {
      setShowAccount(true);
      setMessage(email ? 'Completa tu nombre y celular para guardar tu premio.' : 'Ingresa con Google o tu correo para activar tu carta. Jugar no requiere compra.');
      return;
    }
    lock.current = true; setBusy(true); setActivating(true); setMessage('');
    const version = epoch.current;
    try {
      // El "activando" dura lo mismo aunque el servidor responda al instante.
      const [data] = await Promise.all([request(true), wait(1900)]);
      if (version === epoch.current) publish(data);
    } catch (error) { setMessage((error as Error).message); }
    finally { lock.current = false; setBusy(false); setActivating(false); }
  }
  const prize = PRIZES.find(item => item.id === result?.prize);
  const credit = result?.kind === 'credit';
  const expires = result?.expiresAt ? new Date(result.expiresAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'long' }) : '';
  return <div className="welcome-game">
    <div className="welcome-game-top"><Link href="/" className="gift-card-brand">Kallpa<span>.</span></Link><Link href="/reglas-premios" target="_blank" rel="noopener noreferrer">Reglas ↗</Link></div>
    {!result?.label && <RewardDeck count={PRIZES.length} activating={activating} ready={ready} disabled={busy || result?.state === 'blocked'} onActivate={() => void play()} />}
    {result?.label && <div className="pull-reveal" aria-live="polite">
      {result.state === 'won' && <div className="gift-confetti" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i * 6.3) % 100}%`, animationDelay: `${(i % 6) * .12}s` }} />)}</div>}
      <p className="pull-reveal-eyebrow">{result.state === 'used' ? 'Ya incluido en tu pedido' : result.state === 'expired' ? 'Tu premio venció' : result.state === 'review' ? 'Premio en revisión' : '¡Este regalo es tuyo!'}</p>
      <div className={`pull-prize${credit ? ' credit' : ''}`}>
        <span className="pull-card-brand">Kallpa<i>.</i></span>
        {credit && prize?.amount ? <><strong><small>S/</small>{prize.amount}</strong><span>de descuento</span></> : <><span className="pull-prize-mark" aria-hidden="true">✧</span><strong className="gift">{result.label}</strong></>}
        {expires && <small>Válido hasta el {expires}</small>}
      </div>
      {result.state === 'won' && <>
        <h3>Cómo usarlo</h3>
        <ol className="pull-steps">
          <li>{credit ? `Ya está en tu carrito: se descuenta solo en compras desde S/ ${REWARD_MINIMUM}.` : `Ya está en tu carrito: va gratis en tu paquete en compras desde S/ ${REWARD_MINIMUM}.`}</li>
          <li>Confirma tu pedido con este mismo celular{expires ? ` antes del ${expires}` : ''}.</li>
        </ol>
        {!embedded && (cart.length
          ? <button type="button" className="btn acc block pull-cta" onClick={() => openUI('cart')}>Ver mi carrito con el premio</button>
          : <Link className="btn acc block pull-cta" href="/catalogo">Elegir mi producto</Link>)}
      </>}
      <small className="pull-reveal-id">Premio {result.id}</small>
    </div>}
    <dialog ref={dialog} className="game-auth-dialog" aria-labelledby="game-auth-title" onCancel={() => setShowAccount(false)} onClose={() => setShowAccount(false)} onKeyDown={event => event.stopPropagation()}>
    <div className="game-account-area">
      <div className="game-auth-heading"><div><span>UN PASO MÁS</span><h2 id="game-auth-title">Guarda tu premio</h2></div><button type="button" className="x" aria-label="Cerrar acceso" onClick={() => setShowAccount(false)}>×</button></div>
      <p className="game-auth-intro">{email ? 'Último paso: dinos a quién le entregamos el regalo.' : 'Ingresa o crea tu cuenta. Continúas aquí mismo.'}</p>
      <CheckoutAccount popup onAccount={accountChanged} beforeRedirect={beforeRedirect ?? (() => {})} returnPath={embedded ? '/?checkout=resume' : '/mi-premio'} />
      {email && !result?.label && <fieldset disabled={busy}>
        <div className="field"><label htmlFor={embedded ? 'gift-name-checkout' : 'gift-name'}>Nombre completo</label><input id={embedded ? 'gift-name-checkout' : 'gift-name'} autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor={embedded ? 'gift-phone-checkout' : 'gift-phone'}>Celular de entrega</label><input id={embedded ? 'gift-phone-checkout' : 'gift-phone'} autoComplete="tel" inputMode="tel" placeholder="9XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div className="game-family" role="radiogroup" aria-label="Tipo de regalo">
          {([['style', 'Estilo', 'Joyería'], ['practical', 'Práctico', 'Accesorios']] as const).map(([value, title, detail]) => <label key={value} className={family === value ? 'on' : ''}><input type="radio" name={embedded ? 'gift-family-checkout' : 'gift-family'} value={value} checked={family === value} onChange={() => setFamily(value)} /><b>{title}</b><span>{detail}</span></label>)}
        </div>
        <button type="button" className="btn acc block" onClick={saveDetails}>Listo, elegir mi carta</button>
      </fieldset>}
      {result?.label && <button type="button" className="btn acc block" onClick={() => setShowAccount(false)}>Ver mi premio</button>}
      <p role="status" className="game-auth-message">{showAccount ? message : ''}</p>
    </div></dialog>
    {email && <button type="button" className="game-account-link" onClick={() => setShowAccount(true)}>Mi cuenta y mis datos</button>}
    {result?.state === 'blocked' && <p role="alert">Ya hay una participación vinculada a tu cuenta o celular. Si compartes número, escríbenos para revisarlo.</p>}
    {result?.state === 'unavailable' && <p role="status">Estamos reponiendo regalos. Tu carta no se consumió.</p>}
    {!showAccount && message && <p role="status" className="game-message">{message}</p>}
    <p className="game-terms">Jugar no requiere compra. La participación se valida con tu cuenta y celular según las reglas de la campaña. Tienes 30 días para usar tu premio en una compra desde S/ {REWARD_MINIMUM}. Sin SMS. <Link href="/legal/privacidad">Privacidad</Link>.</p>
  </div>;
}
