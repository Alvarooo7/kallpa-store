-- Variantes reutilizables: colores, sabores, tallas y presentaciones.
create table if not exists product_variants (
  id           text primary key,
  product_slug text not null,
  sku          text not null unique,
  label        text not null,
  color        text,
  flavor       text,
  size         text,
  presentation text,
  swatch       text,
  price_cents  integer check (price_cents is null or price_cents >= 0),
  attributes   jsonb not null default '{}'::jsonb,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_slug, id)
);
create index if not exists product_variants_product_idx on product_variants (product_slug) where active;

create table if not exists variant_inventory (
  variant_id text primary key references product_variants(id) on delete cascade,
  on_hand    integer not null default 0 check (on_hand >= 0),
  reserved   integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now()
);

alter table order_items add column if not exists variant_id text;
alter table order_items add column if not exists variant_sku text;
alter table order_items add column if not exists variant_label text;
alter table order_items add column if not exists variant_attributes jsonb not null default '{}'::jsonb;
alter table stock_moves add column if not exists variant_id text;

alter table product_variants enable row level security;
alter table variant_inventory enable row level security;

insert into product_variants (id, product_slug, sku, label, flavor, swatch)
values
  ('proteina-vainilla', 'proteina-deportiva', 'PROT-VAI', 'Vainilla', 'Vainilla', '#F3E5B7'),
  ('proteina-cookies-cream', 'proteina-deportiva', 'PROT-COO', 'Cookies & Cream', 'Cookies & Cream', '#D8D1C8')
on conflict (id) do update set
  product_slug = excluded.product_slug,
  sku = excluded.sku,
  label = excluded.label,
  flavor = excluded.flavor,
  swatch = excluded.swatch,
  updated_at = now();

insert into variant_inventory (variant_id)
values ('proteina-vainilla'), ('proteina-cookies-cream')
on conflict (variant_id) do nothing;

create or replace function reserve_order_stock(p_slug text, p_variant_id text, p_qty integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if nullif(p_variant_id, '') is null then
    return reserve_stock(p_slug, p_qty);
  end if;

  update variant_inventory vi
     set reserved = vi.reserved + p_qty, updated_at = now()
    from product_variants pv
   where vi.variant_id = p_variant_id
     and pv.id = vi.variant_id
     and pv.product_slug = p_slug
     and pv.active
     and vi.on_hand - vi.reserved >= p_qty;
  get diagnostics affected = row_count;
  return affected = 1;
end $$;

create or replace function create_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key          text := nullif(p->>'idempotency_key', '');
  v_prev         orders%rowtype;
  v_line         jsonb;
  v_customer_id  bigint;
  v_order_id     bigint;
  v_number       text;
  v_subtotal     integer := (p->>'subtotal_cents')::integer;
  v_igv          integer := (p->>'igv_cents')::integer;
  v_shipping     integer := coalesce((p->>'shipping_cents')::integer, 0);
  v_ship         jsonb := coalesce(p->'shipping', '{}'::jsonb);
  v_email        text := lower(nullif(trim(p#>>'{customer,email}'), ''));
  v_phone        text := p#>>'{customer,phone_e164}';
  v_marketing_ok boolean := coalesce((p#>>'{customer,marketing_ok}')::boolean, false);
begin
  if v_key is not null then
    select * into v_prev from orders where idempotency_key = v_key;
    if found then
      return jsonb_build_object('ok', true, 'id', v_prev.id, 'number', v_prev.number,
        'total_cents', v_prev.total_cents, 'igv_cents', v_prev.igv_cents, 'reused', true);
    end if;
  end if;

  if v_email is null then raise exception 'customer_email_required'; end if;

  begin
    for v_line in select * from jsonb_array_elements(p->'lines') loop
      if not reserve_order_stock(v_line->>'slug', v_line->>'variant_id', (v_line->>'qty')::integer) then
        raise exception 'no_stock:%', v_line->>'slug';
      end if;
    end loop;

    select id into v_customer_id
      from customers
     where lower(email) = v_email or phone_e164 = v_phone
     order by case when lower(email) = v_email then 0 else 1 end, id desc
     limit 1;

    if v_customer_id is null then
      insert into customers (email, name, phone_e164, marketing_ok)
      values (v_email, p#>>'{customer,name}', v_phone, v_marketing_ok)
      returning id into v_customer_id;
    else
      update customers set email = v_email, name = p#>>'{customer,name}', phone_e164 = v_phone,
        marketing_ok = customers.marketing_ok or v_marketing_ok
      where id = v_customer_id;
    end if;

    if v_marketing_ok then
      insert into subscribers (email, source) values (v_email, 'checkout')
      on conflict (email) do nothing;
    end if;

    v_number := 'VD-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
                lpad(nextval('order_seq')::text, 6, '0');

    insert into orders (number, customer_id, zone, is_express, pay_method,
                        subtotal_cents, shipping_cents, igv_cents, total_cents, idempotency_key)
    values (v_number, v_customer_id, p->>'zone', (p->>'is_express')::boolean,
            (p->>'pay_method')::pay_method, v_subtotal, v_shipping, v_igv, v_subtotal + v_shipping, v_key)
    returning id into v_order_id;

    insert into order_items (order_id, product_slug, product_name, qty, unit_cents, line_cents,
                             variant_id, variant_sku, variant_label, variant_attributes)
    select v_order_id, l->>'slug', l->>'name', (l->>'qty')::integer,
           (l->>'unit_cents')::integer, (l->>'qty')::integer * (l->>'unit_cents')::integer,
           nullif(l->>'variant_id', ''), nullif(l->>'variant_sku', ''), nullif(l->>'variant_label', ''),
           coalesce(l->'variant_attributes', '{}'::jsonb)
      from jsonb_array_elements(p->'lines') l;

    insert into stock_moves (product_slug, variant_id, delta, reason, order_id)
    select l->>'slug', nullif(l->>'variant_id', ''), -(l->>'qty')::integer, 'venta', v_order_id
      from jsonb_array_elements(p->'lines') l;

    insert into shipping_details (order_id, district, address, reference, city, agency, dni)
    values (v_order_id, v_ship->>'district', v_ship->>'address', v_ship->>'reference',
            v_ship->>'city', v_ship->>'agency', v_ship->>'dni');

    return jsonb_build_object('ok', true, 'id', v_order_id, 'number', v_number,
      'total_cents', v_subtotal + v_shipping, 'igv_cents', v_igv, 'reused', false);
  exception
    when raise_exception then
      if sqlerrm like 'no_stock:%' then
        return jsonb_build_object('ok', false, 'reason', 'no_stock', 'slug', substr(sqlerrm, 10));
      end if;
      raise;
    when unique_violation then
      if v_key is not null then
        select * into v_prev from orders where idempotency_key = v_key;
        if found then
          return jsonb_build_object('ok', true, 'id', v_prev.id, 'number', v_prev.number,
            'total_cents', v_prev.total_cents, 'igv_cents', v_prev.igv_cents, 'reused', true);
        end if;
      end if;
      raise;
  end;
end $$;

create or replace function release_stock(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare line record;
begin
  for line in select product_slug, variant_id, qty from order_items where order_id = p_order_id loop
    if line.variant_id is null then
      update inventory set reserved = greatest(0, reserved - line.qty), updated_at = now()
       where product_slug = line.product_slug;
    else
      update variant_inventory set reserved = greatest(0, reserved - line.qty), updated_at = now()
       where variant_id = line.variant_id;
    end if;
  end loop;
end $$;

revoke execute on function reserve_order_stock(text, text, integer) from public, anon, authenticated;
revoke execute on function create_order(jsonb) from public, anon, authenticated;
grant execute on function reserve_order_stock(text, text, integer) to service_role;
grant execute on function create_order(jsonb) to service_role;
