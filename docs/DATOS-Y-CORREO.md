# Datos y correo — plan de trabajo

Estado al 18 de septiembre de 2026. Cubre todo lo que toca base de datos y
correo transaccional, en el orden en que conviene hacerlo.

---

## El problema de fondo

Las tres rutas de `/api` devuelven hoy un número que **no existe en ningún lado**:

| Ruta | Devuelve | Realidad |
| --- | --- | --- |
| `/api/orders` | `VD-2026-4837` | Nadie lo guardó. El cliente no puede rastrearlo y tú no puedes buscarlo. |
| `/api/leads` | `VD10-K3PX` | Ningún sistema puede validarlo después. Cualquiera puede inventar uno. |
| `/api/reclamaciones` | `LR-2026-2910` | Aleatorio. La norma exige **numeración correlativa** y conservación del registro. |

Por eso **la base va primero**: mandar un correo de confirmación de un pedido que
no está guardado es prometer algo que no puedes cumplir, y el webhook de la
pasarela necesita una fila donde escribir "pagado".

Orden: **base de datos → correo → pasarela**.

---

## 1. Base de datos

### Elección

- **Neon** (Postgres serverless). Se lleva bien con Vercel, escala a cero y el
  plan gratuito sobra para el volumen inicial. Alternativa: Supabase, si más
  adelante quieres además su auth y su storage para las fotos.
- **Drizzle** como ORM. Tipado de verdad, migraciones en SQL legible y sin el
  peso de Prisma en funciones serverless.

```bash
npm i drizzle-orm @neondatabase/serverless
npm i -D drizzle-kit
```

### Qué va a la base y qué se queda en el código

El **catálogo se queda en `src/lib/catalog.ts` por ahora**. Con 7 productos que
edita una sola persona, tenerlo versionado en git es una ventaja: cada cambio de
precio queda con fecha y autor, y `CATALOG_RESEARCH.md` documenta de dónde salió
cada dato. Se migra a la base cuando pasen de ~20 SKUs o cuando alguien más
tenga que editar precios sin tocar el repo.

Lo que **sí** va a la base desde el día uno es todo lo transaccional: pedidos,
clientes, stock, cupones y reclamaciones.

### Esquema

```sql
-- ---------- clientes ----------
create table customers (
  id            bigserial primary key,
  email         text not null,
  phone_e164    text not null,
  name          text not null,
  marketing_ok  boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (email)
);

-- ---------- pedidos ----------
create type order_status as enum ('pending','confirmed','paid','shipped','delivered','cancelled','rejected');
create type order_channel as enum ('web','whatsapp');
create type pay_method as enum ('cod','yape','transfer','card');

create table orders (
  id               bigserial primary key,
  number           text not null unique,          -- VD-2026-000123, correlativo
  customer_id      bigint not null references customers(id),
  status           order_status not null default 'pending',
  channel          order_channel not null default 'web',
  zone             text not null check (zone in ('lima','prov')),
  is_express       boolean not null default false,
  pay_method       pay_method not null,
  -- importes en céntimos, siempre enteros
  subtotal_cents   integer not null,
  discount_cents   integer not null default 0,
  shipping_cents   integer not null default 0,
  igv_cents        integer not null,              -- desagregado desde el día uno
  total_cents      integer not null,
  coupon_id        bigint references coupons(id),
  idempotency_key  text unique,                   -- evita el pedido duplicado por doble clic
  payment_ref      text,                          -- id de la pasarela
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table order_items (
  id             bigserial primary key,
  order_id       bigint not null references orders(id) on delete cascade,
  product_slug   text not null,
  product_name   text not null,                   -- congelado: el nombre de ese día
  qty            integer not null check (qty > 0),
  unit_cents     integer not null,                -- congelado: el precio de ese día
  line_cents     integer not null
);

create table shipping_details (
  order_id     bigint primary key references orders(id) on delete cascade,
  district     text,          -- Lima
  address      text,
  reference    text,
  city         text,          -- provincia
  agency       text,          -- Shalom | Olva
  dni          text,
  tracking     text,
  window_from  timestamptz,   -- la ventana 12–7 p.m. prometida
  window_to    timestamptz
);

-- ---------- stock ----------
create table inventory (
  product_slug text primary key,
  on_hand      integer not null default 0 check (on_hand >= 0),
  reserved     integer not null default 0 check (reserved >= 0)
);

create table stock_moves (
  id           bigserial primary key,
  product_slug text not null,
  delta        integer not null,
  reason       text not null,   -- compra | venta | devolucion | ajuste | merma
  order_id     bigint references orders(id),
  created_at   timestamptz not null default now()
);

-- ---------- cupones ----------
create table coupons (
  id               bigserial primary key,
  code             text not null unique,
  kind             text not null check (kind in ('percent','amount','free_express')),
  value            integer not null,
  min_subtotal_cents integer not null default 0,
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  max_uses         integer,
  max_uses_per_customer integer not null default 1,
  stacks_with_sale boolean not null default false,
  created_at       timestamptz not null default now()
);

create table coupon_redemptions (
  id         bigserial primary key,
  coupon_id  bigint not null references coupons(id),
  order_id   bigint not null references orders(id),
  email      text not null,
  used_at    timestamptz not null default now(),
  unique (coupon_id, email)        -- un uso por persona, garantizado por la base
);

-- ---------- suscriptores ----------
create table subscribers (
  id           bigserial primary key,
  email        text not null unique,
  source       text not null default 'popup',
  coupon_id    bigint references coupons(id),
  confirmed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------- libro de reclamaciones ----------
create type claim_kind as enum ('reclamo','queja');
create type claim_status as enum ('recibido','en_revision','respondido','cerrado');

create table claims (
  id              bigserial primary key,
  sheet_number    text not null unique,     -- LR-2026-000045, CORRELATIVO
  kind            claim_kind not null,
  status          claim_status not null default 'recibido',
  -- consumidor
  name            text not null,
  doc_id          text not null,
  email           text not null,
  phone           text not null,
  address         text,
  guardian        text,                     -- si es menor de edad
  -- bien contratado
  product         text not null,
  order_number    text,
  amount_cents    integer,
  -- reclamo
  detail          text not null,
  request         text not null,
  -- proveedor
  response        text,
  responded_at    timestamptz,
  due_at          timestamptz not null,     -- 15 días hábiles desde created_at
  created_at      timestamptz not null default now()
);

create table claim_events (
  id         bigserial primary key,
  claim_id   bigint not null references claims(id) on delete cascade,
  event      text not null,   -- recibido | copia_enviada | respondido | ampliado
  payload    jsonb,
  created_at timestamptz not null default now()
);

-- ---------- correos enviados ----------
create table emails (
  id          bigserial primary key,
  to_email    text not null,
  template    text not null,
  ref         text,            -- número de pedido o de hoja
  provider_id text,
  status      text not null default 'queued',  -- queued | sent | failed
  error       text,
  created_at  timestamptz not null default now()
);
```

### Numeración correlativa

No sirve `random()`. Dos opciones, en orden de preferencia:

```sql
-- Una secuencia por tipo, reiniciada a mano cada año si quieres el año en el número
create sequence order_seq;
create sequence claim_seq;

-- number = 'VD-' || to_char(now(),'YYYY') || '-' || lpad(nextval('order_seq')::text, 6, '0')
```

Una secuencia es atómica aunque entren diez pedidos en el mismo segundo. Si
prefieres reiniciar el contador cada año, una tabla `counters(scope, year, n)`
con `update ... returning n` dentro de la transacción también es atómica.

**Para el libro de reclamaciones la correlatividad no es una preferencia: es lo
que exige la norma.** Y el registro se conserva.

### Reserva de stock sin carrera

```sql
update inventory
   set reserved = reserved + $qty
 where product_slug = $slug
   and on_hand - reserved >= $qty
returning *;
```

Si no devuelve fila, no hay stock: se rechaza el pedido con un mensaje claro.
Todo dentro de la misma transacción que crea el pedido.

### Idempotencia

El doble clic en "Confirmar" hoy crearía dos pedidos. El cliente manda un
`Idempotency-Key` (un uuid generado al abrir el modal); la columna `unique` en
`orders.idempotency_key` hace el resto: el segundo intento devuelve el pedido ya
creado en vez de uno nuevo.

---

## 2. Correo transaccional

### Lo primero, y es un bloqueo real

**No se puede enviar desde `kallpa.contacto.peru@gmail.com`.** Ningún proveedor
serio firma correo de un dominio que no controlas, y Gmail y Outlook lo mandarían
a spam o lo rechazarían. Hace falta:

1. Un dominio propio (`kallpita.store`).
2. Verificarlo en el proveedor con sus registros **SPF, DKIM y DMARC**.
3. Enviar desde `pedidos@notifications.kallpita.store`, con `reply-to` al Gmail si quieres seguir
   leyendo las respuestas ahí.

Sin esto, el correo de confirmación no llega, y un cliente que pagó y no recibe
nada escribe por WhatsApp molesto. Es media hora de DNS y evita ese problema.

### Proveedor

**Resend**. API directa, dominios y DKIM en el panel, plantillas en React si las
quieres, y plan gratuito holgado para el volumen inicial.

```bash
npm i resend
```

### Los seis correos

| # | Cuándo | A quién | Contenido |
| --- | --- | --- | --- |
| 1 | Pedido creado | Cliente | Número, qué compró, total, **ventana de entrega exacta**, cómo paga, botón de WhatsApp |
| 2 | Pedido creado | **Tú** | Aviso interno con dirección, distrito y teléfono. Es el que hace que el negocio funcione |
| 3 | Pago confirmado | Cliente | Comprobante, para pedidos anticipados y express |
| 4 | Cupón solicitado | Suscriptor | El código, su vencimiento y la condición |
| 5 | Reclamo registrado | Cliente + empresa | **Copia de la hoja** con su número y el plazo de 15 días hábiles. Es obligatorio |
| 6 | Reclamo respondido | Cliente | La respuesta formal dentro del plazo |

### Dos reglas de implementación

**El correo nunca tumba el pedido.** Se envía *después* de confirmar la
transacción, y si falla, se registra en la tabla `emails` con `status='failed'` y
se reintenta aparte. Un fallo de SMTP no puede hacer que el cliente pierda su
compra.

**Nada de datos personales en los logs.** Hoy `console.info` imprime el correo
del cliente en las tres rutas. En producción eso termina en el panel de Vercel:
loguea el número de pedido, no el correo.

---

## 3. Hallazgos en el código actual

| Dónde | Qué pasa | Arreglo |
| --- | --- | --- |
| `api/orders` | `throw new Error` dentro del `.map` devuelve **500** en vez de 400. Además es código muerto: el `some(...)` de arriba ya atrapa los slugs desconocidos, pero con el mensaje equivocado ("consulta el precio" cuando en realidad el producto no existe) | Validar slugs primero y devolver 400 con el mensaje correcto |
| `api/orders` | No valida el formato del teléfono ni del correo | Mismo regex que en `leads`, y normalizar el celular a E.164 |
| `api/orders` | El cupón se recibe pero no se aplica ni se valida | Entra con la tabla `coupons` |
| `api/leads` | Genera un código que nadie puede canjear | Insertar el cupón real y devolver ese código |
| `api/reclamaciones` | Número aleatorio y sin persistencia | Secuencia + tabla `claims` |
| Las tres | `console.info` con correo del cliente | Quitar la PII del log |

---

## Orden sugerido

1. Neon + Drizzle + el esquema de arriba, con seed del inventario de los 7 productos.
2. `/api/orders` escribiendo de verdad: transacción, correlativo, reserva de stock, idempotencia.
3. `/api/reclamaciones` con correlativo y persistencia — es lo legalmente exigible.
4. Dominio y DKIM, luego Resend con los correos 1, 2 y 5.
5. Cupones reales en `/api/leads` y validación en `/api/orders`.
6. Recién ahí, la pasarela y su webhook.

---

## Avance — 18 de septiembre de 2026

Hecho:

- **Limpieza de las tres rutas.** El `throw` que devolvía 500 se fue; ahora un
  slug desconocido da 400 con su propio mensaje, separado del de "consulta el
  precio". Se valida el correo y el celular se normaliza a E.164. Los `console`
  ya no imprimen datos personales: va el número de pedido, y cuando hace falta
  el correo para depurar, enmascarado (`ma***@gmail.com`).
- **Capa de datos** con `@supabase/supabase-js` (service key, solo servidor): `src/lib/db/{index,orders,claims}.ts`.
- **Migraciones** en `supabase/migrations/`: `0001_init.sql` crea las doce tablas,
  las secuencias correlativas, la función `reserve_stock` y activa RLS en todas;
  `0002_seed_inventory.sql` carga los siete slugs y el cupón de bienvenida;
  `0003_rpc_functions.sql` crea `create_order`, `create_claim` y `release_stock`.
- `createOrder` llama al rpc `create_order` y hace todo en **una transacción**: reserva stock, crea cliente,
  saca correlativo, congela precio y nombre en `order_items` y guarda el envío.
  Si falta stock, la transacción se deshace entera.
- `createClaim` numera la hoja de forma **correlativa** y calcula el vencimiento
  a 15 días hábiles saltando sábados y domingos.
- **Sin `SUPABASE_SERVICE_ROLE_KEY` las rutas devuelven 503 con el enlace de WhatsApp.** No
  fingen un número de pedido que nadie guardó.

Para levantarlo:

```bash
npm install                     # en PowerShell, no por el puente: es mucho más rápido
# Supabase → SQL Editor → pegar 0001_init.sql → Run → luego 0002 y 0003
# .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Luego ajusta el stock real:

```sql
update inventory set on_hand = 12 where product_slug = 'lenovo-xt80';
```

Siguiente: el correo. Antes hace falta el dominio con SPF y DKIM — sin eso no
sale nada.
