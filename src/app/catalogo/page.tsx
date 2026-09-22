import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { PRODUCTS, PRODUCT_IDS_BY_USE } from '@/lib/catalog';
import { getCatalogAvailability } from '@/lib/db/inventory';

export const dynamic = 'force-dynamic';

const CATEGORIES = {
  todos: {
    label: 'Todos',
    title: 'Todos los equipos',
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

  return (
    <>
      <header className="catalog-head">
        <div className="wrap">
          <nav className="catalog-tabs catalog-filter-tabs" aria-label="Filtrar catálogo por categoría">
            {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([key, item]) => (
              <Link key={key} className={`catalog-tab${!activeUse && active === key ? ' on' : ''}`} href={key === 'todos' ? '/catalogo' : `/catalogo?categoria=${key}`} aria-current={!activeUse && active === key ? 'page' : undefined}>
                {item.label} · {visibleProducts.filter(product => item.matches(product.cat)).length}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="catalog-results">
        <div className="wrap">
          <div className="catalog-summary">
            <h1>{title}</h1>
            <span>{products.length} {products.length === 1 ? 'producto' : 'productos'}</span>
          </div>
          <div className="grid">{products.map(product => <ProductCard key={product.id} p={product} availability={availability[product.id]} />)}</div>

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
