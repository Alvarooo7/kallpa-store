import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: '80px 22px', textAlign: 'center' }}>
      <span className="eb c">Error 404</span>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '2.2rem', margin: '0 0 12px' }}>
        Esta página no existe
      </h1>
      <p style={{ color: 'var(--t2)', maxWidth: '44ch', margin: '0 auto 24px' }}>
        Puede que el equipo ya no esté en catálogo o que el enlace esté mal escrito.
      </p>
      <Link className="btn acc" href="/">Ver el catálogo</Link>
    </div>
  );
}
