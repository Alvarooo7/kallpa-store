'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useShop } from './Providers';
import { AccountAvatar } from './AccountMenu';
import { CheckoutAccount } from './CheckoutAccount';
import { accountHeaders } from '@/lib/auth-browser';
import { waLink } from '@/lib/company';
import { money } from '@/lib/format';
import { REWARD_MINIMUM, rewardCredit, rewardDelivery } from '@/lib/rewards';
import type { AccountOrder } from '@/app/api/account/route';

const STATUS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', paid: 'Pagado', shipped: 'En camino',
  delivered: 'Entregado', cancelled: 'Cancelado', rejected: 'Rechazado',
};
const REWARD_STATE: Record<string, string> = { won: 'Activo', used: 'Usado', expired: 'Vencido', review: 'En revisión' };
const date = (iso: string, options: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString('es-PE', { timeZone: 'America/Lima', ...options });

/** Mi cuenta: perfil, premios y pedidos de la cuenta con sesión. */
export function AccountPage() {
  const { account, reward, signOut } = useShop();
  const [data, setData] = useState<{ phone: string | null; orders: AccountOrder[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null); setError('');
    if (!account) return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/account', { headers: await accountHeaders(), cache: 'no-store' });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? 'No pudimos cargar tus pedidos.');
        if (active) setData(body);
      } catch (failure) { if (active) setError((failure as Error).message); }
    })();
    return () => { active = false; };
  }, [account?.email]);

  if (account === undefined) return <main className="wrap account-page editorial-page"><p className="account-loading">Cargando tu cuenta…</p></main>;
  if (!account) return <main className="wrap account-page editorial-page">
    <div className="account-signin">
      <h1>Mi cuenta</h1>
      <p>Ingresa para ver tus pedidos y tus premios.</p>
      <CheckoutAccount popup onAccount={() => {}} beforeRedirect={() => {}} returnPath="/mi-cuenta" />
    </div>
  </main>;

  const credit = rewardCredit(reward);
  return <main className="wrap account-page editorial-page">
    <section className="account-hero">
      <AccountAvatar {...account} size={56} />
      <div>
        <h1>{account.name || 'Mi cuenta'}</h1>
        <span>{account.email}</span>
        {data?.phone && <span>Celular: {data.phone.replace(/^\+51/, '')}</span>}
      </div>
      <button type="button" className="btn sm out" onClick={() => void signOut()}>Cerrar sesión</button>
    </section>

    <section id="premios" className="account-section">
      <h2>Mis premios</h2>
      {reward?.label ? <div className={`account-reward ${reward.state}`}>
        <span className="account-reward-icon" aria-hidden="true">🎁</span>
        <div>
          <b>{reward.label}</b>
          <small>{reward.state === 'won'
            ? `${credit ? `Se descuenta solo en compras desde S/ ${REWARD_MINIMUM}` : rewardDelivery(reward) === 'whatsapp' ? `Con tu compra desde S/ ${REWARD_MINIMUM} coordinamos tu clase por WhatsApp` : `Va gratis en tu paquete con tu compra desde S/ ${REWARD_MINIMUM}`}${reward.expiresAt ? ` · vence el ${date(reward.expiresAt, { day: 'numeric', month: 'long' })}` : ''}.`
            : reward.state === 'used' ? 'Ya lo usaste en un pedido.' : reward.state === 'expired' ? 'Venció sin usarse.' : 'Lo estamos revisando con tu pedido.'}</small>
        </div>
        <em>{REWARD_STATE[reward.state] ?? reward.state}</em>
        {reward.state === 'won' && <Link className="btn acc sm" href="/catalogo">Hacer mi pedido</Link>}
      </div> : <div className="account-empty">
        <span>Aún no reclamas tu regalo de bienvenida.</span>
        <Link className="btn acc sm" href="/reclama-tu-premio">🎁 ¡Reclama tu Regalo!</Link>
      </div>}
    </section>

    <section id="pedidos" className="account-section">
      <h2>Mis pedidos</h2>
      {error ? <p className="account-error" role="alert">{error}</p>
        : !data ? <p className="account-loading">Cargando pedidos…</p>
        : !data.orders.length ? <div className="account-empty"><span>Todavía no tienes pedidos con este correo.</span><Link className="btn acc sm" href="/catalogo">Ver catálogo</Link></div>
        : <ul className="account-orders">{data.orders.map(order => <li key={order.number}>
          <div className="account-order-head">
            <b>{order.number}</b>
            <span>{date(order.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <em className={`status-${order.status}`}>{STATUS[order.status] ?? order.status}</em>
          </div>
          <ul>{order.items.map((item, index) => <li key={index}>{item.qty} × {item.name}{item.variant ? ` · ${item.variant}` : ''}</li>)}</ul>
          <div className="account-order-foot">
            <span>Total <b>{money(order.totalCents / 100)}</b>{order.discountCents > 0 && <small> · ahorraste {money(order.discountCents / 100)}</small>}</span>
            <a href={waLink(`Hola Kallpa, quiero consultar por mi pedido ${order.number}.`)} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
          </div>
        </li>)}</ul>}
    </section>
  </main>;
}
