import { Hero, Usos, Anchor, Catalogo, Combo, Diagnostico, PorQue, Envios, Faq, FAQ_ITEMS } from '@/components/home/Sections';
import { JsonLd } from '@/lib/seo';
import { PRODUCTS } from '@/lib/catalog';
import { SITE_URL } from '@/lib/company';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(([q, a]) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const listJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: PRODUCTS.map((p, i) => ({
    '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/p/${p.id}`, name: p.name,
  })),
};

export default function Home() {
  return (
    <>
      <JsonLd data={listJsonLd} />
      <JsonLd data={faqJsonLd} />
      <Hero />
      <Usos />
      <Anchor />
      <Catalogo />
      <Combo />
      <Diagnostico />
      <PorQue />
      <Envios />
      <Faq />
    </>
  );
}
