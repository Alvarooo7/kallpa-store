'use client';
import Link from 'next/link';
import { useShop } from './Providers';
export function RewardProgress({ subtotal }: { subtotal: number }) {
  const { closeUI } = useShop();
  if (process.env.NEXT_PUBLIC_REWARDS_ENABLED !== 'true') return null;
  return <div className="reward-note"><b>🎁 Tu compra puede venir con regalo</b><p>{subtotal < 60 ? `Te faltan S/ ${(60 - subtotal).toFixed(2)} para la compra mínima. ` : ''}Juega antes de comprar: el descuento se usa en esta compra y el accesorio va en tu paquete.</p><Link href="/mi-premio" onClick={closeUI}>Explorar premios y girar →</Link></div>;
}
