import Image from 'next/image';
import type { Product } from '@/lib/types';

export function ProductImage({ p, index = 0, priority = false }: { p: Product; index?: number; priority?: boolean }) {
  const photo = p.images[index] ?? p.images[0];
  return <Image className="product-photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}
    sizes="(max-width: 620px) 90vw, (max-width: 1000px) 45vw, 500px" priority={priority} />;
}
