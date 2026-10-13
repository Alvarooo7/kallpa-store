'use client';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prizeLabel, type Prize, type RewardFamily } from '@/lib/rewards';

/** Distancia (px) que hay que bajar la carta para activarla. */
const ARM = 110;
const BACKS = ['sand', 'sage', 'ember', 'clay', 'ink'];
/** Puntos que suma la carta arrastrada a la probabilidad de su premio (lo aplica el servidor). */
export const PICK_BOOST = 2;

/**
 * Cartas de premio: el cliente elige una y la arrastra a la ranura para activarla.
 * La carta activada suma PICK_BOOST puntos a su premio; el sorteo lo hace el servidor.
 */
export function RewardDeck({ prizes, family, onFamily, activating, ready, disabled, onActivate }: { prizes: Prize[]; family: RewardFamily; onFamily: (family: RewardFamily) => void; activating: boolean; ready: boolean; disabled: boolean; onActivate: (pick: string) => void }) {
  const count = prizes.length;
  const [active, setActive] = useState(0);
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
    if (!ready) { reset(); onActivate(prizes[active].id); return; }
    setDropping(true); onActivate(prizes[active].id);
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

  const title = activating ? 'Activando tu regalo…' : armed ? `¡Suelta y suma +${PICK_BOOST}% a este premio!` : 'Elige tu regalo de bienvenida';
  return <div className={`pull-deck${activating ? ' activating' : ''}${armed ? ' armed' : ''}`}>
    <div className="pull-head"><span className="pull-gift" aria-hidden="true">🎁</span><h2 aria-live="polite">{title}</h2></div>
    <div className="pull-stage" role="group" aria-roledescription="carrusel" aria-label={`Premio ${active + 1} de ${count}: ${prizes[active].amount ? `S/ ${prizes[active].amount} de descuento` : prizeLabel(prizes[active], family)}, ${prizes[active].probability}%`} tabIndex={0}
      onKeyDown={event => {
        if (disabled || activating) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); shift(event.key === 'ArrowRight' ? 1 : -1); }
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
      }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { gesture.current = null; setDragging(false); reset(); }}>
      <div className="pull-frame" aria-hidden="true" />
      {prizes.map((prize, index) => {
        let offset = (index - active + count) % count;
        if (offset > count / 2) offset -= count;
        const focused = offset === 0;
        const transform = focused
          ? dropping || activating
            ? 'translateX(-50%) translateY(300px) scale(.55)'
            : `translateX(calc(-50% + ${pull.x}px)) translateY(${pull.y}px) rotate(${pull.x * .08}deg) scale(${1 - pull.y / 1400})`
          : `translateX(calc(-50% + ${offset * 128}px)) translateY(${Math.abs(offset) * 16}px) rotate(${offset * 10}deg) scale(.86)`;
        const boosted = focused && (dragging || dropping || activating);
        return <div key={prize.id} data-offset={offset} aria-hidden={!focused}
          className={`pull-card back-${BACKS[index % BACKS.length]}${focused ? ' focused' : ''}${focused && dragging ? ' dragging' : ''}`}
          style={{ transform, zIndex: 10 - Math.abs(offset), opacity: Math.abs(offset) > 1 || (!focused && (dragging || activating)) || (focused && (dropping || activating)) ? 0 : 1 }}>
          <span className="pull-card-brand">Kallpa<i>.</i></span>
          <span className="pull-card-mark" aria-hidden="true">✧</span>
          <span className="pull-card-label">{prize.amount ? <><b>S/ {prize.amount}</b> de descuento</> : prizeLabel(prize, family)}</span>
          <small className={`pull-card-odds${boosted ? ' boosted' : ''}`}>{boosted ? <>{prize.probability + PICK_BOOST}% <em>+{PICK_BOOST}%</em></> : `${prize.probability}% de probabilidad`}</small>
        </div>;
      })}
      <div className="pull-chevrons" aria-hidden="true"><i /><i /></div>
      <div className="pull-mouth" aria-hidden="true" />
    </div>
    <p className="pull-hint">{activating ? 'Sorteando tu premio de forma segura…' : `Arrastra la carta que quieras hacia el brillo: suma +${PICK_BOOST}% a ese premio`}</p>
    <div className="pull-dots" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index} className={index === active ? 'on' : ''} />)}</div>
    <div className="pull-family" role="radiogroup" aria-label="Tipo de regalo físico">
      {([['style', 'Estilo'], ['practical', 'Práctico']] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={family === value} disabled={disabled || activating} onClick={() => onFamily(value)}>{label}</button>)}
    </div>
    <button type="button" className="pull-alt" disabled={disabled || activating} onClick={activate}>{activating ? 'Activando…' : 'Activar esta carta'}</button>
    <p className="gift-disclaimer">La carta que activas suma {PICK_BOOST} puntos a la probabilidad de su premio y los demás bajan en proporción. El sorteo lo realiza nuestro servidor.</p>
  </div>;
}
