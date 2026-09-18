-- Vendemia Store — esquema transaccional
-- Aplicar en Supabase: SQL Editor → pegar → Run.
-- El catálogo NO vive acá: está versionado en src/lib/catalog.ts.

-- ─────────────────────────── correlativos ───────────────────────────
-- Una secuencia es atómica aunque entren diez pedidos en el mismo segundo.
create sequence if not exists order_seq start 1;
create sequence if not exists claim_seq start 1;

-- ─────────────────────────── clientes ───────────────────────────
create table if not exists customers (
  id           bigserial primary key,
  email        text not null unique,
  phone_e164   text not null,
  name         text not null,
  marketing_ok boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────── cupones ───────────────────────────
create table if not exists coupons (
  id                    bigserial primary key,
  code                  text not null unique,
  kind                  text not null check (kind in ('percent','amount','free_express')),
  value                 integer not null default 0,
  min_subtotal_cents    integer not null default 0,
  starts_at             timestamptz not null default now(),
  ends_at               timestamptz,
  max_uses              integer,
  max_uses_per_customer integer not null default 1,
  stacks_with_sale      boolean not null default false,
  uses                  integer not null default 0,
  created_at            timestamptz not null default now()
);

-- ─────────────────────────── pedidos ───────────────────────────
do $$ begin
  create type order_status as enum ('pending','confirmed','paid','shipped','delivered','cancelled','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pay_method as enum ('cod','yape','transfer','card');
exception when duplicate_object then null; end $$;

create table if not exists orders (
  id              bigserial primary key,
  number          text not null unique,
  customer_id     bigint not null references customers(id),
  status          order_status not null default 'pending',
  channel         text not null default 'web' check (channel in ('web','whatsapp')),
  zone            text not null check (zone in ('lima','prov')),
  is_express      boolean not null default false,
  pay_method      pay_method not null,
  subtotal_cents  integer not null,
  discount_cents  integer not null default 0,
  shipping_cents  integer not null default 0,
  igv_cents       integer not null default 0,
  total_cents     integer not null,
  coupon_id       bigint references coupons(id),
  idempotency_key text unique,
  payment_ref     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx  on orders (status);

create table if not exists order_items (
  id           bigserial primary key,
  order_id     bigint not null references orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,      -- congelado
  qty          integer not null check (qty > 0),
  unit_cents   integer not null,   -- congelado
  line_cents   integer not null
);
create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists shipping_details (
  order_id    bigint primary key references orders(id) on delete cascade,
  district    text,
  address     text,
  reference   text,
  city        text,
  agency      text,
  dni         text,
  tracking    text,
  window_from timestamptz,
  window_to   timestamptz
);

-- ─────────────────────────── stock ───────────────────────────
create table if not exists inventory (
  product_slug text primary key,
  on_hand      integer not null default 0 check (on_hand >= 0),
  reserved     integer not null default 0 check (reserved >= 0),
  updated_at   timestamptz not null default now()
);

create table if not exists stock_moves (
  id           bigserial primary key,
  product_slug text not null,
  delta        integer not null,
  reason       text not null check (reason in ('compra','venta','devolucion','ajuste','merma')),
  order_id     bigint references orders(id),
  created_at   timestamptz not null default now()
);

-- ─────────────────────────── suscriptores ───────────────────────────
create table if not exists subscribers (
  id         bigserial primary key,
  email      text not null unique,
  source     text not null default 'popup',
  coupon_id  bigint references coupons(id),
  created_at timestamptz not null default now()
);

create table if not exists coupon_redemptions (
  id        bigserial primary key,
  coupon_id bigint not null references coupons(id),
  order_id  bigint not null references orders(id),
  email     text not null,
  used_at   timestamptz not null default now(),
  unique (coupon_id, email)   -- un uso por persona, garantizado por la base
);

-- ─────────────────────────── libro de reclamaciones ───────────────────────────
do $$ begin
  create type claim_kind as enum ('reclamo','queja');
exception when duplicate_object then null; end $$;

do $$ begin
  create type claim_status as enum ('recibido','en_revision','respondido','cerrado');
exception when duplicate_object then null; end $$;

create table if not exists claims (
  id           bigserial primary key,
  sheet_number text not null unique,     -- CORRELATIVO, lo exige la norma
  kind         claim_kind not null,
  status       claim_status not null default 'recibido',
  name         text not null,
  doc_id       text not null,
  email        text not null,
  phone        text not null,
  address      text,
  guardian     text,
  product      text not null,
  order_number text,
  amount_cents integer,
  detail       text not null,
  request      text not null,
  response     text,
  responded_at timestamptz,
  due_at       timestamptz not null,     -- 15 días hábiles
  created_at   timestamptz not null default now()
);
create index if not exists claims_due_idx on claims (due_at) where status <> 'cerrado';

create table if not exists claim_events (
  id         bigserial primary key,
  claim_id   bigint not null references claims(id) on delete cascade,
  event      text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────── correos ───────────────────────────
create table if not exists emails (
  id          bigserial primary key,
  to_email    text not null,
  template    text not null,
  ref         text,
  provider_id text,
  status      text not null default 'queued' check (status in ('queued','sent','failed')),
  error       text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────── RLS ───────────────────────────
-- Estas tablas solo se tocan desde el servidor con la service key.
-- RLS activo y sin políticas = nadie entra con la anon key, ni por error.
alter table customers          enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table shipping_details   enable row level security;
alter table inventory          enable row level security;
alter table stock_moves        enable row level security;
alter table coupons            enable row level security;
alter table coupon_redemptions enable row level security;
alter table subscribers        enable row level security;
alter table claims             enable row level security;
alter table claim_events       enable row level security;
alter table emails             enable row level security;

-- ─────────────────────────── reserva de stock sin carrera ───────────────────────────
create or replace function reserve_stock(p_slug text, p_qty integer)
returns boolean language plpgsql as $$
declare ok boolean;
begin
  update inventory
     set reserved = reserved + p_qty, updated_at = now()
   where product_slug = p_slug
     and on_hand - reserved >= p_qty;
  get diagnostics ok = row_count;
  return ok;
end $$;
