import { TIERS, tierForCents } from '@/lib/rewards';
export function RewardProgress({ subtotal }: { subtotal: number }) {
  if(process.env.NEXT_PUBLIC_REWARDS_ENABLED!=='true')return null;
  const cents=Math.round(subtotal*100);
  const tier=tierForCents(cents);
  const next=TIERS.find(t=>t.minimum*100>cents);
  return <div className="reward-note"><b>{next?`🎁 Te faltan S/ ${(next.minimum-subtotal).toFixed(2)} para ${next.label}`:'🎁 Tu carrito alcanza el nivel Premium'}</b><p>{tier?`Nivel estimado: ${tier.label}. `:''}El monto final después de cupones determina tu ruleta. Un giro por participación elegible, desde tu primera compra.</p></div>;
}
