'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useShop } from './Providers';

/** Inicial o foto de Google de la cuenta. */
export function AccountAvatar({ name, email, avatar, size = 30 }: { name: string; email: string; avatar: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (name || email).trim().charAt(0).toUpperCase();
  // eslint-disable-next-line @next/next/no-img-element -- foto externa de Google, sin optimizar.
  return avatar && !broken ? <img className="account-avatar" src={avatar} alt="" width={size} height={size} style={{ width: size, height: size }} referrerPolicy="no-referrer" onError={() => setBroken(true)} />
    : <span className="account-avatar" style={{ width: size, height: size, fontSize: Math.round(size * .42) }} aria-hidden="true">{initial}</span>;
}

/** "Mi perfil" dentro del menú: sin sesión invita a ingresar; con sesión, la cuenta y sus accesos. */
export function MenuAccount({ onNavigate }: { onNavigate: () => void }) {
  const { account, signOut } = useShop();
  if (account === undefined) return null;
  if (!account) return <div className="mnav-account">
    <Link className="mnav-account-head" href="/mi-cuenta" onClick={onNavigate}>
      <span className="account-avatar ghost" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-3.6 4.4-5.5 8-5.5s6.5 1.9 8 5.5" /></svg>
      </span>
      <span><b>Mi perfil</b><small>Ingresa para ver tus pedidos y premios</small></span>
      <em>Ingresar</em>
    </Link>
  </div>;

  return <div className="mnav-account">
    <Link className="mnav-account-head" href="/mi-cuenta" onClick={onNavigate}>
      <AccountAvatar {...account} size={40} />
      <span><b>{account.name || 'Mi perfil'}</b><small>{account.email}</small></span>
    </Link>
    <nav className="mnav-account-links" aria-label="Mi perfil">
      <Link href="/mi-cuenta" onClick={onNavigate}>Mi cuenta</Link>
      <Link href="/mi-cuenta#pedidos" onClick={onNavigate}>Mis pedidos</Link>
      <Link href="/mi-cuenta#premios" onClick={onNavigate}>Mis premios</Link>
      <button type="button" className="account-signout" onClick={() => { onNavigate(); void signOut(); }}>Cerrar sesión</button>
    </nav>
  </div>;
}
