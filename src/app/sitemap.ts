import type { MetadataRoute } from 'next';
import { PRODUCTS } from '@/lib/catalog';
import { LEGAL_SLUGS } from '@/lib/legal';
import { SITE_URL } from '@/lib/company';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/envios`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/libro-de-reclamaciones`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...PRODUCTS.map((p) => ({
      url: `${SITE_URL}/p/${p.id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9,
    })),
    ...LEGAL_SLUGS.map((s) => ({
      url: `${SITE_URL}/legal/${s}`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.3,
    })),
  ];
}
