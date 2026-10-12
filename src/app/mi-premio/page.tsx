import { RewardGame } from '@/components/RewardGame';
export const metadata = { title: 'Mis premios', robots: { index: false } };
export default function RewardPage() {
  return <main className="wrap reward-page"><RewardGame /></main>;
}
