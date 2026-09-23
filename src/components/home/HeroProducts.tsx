'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { ProductImage } from '../ProductImage';
import { ProductPrice } from '../ProductPrice';
import { useShop } from '../Providers';

const bits = [1, 2, 4];
const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const portraits = [
  '/hero/vendemia-lucho.webp',
  '/hero/lucho-combination-1.webp',
  '/hero/lucho-combination-2.webp',
  '/hero/lucho-combination-3.webp',
  '/hero/lucho-combination-4.webp',
  '/hero/lucho-combination-5.webp',
  '/hero/vendemia-lucho-equipado.webp',
  '/hero/lucho-combination-7-v2.webp',
];

export function HeroProducts({ products }: { products: Product[] }) {
  const { cart, add, remove, openUI } = useShop();
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [desktop, setDesktop] = useState(false);
  const [ready, setReady] = useState<number[]>([0]);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(min-width: 761px)');
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const selectedMask = products.reduce((mask, p, i) => cart.some(l => l.id === p.id) ? mask | bits[i] : mask, 0);
  const preview = hovered ?? focused;
  const requestedMask = selectedMask | (preview === null ? 0 : bits[preview]);
  const activeMask = ready.includes(requestedMask) ? requestedMask : 0;
  const wearing = products.filter((_, i) => activeMask & bits[i]).map(p => p.short);

  function toggle(p: Product, selected: boolean) {
    setHovered(null);
    setFocused(null);
    if (selected) {
      remove(p.id);
      setAnnouncement(`${p.short} retirado de Lucho y del carrito.`);
    } else {
      add(p.id, 1, { openCart: false, allowQuote: true });
      setAnnouncement(`${p.short} añadido al carrito${p.priceKnown ? '.' : '. Precio por confirmar.'}`);
    }
  }

  return (
    <div className="hero-visual">
      <div className="hero-orange-shape" aria-hidden="true" />
      <div className="hero-model-photo" data-combination={activeMask}>
        {portraits.map((src, mask) => (mask === 0 || (desktop && mask === requestedMask)) && <picture key={src}>
          {mask === 0 && <source media="(max-width: 760px)" srcSet={transparentPixel} />}
          <Image
            src={src} fill loading={mask === 0 ? 'lazy' : 'eager'}
            fetchPriority={mask === 0 ? 'high' : undefined}
            quality={95} sizes="(max-width: 1000px) 50vw, 440px"
            className={`hero-lucho-variant${mask === activeMask ? ' visible' : ''}`}
            aria-hidden={mask !== activeMask}
            alt={mask === activeMask ? `Lucho${wearing.length ? ` usando ${wearing.join(', ')}` : ''}, con polo blanco Kallpa, shorts negros y zapatillas Adidas naranjas` : ''}
            onLoad={() => setReady(previous => previous.includes(mask) ? previous : [...previous, mask])}
          />
        </picture>)}
      </div>
      {products.map((p, i) => {
        const selected = Boolean(selectedMask & bits[i]);
        return <article key={p.id} className={`hero-floating-card hero-floating-card-${i + 1}${selected ? ' selected' : ''}`}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
          onFocus={() => setFocused(i)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null); }}>
          <Link className="hero-product-link" href={`/p/${p.id}`}>
            <div className="hero-floating-photo"><ProductImage p={p} /></div>
            <b>{p.short}</b><span>{p.cat}</span><strong><ProductPrice p={p} /></strong>
          </Link>
          <button type="button" className="hero-product-add" aria-pressed={selected}
            aria-label={`${selected ? 'Quitar' : 'Añadir'} ${p.short} ${selected ? 'de' : 'a'} Lucho y ${selected ? 'del' : 'al'} carrito`}
            onClick={() => toggle(p, selected)}>{selected ? '−' : '+'}</button>
        </article>;
      })}
      <div className="hero-build-hint">
        <span>Arma a Lucho con <b>+</b></span>
        {selectedMask !== 0 && <button type="button" onClick={() => openUI('cart')}>Ver carrito</button>}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  );
}
