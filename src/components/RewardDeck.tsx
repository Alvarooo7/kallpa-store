'use client';
import { useEffect, useRef, useState } from 'react';
import { prizeLabel, type RewardFamily, type Prize } from '@/lib/rewards';

export function RewardDeck({ prizes, family, spinning, disabled, onPlay, preview=false, selectedPrize }: { prizes: Prize[]; family: RewardFamily; spinning: boolean; disabled: boolean; onPlay: () => void; preview?: boolean; selectedPrize?: string }) {
  const [active, setActive] = useState(0);
  const start = useRef<number | null>(null);
  const shift = (direction: number) => setActive(value => (value + direction + prizes.length) % prizes.length);
  useEffect(() => { if (selectedPrize) { const index = prizes.findIndex(prize => prize.id === selectedPrize); if (index >= 0) setActive(index); } }, [selectedPrize, prizes]);
  useEffect(() => {
    if (!spinning || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setActive(value => (value + 1) % prizes.length), 140);
    return () => clearInterval(timer);
  }, [spinning, prizes.length]);
  return <div className="gift-stage">
    <div className="gift-orbit" aria-hidden="true">🎁</div>
    <p className="gift-eyebrow">{preview?'Vista previa · sin sorteo':'Tu próxima compra, con premio'}</p>
    <h2>{spinning ? 'Descubriendo tu sorpresa…' : 'Explora los premios. Gira por el tuyo.'}</h2>
    <div className="gift-carousel" role="group" aria-label="Explora los premios de tu ruleta" tabIndex={0}
      onKeyDown={e => { if (disabled) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); shift(e.key === 'ArrowRight' ? 1 : -1); } }}
      onPointerDown={e => { start.current=e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerCancel={()=>{start.current=null;}}
      onPointerUp={e => { if (!disabled && start.current!==null && Math.abs(e.clientX-start.current)>35) shift(e.clientX<start.current?1:-1); start.current=null; }}>
      {prizes.map((prize,index) => {
        let offset=(index-active+prizes.length)%prizes.length;
        if(offset>prizes.length/2)offset-=prizes.length;
        return <div key={prize.id} className={`gift-card${offset===0?' focused':''}`} aria-hidden={offset!==0}
          style={{transform:`translateX(calc(-50% + ${offset*138}px)) translateY(${Math.abs(offset)*14}px) rotate(${offset*9}deg) scale(${offset===0?1:.88})`,zIndex:10-Math.abs(offset),opacity:Math.abs(offset)>1?0:1}}>
          <span className="gift-card-brand">Kallpa<span>.</span></span><span className="gift-card-symbol" aria-hidden="true">{prize.amount?'S/':'✧'}</span>
          <strong>{prize.amount ?? prizeLabel(prize,family)}</strong>{prize.amount && <span>de descuento en esta compra</span>}
          <small>{prize.amount?`Compra mínima S/ ${prize.minimum}`:'Un detalle para acompañar tu pedido'}</small>
          <span className="gift-card-odds">{prize.probability}% de probabilidad</span>
        </div>;
      })}
    </div>
    <div className="gift-controls"><button type="button" disabled={disabled} aria-label="Premio anterior" onClick={()=>shift(-1)}>←</button><span>{active+1} / {prizes.length}</span><button type="button" disabled={disabled} aria-label="Premio siguiente" onClick={()=>shift(1)}>→</button></div>
    <div className={`gift-spin-ring${spinning?' running':''}`}><button type="button" className="gift-play" disabled={disabled} onClick={onPlay} aria-label="Girar por mi regalo"><span aria-hidden="true">↻</span>{preview?'Ver':spinning?'Girando…':'Girar'}</button></div>
    <p className="gift-disclaimer">Deslizar muestra los premios, no elige el resultado. El sorteo se realiza al pulsar el botón.</p>
  </div>;
}
