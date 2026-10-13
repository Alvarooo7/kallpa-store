'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from './Providers';
import { CheckoutAccount } from './CheckoutAccount';

/** Inicial o foto de Google de la cuenta. */
export function AccountAvatar({ name, email, avatar, size = 30 }: { name: string; email: string; avatar: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (name || email).trim().charAt(0).toUpperCase();
  // eslint-disable-next-line @next/next/no-img-element -- foto externa de Google, sin optimizar.
  return avatar && !broken ? <img className="account-avatar" src={avatar} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setBroken(true)} />
    : <span className="account-avatar" style={{ width: size, height: size, fontSize: Math.round(size * .42) }} aria-hidden="true">{initial}</span>;
}

/** Botón de cuenta del header: sin sesión abre el acceso; con sesión, el menú de la cuenta. */
export function AccountMenu() {
  const { account, signOut } = useShop();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (login && !node.open) node.showModal();
    if (!login && node.open) node.close();
  }, [login]);
  // Al completar el acceso, el diálogo se cierra solo.
  useEffect(() => { if (account) setLogin(false); }, [account]);

  if (account === undefined) return <span className="ib account-btn" aria-hidden="true"><span className="account-avatar ghost" /></span>;
  if (!account) return <>
    <button type="button" className="ib account-btn" aria-label="Ingresar a mi cuenta" onClick={() => setLogin(true)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-3.6 4.4-5.5 8-5.5s6.5 1.9 8 5.5" /></svg>
    </button>
    <dialog ref={dialog} className="game-auth-dialog account-login" aria-labelledby="account-login-title" onClose={() => setLogin(false)} onCancel={() => setLogin(false)} onKeyDown={event => event.stopPropagation()}>
      <div className="game-account-area">
        <div className="game-auth-heading"><div><span>MI CUENTA</span><h2 id="account-login-title">Ingresa a Kallpa</h2></div><button type="button" className="x" aria-label="Cerrar" onClick={() => setLogin(false)}>×</button></div>
        <p className="game-auth-intro">Revisa tus pedidos y tus premios en un solo lugar.</p>
        {login && <CheckoutAccount popup onAccount={() => {}} beforeRedirect={() => {}} returnPath="/mi-cuenta" />}
      </div>
    </dialog>
  </>;

  return <div className="account-menu" ref={box}>
    <button type="button" className="ib account-btn" aria-label={`Mi cuenta: ${account.email}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(value => !value)}>
      <AccountAvatar {...account} />
    </button>
    {open && <div className="account-dropdown" role="menu">
      <div className="account-dropdown-head"><AccountAvatar {...account} size={38} /><div><b>{account.name || 'Mi cuenta'}</b><span>{account.email}</span></div></div>
      <Link role="menuitem" href="/mi-cuenta" onClick={() => setOpen(false)}>Mi cuenta</Link>
      <Link role="menuitem" href="/mi-cuenta#pedidos" onClick={() => setOpen(false)}>Mis pedidos</Link>
      <Link role="menuitem" href="/mi-cuenta#premios" onClick={() => setOpen(false)}>Mis premios</Link>
      <button type="button" role="menuitem" className="account-signout" onClick={() => { setOpen(false); void signOut(); }}>Cerrar sesión</button>
    </div>}
  </div>;
}
