'use client';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { prizeLabel, type Prize } from '@/lib/rewards';

/** Distancia (px) que hay que bajar la carta para cargarle poder. */
const ARM = 110;
const BACKS = ['sand', 'sage', 'ember', 'clay', 'ink'];
/** Puntos que suma el "poder" a la probabilidad de la carta cargada (lo aplica el servidor). */
export const PICK_BOOST = 2;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const prizeName = (prize: Prize) => prize.amount ? `S/ ${prize.amount} de descuento` : prizeLabel(prize, 'style');

/**
 * Cartas de premio. Arrastrar una carta al brillo (o tocarla) solo le carga el poder +PICK_BOOST%;
 * el premio se sortea en el servidor al pulsar "Girar". Mientras `spinning`, la ruleta gira sin
 * fin; cuando llega `target` (premio sorteado) desacelera, se detiene en él y avisa con onLanded.
 */
export function RewardDeck({ prizes, spinning, target, disabled, onSpin, onLanded, onTerms }: { prizes: Prize[]; spinning: boolean; target: string | null; disabled: boolean; onSpin: (pick: string | null) => void; onLanded: () => void; onTerms: () => void }) {
  const count = prizes.length;
  const [active, setActive] = useState(0);
  const [pull, setPull] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [charging, setCharging] = useState(false);
  const [powered, setPowered] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);
  const gesture = useRef<{ x: number; y: number; mode: 'none' | 'h' | 'v'; onCard: boolean } | null>(null);
  const pullY = useRef(0);
  const position = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const landedCallback = useRef(onLanded); landedCallback.current = onLanded;
  const locked = disabled || spinning || charging;
  const moveTo = (index: number) => { position.current = (index + count) % count; setActive(position.current); };
  const armed = dragging && pull.y >= ARM;
  const reset = () => { pullY.current = 0; setPull({ x: 0, y: 0 }); };

  // Ruleta: gira sin fin mientras el servidor sortea…
  useEffect(() => {
    clearTimeout(timer.current);
    setStopped(false);
    if (!spinning || reducedMotion()) return;
    const loop = () => { moveTo(position.current + 1); timer.current = setTimeout(loop, 70); };
    timer.current = setTimeout(loop, 70);
    return () => clearTimeout(timer.current);
  }, [spinning]);
  // …y al conocer el premio desacelera hasta detenerse exactamente en él.
  useEffect(() => {
    if (!spinning || !target) return;
    const index = prizes.findIndex(prize => prize.id === target);
    clearTimeout(timer.current);
    const finish = () => { setStopped(true); landedCallback.current(); };
    if (index < 0 || reducedMotion()) { if (index >= 0) moveTo(index); finish(); return; }
    const steps = count * 2 + ((index - position.current + count) % count);
    let step = 0;
    const tick = () => {
      step++;
      moveTo(position.current + 1);
      if (step >= steps) { finish(); return; }
      timer.current = setTimeout(tick, 70 + 360 * (step / steps) ** 3);
    };
    timer.current = setTimeout(tick, 70);
    return () => clearTimeout(timer.current);
  }, [target, spinning]);

  /** La carta baja al brillo, se carga y vuelve iluminada. No sortea nada. */
  function charge() {
    if (locked) return;
    const id = prizes[position.current].id;
    if (reducedMotion()) { setPowered(id); reset(); return; }
    setCharging(true);
    timer.current = setTimeout(() => { setPowered(id); setCharging(false); reset(); }, 480);
  }
  function down(event: ReactPointerEvent<HTMLDivElement>) {
    if (locked) return;
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
    if (g.mode === 'h') { const dx = event.clientX - g.x; if (Math.abs(dx) > 35) moveTo(position.current + (dx < 0 ? 1 : -1)); return; }
    if (g.mode === 'v') { setDragging(false); if (pullY.current >= ARM) charge(); else reset(); return; }
    // Toque: en la carta del centro carga el poder; en una lateral la trae al centro.
    if (g.onCard) { charge(); return; }
    const offset = Number((event.target as HTMLElement).closest<HTMLElement>('[data-offset]')?.dataset.offset ?? 0);
    if (offset) moveTo(position.current + Math.sign(offset));
  }

  const focusedPowered = powered === prizes[active].id;
  const title = stopped ? '¡Aquí está tu regalo!' : spinning ? 'Girando…' : charging ? 'Cargando poder…' : armed ? '¡Suelta para cargar el poder!' : powered ? '¡Tu carta tiene poder!' : 'Elige tu regalo de bienvenida';
  const hint = spinning ? 'Sorteando tu premio de forma segura…' : powered ? `Pulsa Girar: tu carta con poder tiene +${PICK_BOOST}% de probabilidad` : `Arrastra una carta al brillo para darle poder +${PICK_BOOST}% y luego pulsa Girar`;
  const auraOn = (focusedPowered && !spinning) || dragging || charging;
  return <div className={`pull-deck${spinning ? ' spinning' : ''}${armed ? ' armed' : ''}${auraOn ? ' powered' : ''}${dragging ? ' dragging' : ''}${stopped ? ' stopped' : ''}`}>
    <button type="button" className="pull-terms" onClick={onTerms}>TyC</button>
    <div className="pull-head"><span className="pull-gift" aria-hidden="true">🎁</span><h2 aria-live="polite">{title}</h2></div>
    <div className="pull-stage" role="group" aria-roledescription="carrusel" aria-label={`Premio ${active + 1} de ${count}: ${prizeName(prizes[active])}, ${prizes[active].probability}%${focusedPowered ? `, con poder +${PICK_BOOST}%` : ''}`} tabIndex={0}
      onKeyDown={event => {
        if (locked) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveTo(position.current + (event.key === 'ArrowRight' ? 1 : -1)); }
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); charge(); }
      }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { gesture.current = null; setDragging(false); reset(); }}>
      <div className="pull-frame" aria-hidden="true" />
      <div className="pull-aura" aria-hidden="true" style={{ transform: `translateX(calc(-50% + ${pull.x}px)) translateY(${charging ? 300 : pull.y}px)` }}>
        <i className="pull-aura-rays" /><i className="pull-aura-glow" />
        {Array.from({ length: 8 }, (_, index) => <b key={index} style={{ '--spark': index } as CSSProperties} />)}
      </div>
      {prizes.map((prize, index) => {
        let offset = (index - active + count) % count;
        if (offset > count / 2) offset -= count;
        const focused = offset === 0;
        const transform = focused
          ? charging
            ? 'translateX(-50%) translateY(300px) scale(.55)'
            : `translateX(calc(-50% + ${pull.x}px)) translateY(${pull.y}px) rotate(${pull.x * .08}deg) scale(${1 - pull.y / 1400})`
          : `translateX(calc(-50% + ${offset * 128}px)) translateY(${Math.abs(offset) * 16}px) rotate(${offset * 10}deg) scale(.86)`;
        const hasPower = powered === prize.id;
        const lit = focused && ((hasPower && !spinning) || stopped);
        return <div key={prize.id} data-offset={offset} aria-hidden={!focused}
          className={`pull-card back-${BACKS[index % BACKS.length]}${focused ? ' focused' : ''}${focused && dragging ? ' dragging' : ''}${lit ? ' lit' : ''}`}
          style={{ transform, zIndex: 10 - Math.abs(offset), opacity: Math.abs(offset) > 1 || (!focused && dragging) || (focused && charging) ? 0 : 1 }}>
          {hasPower && <span className="pull-power" aria-hidden="true">⚡ +{PICK_BOOST}%</span>}
          <span className="pull-card-brand">Kallpa<i>.</i></span>
          <span className="pull-card-mark" aria-hidden="true">✧</span>
          <span className="pull-card-label">{prize.amount ? <><b>S/ {prize.amount}</b> de descuento</> : prizeLabel(prize, 'style')}</span>
          <small className={`pull-card-odds${hasPower ? ' boosted' : ''}`}>{hasPower ? prize.probability + PICK_BOOST : prize.probability}% de probabilidad</small>
        </div>;
      })}
      <div className="pull-chevrons" aria-hidden="true"><i /><i /></div>
      <div className="pull-mouth" aria-hidden="true" />
    </div>
    <p className="pull-hint">{hint}</p>
    <div className="pull-dots" aria-hidden="true">{prizes.map((prize, index) => <i key={prize.id} className={index === active ? 'on' : ''} />)}</div>
    <button type="button" className="pull-spin" disabled={locked} onClick={() => onSpin(powered)}><span aria-hidden="true">↻</span>{spinning ? 'Girando…' : 'Girar'}</button>
  </div>;
}
