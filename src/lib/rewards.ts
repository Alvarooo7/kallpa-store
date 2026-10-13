export type RewardTier = 'sorpresa' | 'plus' | 'premium';
export type RewardFamily = 'style' | 'practical';
/** delivery 'whatsapp': no va en el paquete, se coordina por WhatsApp (p. ej. una clase). */
export type Prize = { id: string; label: string; practicalLabel?: string; probability: number; amount?: number; minimum?: number; delivery?: 'whatsapp' };
export const TIERS: { id: RewardTier; label: string; minimum: number; prizes: Prize[] }[] = [
  { id: 'sorpresa', label: 'Sorpresa', minimum: 60, prizes: [
    // Mismo orden y pesos que reward_pool (0016): el sorteo del servidor manda.
    { id: 'credit5', label: 'Crédito S/ 5', probability: 65, amount: 5, minimum: 60 },
    { id: 'bracelet', label: 'Pulsera sorpresa', probability: 10 },
    { id: 'necklace', label: 'Collar sorpresa', probability: 10 },
    { id: 'ring', label: 'Anillo sorpresa', probability: 6 },
    { id: 'perfume', label: 'Perfume decant sorpresa', probability: 6 },
    { id: 'gymbox', label: 'Clase gratis en GymBox', probability: 3, delivery: 'whatsapp' },
  ] },
  { id: 'plus', label: 'Plus', minimum: 120, prizes: [
    { id: 'credit10', label: 'Crédito S/ 10', probability: 30, amount: 10, minimum: 100 },
    { id: 'necklace', label: 'Collar sorpresa', practicalLabel: 'Accesorio práctico sorpresa', probability: 25 },
    { id: 'pack2', label: 'Pack de 2 accesorios', practicalLabel: 'Pack de 2 accesorios prácticos', probability: 25 },
    { id: 'credit15', label: 'Crédito S/ 15', probability: 15, amount: 15, minimum: 150 },
    { id: 'pack3', label: 'Pack de 3 accesorios', practicalLabel: 'Pack de 3 accesorios prácticos', probability: 5 },
  ] },
  { id: 'premium', label: 'Premium', minimum: 230, prizes: [
    { id: 'credit20', label: 'Crédito S/ 20', probability: 35, amount: 20, minimum: 200 },
    { id: 'pack2premium', label: 'Pack de 2 seleccionados', practicalLabel: 'Pack de 2 prácticos seleccionados', probability: 30 },
    { id: 'pack3', label: 'Pack de 3 accesorios', practicalLabel: 'Pack de 3 accesorios prácticos', probability: 25 },
    { id: 'credit30', label: 'Crédito S/ 30', probability: 10, amount: 30, minimum: 300 },
  ] },
];
export function tierForCents(cents: number) {
  return [...TIERS].reverse().find(tier => Number.isFinite(cents) && cents >= tier.minimum * 100) ?? null;
}
export function rewardForRoll(tier: RewardTier, roll: number) {
  if (!Number.isInteger(roll) || roll < 0 || roll >= 100) throw new Error('Invalid roll');
  let boundary = 0;
  return TIERS.find(t => t.id === tier)!.prizes.find(prize => (boundary += prize.probability) > roll)!;
}
export function prizeLabel(prize: Prize, family: RewardFamily) { return family === 'practical' ? prize.practicalLabel ?? prize.label : prize.label; }
export type RewardOrder = { id: number; number: string; status: string; net: number; phone: string | null };
export type WelcomeReward = { id?: string; state: 'eligible' | 'blocked' | 'unavailable' | 'won' | 'used' | 'review' | 'expired'; prize?: string; label?: string; kind?: string; code?: string; minimum?: number; expiresAt?: string; name?: string; phone?: string };
export type RewardResult = { state: 'eligible' | 'pending' | 'blocked' | 'unavailable' | 'won' | 'reserved' | 'review' | 'expired' | 'used'; tier?: RewardTier; label?: string; kind?: string; code?: string; minimum?: number; expiresAt?: string; error?: string; orders?: RewardOrder[] };
/** Soles a descontar por un premio de crédito ganado; 0 si es regalo físico o no está vigente. */
export function rewardCredit(reward: WelcomeReward | null) {
  if (reward?.state !== 'won' || reward.kind !== 'credit') return 0;
  return TIERS[0].prizes.find(prize => prize.id === reward.prize)?.amount ?? 0;
}
export const REWARD_MINIMUM = 60;
/** Cómo recibe el cliente un premio no monetario, según su id o etiqueta. */
export function rewardDelivery(reward: { prize?: string; label?: string } | null | undefined) {
  const prize = TIERS[0].prizes.find(item => item.id === reward?.prize || item.label === reward?.label);
  return prize?.delivery === 'whatsapp' ? 'whatsapp' : 'package';
}
