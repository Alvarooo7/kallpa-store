import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LEGAL_DOCS, LEGAL_SLUGS } from '@/lib/legal';
import { COMPANY } from '@/lib/company';

export const dynamicParams = false;
export const generateStaticParams = () => LEGAL_SLUGS.map((doc) => ({ doc }));

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = LEGAL_DOCS[doc];
  if (!d) return {};
  return { title: d.t, alternates: { canonical: `/legal/${doc}` }, robots: { index: true, follow: true } };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = LEGAL_DOCS[doc];
  if (!d) notFound();

  const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="wrap" style={{ maxWidth: 820, paddingTop: 30, paddingBottom: 50 }}>
      <div className="legal" style={{ padding: 0 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '1.9rem', lineHeight: 1.15, margin: 0 }}>{d.t}</h1>
        <p className="upd">Vigente desde el {hoy}</p>
        <div dangerouslySetInnerHTML={{ __html: d.body }} />
        <div className="box" style={{ marginTop: 22 }}>
          <p style={{ fontSize: '.84rem' }}>
            <b>{COMPANY.legalName}</b> · RUC {COMPANY.ruc}<br />
            {COMPANY.address}, {COMPANY.city}, Perú<br />
            {COMPANY.email} · WhatsApp {COMPANY.whatsappPretty}
          </p>
        </div>
      </div>
    </div>
  );
}
