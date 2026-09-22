import type { Metadata } from 'next';
import { COMPANY, SITE_URL } from './company';
import type { Product, ProductAvailability } from './types';
import { money } from './format';

export const DEFAULT_TITLE = `${COMPANY.brand} — Audífonos, smartwatches y lentes con entrega hoy en Lima`;
export const DEFAULT_DESC =
  'Descubre audífonos deportivos, smartwatches Haylou y Zeblaze y lentes inteligentes. Fotos, características y asesoría para elegir tu equipo en Kallpa.';

export function productMetadata(p: Product): Metadata {
  const title = `${p.name} | Entrega hoy en Lima · ${COMPANY.brand}`;
  const description = `${p.claim} ${p.priceKnown ? money(p.price) : 'Consulta precio y disponibilidad.'} ${p.description}`;
  const url = `${SITE_URL}/p/${p.id}`;
  const image = p.images[0];
  return {
    // `absolute` evita que la plantilla del layout vuelva a pegar la marca.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description, siteName: COMPANY.brand, locale: 'es_PE', ...(image ? { images: [{url: `${SITE_URL}${image.src}`, alt:image.alt}] } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images:[`${SITE_URL}${image.src}`] } : {}) },
  };
}

export function productJsonLd(p: Product, availability?: ProductAvailability) {
  const url = `${SITE_URL}/p/${p.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.images.map(i => `${SITE_URL}${i.src}`),
    sku: p.id.toUpperCase(),
    brand: { '@type': 'Brand', name: p.name.split(' ')[0] },
    offers: p.priceKnown ? {
      '@type': 'Offer', url, priceCurrency: 'PEN', price: p.price.toFixed(2),
      availability: availability?.status === 'coming_soon'
        ? 'https://schema.org/PreOrder'
        : availability?.status === 'out_of_stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: COMPANY.brand },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'PEN' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PE' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 5, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy', applicableCountry: 'PE',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    } : undefined,
  };
}

export const storeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: COMPANY.brand,
  legalName: COMPANY.legalName,
  taxID: COMPANY.ruc,
  url: SITE_URL,
  email: COMPANY.email,
  areaServed: 'PE',
  currenciesAccepted: 'PEN',
  paymentAccepted: 'Efectivo, Yape, Plin, Transferencia, Tarjeta',
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.address,
    addressLocality: 'Jesús María',
    addressRegion: 'Lima',
    addressCountry: 'PE',
  },
  contactPoint: {
    '@type': 'ContactPoint', contactType: 'customer service',
    telephone: `+${COMPANY.whatsapp}`, email: COMPANY.email, availableLanguage: 'es',
  },
};

export const JsonLd = ({ data }: { data: unknown }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);
