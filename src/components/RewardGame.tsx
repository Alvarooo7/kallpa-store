'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { accountHeaders } from '@/lib/auth-browser';
import { TIERS, type RewardFamily, type WelcomeReward } from '@/lib/rewards';
import { toE164Pe } from '@/lib/validation';
import { RewardDeck } from './RewardDeck';
import { CheckoutAccount } from './CheckoutAccount';

export function RewardGame({ embedded = false, beforeRedirect, onReward, onAccount }: { embedded?: boolean; beforeRedirect?: () => void; onReward?: (reward: WelcomeReward) => void; onAccount?: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [family, setFamily] = useState<RewardFamily>('style');
  const [result, setResult] = useState<WelcomeReward | null>(null);
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<string>();
  const [showAccount, setShowAccount] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const epoch = useRef(0);
  const callback = useRef(onReward); callback.current = onReward;
  const accountCallback = useRef(onAccount); accountCallback.current = onAccount;
  const controls = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
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
  const accountChanged = useCallback((value: string) => { setEmail(value); accountCallback.current?.(value); }, []);
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
    void request(false).then(data => { if (version === epoch.current) { setResult(data); callback.current?.(data); if (data.name) setName(data.name); if (data.phone) setPhone(data.phone); } }).catch(error => { if (version === epoch.current) setMessage(error.message); });
    return () => { epoch.current++; };
  }, [email]);
  async function play() {
    if (lock.current) return;
    if (!email || name.trim().length < 3 || !toE164Pe(phone)) {
      setShowAccount(true); setMessage('Completa tu cuenta, nombre y celular para guardar tu premio. No necesitas comprar ni pagar para girar.');
      return;
    }
    setShowAccount(false);
    lock.current = true; setBusy(true); setSpinning(true); setMessage('');
    const version = epoch.current;
    try {
      const data = await request(true);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(resolve => setTimeout(resolve, 2200));
      setSpinning(false); setSelectedPrize(data.prize);
      if (data.prize && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(resolve => setTimeout(resolve, 650));
      if (version === epoch.current) { setResult(data); callback.current?.(data); }
    } catch (error) { setMessage((error as Error).message); }
    finally { lock.current = false; setBusy(false); setSpinning(false); }
  }
  return <div className="welcome-game">
    <div className="welcome-game-top"><Link href="/" className="gift-card-brand">Kallpa<span>.</span></Link><Link href="/reglas-premios" target="_blank" rel="noopener noreferrer">Reglas ↗</Link></div>
    {!result?.label && <RewardDeck prizes={TIERS[0].prizes} family={family} selectedPrize={selectedPrize} spinning={spinning} disabled={busy || result?.state === 'blocked'} onPlay={() => void play()} />}
    {result?.label && <div className="reward-winner gift-reveal" aria-live="polite"><div className="gift-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${i * 8}%`, animationDelay: `${i * .08}s` }} />)}</div><span>{result.state === 'used' ? 'Ya incluido en tu pedido' : result.state === 'expired' ? 'Tu premio venció' : result.state === 'review' ? 'Premio en revisión' : '¡Este regalo es tuyo!'}</span><h2>{result.label}</h2><p>{result.kind === 'credit' ? 'Se descuenta en esa misma compra, desde S/ 60 en productos antes de este descuento. No se acumula con otros cupones.' : 'Lo recibirás junto con tu compra desde S/ 60 después de descuentos, al pagar el pedido.'}</p>{result.expiresAt && <p>Válido hasta {new Date(result.expiresAt).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}.</p>}<small>Premio: {result.id}</small>{result.state === 'won' && !embedded && <Link className="btn acc block" href="/catalogo">Elegir mi producto y usar mi premio</Link>}</div>}
    <dialog ref={dialog} className="game-auth-dialog" aria-labelledby="game-auth-title" onCancel={() => setShowAccount(false)} onClose={() => setShowAccount(false)} onKeyDown={event => event.stopPropagation()}>
    <div ref={controls} className="game-account-area">
      <div className="game-auth-heading"><div><span>UN PASO MÁS</span><h2 id="game-auth-title">Guarda tu premio</h2></div><button type="button" className="x" aria-label="Cerrar acceso" onClick={() => setShowAccount(false)}>×</button></div>
      <p className="game-auth-intro">Ingresa o crea tu cuenta. Continúas aquí mismo.</p>
      <CheckoutAccount popup onAccount={accountChanged} beforeRedirect={beforeRedirect ?? (() => {})} returnPath={embedded ? '/?checkout=resume' : '/mi-premio'} />
      {email && !result?.label && <fieldset disabled={busy}><legend>¿Para quién guardamos el regalo?</legend><div className="field"><label htmlFor={embedded ? 'gift-name-checkout' : 'gift-name'}>Nombre completo</label><input id={embedded ? 'gift-name-checkout' : 'gift-name'} autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></div><div className="field"><label htmlFor={embedded ? 'gift-phone-checkout' : 'gift-phone'}>Celular de entrega</label><input id={embedded ? 'gift-phone-checkout' : 'gift-phone'} autoComplete="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div><label>Tipo de regalo <select value={family} onChange={e => setFamily(e.target.value as RewardFamily)}><option value="style">Estilo · joyería</option><option value="practical">Práctico · accesorios</option></select></label><button type="button" className="btn acc block" disabled={busy} onClick={() => void play()}>Guardar mis datos y girar</button></fieldset>}
      {result?.label && <button type="button" className="btn acc block" onClick={() => setShowAccount(false)}>Ver mi premio</button>}
      <p role="status" className="game-auth-message">{message}</p>
    </div></dialog>
    {email && <button type="button" className="game-account-link" onClick={() => setShowAccount(true)}>Mi cuenta y mis datos</button>}
    {result?.state === 'blocked' && <p role="alert">Ya hay una participación vinculada a tu cuenta o celular. Si compartes número, escríbenos para revisarlo.</p>}
    {result?.state === 'unavailable' && <p role="status">Estamos reponiendo regalos. Tu giro no se consumió.</p>}
    {!showAccount && <p role="status">{message}</p>}
    <p className="game-terms">Jugar no requiere compra. La participación se valida con tu cuenta y celular según las reglas de la campaña. Tienes 30 días para usar tu premio en una compra desde S/ 60. Sin SMS. <Link href="/legal/privacidad">Privacidad</Link>.</p>
  </div>;
}
