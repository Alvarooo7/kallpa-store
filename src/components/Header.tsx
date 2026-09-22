'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useShop } from './Providers';
import { TopBarPromise } from './DeliveryPromise';
import { ProductImage } from './ProductImage';
import { PRODUCTS } from '@/lib/catalog';
import { COMPANY, waLink } from '@/lib/company';
import { money } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { MouseEvent } from 'react';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const INDEX = PRODUCTS.map((p) => ({
  p,
  hay: norm([p.name, p.short, p.cat, p.claim, ...p.ben, p.compat, ...Object.entries(p.specs).flat()].join(' ')),
}));

export function Header() {
  const { count, favs, openUI } = useShop();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState('');

  const goToHomeSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    setMenu(false);
    if (window.location.pathname !== '/') return;
    event.preventDefault();
    window.history.pushState(null, '', `/#${sectionId}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hits = useMemo(() => {
    const n = norm(q);
    if (n.length < 2) return null;
    const words = n.split(/\s+/);
    return INDEX.filter((x) => words.every((w) => x.hay.includes(w))).map((x) => x.p);
  }, [q]);

  return (
    <>
      <div className="top">
        <div className="wrap">
          <div className="l">
            <TopBarPromise />
            <span className="sep hide-sm" />
            <Link href="/envios" className="hide-sm">Envíos</Link>
            <span className="sep hide-sm" />
            <Link href="/legal/cambios" className="hide-sm">Garantía</Link>
          </div>
          <div className="r">
            <span className="hide-md">Lima y todo el Perú</span>
            <span className="sep" />
            <a href={waLink('Hola Kallpa, quiero información')} target="_blank" rel="noopener noreferrer">
              {COMPANY.whatsappPretty}
            </a>
          </div>
        </div>
      </div>

      <header className="nav">
        <div className="wrap">
          <Link href="/" className="logo">Kallpa<i>.</i></Link>
          <nav className="main">
            <Link href="/">Inicio</Link>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/#usos" onClick={(event) => goToHomeSection(event, 'usos')}>¿Para qué lo necesitas?</Link>
            <Link href="/#combo" onClick={(event) => goToHomeSection(event, 'combo')}>Smartwatches</Link>
            <Link href="/envios">Envíos</Link>
          </nav>
          <div className="tools">
            <button className={`ib${search ? ' act' : ''}`} aria-label="Buscar" aria-expanded={search}
              onClick={() => { setSearch((v) => !v); setMenu(false); }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </button>
            <button className="ib" aria-label="Favoritos" onClick={() => openUI('favs')}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20s-7-4.6-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.4 12 20 12 20z" /></svg>
              {favs.length > 0 && <span className="bdg">{favs.length}</span>}
            </button>
            <button className="ib" aria-label="Carrito" onClick={() => openUI('cart')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 7h12l-1 12H7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
              <span className="bdg">{count}</span>
            </button>
            <button className="ib burger" aria-label="Menú" aria-expanded={menu}
              onClick={() => { setMenu((v) => !v); setSearch(false); }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </div>

        {search && (
          <div className="spanel on">
            <div className="wrap">
              <div className="box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                <input autoFocus type="search" value={q} placeholder="Busca por nombre, uso o característica…"
                  onChange={(e) => { setQ(e.target.value); if (e.target.value.length > 2) track('Search', { search_string: e.target.value }); }} />
                <button className="x" onClick={() => { setSearch(false); setQ(''); }} aria-label="Cerrar búsqueda">×</button>
              </div>
              <div className="hint">
                {hits === null
                  ? <>Prueba con <b>nadar</b>, <b>batería</b>, <b>GPS</b> o <b>traducir</b>.</>
                  : hits.length
                    ? `${hits.length} ${hits.length === 1 ? 'resultado' : 'resultados'}`
                    : 'Nada con esas palabras. Escríbenos por WhatsApp y te decimos si lo conseguimos.'}
              </div>
              <div className="sres">
                {hits?.map((p) => (
                  <Link key={p.id} href={`/p/${p.id}`} onClick={() => { setSearch(false); setQ(''); }}
                    style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 13, alignItems: 'center', borderTop: '1px solid var(--line)', padding: '11px 4px' }}>
                    <div className="t" style={{ background: p.bg, borderRadius: 8, aspectRatio: '1/1', display: 'grid', placeItems: 'center', color: '#fff' }}><ProductImage p={p} /></div>
                    <div><b>{p.short}</b><span>{p.claim}</span></div>
                    <span className="pz">{p.priceKnown ? money(p.price) : 'Consultar precio'}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {menu && (
          <div className="mnav on">
            <div className="wrap">
              <Link href="/catalogo" onClick={() => setMenu(false)}>Catálogo</Link>
              <Link href="/#usos" onClick={(event) => goToHomeSection(event, 'usos')}>¿Para qué lo necesitas?</Link>
              <Link href="/#diagnostico" onClick={(event) => goToHomeSection(event, 'diagnostico')}>¿Qué quieres resolver?</Link>
              <Link href="/#combo" onClick={(event) => goToHomeSection(event, 'combo')}>Smartwatches</Link>
              <Link href="/envios" onClick={() => setMenu(false)}>Envíos y pagos</Link>
              <div className="foot">
                <button className="btn sm out" onClick={() => { setMenu(false); openUI('lead'); }}>Mi 10% de descuento</button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
