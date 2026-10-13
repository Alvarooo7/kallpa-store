'use client';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { prizeLabel, type Prize } from '@/lib/rewards';

/** Distancia (px) que hay que bajar la carta para activarla. */
const ARM = 110;
const BACKS = ['sand', 'sage', 'ember', 'clay', 'ink'];
/** Puntos que suma el "poder" a la probabilidad de la carta activada (lo aplica el servidor). */
export const PICK_BOOST = 2;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const prizeName = (prize: Prize) => prize.amount ? `S/ ${prize.amount} de descuento` : prizeLabel(prize, 'style');

/**
 * Cartas de premio: se eligen deslizando o con "Girar" (ruleta). La carta elegida recibe un
 * poder que la ilumina y suma PICK_BOOST puntos a su premio; se activa arrastrándola al brillo
 * o tocándola. El sorteo lo hace el servidor.
 */
export function RewardDeck({ prizes, activating, ready, disabled, onActivate, onTerms }: { prizes: Prize[]; activating: boolean; ready: boolean; disabled: boolean; onActivate: (pick: string) => void; onTerms: () => void }) {
  const count = prizes.length;
  const [active, setActive] = useState(0);
  const [pull, setPull] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(false);
  const gesture = useRef<{ x: number; y: number; mode: 'none' | 'h' | 'v'; onCard: boolean } | null>(null);
  const pullY = useRef(0);
  const spinTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const locked = disabled || activating || spinning;
  const shift = (direction: number) => { setLanded(false); setActive(value => (value + direction + count) % count); };
  const armed = dragging && pull.y >= ARM;
  const powered = landed || dragging || dropping || activating;
  const reset = () => { pullY.current = 0; setPull({ x: 0, y: 0 }); };

  // Si la activación no arrancó (falta la cuenta), la carta vuelve a su sitio.
  useEffect(() => {
    if (!dropping || activating) return;
    const timer = setTimeout(() => { setDropping(false); reset(); }, 520);
    return () => clearTimeout(timer);
  }, [dropping, activating]);
  useEffect(() => () => clearTimeout(spinTimer.current), []);

  /** Ruleta: recorre las cartas cada vez más lento y se detiene en una al azar. */
  function spin() {
    if (locked) return;
    const target = Math.floor(Math.random() * count);
    setLanded(false);
    if (reducedMotion()) { setActive(target); setLanded(true); return; }
    const steps = count * 3 + ((target - active + count) % count);
    setSpinning(true);
    let step = 0;
    const tick = () => {
      step++;
      setActive(value => (value + 1) % count);
      if (step >= steps) { setSpinning(false); setLanded(true); return; }
      spinTimer.current = setTimeout(tick, 55 + 330 * (step / steps) ** 3);
    };
    spinTimer.current = setTimeout(tick, 55);
  }
  function activate() {
    if (locked) return;
    if (!ready) { reset(); onActivate(prizes[active].id); return; }
    setDropping(true); onActivate(prizes[active].id);
  }
  function down(event: ReactPointerEvent<HTMLDivElement>) {
    if (locked || dropping) return;
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
    // Toque: en la carta elegida la activa; en una lateral la trae al centro.
    if (g.onCard) { activate(); return; }
    const offset = Number((event.target as HTMLElement).closest<HTMLElement>('[data-offset]')?.dataset.offset ?? 0);
    if (offset) shift(Math.sign(offset));
  }

  const title = activating ? 'Activando tu regalo…' : spinning ? 'Girando…' : armed ? `¡Suelta y activa tu poder +${PICK_BOOST}%!` : powered ? '¡Tu carta tiene poder!' : 'Elige tu regalo de bienvenida';
  const hint = activating ? 'Sorteando tu premio de forma segura…' : spinning ? 'La ruleta elige tu carta…' : powered ? 'Arrástrala hacia el brillo o tócala para activarla' : `Gira o desliza para elegir. Tu carta gana un poder de +${PICK_BOOST}%`;
  return <div className={`pull-deck${activating ? ' activating' : ''}${armed ? ' armed' : ''}${spinning ? ' spinning' : ''}${powered && !spinning ? ' powered' : ''}${dragging ? ' dragging' : ''}`}>
    <button type="button" className="pull-terms" onClick={onTerms}>TyC</button>
    <div className="pull-head"><span className="pull-gift" aria-hidden="true">🎁</span><h2 aria-live="polite">{title}</h2></div>
    <div className="pull-stage" role="group" aria-roledescription="carrusel" aria-label={`Premio ${active + 1} de ${count}: ${prizeName(prizes[active])}, ${prizes[active].probability}%`} tabIndex={0}
      onKeyDown={event => {
        if (locked) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); shift(event.key === 'ArrowRight' ? 1 : -1); }
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
      }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { gesture.current = null; setDragging(false); reset(); }}>
      <div className="pull-frame" aria-hidden="true" />
      <div className="pull-aura" aria-hidden="true" style={{ transform: `translateX(calc(-50% + ${pull.x}px)) translateY(${dropping || activating ? 300 : pull.y}px)` }}>
        <i className="pull-aura-rays" /><i className="pull-aura-glow" />
        {Array.from({ length: 8 }, (_, index) => <b key={index} style={{ '--spark': index } as CSSProperties} />)}
      </div>
      {prizes.map((prize, index) => {
        let offset = (index - active + count) % count;
        if (offset > count / 2) offset -= count;
        const focused = offset === 0;
        const transform = focused
          ? dropping || activating
            ? 'translateX(-50%) translateY(300px) scale(.55)'
            : `translateX(calc(-50% + ${pull.x}px)) translateY(${pull.y}px) rotate(${pull.x * .08}deg) scale(${1 - pull.y / 1400})`
          : `translateX(calc(-50% + ${offset * 128}px)) translateY(${Math.abs(offset) * 16}px) rotate(${offset * 10}deg) scale(.86)`;
        const lit = focused && powered && !spinning;
        return <div key={prize.id} data-offset={offset} aria-hidden={!focused}
          className={`pull-card back-${BACKS[index % BACKS.length]}${focused ? ' focused' : ''}${focused && dragging ? ' dragging' : ''}${lit ? ' lit' : ''}`}
          style={{ transform, zIndex: 10 - Math.abs(offset), opacity: Math.abs(offset) > 1 || (!focused && (dragging || activating)) || (focused && (dropping || activating)) ? 0 : 1 }}>
          {lit && <span className="pull-power" aria-hidden="true">⚡ +{PICK_BOOST}%</span>}
          <span className="pull-card-brand">Kallpa<i>.</i></span>
          <span className="pull-card-mark" aria-hidden="true">✧</span>
          <span className="pull-card-label">{prize.amount ? <><b>S/ {prize.amount}</b> de descuento</> : prizeLabel(prize, 'style')}</span>
          <small className={`pull-card-odds${lit ? ' boosted' : ''}`}>{lit ? prize.probability + PICK_BOOST : prize.probability}% de probabilidad</small>
        </div>;
      })}
      <div className="pull-chevrons" aria-hidden="true"><i /><i /></div>
      <div className="pull-mouth" aria-hidden="true" />
    </div>
    <p className="pull-hint">{hint}</p>
    <div className="pull-dots" aria-hidden="true">{prizes.map((prize, index) => <i key={prize.id} className={index === active ? 'on' : ''} />)}</div>
    <button type="button" className="pull-spin" disabled={locked} onClick={spin}><span aria-hidden="true">↻</span>{spinning ? 'Girando…' : 'Girar'}</button>
  </div>;
}
