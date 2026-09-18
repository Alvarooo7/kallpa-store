import type { Metadata } from 'next';
import { Envios } from '@/components/home/Sections';

export const metadata: Metadata = {
  title: 'Envíos y pagos — delivery gratis en Lima, express desde S/ 10',
  description:
    'Delivery gratis el mismo día en Lima si pides antes de las 9 a.m., entre 12 y 7 p.m. Express en horas desde S/ 10. Envío gratis a provincias por Shalom u Olva.',
  alternates: { canonical: '/envios' },
};

export default function EnviosPage() {
  return (
    <div className="wrap" style={{ paddingTop: 30 }}>
      <span className="eb">Logística</span>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 'clamp(1.8rem,4vw,2.6rem)', lineHeight: 1.08, margin: '0 0 14px' }}>
        Dos velocidades. Tú eliges.
      </h1>
      <p style={{ color: 'var(--t2)', maxWidth: '58ch' }}>
        Si puedes esperar la ventana del día, no pagas nada. Si lo quieres en horas, cuesta lo que cuesta mover una moto
        extra. Nada más, y sin letra chica.
      </p>
      <Envios heading={false} />
    </div>
  );
}
