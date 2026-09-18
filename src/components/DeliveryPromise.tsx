'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { deliveryPromise, PROVINCE_PROMISE, LIMA_FINE } from '@/lib/delivery';
import type { Zone } from '@/lib/types';

/**
 * El contador corre solo en el cliente. En el servidor pintamos la promesa
 * genérica para que el HTML inicial sea estable y no haya parpadeo raro.
 */
export function DeliveryPromise({ zone = 'lima', showFine = true }: { zone?: Zone; showFine?: boolean }) {
  const [p, setP] = useState<ReturnType<typeof deliveryPromise> | null>(null);

  useEffect(() => {
    setP(deliveryPromise());
    const id = setInterval(() => setP(deliveryPromise()), 1000);
    return () => clearInterval(id);
  }, []);

  const prov = zone === 'prov';
  return (
    <div className="promise">
      <div className="big">{prov ? PROVINCE_PROMISE.big : p?.big ?? 'Delivery gratis en Lima, entrega de 12 a 7 p.m.'}</div>
      <div className="sm">
        {prov ? PROVINCE_PROMISE.small : p?.small ?? 'Corte a las 9 a.m., de lunes a sábado.'}
      </div>
      {showFine && (
        <div className="xs" dangerouslySetInnerHTML={{ __html: prov ? PROVINCE_PROMISE.fine : LIMA_FINE }} />
      )}
    </div>
  );
}

export function CutoffClock() {
  const [p, setP] = useState<ReturnType<typeof deliveryPromise> | null>(null);
  useEffect(() => {
    setP(deliveryPromise());
    const id = setInterval(() => setP(deliveryPromise()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div className="val">{p?.clock ?? '--:--:--'}</div>
      <span className="cap2">{p?.clockCap ?? 'para el próximo corte de las 9 a.m.'}</span>
    </>
  );
}

export function TopBarPromise() {
  const [p, setP] = useState<ReturnType<typeof deliveryPromise> | null>(null);
  const viewport = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, distance: 0 });
  useEffect(() => {
    setP(deliveryPromise());
    const id = setInterval(() => setP(deliveryPromise()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const measure = () => {
      if (viewport.current && text.current) {
        const width = text.current.scrollWidth;
        setScroll({ overflow: width > viewport.current.clientWidth, distance: width + 48 });
      }
    };
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (text.current) observer.observe(text.current);
    measure();
    return () => observer.disconnect();
  }, []);
  const style = { '--delivery-shift': `${-scroll.distance}px`, '--delivery-duration': `${scroll.distance / 28}s` } as CSSProperties;
  return (
    <span className={`top-promise${scroll.overflow ? ' scrolling' : ''}`} style={style}>
      <span ref={viewport} className="top-promise-viewport">
        <span className="top-promise-track">
        <span ref={text} className="top-promise-text">
          <b>{p?.headline ?? 'Delivery GRATIS en Lima, entrega de 12 a 7 p.m.'}</b>{' '}
          <span id="cutTop">{p?.cut ?? '· próximo: --:--:--'}</span>
        </span>
        {scroll.overflow && <span className="top-promise-text top-promise-repeat" aria-hidden="true">
          <b>{p?.headline ?? 'Delivery GRATIS en Lima, entrega de 12 a 7 p.m.'}</b>{' '}
          <span className="delivery-countdown">{p?.cut ?? '· próximo: --:--:--'}</span>
        </span>}
        </span>
      </span>
    </span>
  );
}
