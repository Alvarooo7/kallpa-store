'use client';

import { useEffect, useRef, useState } from 'react';

import { FREE_EXPRESS_FROM } from '@/lib/shipping';
import { useShop } from './Providers';

const COLORS = ['#E85D26', '#111114', '#F3B33D', '#25D366', '#7C5CFC', '#FFFFFF'];

export function FreeExpressCelebration() {
  const { cart, subtotal } = useShop();
  const eligible = cart.length > 0 && subtotal >= FREE_EXPRESS_FROM;
  const wasEligible = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!eligible) {
      wasEligible.current = false;
      return;
    }
    if (wasEligible.current) return;

    wasEligible.current = true;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2400);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  if (!visible) return null;

  return (
    <div className="page-confetti" aria-hidden="true">
      {Array.from({ length: 54 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 47) % 100}%`,
            animationDelay: `${(i % 12) * 0.035}s`,
            animationDuration: `${1.65 + (i % 6) * 0.12}s`,
            background: COLORS[i % COLORS.length],
            ['--drift' as string]: `${((i * 31) % 190) - 95}px`,
            ['--turn' as string]: `${420 + (i % 5) * 150}deg`,
          }}
        />
      ))}
    </div>
  );
}
