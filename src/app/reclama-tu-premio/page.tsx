import Link from 'next/link';
import { RewardGame } from '@/components/RewardGame';
export const metadata = { title: '¡Reclama tu Regalo!', robots: { index: false } };

export default function RewardPage() {
  return <div className="standalone-game premio-page">
    <div className="premio-bar"><Link href="/" className="gift-card-brand">Kallpa<span>.</span></Link><nav aria-label="Mi premio"><Link href="/catalogo">Volver a la tienda</Link></nav></div>
    <main className="premio-layout">
      <section className="premio-game" aria-label="Elige una carta y reclama tu premio"><RewardGame /></section>
    </main>
  </div>;
}
