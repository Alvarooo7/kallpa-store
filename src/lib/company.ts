/** Datos de la empresa. Fuente única: si cambia algo, cambia acá. */
export const COMPANY = {
  brand: 'Vendemia Store',
  legalName: 'KALLPA TRIATLON S.A.C.',
  ruc: '20608585541',
  address: 'Av. Talara Nro. 450, A.F. Angamos, Jesús María',
  city: 'Lima',
  country: 'PE',
  email: 'kallpa.contacto.peru@gmail.com',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '51947144701',
  whatsappPretty: '947 144 701',
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vendemia.pe').replace(/\/$/, '');

export const waLink = (text: string) =>
  `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;
