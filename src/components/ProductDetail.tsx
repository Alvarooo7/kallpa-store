'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart } from './Art';
import { ProductImage } from './ProductImage';
import { ProductPrice } from './ProductPrice';
import { useShop } from './Providers';
import { DeliveryPromise } from './DeliveryPromise';
import { money } from '@/lib/format';
import { track } from '@/lib/analytics';
import { canAddToCart, selectedAvailability, stockButtonLabel, stockLabel } from '@/lib/availability';
import type { Product, ProductAvailability, Zone } from '@/lib/types';

export function ProductDetail({ p, recs, availability }: { p: Product; recs: Product[]; availability: ProductAvailability }) {
  const { add, isFav, toggleFav } = useShop();
  const [zone, setZone] = useState<Zone>('lima');
  const fav = isFav(p.id);
  const [selected, setSelected] = useState(0);
  const firstAvailableVariant = p.variants?.find(variant => canAddToCart(selectedAvailability(availability, variant.id)));
  const [variantId, setVariantId] = useState(firstAvailableVariant?.id ?? p.variants?.[0]?.id);
  const selectedVariant = p.variants?.find(variant => variant.id === variantId);
  const selectedStock = selectedAvailability(availability, variantId);
  const stockMessage = stockLabel(selectedStock);
  const purchasable = canAddToCart(selectedStock);
  const isNutrition = p.art === 'supplement';

  const selectVariant = (nextVariantId: string) => {
    setVariantId(nextVariantId);
    const nextVariant = p.variants?.find(variant => variant.id === nextVariantId);
    if (nextVariant?.imageIndex !== undefined) setSelected(nextVariant.imageIndex);
  };

  useEffect(() => {
    track('ViewContent', { content_ids: [p.id], content_name: p.short, value: p.price, currency: 'PEN' });
  }, [p.id, p.short, p.price]);

  return (
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <nav aria-label="Ruta" style={{ fontSize: '.8rem', color: 'var(--t2)', marginBottom: 18 }}>
        <Link href="/">Inicio</Link> / <Link href="/catalogo">Catálogo</Link> / <span style={{ color: 'var(--t)' }}>{p.short}</span>
      </nav>

      <div className="sheet" style={{ width: '100%', boxShadow: 'none' }}>
        <div className="pdp">
          <div className="gal">
            <div className="stage" style={{ background: p.images.length > 0 ? p.bg : (selectedVariant?.swatch ?? p.bg) }}>
              <button className={`fav${fav ? ' on' : ''}`} style={{ width: 36, height: 36, top: 12, right: 12 }}
                aria-label="Guardar en favoritos" aria-pressed={fav} onClick={() => toggleFav(p.id)}>
                <Heart />
              </button>
              <ProductImage p={p} index={selected} priority />
            </div>
            {p.images.length > 0 ? <>
              <div className="th">
                {p.images.map((photo, i) => <button key={photo.src} className={`photo-thumb${selected === i ? ' selected' : ''}`}
                  aria-label={`Ver foto ${i + 1} de ${p.short}`} aria-pressed={selected === i} onClick={() => setSelected(i)}>
                  <img src={photo.src.replace('.webp', '-thumb.webp')} alt={photo.alt} loading="lazy" />
                </button>)}
              </div>
              <p style={{ fontSize: '.76rem', color: 'var(--t2)', margin: '11px 0 0' }}>
                {p.images.length} fotos del producto. Selecciona una miniatura para ampliarla.
              </p>
            </> : <p style={{ fontSize: '.76rem', color: 'var(--t2)', margin: '11px 0 0' }}>Foto real pendiente de cargar.</p>}
            {p.video && <video className="product-video" controls preload="none" poster={p.images[0].src} aria-label={`Video de ${p.short}`}><source src={p.video} type="video/mp4" /><track kind="captions" />Tu navegador no admite este video.</video>}
          </div>

          <div className="det">
            <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--t2)' }}>{p.cat}</span>
            <h1 style={{ fontSize: '1.6rem', margin: '7px 0 9px', lineHeight: 1.18, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{p.name}</h1>
            <div className="pr" style={{ marginBottom: 16 }}>
              <ProductPrice p={p} variantId={variantId} />
            </div>
            {stockMessage && <span className={`stock-chip product-stock ${selectedStock.status}`}>{stockMessage}</span>}

            <p className="product-intro">✨ {p.claim}</p>

            {p.variants && p.variants.length > 0 && <div className="product-variants">
              <span className="klbl" style={{ marginTop: 0 }}>Elige {p.variants.some(v => v.flavor) ? 'el sabor' : 'una opción'}</span>
              <div className="variant-picker" role="group" aria-label={`Opciones de ${p.short}`}>
                {p.variants.map(variant => <button key={variant.id} type="button" className={variantId === variant.id ? 'on' : ''}
                  aria-pressed={variantId === variant.id} onClick={() => selectVariant(variant.id)}>
                  {variant.swatch && <i style={{ background: variant.swatch }} />}{variant.label}
                </button>)}
              </div>
              <span className="sr-only" role="status">Opción seleccionada: {selectedVariant?.label}</span>
            </div>}

            <div className="seg" role="group" aria-label="Zona de entrega">
              <button className={zone === 'lima' ? 'on' : ''} onClick={() => setZone('lima')}>Lima</button>
              <button className={zone === 'prov' ? 'on' : ''} onClick={() => setZone('prov')}>Provincia</button>
            </div>
            <div style={{ marginBottom: 17 }}><DeliveryPromise zone={zone} /></div>

            {p.priceKnown ? <button className="btn acc block" disabled={!purchasable} onClick={() => add(p.id, 1, { variantId, stockAvailable: selectedStock.available })}>{stockButtonLabel(selectedStock, 'Pedir y pagar al recibir')}</button> :
              <button className="btn acc block" disabled={!purchasable} onClick={() => add(p.id, 1, { allowQuote: true, variantId, stockAvailable: selectedStock.available })}>{stockButtonLabel(selectedStock, 'Agregar para cotizar')}</button>}

            <ul className="ben">{p.ben.map((b) => <li key={b}>{b}</li>)}</ul>

            <div className="product-disclosures">
              {isNutrition ? <>
                <details open><summary>Sobre el producto</summary><div className="disclosure-content"><p>{p.description}</p></div></details>
                <details><summary>Antes de consumir</summary><div className="disclosure-content"><p>{p.compat}</p></div></details>
                <details><summary>Cambios y devoluciones</summary><div className="disclosure-content"><p>{p.warr}{' '}<Link href="/legal/cambios">Ver la política completa</Link></p></div></details>
              </> : <>
              <details>
                <summary><span aria-hidden="true">🔗</span> Compatibilidad</summary>
                <div className="disclosure-content"><p>{p.compat}</p></div>
              </details>
              <details>
                <summary><span aria-hidden="true">🧾</span> Ficha técnica</summary>
                <div className="disclosure-content">
                  <table className="specs">
                    <tbody>{Object.entries(p.specs).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
                  </table>
                  {p.sources.length > 0 && <div className="product-sources"><b>Fuentes</b><ul>{p.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul></div>}
                </div>
              </details>
              <details>
                <summary><span aria-hidden="true">🛡️</span> Garantía y cambios</summary>
                <div className="disclosure-content">
                  <p>{p.warr}{' '}<Link href="/legal/cambios">Ver la política completa</Link></p>
                </div>
              </details>
              </>}
            </div>
          </div>
        </div>

        <div className="recs">
          <h4>Puede que también te interese</h4>
          <div className="row">
            {recs.map((r) => (
              <Link className="r" key={r.id} href={`/p/${r.id}`}>
                <div className="t" style={{ background: r.bg }}><ProductImage p={r} /></div>
                <div className="c"><b>{r.short}</b><span>{r.cat}</span><br /><strong>{r.priceKnown ? money(r.price) : 'Consultar precio'}</strong></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
