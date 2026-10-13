import Link from 'next/link';
import { RewardGame } from '@/components/RewardGame';
import { TIERS, prizeLabel } from '@/lib/rewards';
export const metadata = { title: 'Mis premios', robots: { index: false } };
const STEPS = [
  ['Elige tu carta', 'Gira la ruleta o desliza entre los premios. Tu carta gana un poder de +2% que la ilumina.'],
  ['Guarda tu premio', 'Solo entra con Google o tu correo. No necesitas comprar ni dejar tus datos para jugar.'],
  ['Úsalo en tu pedido', 'Se suma solo a tu carrito: completas tus datos de entrega al comprar desde S/ 60. Tienes 30 días.'],
];
const PRIZES = TIERS[0].prizes;
const TOP_ODDS = Math.max(...PRIZES.map(prize => prize.probability));
export default function RewardPage() {
  return <div className="standalone-game premio-page">
    <div className="premio-bar"><Link href="/" className="gift-card-brand">Kallpa<span>.</span></Link><nav aria-label="Mi premio"><Link href="/catalogo">Volver a la tienda</Link></nav></div>
    <div className="premio-layout">
      <div className="premio-info">
        <p className="premio-eyebrow">Regalo de bienvenida</p>
        <h1>Elige una carta y llévate un regalo en tu próxima compra.</h1>
        <p className="premio-lede">Una participación por cuenta. Jugar es gratis y el premio se sortea en nuestro servidor al activar tu carta.</p>
        <ol className="premio-steps">{STEPS.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}</ol>
        <section className="premio-odds" aria-labelledby="premio-odds-title">
          <h2 id="premio-odds-title">Premios posibles</h2>
          <p>La carta con poder suma +2% a su premio; los demás bajan en proporción.</p>
          <ul>{PRIZES.map(prize => <li key={prize.id}>
            <span>{prize.amount ? `S/ ${prize.amount} de descuento` : prizeLabel(prize, 'style')}</span>
            <b>{prize.probability}%</b>
            <i aria-hidden="true" style={{ width: `${prize.probability / TOP_ODDS * 100}%` }} />
          </li>)}</ul>
        </section>
      </div>
      <section className="premio-game" aria-label="Juego de premios"><RewardGame /></section>
    </div>
  </div>;
}
