import { COMPANY } from './company';

const CO = COMPANY;
const EMPRESA = `<b>${CO.legalName}</b>, RUC ${CO.ruc}, con domicilio en ${CO.address}, ${CO.city}, Perú`;

export type LegalDoc = { t: string; body: string };

const DOCS = {
  cambios: { t:'Cambios y devoluciones', body:`
    <h4>Garantía de 3 meses</h4>
    <p>Todos los equipos tienen <b>3 meses de garantía</b> contra defectos de fábrica, contados desde la fecha de entrega. La garantía cubre fallas de funcionamiento del equipo y se hace efectiva presentando la boleta o el número de pedido.</p>
    <p>No cubre: daño por caída, humedad fuera de la certificación del equipo, contacto con químicos, intento de reparación por terceros, ni desgaste normal de accesorios como correas, almohadillas y micas.</p>
    <h4>Cambio dentro de 7 días</h4>
    <p>Si el equipo llega con falla de fábrica, lo cambiamos por uno nuevo dentro de los <b>7 días calendario</b> siguientes a la entrega, siempre que devuelvas la caja y los accesorios completos. El recojo y el reenvío corren por nuestra cuenta.</p>
    <h4>Cambio de opinión</h4>
    <p>No devolvemos dinero por cambio de opinión, y preferimos decírtelo antes de que compres en vez de después. Si el equipo no era lo que esperabas y está sin uso, con precinto y accesorios completos, podemos evaluar un cambio por otro producto de la tienda dentro de los 7 días; el costo del traslado en ese caso lo asume el cliente.</p>
    <h4>Productos digitales</h4>
    <p>Las guías y plantillas se entregan por descarga inmediata. Por su naturaleza, <b>no admiten devolución</b> una vez enviado el enlace de acceso. Esto se indica antes de la compra.</p>
    <h4>Cómo pedirlo</h4>
    <p>Escríbenos por WhatsApp al <b>${CO.whatsappPretty}</b> con tu número de pedido y una foto o video de la falla. Te respondemos el mismo día hábil y coordinamos el recojo.</p>`},

  privacidad: { t:'Política de privacidad', body:`
    <p>${EMPRESA} (en adelante, “Kallpa”) trata tus datos personales conforme a la <b>Ley 29733, Ley de Protección de Datos Personales</b>, y su reglamento.</p>
    <h4>Qué datos recogemos</h4>
    <ul>
      <li><b>Para entregarte el pedido:</b> nombre, DNI cuando la agencia lo exige, teléfono, correo, dirección y distrito.</li>
      <li><b>Para la boleta:</b> los datos que la SUNAT exige para emitir el comprobante.</li>
      <li><b>Si te suscribes:</b> tu correo, para mandarte el cupón y avisos de stock.</li>
      <li><b>De navegación:</b> páginas vistas y productos consultados, mediante cookies y herramientas de medición.</li>
    </ul>
    <h4>Para qué los usamos</h4>
    <p>Para procesar y entregar tu pedido, emitir el comprobante, atenderte por WhatsApp, cumplir la garantía y, si nos diste permiso, enviarte ofertas. <b>No vendemos tus datos a terceros.</b></p>
    <h4>Con quién los compartimos</h4>
    <p>Solo con quien hace falta para que el pedido llegue: el repartidor asignado, la agencia de envíos (Shalom u Olva) cuando el destino es provincia, y la pasarela de pago si eliges tarjeta. Cada uno recibe únicamente el dato que necesita.</p>
    <h4>Cuánto tiempo</h4>
    <p>Los datos de compra se conservan mientras dure la relación comercial y el plazo que exige la normativa tributaria. Los datos de marketing, hasta que pidas que los borremos.</p>
    <h4>Tus derechos</h4>
    <p>Puedes pedir acceso, rectificación, cancelación u oposición al tratamiento de tus datos (derechos ARCO) escribiendo a <b>${CO.email}</b> o por WhatsApp al ${CO.whatsappPretty}. Respondemos en los plazos que fija la ley. También puedes acudir a la Autoridad Nacional de Protección de Datos Personales si consideras que no atendimos tu solicitud.</p>
    <h4>Cookies</h4>
    <p>Usamos cookies propias para recordar tu carrito y tus favoritos, y cookies de terceros para medir el rendimiento de nuestros anuncios. Puedes bloquearlas desde tu navegador; si lo haces, el carrito puede dejar de recordar lo que agregaste.</p>`},

  terminos: { t:'Términos y condiciones', body:`
    <p>Estos términos regulan las compras en esta tienda, operada por ${EMPRESA}.</p>
    <h4>Precios</h4>
    <p>Todos los precios están en <b>soles e incluyen IGV</b>. El precio tachado es el precio de lista de referencia; el precio vigente es el que ves al momento de comprar. Podemos cambiar precios y promociones en cualquier momento, pero nunca después de que hayas confirmado un pedido.</p>
    <h4>Stock</h4>
    <p>Trabajamos con stock propio y la cantidad mostrada en cada ficha es real. Si por un error de inventario el equipo no estuviera disponible, te avisamos el mismo día y te devolvemos cualquier monto adelantado, completo.</p>
    <h4>Formas de pago</h4>
    <ul>
      <li><b>Contra entrega</b> en Lima, en el delivery del día: efectivo, Yape o Plin al repartidor.</li>
      <li><b>Por adelantado</b> en dos casos: envíos a provincia y servicio express. Yape, Plin, transferencia o tarjeta.</li>
    </ul>
    <h4>Entregas</h4>
    <p>Los pedidos hechos antes de las <b>9:00 a.m.</b> de lunes a sábado se entregan ese mismo día entre 12 y 7 p.m. en Lima, sin costo. Después del corte, al día siguiente hábil. El express es gratis desde S/ 200 de compra; para importes menores tiene un costo desde S/ 10 según distrito. El pedido express se paga por adelantado. A provincias enviamos por Shalom u Olva, sin costo, con entrega estimada de 2 a 5 días hábiles; ese plazo depende de la agencia y no es una garantía nuestra.</p>
    <p>Si nadie recibe el pedido en la dirección indicada, coordinamos una segunda visita. A partir de la tercera visita fallida, el pedido se cancela.</p>
    <h4>Comprobante</h4>
    <p>Emitimos boleta electrónica por cada venta. Si necesitas factura, indícanoslo antes de confirmar el pedido con el RUC y la razón social.</p>
    <h4>Cupones</h4>
    <p>Los cupones son de un solo uso por persona, tienen fecha de vencimiento y no se acumulan entre sí salvo que se indique lo contrario.</p>
    <h4>Reclamos</h4>
    <p>Puedes registrar un reclamo o una queja en nuestro <b>Libro de Reclamaciones virtual</b>, disponible en el pie de esta página. Responderemos en un plazo máximo de 15 días hábiles.</p>
    <h4>Ley aplicable</h4>
    <p>Estos términos se rigen por las leyes de la República del Perú, incluido el Código de Protección y Defensa del Consumidor (Ley 29571).</p>`}
};
export const LEGAL_DOCS: Record<string, LegalDoc> = DOCS;
export const LEGAL_SLUGS = Object.keys(DOCS);
export const isLegalSlug = (s: string): s is keyof typeof DOCS => s in DOCS;
