'use client';

import { useState } from 'react';
import { useShop } from './Providers';
import { bySlug } from '@/lib/catalog';
import { waLink } from '@/lib/company';
import { track } from '@/lib/analytics';

export function WhatsAppBubble() {
  const { cart } = useShop();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const items = cart.length
    ? cart.map((l) => `${l.q}× ${bySlug(l.id)?.short}`).join(', ')
    : 'información';

  return (
    <div className="wa">
      <div className="tip"><b>¿Dudas?</b> Escríbenos, respondemos al toque</div>
      <div style={{ position: 'relative' }}>
        <a
          className="btn2"
          href={waLink(`Hola Vendemia, quiero ${items}`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escríbenos por WhatsApp"
          onClick={() => track('Contact', { channel: 'whatsapp' })}
        >
          <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.8-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.3z" />
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
          </svg>
        </a>
        <button className="cl" onClick={() => setHidden(true)} aria-label="Ocultar">×</button>
      </div>
    </div>
  );
}
