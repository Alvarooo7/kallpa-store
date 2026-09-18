'use client';

import { useEffect, useState } from 'react';

// Cambia esta lista para personalizar las palabras del banner.
const CATEGORIES = ['audífonos', 'smartwatch', 'lentes'] as const;

export function HeroSearchPrompt() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px) and (prefers-reduced-motion: no-preference)');
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
      if (media.matches) {
        timer = setInterval(() => {
          if (!document.hidden) setIndex(current => (current + 1) % CATEGORIES.length);
        }, 2800);
      }
    };
    update();
    media.addEventListener('change', update);
    return () => {
      clearInterval(timer);
      media.removeEventListener('change', update);
    };
  }, []);

  return (
    <>
      <span className="sr-only">¿Buscas audífonos, smartwatch o lentes?</span>
      <span className="hero-search-prompt" aria-hidden="true">
        ¿Buscas <span className="hero-search-word"><span key={index}>{CATEGORIES[index]}?</span></span>
      </span>
    </>
  );
}
