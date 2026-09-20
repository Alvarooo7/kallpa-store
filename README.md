# Kallpita Store — tienda en Next.js

Tienda de tecnología con stock propio en Lima: delivery gratis el mismo día con
corte a las 9 a.m., express desde S/ 10, envío gratis a provincias y pago contra
entrega.

```bash
cp .env.example .env.local     # completa NEXT_PUBLIC_SITE_URL y el WhatsApp
npm install
npm run dev                    # http://localhost:3000
```

Next.js 15 (App Router) · React 19 · TypeScript estricto · sin dependencias de UI.

---

## Cómo está organizado

```
src/
├─ app/
│  ├─ page.tsx                    home
│  ├─ p/[slug]/page.tsx           ficha por producto (SSG + metadata + JSON-LD)
│  ├─ envios/page.tsx
│  ├─ legal/[doc]/page.tsx        cambios · privacidad · terminos
│  ├─ libro-de-reclamaciones/
│  ├─ sitemap.ts · robots.ts
│  └─ api/{orders,leads,reclamaciones}/route.ts
├─ components/                    Header, Footer, fichas, carrito, modales
└─ lib/
   ├─ catalog.ts                  los 7 productos (hoy en memoria)
   ├─ company.ts                  razón social, RUC, correo, WhatsApp
   ├─ delivery.ts                 la lógica del corte de las 9 a.m.
   ├─ legal.ts                    los tres documentos
   ├─ seo.tsx                     metadata + datos estructurados
   └─ analytics.ts                capa de eventos
```

### Por qué no hay Tailwind

El CSS de esta tienda son ~1.000 líneas con tokens y componentes ya afinados
(`app/globals.css`). Con 7 productos y una sola plantilla de página, meter Tailwind
agregaría un paso de build y una capa de abstracción sin resolver ningún problema
real. Si tu equipo crece y lo prefieren, se puede montar encima sin tocar la lógica:
los estilos están aislados en un solo archivo.

---

## Lo que ya funciona

- **Una URL por producto** (`/p/lenovo-xt80`), prerenderizada, con su título,
  meta description, canonical, Open Graph y JSON-LD de `Product` con precio,
  fotografías, oferta cuando existe precio, envío y política de devolución.
- **`sitemap.xml` y `robots.txt`** generados desde el catálogo.
- **Promesa de entrega en vivo**: `lib/delivery.ts` es una función pura sobre la
  hora de Lima. El contador solo corre en el cliente para no romper la hidratación.
- Carrito con barra de express gratis, favoritos en `localStorage`, buscador que
  indexa toda la ficha técnica, modal de pedido que se bifurca Lima/provincia.
- Libro de Reclamaciones con los campos del D.S. 011-2011-PCM.
- Eventos con los nombres estándar de Meta (`lib/analytics.ts`).

## Lo que falta para vender de verdad

1. **Base de datos.** Hoy `lib/catalog.ts` está en memoria. Al conectar Postgres:
   productos, variantes, `bundles` + `bundle_items` con regla de precio, cupones
   con `max_uses` y vencimiento, pedidos con el precio **congelado** en
   `order_items`, e IGV en columna propia desde el primer día.
2. **Pasarela de pago.** Izipay, Culqi o Mercado Pago. Lo que bloquea es el
   *webhook*: sin confirmación automática, el pedido no se cierra solo.
   `api/orders/route.ts` ya deja el hueco marcado.
3. **Correo transaccional** (Resend u otro) para confirmación de pedido, cupón y
   copia del libro de reclamaciones.
4. **Numeración correlativa real** en `api/reclamaciones`. Hoy es aleatoria y eso
   no cumple la norma.
5. **Datos comerciales.** Confirmar precios, stock y variantes pendientes en
   `CATALOG_RESEARCH.md`. Ya se importaron 34 fotografías y tres videos locales.
6. **Meta Pixel.** Pega el snippet en `layout.tsx` y `track()` empieza a enviar.
   Para señal que resista bloqueadores, reenvía el mismo evento por Conversions
   API desde las rutas de `/api`.

## Datos de la empresa

Están en un solo lugar: `src/lib/company.ts`. Si cambia el correo o el WhatsApp,
se cambia ahí y se propaga a la tienda, al pie, a los documentos legales y al
schema.

## Nota legal

Los textos de `lib/legal.ts` son una base de trabajo preparada sobre la operación
real, no asesoría legal. Conviene que los revise un abogado antes de publicar.
