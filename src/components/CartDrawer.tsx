'use client';

import { ProductImage } from './ProductImage';
import { waLink } from '@/lib/company';
import { useShop } from './Providers';
import { bySlug, productLineName, productPriceKnown, productUnitPrice, variantById } from '@/lib/catalog';
import { money } from '@/lib/format';
import { FREE_EXPRESS_FROM } from '@/lib/shipping';

export function CartDrawer() {
  const { cart, setQuantity, remove, subtotal, ui, openUI, closeUI } = useShop();
  const on = ui === 'cart';
  const needsQuote = cart.some(l => { const p = bySlug(l.id); return !p || !productPriceKnown(p, l.variantId); });
  const hasConfirmedPrice = cart.some(l => { const p = bySlug(l.id); return Boolean(p && productPriceKnown(p, l.variantId)); });
  const remainingForFreeExpress = Math.max(0, FREE_EXPRESS_FROM - subtotal);
  const freeExpress = cart.length > 0 && remainingForFreeExpress === 0;
  const progress = Math.min(100, (subtotal / FREE_EXPRESS_FROM) * 100);
  const quoteMessage = `Hola Kallpa, quiero confirmar precio y disponibilidad de mi selección: ${cart.map(l => { const p = bySlug(l.id); return `${l.q} × ${p ? productLineName(p, l.variantId) : l.id}`; }).join(', ')}.`;

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
          const variant = variantById(p, l.variantId);
          const unitPrice = productUnitPrice(p, l.variantId);
          const priceKnown = productPriceKnown(p, l.variantId);
          return (
            <div className="li" key={`${l.id}:${l.variantId ?? 'base'}`}>
              <div className="t" style={{ background: variant?.swatch ?? p.bg }}><ProductImage p={p} /></div>
              <div className="li-info">
                <b>{p.short}</b>
                {variant && <span className="q variant-line">{variant.label}</span>}
                <span className="q">{priceKnown ? `${money(unitPrice)} c/u` : 'Consultar precio'}</span>
                <div className="cart-quantity-row">
                  <div className="cart-quantity">
                    <button type="button" aria-label={`Quitar una unidad de ${p.short}`} disabled={l.q <= 1} onClick={() => setQuantity(l.id, l.q - 1, l.variantId)}>−</button>
                    <output aria-label={`Cantidad de ${p.short}`}>{l.q}</output>
                    <button type="button" aria-label={`Agregar una unidad de ${p.short}`} disabled={l.max !== null && l.max !== undefined && l.q >= l.max} onClick={() => setQuantity(l.id, l.q + 1, l.variantId)}>+</button>
                  </div>
                  {l.max !== null && l.max !== undefined && <small className="cart-stock-limit">Máx. {l.max}</small>}
                </div>
                <button className="rm" onClick={() => remove(l.id, l.variantId)}>quitar</button>
              </div>
              <span className="li-total">{priceKnown ? money(unitPrice * l.q) : 'Por confirmar'}</span>
            </div>
          );
        })}
      </div>

      <div className="df">
        {cart.length > 0 && (
          <>
            <div className={`express-goal${freeExpress ? ' reached' : ''}`} role="status" aria-live="polite">
              <div><b>{freeExpress ? '¡Express gratis desbloqueado!' : `Te faltan ${money(remainingForFreeExpress)}`}</b><span>{freeExpress ? 'Tu pedido superó la meta de S/ 200.' : 'para obtener envío express gratis'}</span></div>
              <strong>{Math.round(progress)}%</strong>
              <div className="express-goal-bar"><i style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="tot"><span>{needsQuote && hasConfirmedPrice ? 'Subtotal confirmado' : 'Total'}</span><span>{needsQuote && !hasConfirmedPrice ? 'Por confirmar' : money(subtotal)}</span></div>
            {needsQuote && <p style={{ fontSize: '.8rem', color: 'var(--t2)' }}>Tu selección incluye productos por cotizar. Confirmaremos sus precios y el total antes de tomar el pedido.</p>}
          </>
        )}
        {needsQuote ? <a className="btn acc block" href={waLink(quoteMessage)} target="_blank" rel="noopener noreferrer">Consultar mi selección</a> : <button className="btn acc block" disabled={cart.length === 0} onClick={() => openUI('order')}>
          Continuar con mi pedido
        </button>}
        <span style={{ fontSize: '.76rem', color: 'var(--t2)', textAlign: 'center' }}>
          Programada gratis · express gratis desde S/ 200
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
