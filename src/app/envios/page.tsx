import type { Metadata } from 'next';
import { Envios } from '@/components/home/Sections';
import { EXPRESS_TIERS } from '@/lib/shipping';
import { money } from '@/lib/format';

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
        Si puedes esperar la ventana del día, no pagas nada. Si lo quieres en horas, el express es gratis desde S/ 200;
        antes de esa meta se aplica el rango de tu distrito.
      </p>
      <Envios heading={false} />
      <section className="shipping-ranges" aria-labelledby="shipping-ranges-title">
        <span className="eb">Express desde Pueblo Libre</span>
        <h2 id="shipping-ranges-title">Cinco rangos, un precio visible</h2>
        <p>
          El express es gratis desde S/ 200. Para compras menores calculamos el recargo según la distancia aproximada al
          centro del distrito. Antes de confirmar verás el monto exacto; luego coordinamos disponibilidad y hora por WhatsApp.
        </p>
        <div className="shipping-range-grid">
          {EXPRESS_TIERS.map(tier => (
            <article key={tier.fee}>
              <b>{money(tier.fee)}</b>
              <span>{tier.distance}</span>
              <small>{tier.districts.join(' · ')}</small>
            </article>
          ))}
        </div>
        <p className="shipping-method">
          Los rangos toman como referencia el costo de una moto por distancia y tiempo. La tarifa mostrada es el recargo
          de Kallpa para tu distrito; el operador disponible puede ser inDrive, Uber, Cabify u otro servicio equivalente.
        </p>
      </section>
    </div>
  );
}
