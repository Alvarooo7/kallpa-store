import type { Metadata } from 'next';
import Link from 'next/link';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { PRODUCTS, PRODUCT_IDS_BY_USE } from '@/lib/catalog';
import { getCatalogAvailability } from '@/lib/db/inventory';

export const dynamic = 'force-dynamic';

const CATEGORIES = {
  todos: {
    label: 'Todos',
    title: 'Todos los productos',
    matches: () => true,
  },
  audifonos: {
    label: 'Audífonos',
    title: 'Audífonos',
    matches: (category: string) => category.startsWith('Audio'),
  },
  smartwatches: {
    label: 'Smartwatches',
    title: 'Smartwatches',
    matches: (category: string) => category === 'Smartwatches',
  },
  lentes: {
    label: 'Lentes inteligentes',
    title: 'Lentes inteligentes',
    matches: (category: string) => category === 'Lentes inteligentes',
  },
  nutricion: {
    label: 'Proteínas y creatinas',
    title: 'Proteínas y creatinas',
    matches: (category: string) => category === 'Nutrición deportiva',
  },
  natacion: {
    label: 'Natación',
    title: 'Artículos de natación',
    matches: (category: string) => category === 'Natación',
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;
type UseKey = keyof typeof PRODUCT_IDS_BY_USE;

const USE_LABELS: Record<UseKey, string> = {
  entrenar: 'Productos para entrenar',
  escuchar: 'Productos para escuchar música',
  espiar: 'Lentes para capturar fotos y videos',
};

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Explora tecnología, nutrición deportiva y artículos de natación disponibles en Kallpa.',
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ categoria?: string; uso?: string }> }) {
  const params = await searchParams;
  const requested = params.categoria;
  const requestedUse = params.uso;
  const active: CategoryKey = requested && requested in CATEGORIES ? requested as CategoryKey : 'todos';
  const activeUse: UseKey | undefined = requestedUse && requestedUse in PRODUCT_IDS_BY_USE ? requestedUse as UseKey : undefined;
  const category = CATEGORIES[active];
  const availability = await getCatalogAvailability();
  const visibleProducts = PRODUCTS.filter(product => availability[product.id].status !== 'inactive');
  const products = activeUse
    ? visibleProducts.filter(product => (PRODUCT_IDS_BY_USE[activeUse] as readonly string[]).includes(product.id))
    : visibleProducts.filter(product => category.matches(product.cat));
  const title = activeUse ? USE_LABELS[activeUse] : category.title;

  const filters = (Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([key, item]) => ({
    key,
    label: item.label,
    count: visibleProducts.filter(product => item.matches(product.cat)).length,
    href: key === 'todos' ? '/catalogo' : `/catalogo?categoria=${key}`,
    on: !activeUse && active === key,
  }));
  const activeLabel = activeUse ? USE_LABELS[activeUse] : active === 'todos' ? undefined : category.label;

  return (
    <>
      <CatalogBrowser title={title} ids={products.map(product => product.id)} availability={availability} filters={filters} activeLabel={activeLabel} invite={!activeLabel} />
      <section className="catalog-more">
        <div className="wrap">
          <div className="catalog-related">
            <h2>Explora otras categorías</h2>
            <div className="catalog-tabs">
              {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][])
                .filter(([key]) => key !== 'todos' && key !== active)
                .map(([key, item]) => <Link key={key} className="catalog-tab" href={`/catalogo?categoria=${key}`}>{item.label}</Link>)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
