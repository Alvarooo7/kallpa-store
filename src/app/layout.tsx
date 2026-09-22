import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer, FavsDrawer } from '@/components/CartDrawer';
import { OrderModal } from '@/components/OrderModal';
import { LeadModal } from '@/components/LeadModal';
import { WhatsAppBubble } from '@/components/WhatsAppBubble';
import { FreeExpressCelebration } from '@/components/FreeExpressCelebration';
import { JsonLd, storeJsonLd, DEFAULT_TITLE, DEFAULT_DESC } from '@/lib/seo';
import { SITE_URL, COMPANY } from '@/lib/company';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s · ${COMPANY.brand}` },
  description: DEFAULT_DESC,
  applicationName: COMPANY.brand,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: SITE_URL, siteName: COMPANY.brand, locale: 'es_PE', title: DEFAULT_TITLE, description: DEFAULT_DESC },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0C0D' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap"
        />
        <JsonLd data={storeJsonLd} />
      </head>
      <body>
        <Providers>
          <a href="#main" className="skip">Saltar al contenido</a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <FavsDrawer />
          <OrderModal />
          <LeadModal />
          <WhatsAppBubble />
          <Scrim />
          <FreeExpressCelebration />
        </Providers>
      </body>
    </html>
  );
}

import { Scrim } from '@/components/Scrim';
