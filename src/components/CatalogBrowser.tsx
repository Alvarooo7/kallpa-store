'use client';
import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';
import { bySlug } from '@/lib/catalog';
import { waLink } from '@/lib/company';
import type { ProductAvailability } from '@/lib/types';

export type CatalogFilter = { key: string; label: string; count: number; href: string; on: boolean };
const norm = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/**
 * Catálogo con los productos en primer plano: búsqueda al instante y filtros plegados tras un
 * botón "Filtros".
 */
export function CatalogBrowser({ title, ids, availability, filters, activeLabel }: { title: string; ids: string[]; availability: Record<string, ProductAvailability>; filters: CatalogFilter[]; activeLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const panelId = useId();
  const products = useMemo(() => ids.map(id => bySlug(id)!).filter(Boolean), [ids]);
  const shown = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) return products;
    return products.filter(product => {
      const hay = norm([product.name, product.short, product.cat, product.claim, ...product.ben].join(' '));
      return words.every(word => hay.includes(word));
    });
  }, [products, query]);
  const toggle = () => setOpen(value => !value);

  return <section className="catalog-results">
    <div className="wrap">
      <header className="catalog-lead">
        <div className="catalog-lead-copy">
          <span className="editorial-kicker">Kallpa / Catálogo</span>
          <h1>{title}</h1>
          <p>Encuentra lo que acompaña tu ritmo: tecnología, entrenamiento y accesorios para cada día.</p>
        </div>
        <div className="catalog-lead-gallery" aria-hidden="true">
          {products.slice(0, 2).map(product => <div className="catalog-lead-photo" key={product.id}><ProductImage p={product} /></div>)}
        </div>
      </header>
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <span className="sr-only">Buscar en el catálogo</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar…" autoComplete="off" />
        </label>
        <button type="button" className={`catalog-filter-btn${open ? ' on' : ''}${activeLabel ? ' active' : ''}`} aria-expanded={open} aria-controls={panelId} onClick={toggle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
          <span>Filtros</span>
          {activeLabel && <b>{activeLabel}</b>}
          <svg className="catalog-filter-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>
      <div id={panelId} className={`catalog-filters${open ? ' on' : ''}`} hidden={!open}>
        <p>Categorías</p>
        <nav className="catalog-tabs" aria-label="Filtrar catálogo por categoría">
          {filters.map(filter => <Link key={filter.key} className={`catalog-tab${filter.on ? ' on' : ''}`} href={filter.href} aria-current={filter.on ? 'page' : undefined} onClick={() => setOpen(false)}>{filter.label} · {filter.count}</Link>)}
        </nav>
      </div>

      <div className="catalog-summary">
        <span>{query ? `${shown.length} de ${products.length}` : `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`}</span>
        {activeLabel && <Link className="catalog-clear" href="/catalogo" aria-label={`Quitar filtro ${activeLabel}`}>{activeLabel} ✕</Link>}
      </div>
      {shown.length
        ? <div className="grid catalog-grid">{shown.map(product => <ProductCard key={product.id} p={product} availability={availability[product.id]} />)}</div>
        : <div className="catalog-empty"><b>No encontramos “{query}”.</b><span>Prueba con otra palabra o <a href={waLink(`Hola Kallpa, busco: ${query}`)} target="_blank" rel="noopener noreferrer">pregúntanos por WhatsApp</a> si lo conseguimos.</span></div>}
    </div>
  </section>;
}
