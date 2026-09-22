import Image from 'next/image';
import type { Product } from '@/lib/types';

export function ProductImage({ p, index = 0, priority = false }: { p: Product; index?: number; priority?: boolean }) {
  const photo = p.images[index] ?? p.images[0];
  if (!photo) return <ProductPlaceholder p={p} />;
  return <Image className="product-photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}
    sizes="(max-width: 620px) 90vw, (max-width: 1000px) 45vw, 500px" priority={priority} />;
}

function ProductPlaceholder({ p }: { p: Product }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className="product-photo product-placeholder" viewBox="0 0 240 240" role="img" aria-label={`Imagen de ${p.short} pendiente`}>
      {p.art === 'supplement' && <g {...common}><path d="M72 65h96l-8 128H80L72 65Z" /><path d="M68 65h104V44H68v21Z" /><path d="M91 112h58M96 137h48" /></g>}
      {p.art === 'goggles' && <g {...common}><path d="M28 113c19-32 57-34 78-8l7 10h14l7-10c21-26 59-24 78 8" /><path d="M35 116c0 31 16 48 43 48 25 0 37-17 37-42M205 116c0 31-16 48-43 48-25 0-37-17-37-42" /><path d="M28 113 16 92M212 113l12-21" /></g>}
      {p.art === 'swimcap' && <g {...common}><path d="M42 169c0-72 30-112 78-112s78 40 78 112c-44 16-112 16-156 0Z" /><path d="M57 170c38 8 88 8 126 0" /></g>}
      <text x="120" y="215" textAnchor="middle" fill="currentColor" fontSize="13" fontFamily="Arial, sans-serif">IMAGEN PENDIENTE</text>
    </svg>
  );
}
