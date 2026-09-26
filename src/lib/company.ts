/** Datos de la empresa. Fuente única: si cambia algo, cambia acá. */
export const COMPANY = {
  brand: 'Kallpa',
  legalName: 'KALLPA TRIATLON S.A.C.',
  ruc: '20608585541',
  address: 'Av. Talara Nro. 450, A.F. Angamos, Jesús María',
  city: 'Lima',
  country: 'PE',
  email: 'kallpa.contacto.peru@gmail.com',
  whatsapp: '51907863118',
  whatsappPretty: '+51 907 863 118',
  yapePlinPhone: '947144701',
  yapePlinHolder: 'Alvaro Pelaez',
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kallpita.store').replace(/\/$/, '');

export const waLink = (text: string) =>
  `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;

export const COURSE_CONTACT = { whatsapp: '51955882306', whatsappPretty: '+51 955 882 306' } as const;
export const courseWaLink = (text: string) =>
  `https://wa.me/${COURSE_CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
