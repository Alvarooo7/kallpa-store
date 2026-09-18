'use client';

import { useState } from 'react';
import { COMPANY } from '@/lib/company';
import { track } from '@/lib/analytics';

export function LibroForm() {
  const [tipo, setTipo] = useState<'Reclamo' | 'Queja'>('Reclamo');
  const [sending, setSending] = useState(false);
  const [hoja, setHoja] = useState<{ n: string; mail: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const r = await fetch('/api/reclamaciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, tipo }),
      });
      const data = (await r.json()) as { numero?: string };
      track('SubmitApplication', { form: 'libro_reclamaciones', tipo });
      setHoja({ n: data.numero ?? 'LR-0000', mail: String(body.email ?? '') });
    } finally {
      setSending(false);
    }
  }

  if (hoja) {
    return (
      <>
        <div className="lrok">
          <p style={{ fontSize: '.85rem', color: 'var(--t2)', margin: 0 }}>Número de hoja</p>
          <div className="code">{hoja.n}</div>
          <p>Enviamos una copia a <b style={{ color: 'var(--t)' }}>{hoja.mail}</b>. Guárdala.</p>
        </div>
        <div className="box">
          <p>
            <b>Qué pasa ahora:</b> revisamos tu caso y te respondemos por correo en un plazo máximo de{' '}
            <b>15 días hábiles</b>. Si necesitamos más tiempo, te propondremos una solución antes de que venza ese plazo y
            podremos ampliarlo una sola vez por 5 días hábiles más.
          </p>
          <p style={{ marginTop: 8 }}>
            Si no quedas conforme con nuestra respuesta, puedes presentar tu caso ante <b>Indecopi</b>.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h4>1. ¿Qué quieres registrar?</h4>
      <div className="radios">
        <label>
          <input type="radio" name="tipo" checked={tipo === 'Reclamo'} onChange={() => setTipo('Reclamo')} />
          <span><b>Reclamo</b><span>Tu disconformidad es con el producto o el servicio que compraste.</span></span>
        </label>
        <label>
          <input type="radio" name="tipo" checked={tipo === 'Queja'} onChange={() => setTipo('Queja')} />
          <span><b>Queja</b><span>Tu malestar es con la atención recibida, no con el producto.</span></span>
        </label>
      </div>

      <form onSubmit={submit}>
        <h4>2. Tus datos</h4>
        <div className="lrgrid">
          <div className="field"><label htmlFor="r-name">Nombre completo *</label><input id="r-name" name="nombre" required placeholder="Como figura en tu DNI" /></div>
          <div className="field"><label htmlFor="r-dni">DNI o Carné de extranjería *</label><input id="r-dni" name="dni" required inputMode="numeric" placeholder="########" /></div>
          <div className="field"><label htmlFor="r-mail">Correo electrónico *</label><input id="r-mail" name="email" type="email" required placeholder="tucorreo@gmail.com" /></div>
          <div className="field"><label htmlFor="r-tel">Teléfono *</label><input id="r-tel" name="telefono" required inputMode="numeric" placeholder="9XX XXX XXX" /></div>
          <div className="field lrfull"><label htmlFor="r-dom">Domicilio</label><input id="r-dom" name="domicilio" placeholder="Dirección, distrito" /></div>
          <div className="field lrfull"><label htmlFor="r-apo">Si eres menor de edad, nombre del padre, madre o apoderado</label><input id="r-apo" name="apoderado" placeholder="Opcional" /></div>
        </div>

        <h4>3. Sobre tu pedido</h4>
        <div className="lrgrid">
          <div className="field"><label htmlFor="r-prod">Producto o servicio *</label><input id="r-prod" name="producto" required placeholder="Ej. Audífonos Lenovo XT80" /></div>
          <div className="field"><label htmlFor="r-ped">N° de pedido</label><input id="r-ped" name="pedido" placeholder="Si lo tienes a la mano" /></div>
          <div className="field lrfull"><label htmlFor="r-monto">Monto reclamado (S/)</label><input id="r-monto" name="monto" inputMode="decimal" placeholder="Opcional" /></div>
        </div>

        <h4>4. Cuéntanos qué pasó</h4>
        <div className="field">
          <label htmlFor="r-det">Detalle *</label>
          <textarea id="r-det" name="detalle" required placeholder="Describe lo que ocurrió con el mayor detalle posible: fechas, con quién hablaste, qué se te ofreció." />
        </div>
        <div className="field">
          <label htmlFor="r-ped2">¿Qué esperas que hagamos? *</label>
          <textarea id="r-ped2" name="pedidoConsumidor" required style={{ minHeight: 70 }} placeholder="Cambio del equipo, devolución del monto, una explicación…" />
        </div>

        <button className="btn acc block" type="submit" style={{ marginTop: 6 }} disabled={sending}>
          {sending ? 'Registrando…' : `Enviar mi ${tipo.toLowerCase()}`}
        </button>
        <p style={{ fontSize: '.78rem', color: 'var(--t2)', marginTop: 12 }}>
          Al enviarlo recibes una copia en <b>{COMPANY.email}</b> y en tu correo. Responderemos en un plazo máximo de{' '}
          <b>15 días hábiles</b>, conforme a la Ley 31435. Registrar un reclamo acá no impide que acudas a Indecopi.
        </p>
      </form>
    </>
  );
}
