'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart } from './Art';
import { ProductImage } from './ProductImage';
import { ProductPrice } from './ProductPrice';
import { waLink } from '@/lib/company';
import { useShop } from './Providers';
import { DeliveryPromise } from './DeliveryPromise';
import { money } from '@/lib/format';
import { track } from '@/lib/analytics';
import type { Product, Zone } from '@/lib/types';
import { useEffect } from 'react';

export function ProductDetail({ p, recs }: { p: Product; recs: Product[] }) {
  const { add, isFav, toggleFav } = useShop();
  const [zone, setZone] = useState<Zone>('lima');
  const fav = isFav(p.id);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    track('ViewContent', { content_ids: [p.id], content_name: p.short, value: p.price, currency: 'PEN' });
  }, [p.id, p.short, p.price]);

  return (
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 40 }}>
      <nav aria-label="Ruta" style={{ fontSize: '.8rem', color: 'var(--t2)', marginBottom: 18 }}>
        <Link href="/">Inicio</Link> / <Link href="/#catalogo">Catálogo</Link> / <span style={{ color: 'var(--t)' }}>{p.short}</span>
      </nav>

      <div className="sheet" style={{ width: '100%', boxShadow: 'none' }}>
        <div className="pdp">
          <div className="gal">
            <div className="stage" style={{ background: p.bg }}>
              <button className={`fav${fav ? ' on' : ''}`} style={{ width: 36, height: 36, top: 12, right: 12 }}
                aria-label="Guardar en favoritos" aria-pressed={fav} onClick={() => toggleFav(p.id)}>
                <Heart />
              </button>
              <ProductImage p={p} index={selected} priority />
            </div>
            <div className="th">
              {p.images.map((photo, i) => <button key={photo.src} className={`photo-thumb${selected === i ? ' selected' : ''}`}
                aria-label={`Ver foto ${i + 1} de ${p.short}`} aria-pressed={selected === i} onClick={() => setSelected(i)}>
                <img src={photo.src.replace('.webp', '-thumb.webp')} alt={photo.alt} loading="lazy" />
              </button>)}
            </div>
            <p style={{ fontSize: '.76rem', color: 'var(--t2)', margin: '11px 0 0' }}>
              {p.images.length} fotos del producto. Selecciona una miniatura para ampliarla.
            </p>
            {p.video && <video className="product-video" controls preload="none" poster={p.images[0].src} aria-label={`Video de ${p.short}`}><source src={p.video} type="video/mp4" /><track kind="captions" />Tu navegador no admite este video.</video>}
          </div>

          <div className="det">
            <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--t2)' }}>{p.cat}</span>
            <h1 style={{ fontSize: '1.6rem', margin: '7px 0 9px', lineHeight: 1.18, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{p.name}</h1>
            <div className="rt" style={{ marginBottom: 12 }}>
              Consulta disponibilidad y versión antes de comprar.
            </div>
            <div className="pr" style={{ marginBottom: 16 }}>
              <ProductPrice p={p} />
            </div>

            <div className="seg" role="group" aria-label="Zona de entrega">
              <button className={zone === 'lima' ? 'on' : ''} onClick={() => setZone('lima')}>Lima</button>
              <button className={zone === 'prov' ? 'on' : ''} onClick={() => setZone('prov')}>Provincia</button>
            </div>
            <div style={{ marginBottom: 17 }}><DeliveryPromise zone={zone} /></div>

            {p.priceKnown ? <button className="btn acc block" onClick={() => add(p.id)}>Pedir y pagar al recibir</button> :
              <a className="btn acc block" href={waLink(`Hola, quiero consultar precio y disponibilidad de ${p.short}.`)} target="_blank" rel="noopener noreferrer">Consultar precio y disponibilidad</a>}

            <p className="mini2" style={{ marginTop: 20 }}>{p.description}</p>

            <ul className="ben">{p.ben.map((b) => <li key={b}>{b}</li>)}</ul>

            <div className="klbl">Compatibilidad</div>
            <p className="mini2">{p.compat}</p>

            <div className="klbl">Ficha técnica</div>
            <table className="specs">
              <tbody>{Object.entries(p.specs).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
            </table>
            {p.note && <p className="product-note">{p.note}</p>}
            {p.sources.length > 0 && <details className="product-sources"><summary>Fuentes de la ficha técnica</summary><ul>{p.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul></details>}

            <div className="klbl">Garantía y cambios</div>
            <p className="mini2" style={{ margin: 0 }}>
              {p.warr}{' '}
              <Link href="/legal/cambios" style={{ color: 'var(--acc)', fontWeight: 600, textDecoration: 'underline' }}>
                Ver la política completa
              </Link>
            </p>
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
