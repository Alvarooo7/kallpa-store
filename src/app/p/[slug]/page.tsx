import { notFound } from 'next/navigation';
import { PRODUCTS, bySlug, otherThan } from '@/lib/catalog';
import { ProductDetail } from '@/components/ProductDetail';
import { JsonLd, productJsonLd, productMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getCatalogAvailability } from '@/lib/db/inventory';

export const dynamicParams = false;
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = bySlug(slug);
  return p ? productMetadata(p) : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();
  const availability = await getCatalogAvailability();
  const productAvailability = availability[p.id];
  if (productAvailability.status === 'inactive') notFound();
  return (
    <>
      <JsonLd data={productJsonLd(p, productAvailability)} />
      <ProductDetail p={p} recs={otherThan(p.id)} availability={productAvailability} />
    </>
  );
}
