'use client';

import { ProductImage } from './ProductImage';
import { waLink } from '@/lib/company';
import { useShop } from './Providers';
import { bySlug, FREE_EXPRESS_FROM } from '@/lib/catalog';
import { money } from '@/lib/format';

export function CartDrawer() {
  const { cart, remove, subtotal, missingForFreeExpress, ui, openUI, closeUI } = useShop();
  const on = ui === 'cart';
  const needsQuote = cart.some(l => !bySlug(l.id)?.priceKnown);
  const hasConfirmedPrice = cart.some(l => bySlug(l.id)?.priceKnown);
  const quoteMessage = `Hola Kallpa, quiero confirmar precio y disponibilidad de mi selección: ${cart.map(l => `${l.q} × ${bySlug(l.id)?.short}`).join(', ')}.`;

  return (
    <aside className={`drawer${on ? ' on' : ''}`} aria-hidden={!on}>
      <div className="dh">
        <h3>Tu pedido</h3>
        <button className="x" onClick={closeUI} aria-label="Cerrar">×</button>
      </div>

      <div className="db">
        {cart.length === 0 ? (
          <div className="empty">Tu pedido está vacío.<br />Agrega un equipo y te decimos a qué hora llega.</div>
        ) : cart.map((l) => {
          const p = bySlug(l.id)!;
          return (
            <div className="li" key={l.id}>
              <div className="t" style={{ background: p.bg }}><ProductImage p={p} /></div>
              <div>
                <b>{p.short}</b>
                <span className="q">{l.q} × {p.priceKnown ? money(p.price) : 'Consultar precio'}</span><br />
                <button className="rm" onClick={() => remove(l.id)}>quitar</button>
              </div>
              <span style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{p.priceKnown ? money(p.price * l.q) : 'Por confirmar'}</span>
            </div>
          );
        })}
      </div>

      <div className="df">
        {cart.length > 0 && (
          <>
            {!needsQuote && <div>
              <div className="bar"><i style={{ width: `${Math.min(100, (subtotal / FREE_EXPRESS_FROM) * 100)}%` }} /></div>
              <span style={{ fontSize: '.79rem', color: 'var(--t2)' }}>
                {missingForFreeExpress > 0
                  ? <>Te faltan <b style={{ color: 'var(--t)' }}>{money(missingForFreeExpress)}</b> para el express gratis</>
                  : <>Este pedido lleva <b style={{ color: 'var(--t)' }}>express gratis</b></>}
              </span>
            </div>}
            <div className="tot"><span>{needsQuote && hasConfirmedPrice ? 'Subtotal confirmado' : 'Total'}</span><span>{needsQuote && !hasConfirmedPrice ? 'Por confirmar' : money(subtotal)}</span></div>
            {needsQuote && <p style={{ fontSize: '.8rem', color: 'var(--t2)' }}>Tu selección incluye productos por cotizar. Confirmaremos sus precios y el total antes de tomar el pedido.</p>}
          </>
        )}
        {needsQuote ? <a className="btn acc block" href={waLink(quoteMessage)} target="_blank" rel="noopener noreferrer">Consultar mi selección</a> : <button className="btn acc block" disabled={cart.length === 0} onClick={() => openUI('order')}>
          Continuar con mi pedido
        </button>}
        <span style={{ fontSize: '.76rem', color: 'var(--t2)', textAlign: 'center' }}>
          Delivery gratis de 12 a 7 p.m. · express desde S/ 10 · pagas al recibir
        </span>
      </div>
    </aside>
  );
}

export function FavsDrawer() {
  const { favs, toggleFav, add, ui, closeUI } = useShop();
  const on = ui === 'favs';

  return (
    <aside className={`drawer${on ? ' on' : ''}`} aria-hidden={!on}>
      <div className="dh">
        <h3>Tus favoritos</h3>
        <button className="x" onClick={closeUI} aria-label="Cerrar">×</button>
      </div>
      <div className="db">
        {favs.length === 0 ? (
          <div className="favempty">Todavía no guardaste nada.<br />Toca el corazón de un equipo para tenerlo a mano.</div>
        ) : favs.map((id) => {
          const p = bySlug(id)!;
          return (
            <div className="li" key={id}>
              <div className="t" style={{ background: p.bg }}><ProductImage p={p} /></div>
              <div>
                <b>{p.short}</b>
                <span className="q">{p.priceKnown ? money(p.price) : 'Consultar precio'}</span><br />
                <button className="rm" onClick={() => toggleFav(id)}>quitar</button>
              </div>
              <a className="btn sm acc" href={waLink(`Hola, quiero consultar ${p.short}.`)} target="_blank" rel="noopener noreferrer">Consultar</a>
            </div>
          );
        })}
      </div>
      <div className="df">
        <span style={{ fontSize: '.76rem', color: 'var(--t2)', textAlign: 'center' }}>
          Se guardan en este navegador. Si lo borras, se van.
        </span>
      </div>
    </aside>
  );
}
