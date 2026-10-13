'use client';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** Distancia (px) que hay que bajar la carta para activarla. */
const ARM = 110;
const BACKS = ['sand', 'sage', 'ember', 'clay', 'ink'];

/**
 * Cartas boca abajo: el cliente elige una y la arrastra a la ranura para activarla.
 * La carta elegida es solo la experiencia; el premio lo sortea el servidor al activar.
 */
export function RewardDeck({ count, activating, ready, disabled, onActivate }: { count: number; activating: boolean; ready: boolean; disabled: boolean; onActivate: () => void }) {
  const [active, setActive] = useState(Math.floor(count / 2));
  const [pull, setPull] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dropping, setDropping] = useState(false);
  const gesture = useRef<{ x: number; y: number; mode: 'none' | 'h' | 'v'; onCard: boolean } | null>(null);
  const pullY = useRef(0);
  const shift = (direction: number) => setActive(value => (value + direction + count) % count);
  const armed = dragging && pull.y >= ARM;
  const reset = () => { pullY.current = 0; setPull({ x: 0, y: 0 }); };

  // Si la activación no arrancó (falta cuenta o datos), la carta vuelve a su sitio.
  useEffect(() => {
    if (!dropping || activating) return;
    const timer = setTimeout(() => { setDropping(false); reset(); }, 520);
    return () => clearTimeout(timer);
  }, [dropping, activating]);

  function activate() {
    if (disabled || activating) return;
    if (!ready) { reset(); onActivate(); return; }
    setDropping(true); onActivate();
  }
  function down(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || activating || dropping) return;
    gesture.current = { x: event.clientX, y: event.clientY, mode: 'none', onCard: Boolean((event.target as HTMLElement).closest('.pull-card.focused')) };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (g.mode === 'none') {
      if (g.onCard && dy > 8 && dy > Math.abs(dx)) { g.mode = 'v'; setDragging(true); }
      else if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) g.mode = 'h';
    }
    if (g.mode !== 'v') return;
    const y = Math.max(0, dy);
    pullY.current = y > 200 ? 200 + (y - 200) * .25 : y;
    setPull({ x: dx * .2, y: pullY.current });
  }
  function up(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (g.mode === 'h') { const dx = event.clientX - g.x; if (Math.abs(dx) > 35) shift(dx < 0 ? 1 : -1); return; }
    if (g.mode === 'v') { setDragging(false); if (pullY.current >= ARM) activate(); else reset(); return; }
    const offset = Number((event.target as HTMLElement).closest<HTMLElement>('[data-offset]')?.dataset.offset ?? 0);
    if (offset) shift(Math.sign(offset));
  }

  const title = activating ? 'Activando tu regalo…' : armed ? '¡Suelta para activar tu regalo!' : 'Elige tu carta de bienvenida';
  return <div className={`pull-deck${activating ? ' activating' : ''}${armed ? ' armed' : ''}`}>
    <div className="pull-head"><span className="pull-gift" aria-hidden="true">🎁</span><h2 aria-live="polite">{title}</h2></div>
    <div className="pull-stage" role="group" aria-roledescription="carrusel" aria-label={`Carta ${active + 1} de ${count}`} tabIndex={0}
      onKeyDown={event => {
        if (disabled || activating) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); shift(event.key === 'ArrowRight' ? 1 : -1); }
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
      }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { gesture.current = null; setDragging(false); reset(); }}>
      <div className="pull-frame" aria-hidden="true" />
      {Array.from({ length: count }, (_, index) => {
        let offset = (index - active + count) % count;
        if (offset > count / 2) offset -= count;
        const focused = offset === 0;
        const transform = focused
          ? dropping || activating
            ? 'translateX(-50%) translateY(300px) scale(.55)'
            : `translateX(calc(-50% + ${pull.x}px)) translateY(${pull.y}px) rotate(${pull.x * .08}deg) scale(${1 - pull.y / 1400})`
          : `translateX(calc(-50% + ${offset * 128}px)) translateY(${Math.abs(offset) * 16}px) rotate(${offset * 10}deg) scale(.86)`;
        return <div key={index} data-offset={offset} aria-hidden={!focused}
          className={`pull-card back-${BACKS[index % BACKS.length]}${focused ? ' focused' : ''}${focused && dragging ? ' dragging' : ''}`}
          style={{ transform, zIndex: 10 - Math.abs(offset), opacity: Math.abs(offset) > 1 || (!focused && (dragging || activating)) || (focused && (dropping || activating)) ? 0 : 1 }}>
          <span className="pull-card-brand">Kallpa<i>.</i></span>
          <span className="pull-card-mark" aria-hidden="true">?</span>
          <span className="pull-card-label">Carta sorpresa</span>
          <small>N.º {index + 1}</small>
        </div>;
      })}
      <div className="pull-chevrons" aria-hidden="true"><i /><i /></div>
      <div className="pull-mouth" aria-hidden="true" />
    </div>
    <p className="pull-hint">{activating ? 'Sorteando tu premio de forma segura…' : 'Arrastra la carta hacia el brillo para activarla'}</p>
    <div className="pull-dots" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index} className={index === active ? 'on' : ''} />)}</div>
    <button type="button" className="pull-alt" disabled={disabled || activating} onClick={activate}>{activating ? 'Activando…' : 'Activar esta carta'}</button>
    <p className="gift-disclaimer">La carta que eliges no cambia las probabilidades: el sorteo se realiza al activarla.</p>
  </div>;
}
