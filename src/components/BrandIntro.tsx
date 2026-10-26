'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const INTRO_DURATION_MS = 3300;
const THROW_AT_MS = 1120;
const FLIGHT_MS = 1550;

type Placement = { left: number; top: number; width: number };

export function BrandIntro() {
  const [finished, setFinished] = useState(false);
  const [readyLoaded, setReadyLoaded] = useState(false);
  const [releaseLoaded, setReleaseLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [thrown, setThrown] = useState(false);
  const [landed, setLanded] = useState(false);
  const athleteRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLSpanElement>(null);
  const flightRef = useRef<Animation | null>(null);

  const finish = useCallback(() => {
    flightRef.current?.cancel();
    document.documentElement.dataset.intro = 'done';
    setFinished(true);
    window.dispatchEvent(new Event('kallpa:intro-complete'));
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const disabled = new URLSearchParams(window.location.search).get('intro') === '0';
    if (reducedMotion || disabled) {
      document.documentElement.dataset.intro = 'skip';
      setFinished(true);
      return;
    }

    // También se ejecuta al volver a la home mediante navegación interna.
    document.documentElement.dataset.intro = 'run';
    const placeAthlete = () => {
      const mobile = window.innerWidth <= 760;
      const width = mobile ? Math.min(window.innerWidth * 1.12, 490) : Math.min(window.innerWidth * .62, 820);
      setPlacement({
        left: window.innerWidth * (mobile ? .05 : .45),
        top: mobile ? window.innerHeight * .39 : Math.max(46, (window.innerHeight - width * 1111 / 1415) * .56),
        width,
      });
    };
    placeAthlete();
    window.addEventListener('resize', placeAthlete);
    return () => {
      window.removeEventListener('resize', placeAthlete);
      if (document.documentElement.dataset.intro === 'run') document.documentElement.dataset.intro = 'skip';
    };
  }, []);

  useEffect(() => {
    if (!readyLoaded || !releaseLoaded || !placement || finished || document.documentElement.dataset.intro !== 'run') return;

    setStarted(true);
    const timer = window.setTimeout(finish, INTRO_DURATION_MS);
    const launchTimer = window.setTimeout(() => {
      const athlete = athleteRef.current?.getBoundingClientRect();
      const dot = document.querySelector('header.nav .logo i')?.getBoundingClientRect();
      const ball = ballRef.current;
      if (!athlete || !dot || !ball) return;

      const size = Math.max(29, Math.min(68, athlete.width * .105));
      const startX = athlete.left + athlete.width * .707 - size / 2;
      const startY = athlete.top + athlete.height * .402 - size / 2;
      const endX = dot.left + dot.width / 2 - size / 2;
      const endY = dot.bottom - dot.height * .18 - size / 2;
      const arc = Math.min(170, Math.max(60, Math.abs(endX - startX) * .18));

      ball.style.width = `${size}px`;
      ball.style.height = `${size}px`;
      setThrown(true);
      flightRef.current = ball.animate([
        { transform: `translate3d(${startX}px, ${startY}px, 0) scale(1)`, opacity: 1, offset: 0 },
        { transform: `translate3d(${startX + (endX - startX) * .4}px, ${startY + (endY - startY) * .32 - arc}px, 0) scale(.75)`, opacity: 1, offset: .4 },
        { transform: `translate3d(${endX}px, ${endY}px, 0) scale(${Math.max(.1, dot.width / size)})`, opacity: 1, offset: 1 },
      ], { duration: FLIGHT_MS, easing: 'cubic-bezier(.18,.52,.28,1)', fill: 'forwards' });
      flightRef.current.onfinish = () => setLanded(true);
    }, THROW_AT_MS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        window.clearTimeout(timer);
        finish();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(launchTimer);
      flightRef.current?.cancel();
      window.removeEventListener('keydown', onKeyDown);
      if (document.documentElement.dataset.intro === 'run') document.documentElement.dataset.intro = 'skip';
    };
  }, [readyLoaded, releaseLoaded, placement, finished, finish]);

  if (finished) return null;

  return (
    <div className={`brand-intro${started ? ' brand-intro-started' : ''}${thrown ? ' brand-intro-thrown' : ''}${landed ? ' brand-intro-landed' : ''}`} role="dialog" aria-modal="true" aria-label="Presentación de Kallpa">
      <div className="brand-intro-scene">
        <div className="brand-intro-copy" aria-label="Lo pides hoy. Lo recibes hoy.">
          <span className="brand-intro-line brand-intro-line-first" aria-hidden="true">Lo pides hoy.</span>
          <span className="brand-intro-line brand-intro-line-second" aria-hidden="true">Lo recibes hoy.</span>
        </div>
        <div className="brand-intro-athlete" ref={athleteRef} style={placement ?? undefined} aria-hidden="true">
          <Image className="brand-intro-ready" src="/hero/luchito-shot-ready-v2.webp" alt="" width={1415} height={1111} priority unoptimized onLoad={() => setReadyLoaded(true)} />
          <Image className="brand-intro-release" src="/hero/luchito-shot-release-v2.webp" alt="" width={1415} height={1111} priority unoptimized onLoad={() => setReleaseLoaded(true)} />
        </div>
        <button className="brand-intro-skip" type="button" onClick={finish}>Saltar intro</button>
      </div>
      <span className="brand-intro-ball" ref={ballRef} aria-hidden="true" />
    </div>
  );
}
