-- Disponibilidad derivada del stock real. "coming_soon" e "inactive" son
-- excepciones editoriales; los otros estados cambian con on_hand - reserved.
alter table inventory
  add column if not exists availability_mode text not null default 'auto'
  check (availability_mode in ('auto', 'coming_soon', 'inactive'));
alter table inventory
  add column if not exists low_stock_threshold integer not null default 2
  check (low_stock_threshold >= 0);

alter table variant_inventory
  add column if not exists availability_mode text not null default 'auto'
  check (availability_mode in ('auto', 'coming_soon', 'inactive'));
alter table variant_inventory
  add column if not exists low_stock_threshold integer not null default 2
  check (low_stock_threshold >= 0);

insert into inventory (product_slug, on_hand, reserved, availability_mode)
values
  ('erazer-xf21', 0, 0, 'auto'),
  ('gorros-natacion', 0, 0, 'auto')
on conflict (product_slug) do update set
  on_hand = excluded.on_hand,
  reserved = excluded.reserved,
  availability_mode = excluded.availability_mode,
  updated_at = now();

insert into variant_inventory (variant_id, on_hand, reserved, availability_mode)
values
  ('proteina-vainilla', 3, 0, 'auto'),
  ('proteina-cookies-cream', 1, 0, 'auto'),
  ('creatina-250g', 2, 0, 'auto'),
  ('creatina-500g', 2, 0, 'auto'),
  ('torneo-verde', 2, 0, 'auto'),
  ('torneo-azul', 2, 0, 'auto'),
  ('torneo-negro', 2, 0, 'auto'),
  ('torneo-blanco', 2, 0, 'auto')
on conflict (variant_id) do update set
  on_hand = excluded.on_hand,
  reserved = excluded.reserved,
  availability_mode = excluded.availability_mode,
  updated_at = now();

drop view if exists catalog_availability;
create view catalog_availability
with (security_invoker = true)
as
select
  i.product_slug,
  null::text as variant_id,
  greatest(0, i.on_hand - i.reserved)::integer as available,
  case
    when i.availability_mode = 'inactive' then 'inactive'
    when i.availability_mode = 'coming_soon' then 'coming_soon'
    when i.on_hand - i.reserved <= 0 then 'out_of_stock'
    when i.on_hand - i.reserved <= i.low_stock_threshold then 'low_stock'
    else 'in_stock'
  end::text as status
from inventory i
union all
select
  pv.product_slug,
  vi.variant_id,
  greatest(0, vi.on_hand - vi.reserved)::integer as available,
  case
    when vi.availability_mode = 'inactive' then 'inactive'
    when vi.availability_mode = 'coming_soon' then 'coming_soon'
    when vi.on_hand - vi.reserved <= 0 then 'out_of_stock'
    when vi.on_hand - vi.reserved <= vi.low_stock_threshold then 'low_stock'
    else 'in_stock'
  end::text as status
from variant_inventory vi
join product_variants pv on pv.id = vi.variant_id and pv.active;

revoke all on catalog_availability from public, anon, authenticated;
grant select on catalog_availability to service_role;

-- Una reserva modifica la disponibilidad de inmediato. Los modos editoriales
-- no pueden venderse aunque tengan unidades cargadas.
create or replace function reserve_stock(p_slug text, p_qty integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  update inventory
     set reserved = reserved + p_qty, updated_at = now()
   where product_slug = p_slug
     and availability_mode = 'auto'
     and on_hand - reserved >= p_qty;
  get diagnostics affected = row_count;
  return affected = 1;
end $$;

create or replace function reserve_order_stock(p_slug text, p_variant_id text, p_qty integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
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
     and vi.availability_mode = 'auto'
     and vi.on_hand - vi.reserved >= p_qty;
  get diagnostics affected = row_count;
  return affected = 1;
end $$;

-- Punto único para compras, devoluciones, ajustes y mermas manuales. El estado
-- cambia automáticamente porque la vista se calcula con el saldo resultante.
create or replace function record_stock_move(
  p_slug text,
  p_variant_id text,
  p_delta integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
declare result jsonb;
begin
  if p_delta = 0 then raise exception 'stock_delta_zero'; end if;
  if p_reason not in ('compra','venta','devolucion','ajuste','merma') then
    raise exception 'stock_reason_invalid';
  end if;

  if nullif(p_variant_id, '') is null then
    update inventory
       set on_hand = on_hand + p_delta, updated_at = now()
     where product_slug = p_slug and on_hand + p_delta >= 0;
  else
    update variant_inventory vi
       set on_hand = vi.on_hand + p_delta, updated_at = now()
      from product_variants pv
     where vi.variant_id = p_variant_id
       and pv.id = vi.variant_id
       and pv.product_slug = p_slug
       and vi.on_hand + p_delta >= 0;
  end if;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'stock_move_invalid'; end if;

  insert into stock_moves (product_slug, variant_id, delta, reason)
  values (p_slug, nullif(p_variant_id, ''), p_delta, p_reason);

  select jsonb_build_object('available', available, 'status', status)
    into result
    from catalog_availability
   where product_slug = p_slug
     and variant_id is not distinct from nullif(p_variant_id, '');
  return result;
end $$;

create or replace function set_availability_mode(
  p_slug text,
  p_variant_id text,
  p_mode text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_mode not in ('auto', 'coming_soon', 'inactive') then
    raise exception 'availability_mode_invalid';
  end if;

  if nullif(p_variant_id, '') is null then
    update inventory set availability_mode = p_mode, updated_at = now()
     where product_slug = p_slug;
  else
    update variant_inventory vi set availability_mode = p_mode, updated_at = now()
      from product_variants pv
     where vi.variant_id = p_variant_id
       and pv.id = vi.variant_id
       and pv.product_slug = p_slug;
  end if;
end $$;

revoke execute on function reserve_stock(text, integer) from public, anon, authenticated;
revoke execute on function reserve_order_stock(text, text, integer) from public, anon, authenticated;
revoke execute on function record_stock_move(text, text, integer, text) from public, anon, authenticated;
revoke execute on function set_availability_mode(text, text, text) from public, anon, authenticated;
grant execute on function reserve_stock(text, integer) to service_role;
grant execute on function reserve_order_stock(text, text, integer) to service_role;
grant execute on function record_stock_move(text, text, integer, text) to service_role;
grant execute on function set_availability_mode(text, text, text) to service_role;
