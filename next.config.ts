import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Cuando subas fotos a un CDN, agrégalo acá.
    remotePatterns: [],
  },
  async redirects() {
    // Enlaces ya enviados por correo/WhatsApp apuntan a la ruta anterior del juego.
    return [{ source: '/mi-premio', destination: '/reclama-tu-premio', permanent: true }];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default config;
