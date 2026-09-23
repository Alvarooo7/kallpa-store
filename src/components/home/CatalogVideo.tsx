'use client';

import Image from 'next/image';
import { useState } from 'react';

export function CatalogVideo({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="catalog-video">
      {playing ? (
        <video controls autoPlay playsInline preload="none" poster={poster} aria-label={alt}>
          <source src={src} type="video/mp4" />
          Tu navegador no admite este video.
        </video>
      ) : (
        <button type="button" className="catalog-video-poster" onClick={() => setPlaying(true)} aria-label={`Reproducir video: ${alt}`}>
          <Image src={poster} alt="" fill sizes="(max-width: 620px) 90vw, 500px" />
          <span className="catalog-video-play" aria-hidden="true">▶</span>
          <span className="catalog-video-label">Mira el XT80 en video</span>
        </button>
      )}
    </div>
  );
}
