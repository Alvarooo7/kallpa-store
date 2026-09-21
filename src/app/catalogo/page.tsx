import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { PRODUCTS } from '@/lib/catalog';

const CATEGORIES = {
  todos: {
    label: 'Todos',
    title: 'Todos los equipos',
    description: 'Compara audífonos, smartwatches y lentes inteligentes disponibles en Kallpa.',
    matches: () => true,
  },
  audifonos: {
    label: 'Audífonos',
    title: 'Audífonos para moverte',
    description: 'Opciones para correr, entrenar y escuchar música en la piscina sin llevar el celular.',
    matches: (category: string) => category.startsWith('Audio'),
  },
  smartwatches: {
    label: 'Smartwatches',
    title: 'Smartwatches deportivos',
    description: 'Pantalla AMOLED, seguimiento de actividad y GPS para registrar tus rutas.',
    matches: (category: string) => category === 'Smartwatches',
  },
  lentes: {
    label: 'Lentes inteligentes',
    title: 'Lentes inteligentes',
    description: 'Cámara, audio y llamadas en un formato de manos libres.',
    matches: (category: string) => category === 'Lentes inteligentes',
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Explora audífonos deportivos, smartwatches y lentes inteligentes disponibles en Kallpa.',
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const params = await searchParams;
  const requested = params.categoria;
  const active: CategoryKey = requested && requested in CATEGORIES ? requested as CategoryKey : 'todos';
  const category = CATEGORIES[active];
  const products = PRODUCTS.filter(product => category.matches(product.cat));

  return (
    <>
      <header className="catalog-head">
        <div className="wrap">
          <span className="eb">Catálogo Kallpa</span>
          <h1>Encuentra el equipo para lo que quieres hacer.</h1>
          <p>Filtra por categoría, compara sus características y revisa la compatibilidad antes de elegir.</p>
          <nav className="catalog-tabs" aria-label="Categorías del catálogo">
            {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([key, item]) => (
              <Link key={key} className={`catalog-tab${active === key ? ' on' : ''}`} href={key === 'todos' ? '/catalogo' : `/catalogo?categoria=${key}`} aria-current={active === key ? 'page' : undefined}>
                {item.label} · {PRODUCTS.filter(product => item.matches(product.cat)).length}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="catalog-results">
        <div className="wrap">
          <div className="shead">
            <div><span className="eb">{products.length} {products.length === 1 ? 'producto' : 'productos'}</span><h2>{category.title}</h2></div>
            <p style={{ fontSize: '.92rem', color: 'var(--t2)', maxWidth: '38ch', margin: 0 }}>{category.description}</p>
          </div>
          <div className="grid">{products.map(product => <ProductCard key={product.id} p={product} />)}</div>

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
