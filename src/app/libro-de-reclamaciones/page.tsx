import type { Metadata } from 'next';
import { LibroForm } from '@/components/LibroForm';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Libro de Reclamaciones virtual',
  description:
    'Registra tu reclamo o queja. Respondemos en un máximo de 15 días hábiles, conforme a la Ley 31435 y el D.S. 011-2011-PCM.',
  alternates: { canonical: '/libro-de-reclamaciones' },
};

export default function LibroPage() {
  const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="wrap" style={{ maxWidth: 820, paddingTop: 30, paddingBottom: 50 }}>
      <div className="legal" style={{ padding: 0 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '1.9rem', lineHeight: 1.15, margin: 0 }}>
          Libro de Reclamaciones
        </h1>
        <p className="upd">{hoy} · Conforme al D.S. 011-2011-PCM</p>
        <div className="box">
          <p style={{ fontSize: '.86rem' }}>
            <b>Proveedor:</b> {COMPANY.legalName}, RUC {COMPANY.ruc}, con domicilio en {COMPANY.address},{' '}
            {COMPANY.city}, Perú. Tienda virtual {COMPANY.brand}.
          </p>
        </div>
        <LibroForm />
      </div>
    </div>
  );
}
