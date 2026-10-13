'use client';
import Link from 'next/link';
import { useShop } from './Providers';
import { money } from '@/lib/format';
import { REWARD_MINIMUM, rewardCredit, rewardDelivery } from '@/lib/rewards';
export function RewardProgress({ subtotal }: { subtotal: number }) {
  const { closeUI, reward } = useShop();
  if (process.env.NEXT_PUBLIC_REWARDS_ENABLED !== 'true') return null;
  if (reward?.state === 'won') {
    const credit = rewardCredit(reward);
    const missing = Math.max(0, REWARD_MINIMUM - subtotal);
    return <div className={`cart-reward${missing ? '' : ' applied'}`} role="status">
      <span className="cart-reward-icon" aria-hidden="true">🎁</span>
      <div><b>{reward.label}</b><span>{missing ? `Te faltan ${money(missing)} para usar tu premio.` : credit ? 'Premio aplicado a este pedido.' : rewardDelivery(reward) === 'whatsapp' ? 'Gratis · coordinamos tu clase por WhatsApp.' : 'Gratis · va en tu paquete.'}</span></div>
      <strong>{missing ? 'Pendiente' : credit ? `−${money(credit)}` : 'Gratis'}</strong>
    </div>;
  }
  if (reward) return null;
  return <div className="reward-note"><b>🎁 Tu compra puede venir con regalo</b><p>{subtotal < REWARD_MINIMUM ? `Te faltan S/ ${(REWARD_MINIMUM - subtotal).toFixed(2)} para la compra mínima. ` : ''}Juega antes de comprar: el descuento se usa en esta compra y el accesorio va en tu paquete.</p><Link href="/reclama-tu-premio" onClick={closeUI}>Explorar premios y girar →</Link></div>;
}
/** Descuento del premio que el servidor aplicará a este subtotal (en soles). */
export function useRewardDiscount(subtotal: number) {
  const { reward } = useShop();
  const credit = rewardCredit(reward);
  return credit && subtotal >= REWARD_MINIMUM ? credit : 0;
}
