import Link from 'next/link';
import Image from 'next/image';
import { ProductImage } from '../ProductImage';
import { ProductPrice } from '../ProductPrice';
import { CutoffClock } from '../DeliveryPromise';
import { PRODUCTS, PAINS, USES, bySlug } from '@/lib/catalog';
import { HeroProducts } from './HeroProducts';
import { HeroSearchPrompt } from './HeroSearchPrompt';

export function Hero() {
  const featured = ['lenovo-xt80', 'zeblaze-stratos-2-ultra', 'blackview-bv200'].map(id => bySlug(id)!);
  return (
    <div className="hero hero-products hero-model">
      <div className="wrap">
        <div className="hero-copy">
          <div className="hero-banner">
          <div className="hero-mobile-photo"><Image src="/hero/luchito-mobile-v5.png" alt="Luchito sosteniendo un paquete Kallpa, con polo blanco de la marca y ropa deportiva" fill quality={90} sizes="(max-width: 760px) 290px, 1px" /></div>
          <span className="eb">Delivery gratis el mismo día</span>
          <h1>Hoy lo pides. Hoy lo tienes.</h1>
          <p className="hsub">
            <span className="hero-summary-full">Pide antes de las <b>9 a.m.</b> Recibe de 12 a 7 p.m. y paga al recibir.</span>
            <span className="hero-summary-mobile"><HeroSearchPrompt /><br />Pagas al recibir.</span>
          </p>
          <div className="speed" style={{ marginBottom: 26 }}>
            <div className="s">
              <span className="tagp free">Gratis</span>
              <span className="tx"><b>Si esperas la ventana</b><span>Hoy, entre 12 y 7 p.m.</span></span>
            </div>
            <div className="div" />
            <div className="s">
              <span className="tagp pay">S/ 10+</span>
              <span className="tx"><b>Si lo quieres ya</b><span>Express, en cuestión de horas</span></span>
            </div>
          </div>
          <div className="ctas">
            <Link className="btn" href="/catalogo">Ver catálogo</Link>
            <Link className="tl" href="/envios">Cómo llega</Link>
          </div>
          </div>
          <p className="hero-mobile-delivery">En Lima: pide antes de las <b>9 a.m.</b> y recibe de <b>12 a 7 p.m.</b> <Link href="/envios">Ver envíos →</Link></p>
          <div className="pills">
            <span className="pl"><i />Pagas al recibir</span>
            <span className="pl"><i />Stock propio en Lima</span>
            <span className="pl"><i />Garantía 3 meses</span>
          </div>
        </div>
        <HeroProducts products={featured} />
      </div>
    </div>
  );
}

export function Usos() {
  return (
    <section id="usos" style={{ paddingTop: 26 }}>
      <div className="wrap">
        <div className="band">
          <div className="shead">
            <div><span className="eb">Explora</span><h2>¿Para qué lo necesitas?</h2></div>
            <Link className="vall" href="/catalogo">Ver todo</Link>
          </div>
          <div className="cats">
            {USES.map((u) => (
              <Link key={u.t} className="cat" href={u.href}>
                <div className="tile use-photo"><Image src={u.image} alt={u.alt} fill quality={90} unoptimized={u.image === '/uses/lucho-espiar.png'} sizes="(max-width: 620px) 90vw, (max-width: 960px) 45vw, 400px" /></div>
                <div className="row">
                  <div><b>{u.t}</b><span>{u.n}</span></div>
                  <span className="circ">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Anchor() {
  const p = bySlug('lenovo-xt80')!;
  return (
    <section id="ancla" style={{ paddingTop: 34 }}>
      <div className="wrap">
        <div className="anchor">
          <div className="fig" style={{ background: p.bg }}>
            <ProductImage p={p} />
            <span className="tagline">Diseño deportivo · ajuste con ganchos</span>
          </div>
          <div>
            <span className="eb">Audio deportivo</span>
            <h2>Tu música también entrena contigo.</h2>
            <p>
              Ganchos de sujeción, estuche de carga y llamadas manos libres. Lleva tu música a cada entrenamiento.
            </p>
            <div className="row">
              <div className="price">
                <ProductPrice p={p} />
              </div>
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <Link className="btn acc" href={`/p/${p.id}`}>Ver el XT80</Link>
              <Link className="tl" href="/catalogo">Ver los otros {PRODUCTS.length - 1}</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Combo() {
  const a = bySlug('haylou-rs4-plus')!;
  const b = bySlug('zeblaze-stratos-2-ultra')!;
  return <section id="combo"><div className="wrap"><div className="band"><div className="promo">
    <div><span className="eb">Smartwatches deportivos</span><h2>Una pantalla para tu día. GPS para tus rutas.</h2>
      <p>Haylou RS4 Plus ofrece una pantalla AMOLED de 60 Hz y 105 modos deportivos. Zeblaze Stratos 2 Ultra suma posicionamiento de doble frecuencia, brújula y altímetro para tus salidas al aire libre.</p>
      <div className="ctas" style={{ marginTop: 22 }}><Link className="btn w" href={`/p/${a.id}`}>Ver Haylou</Link><Link className="btn out" href={`/p/${b.id}`}>Ver Zeblaze</Link></div>
    </div><div className="promofig"><div style={{ background: a.bg }}><ProductImage p={a} /></div><div style={{ background: b.bg }}><ProductImage p={b} /></div></div>
  </div></div></div></section>;
}

export function Diagnostico() {
  return (
    <section id="diagnostico" style={{ paddingTop: 28 }}>
      <div className="wrap">
        <div className="shead">
          <div><span className="eb">Preguntas frecuentes de compra</span><h2>¿Qué estás buscando?</h2></div>
          <p style={{ fontSize: '.92rem', color: 'var(--t2)', maxWidth: '32ch', margin: 0 }}>
            Elige la pregunta que más se parece a la tuya y te mostramos una opción concreta.
          </p>
        </div>
        <div className="diag">
          {PAINS.map((d) => (
            <Link key={d.pain} href={`/p/${d.to}`}>
              <span className="pain">“{d.pain}”</span>
              <span className="fix">
                <span>{d.fix}</span>
                <span className="arw"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PorQue() {
  return (
    <section style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="why">
          <div className="whyfig"><ProductImage p={bySlug('acuaticos-x7')!} /></div>
          <div>
            <span className="eb">Por qué Kallpa</span>
            <h2>El stock ya está acá.<br />Por eso llega hoy.</h2>
            <p>
              No importamos por pedido ni te hacemos esperar 20 días. Compramos, probamos y guardamos el stock en Lima.
              Por eso podemos decirte la hora exacta a la que llega, por eso el delivery no te cuesta nada, y por eso
              puedes pagar recién cuando lo tienes en la mano.
            </p>
            <Link className="btn out" href="/envios">Cómo trabajamos</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Envios({ heading = true }: { heading?: boolean }) {
  return (
    <section id="envios" style={{ paddingTop: 26 }}>
      <div className="wrap">
        {heading && (
          <div className="shead">
            <div><span className="eb">Logística</span><h2>Dos velocidades. Tú eliges.</h2></div>
            <p style={{ fontSize: '.92rem', color: 'var(--t2)', maxWidth: '34ch', margin: 0 }}>
              Si puedes esperar la ventana del día, no pagas nada. Si lo quieres en horas, cuesta lo que cuesta mover una
              moto extra.
            </p>
          </div>
        )}
        <div className="ships">
          <div className="sh hot">
            <h3>Lima, en el día — gratis</h3>
            <p>Pide antes de las 9:00 a.m. de lunes a sábado y te llega ese mismo día entre 12 y 7 p.m. El delivery no te cuesta nada y le pagas al motorizado cuando ya lo tienes en la mano.</p>
            <CutoffClock />
          </div>
          <div className="sh">
            <h3>Lima, para ya — express</h3>
            <p>Ya pasó el corte, o simplemente no puedes esperar a la tarde. Te mandamos una moto directa y llega en cuestión de horas. Lo coordinamos por WhatsApp según tu distrito. El pago anticipado es obligatorio antes del despacho.</p>
            <div className="val">Gratis desde S/ 200</div>
            <span className="cap2">Antes de la meta: S/ 10 a S/ 30 según distrito</span>
          </div>
          <div className="sh">
            <h3>Provincias — gratis</h3>
            <p>Shalom u Olva a todo el Perú, sin costo de envío. Recoges en agencia con tu DNI y el pago va por adelantado.</p>
            <div className="val">Gratis</div>
            <span className="cap2">2 a 5 días hábiles</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export const FAQ_ITEMS = [
  ['¿Cómo confirmo el modelo del producto?', 'Consulta el modelo exacto, la versión y los accesorios disponibles antes de comprar. Las fichas muestran las fuentes y señalan las características pendientes de verificar.'],
  ['¿De verdad puedo pagar al recibir?', 'En Lima sí, en el delivery del día: pagas al motorizado en efectivo, Yape o Plin cuando ya lo tienes en la mano. Hay dos casos donde el pago va por adelantado: el envío a provincias, porque el flete por agencia sale de nuestra cuenta, y el express, porque mandamos una moto directa solo por tu pedido.'],
  ['¿A qué hora llega si pido ahora?', 'Antes de las 9:00 a.m. de lunes a sábado, llega ese mismo día entre 12 y 7 p.m., y el delivery es gratis. Después del corte, al día siguiente en la misma ventana. Domingos no despachamos.'],
  ['¿Cuánto cuesta el delivery?', 'La entrega programada entre 12 y 7 p.m. en Lima es gratis, y a provincias también. El express es gratis desde S/ 200 de compra. Antes de esa meta tiene un recargo de S/ 10, S/ 15, S/ 20, S/ 25 o S/ 30 según la distancia desde Pueblo Libre.'],
  ['¿Llega a mi ciudad?', 'A todo el Perú por Shalom u Olva, con envío gratis y 2 a 5 días hábiles. Recoges en agencia con tu DNI.'],
  ['¿Funciona con iPhone?', 'La compatibilidad depende del modelo, la versión de tu teléfono y la app requerida. Consulta la ficha y confirma los requisitos antes de comprar.'],
  ['¿Qué pasa si no me gusta?', 'Cambio dentro de 7 días si llega con falla de fábrica, con caja y accesorios completos. Por cambio de opinión no devolvemos el dinero, y preferimos decírtelo antes de que compres.'],
  ['¿Cómo presento un reclamo?', 'Tienes nuestro Libro de Reclamaciones virtual siempre disponible. Respondemos en un máximo de 15 días hábiles.'],
] as const;

export function Faq() {
  return (
    <section id="faq" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="shead c"><span className="eb c">Antes de comprar</span><h2>Lo que siempre nos preguntan</h2></div>
        <div className="faq">
          {FAQ_ITEMS.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}</summary>
              <div className="ans">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
