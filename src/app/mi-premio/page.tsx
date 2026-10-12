import Link from 'next/link';
import { RewardGame } from '@/components/RewardGame';
import { TIERS, prizeLabel } from '@/lib/rewards';
export const metadata = { title: 'Mis premios', robots: { index: false } };
const STEPS = [
  ['Explora y gira', 'Desliza las tarjetas para ver los premios. El resultado se decide solo al pulsar Girar.'],
  ['Guarda tu premio', 'Entra con Google o correo y registra tu nombre y celular. No necesitas comprar para jugar.'],
  ['Úsalo en 30 días', 'En una compra desde S/ 60. El regalo físico llega en el mismo paquete.'],
];
const PRIZES = TIERS[0].prizes;
const TOP_ODDS = Math.max(...PRIZES.map(prize => prize.probability));
export default function RewardPage() {
  return <div className="standalone-game premio-page">
    <div className="premio-bar"><Link href="/" className="gift-card-brand">Kallpa<span>.</span></Link><nav aria-label="Mi premio"><Link href="/reglas-premios">Reglas</Link><Link href="/catalogo">Volver a la tienda</Link></nav></div>
    <div className="premio-layout">
      <div className="premio-info">
        <p className="premio-eyebrow">Regalo de bienvenida</p>
        <h1>Gira una vez y llévate un regalo en tu próxima compra.</h1>
        <p className="premio-lede">Una participación por cuenta y celular. Jugar es gratis y el sorteo se realiza en nuestro servidor al pulsar el botón.</p>
        <ol className="premio-steps">{STEPS.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}</ol>
        <section className="premio-odds" aria-labelledby="premio-odds-title">
          <h2 id="premio-odds-title">Premios posibles</h2>
          <ul>{PRIZES.map(prize => <li key={prize.id}>
            <span>{prize.amount ? `S/ ${prize.amount} de descuento` : prizeLabel(prize, 'style')}{!prize.amount && prize.practicalLabel && <small>o {prizeLabel(prize, 'practical').toLowerCase()}</small>}</span>
            <b>{prize.probability}%</b>
            <i aria-hidden="true" style={{ width: `${prize.probability / TOP_ODDS * 100}%` }} />
          </li>)}</ul>
        </section>
      </div>
      <section className="premio-game" aria-label="Juego de premios"><RewardGame /></section>
    </div>
  </div>;
}
