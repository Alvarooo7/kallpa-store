'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { accountHeaders } from '@/lib/auth-browser';
import { REWARD_MINIMUM, TIERS, type WelcomeReward } from '@/lib/rewards';
import { RewardDeck } from './RewardDeck';
import { CheckoutAccount } from './CheckoutAccount';
import { RewardTerms } from './RewardTerms';
import { useShop } from './Providers';

const PRIZES = TIERS[0].prizes;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

export function RewardGame({ embedded = false, beforeRedirect, onReward, onAccount }: { embedded?: boolean; beforeRedirect?: () => void; onReward?: (reward: WelcomeReward) => void; onAccount?: (email: string) => void }) {
  const { cart, openUI, setReward } = useShop();
  const [email, setEmail] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [result, setResult] = useState<WelcomeReward | null>(null);
  const [busy, setBusy] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  // Carta que el cliente soltó antes de ingresar: se activa sola al completar el acceso.
  const pendingPick = useRef<string | null>(null);
  const epoch = useRef(0);
  const callback = useRef(onReward); callback.current = onReward;
  const accountCallback = useRef(onAccount); accountCallback.current = onAccount;
  const dialog = useRef<HTMLDialogElement>(null);
  const ready = Boolean(email);
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
  const accountChanged = useCallback((value: string) => {
    setEmail(value);
    accountCallback.current?.(value);
  }, []);
  const publish = useCallback((data: WelcomeReward) => {
    setResult(data);
    if (data.label) setReward(data);
    callback.current?.(data);
  }, [setReward]);
  async function request(pick?: string) {
    const response = await fetch('/api/rewards', { method: pick ? 'POST' : 'GET', headers: { ...await accountHeaders(), 'Content-Type': 'application/json' }, cache: 'no-store', ...(pick ? { body: JSON.stringify({ family: 'style', pick }) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'No pudimos consultar tu regalo.');
    return data as WelcomeReward;
  }
  useEffect(() => {
    const version = ++epoch.current;
    setResult(null);
    if (!email) return;
    void request().then(data => {
      if (version !== epoch.current) return;
      publish(data);
      setShowAccount(false);
      const pick = pendingPick.current;
      pendingPick.current = null;
      if (data.state === 'eligible' && pick) void play(pick);
      else if (data.state === 'eligible') setMessage('¡Listo! Arrastra la carta que quieras hacia el brillo.');
    }).catch(error => { if (version === epoch.current) setMessage(error.message); });
    return () => { epoch.current++; };
  }, [email]);
  async function play(pick: string) {
    if (lock.current) return;
    if (!email) {
      pendingPick.current = pick;
      setShowAccount(true);
      setMessage('Ingresa con Google o tu correo y tu carta se activa al instante. Jugar no requiere compra.');
      return;
    }
    lock.current = true; setBusy(true); setActivating(true); setMessage('');
    const version = epoch.current;
    try {
      // El "activando" dura lo mismo aunque el servidor responda al instante.
      const [data] = await Promise.all([request(pick), wait(1900)]);
      if (version === epoch.current) publish(data);
    } catch (error) { setMessage((error as Error).message); }
    finally { lock.current = false; setBusy(false); setActivating(false); }
  }
  const prize = PRIZES.find(item => item.id === result?.prize);
  const credit = result?.kind === 'credit';
  const expires = result?.expiresAt ? new Date(result.expiresAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'long' }) : '';
  return <div className="welcome-game">
    <div className="welcome-game-top"><Link href="/" className="gift-card-brand">Kallpa<span>.</span></Link></div>
    {!result?.label && <RewardDeck prizes={PRIZES} onTerms={() => setShowTerms(true)} activating={activating} ready={ready} disabled={busy || result?.state === 'blocked'} onActivate={pick => void play(pick)} />}
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
          <li>Al comprar, completa tus datos de entrega y confirma tu pedido{expires ? ` antes del ${expires}` : ''}.</li>
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
      <p className="game-auth-intro">Ingresa o crea tu cuenta y tu carta se activa aquí mismo. Tus datos de entrega los completas al hacer tu pedido.</p>
      <CheckoutAccount popup onAccount={accountChanged} beforeRedirect={beforeRedirect ?? (() => {})} returnPath={embedded ? '/?checkout=resume' : '/mi-premio'} />
      {result?.label && <button type="button" className="btn acc block" onClick={() => setShowAccount(false)}>Ver mi premio</button>}
      <p role="status" className="game-auth-message">{showAccount ? message : ''}</p>
    </div></dialog>
    {email && <button type="button" className="game-account-link" onClick={() => setShowAccount(true)}>Mi cuenta</button>}
    {result?.state === 'blocked' && <p role="alert">Ya hay una participación vinculada a tu cuenta o celular. Si compartes número, escríbenos para revisarlo.</p>}
    {result?.state === 'unavailable' && <p role="status">Estamos reponiendo regalos. Tu carta no se consumió.</p>}
    {!showAccount && message && <p role="status" className="game-message">{message}</p>}
    <RewardTerms open={showTerms} onClose={() => setShowTerms(false)} />
  </div>;
}
