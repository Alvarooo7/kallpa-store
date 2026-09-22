'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart } from './Art';
import { ProductImage } from './ProductImage';
import { ProductPrice } from './ProductPrice';
import { useShop } from './Providers';
import { canAddToCart, selectedAvailability, stockButtonLabel, stockLabel } from '@/lib/availability';
import type { Product, ProductAvailability } from '@/lib/types';

export function ProductCard({ p, availability }: { p: Product; availability: ProductAvailability }) {
  const { add, isFav, toggleFav } = useShop();
  const fav = isFav(p.id);
  const [variantId, setVariantId] = useState(p.variants?.[0]?.id);
  const selectedVariant = p.variants?.find(variant => variant.id === variantId);
  const selectedStock = selectedAvailability(availability, variantId);
  const stockMessage = stockLabel(selectedStock);
  const purchasable = canAddToCart(selectedStock);
  const defaultButtonLabel = p.priceKnown ? 'Agregar al carrito' : 'Agregar para cotizar';

  return (
    <div className="card" style={{ position: 'relative' }}>
      <Link href={`/p/${p.id}`} style={{ display: 'block' }}>
        <div className="tile" style={{ background: selectedVariant?.swatch ?? p.bg }}>
          {p.flag && <span className={`flag${p.flag === 'Nuevo' ? '' : ' k'}`}>{p.flag}</span>}
          <ProductImage p={p} index={selectedVariant?.imageIndex} />
        </div>
        <span className="cat">{p.cat}</span>
        <span className="nm">{p.name}</span>
        <span className="mini2">{p.claim}</span>
        <span className="pr">
          <ProductPrice p={p} variantId={variantId} />
        </span>
        {stockMessage && <span className={`stock-chip ${selectedStock.status}`}>{stockMessage}</span>}
      </Link>
      <button
        className={`fav${fav ? ' on' : ''}`}
        aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        aria-pressed={fav}
        onClick={() => toggleFav(p.id)}
      >
        <Heart />
      </button>
      {p.variants && p.variants.length > 0 && <div className="variant-picker" role="group" aria-label={`Opciones de ${p.short}`}>
        {p.variants.map(variant => <button key={variant.id} type="button" className={variantId === variant.id ? 'on' : ''}
          aria-pressed={variantId === variant.id} onClick={() => setVariantId(variant.id)}>
          {variant.swatch && <i style={{ background: variant.swatch }} />}{variant.label}
        </button>)}
      </div>}
      <button
        type="button"
        className="catalog-add"
        disabled={!purchasable}
        onClick={() => add(p.id, 1, { allowQuote: true, variantId, stockAvailable: selectedStock.available })}
      >
        {stockButtonLabel(selectedStock, defaultButtonLabel)}
      </button>
    </div>
  );
}
