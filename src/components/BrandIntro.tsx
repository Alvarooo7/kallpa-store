'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const INTRO_KEY = 'kallpa_intro_seen_v1';
const INTRO_DURATION_MS = 2900;

export function BrandIntro() {
  const [finished, setFinished] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finish = useCallback(() => {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* almacenamiento no disponible */ }
    document.documentElement.dataset.intro = 'done';
    setFinished(true);
  }, []);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== 'run') {
      setFinished(true);
      return;
    }

    skipRef.current?.focus({ preventScroll: true });
    const timer = window.setTimeout(finish, INTRO_DURATION_MS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        window.clearTimeout(timer);
        finish();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [finish]);

  if (finished) return null;

  return (
    <div className="brand-intro" role="dialog" aria-modal="true" aria-label="Presentación de Kallpa">
      <div className="brand-intro-stage" aria-hidden="true">
        <span className="brand-intro-word">
          {'Kallpa'.split('').map((letter, index) => (
            <span className="brand-intro-letter" style={{ animationDelay: `${0.12 + index * 0.13}s` }} key={index}>{letter}</span>
          ))}
          <span className="brand-intro-dot">.</span>
        </span>
      </div>
      <button ref={skipRef} className="brand-intro-skip" type="button" onClick={finish}>Saltar intro</button>
    </div>
  );
}
