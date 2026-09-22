import type { Product } from '@/lib/types';

const s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * Ilustración técnica de cada familia de producto.
 * Es un marcador de posición honesto hasta que entren las fotos reales:
 * nunca pretende ser una foto del equipo.
 */
export function Art({ kind }: { kind: Product['art'] }) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Ilustración del producto">
      {SHAPES[kind]}
    </svg>
  );
}

const SHAPES: Record<Product['art'], React.ReactNode> = {
  buds: (
    <>
      <rect x="54" y="106" width="92" height="56" rx="16" {...s} />
      <path d="M54 124h92" {...s} opacity=".45" />
      <circle cx="100" cy="150" r="3" {...s} />
      <path d="M68 46c9 0 14 7 14 15 0 7-3 11-3 17s4 8 4 14-5 11-11 11-11-6-11-13c0-7 2-10 2-16s-4-10-4-15 0-13 9-13z" {...s} />
      <path d="M132 46c-9 0-14 7-14 15 0 7 3 11 3 17s-4 8-4 14 5 11 11 11 11-6 11-13c0-7-2-10-2-16s4-10 4-15 0-13-9-13z" {...s} />
    </>
  ),
  swim: (
    <>
      <path d="M44 134c0-40 25-71 56-71s56 31 56 71" {...s} />
      <rect x="32" y="128" width="25" height="33" rx="10" {...s} />
      <rect x="143" y="128" width="25" height="33" rx="10" {...s} />
      <path d="M72 88c8-6 16-8 28-8s20 2 28 8" {...s} opacity=".4" />
      <circle cx="44" cy="144" r="2.4" {...s} />
    </>
  ),
  watch: (
    <>
      <rect x="66" y="54" width="68" height="92" rx="18" {...s} />
      <rect x="77" y="67" width="46" height="66" rx="11" {...s} opacity=".45" />
      <path d="M136 84h6v20h-6" {...s} />
      <path d="M83 54l-5-24h44l-5 24" {...s} />
      <path d="M83 146l-5 24h44l-5-24" {...s} />
      <path d="M92 110a15 15 0 1 1 21-14" {...s} />
    </>
  ),
  glasses: (
    <>
      <rect x="26" y="82" width="60" height="40" rx="13" {...s} />
      <rect x="114" y="82" width="60" height="40" rx="13" {...s} />
      <path d="M86 99c6-5 22-5 28 0" {...s} />
      <path d="M26 93L8 84" {...s} />
      <path d="M174 93l18-9" {...s} />
      <circle cx="36" cy="92" r="3.6" {...s} />
    </>
  ),
  lingo: (
    <>
      <circle cx="100" cy="134" r="32" {...s} />
      <path d="M80 134h40" {...s} opacity=".4" />
      <path d="M64 42c9 0 16 8 16 17 0 8-4 12-4 18s5 9 5 15-6 11-12 11-13-7-13-15c0-8 3-11 3-17s-5-11-5-17 1-12 10-12z" {...s} />
      <path d="M136 42c-9 0-16 8-16 17 0 8 4 12 4 18s-5 9-5 15 6 11 12 11 13-7 13-15c0-8-3-11-3-17s5-11 5-17-1-12-10-12z" {...s} />
    </>
  ),
  supplement: (
    <>
      <path d="M62 58h76l-6 105H68L62 58Z" {...s} />
      <path d="M59 58h82V40H59v18Z" {...s} />
      <path d="M78 96h44M82 116h36" {...s} opacity=".45" />
    </>
  ),
  goggles: (
    <>
      <path d="M22 94c16-27 48-29 66-7l7 9h10l7-9c18-22 50-20 66 7" {...s} />
      <path d="M28 97c0 26 13 41 36 41 21 0 31-15 31-36M172 97c0 26-13 41-36 41-21 0-31-15-31-36" {...s} />
      <path d="M22 94 12 77M178 94l10-17" {...s} />
    </>
  ),
  swimcap: (
    <>
      <path d="M35 146c0-60 25-94 65-94s65 34 65 94c-37 14-93 14-130 0Z" {...s} />
      <path d="M48 147c32 7 72 7 104 0" {...s} opacity=".45" />
    </>
  ),
};

export const Heart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path d="M12 20s-7-4.6-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.4 12 20 12 20z" />
  </svg>
);
