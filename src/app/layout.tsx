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
  colorScheme: 'light',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var params = new URLSearchParams(location.search);
            var forced = params.get('intro');
            var fromAd = params.has('gclid') || params.has('fbclid') || params.has('ttclid') ||
              params.has('msclkid') || Array.from(params.keys()).some(function(key) { return key.indexOf('utm_') === 0; });
            var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
            var run = location.pathname === '/' && !reducedMotion && (forced === '1' ||
              (forced !== '0' && !location.hash && !fromAd &&
              (${process.env.NODE_ENV !== 'production'} || localStorage.getItem('kallpa_intro_seen_v1') !== '1')));
            document.documentElement.dataset.intro = run ? 'run' : 'skip';
          } catch (error) {
            document.documentElement.dataset.intro = 'skip';
          }
        ` }} />
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
