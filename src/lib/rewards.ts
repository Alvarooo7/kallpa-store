export type RewardTier = 'sorpresa' | 'plus' | 'premium';
export type RewardFamily = 'style' | 'practical';
export type Prize = { id: string; label: string; practicalLabel?: string; probability: number; amount?: number; minimum?: number };
export const TIERS: { id: RewardTier; label: string; minimum: number; prizes: Prize[] }[] = [
  { id: 'sorpresa', label: 'Sorpresa', minimum: 60, prizes: [
    { id: 'credit5', label: 'Crédito S/ 5', probability: 40, amount: 5, minimum: 60 },
    { id: 'bracelet', label: 'Pulsera sorpresa', practicalLabel: 'Organizadores de cables', probability: 25 },
    { id: 'ring', label: 'Anillo ajustable', practicalLabel: 'Paño + estuche', probability: 20 },
    { id: 'stand', label: 'Soporte para celular', probability: 10 },
    { id: 'necklace', label: 'Collar sorpresa', practicalLabel: 'Accesorio práctico sorpresa', probability: 5 },
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
export type RewardResult = { state: 'eligible' | 'pending' | 'blocked' | 'unavailable' | 'won' | 'reserved' | 'review' | 'expired' | 'used'; tier?: RewardTier; label?: string; kind?: string; code?: string; minimum?: number; expiresAt?: string; error?: string; orders?: RewardOrder[] };
