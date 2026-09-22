import Link from 'next/link';
import { COMPANY } from '@/lib/company';

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="cols">
          <div>
            <div className="logo">Kallpa<i style={{ color: 'var(--acc)' }}>.</i></div>
            <p style={{ maxWidth: '33ch' }}>
              Tecnología que llega hoy. Stock propio en Lima, envío gratis a provincias y pago contra entrega.
            </p>
          </div>
          <div>
            <h4>Tienda</h4>
            <ul>
              <li><Link href="/catalogo">Catálogo</Link></li>
              <li><a href="/#usos">¿Para qué lo necesitas?</a></li>
              <li><Link href="/#combo">Smartwatches</Link></li>
              <li><Link href="/#diagnostico">¿Qué quieres resolver?</Link></li>
            </ul>
          </div>
          <div>
            <h4>Ayuda</h4>
            <ul>
              <li><a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener noreferrer"><b style={{ color: '#fff', fontWeight: 500 }}>WhatsApp {COMPANY.whatsappPretty}</b></a></li>
              <li><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
              <li><Link href="/envios">Envíos y pagos</Link></li>
              <li><Link href="/legal/cambios">Garantía y cambios</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><Link href="/libro-de-reclamaciones">Libro de reclamaciones</Link></li>
              <li><Link href="/legal/cambios">Cambios y devoluciones</Link></li>
              <li><Link href="/legal/privacidad">Política de privacidad</Link></li>
              <li><Link href="/legal/terminos">Términos y condiciones</Link></li>
            </ul>
          </div>
        </div>

        <div className="aviso" style={{ background: 'var(--k2)', borderColor: '#3A3A40' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="1.6">
            <path d="M5 4h11l3 3v13H5z" /><path d="M8 9h8M8 13h8M8 17h5" />
          </svg>
          <p style={{ color: '#B9B9C0' }}>
            Conforme a la ley, tienes derecho a un <b style={{ color: '#fff' }}>Libro de Reclamaciones</b>.{' '}
            <Link href="/libro-de-reclamaciones" style={{ color: 'var(--acc)', textDecoration: 'underline' }}>Ábrelo aquí</Link>
          </p>
        </div>

        <div className="bot">
          <span>© {new Date().getFullYear()} {COMPANY.brand} · {COMPANY.legalName} · RUC {COMPANY.ruc} · {COMPANY.address}, {COMPANY.city}</span>
          <span>Precios en soles, IGV incluido</span>
        </div>
      </div>
    </footer>
  );
}
