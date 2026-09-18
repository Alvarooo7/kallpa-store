'use client';

import Link from 'next/link';
import { Heart } from './Art';
import { ProductImage } from './ProductImage';
import { ProductPrice } from './ProductPrice';
import { useShop } from './Providers';
import type { Product } from '@/lib/types';

export function ProductCard({ p }: { p: Product }) {
  const { isFav, toggleFav } = useShop();
  const fav = isFav(p.id);

  return (
    <div className="card" style={{ position: 'relative' }}>
      <Link href={`/p/${p.id}`} style={{ display: 'block' }}>
        <div className="tile" style={{ background: p.bg }}>
          {p.flag && <span className={`flag${p.flag === 'Nuevo' ? '' : ' k'}`}>{p.flag}</span>}
          <ProductImage p={p} />
        </div>
        <span className="cat">{p.cat}</span>
        <span className="nm">{p.name}</span>
        <span className="mini2">{p.claim}</span>
        <span className="pr">
          <ProductPrice p={p} />
        </span>
      </Link>
      <button
        className={`fav${fav ? ' on' : ''}`}
        aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        aria-pressed={fav}
        onClick={() => toggleFav(p.id)}
      >
        <Heart />
      </button>
    </div>
  );
}
