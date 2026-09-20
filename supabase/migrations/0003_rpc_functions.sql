-- Funciones atómicas que llama el servidor con supabase-js (rpc).
-- supabase-js habla REST y no tiene transacciones entre llamadas: cada función
-- corre entera en una sola transacción de Postgres, o no corre.
-- Aplicar en Supabase: SQL Editor → pegar → Run.

-- ─────────────────────────── pedido ───────────────────────────
create or replace function create_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key         text := nullif(p->>'idempotency_key', '');
  v_prev        orders%rowtype;
  v_line        jsonb;
  v_customer_id bigint;
  v_order_id    bigint;
  v_number      text;
  v_subtotal    integer := (p->>'subtotal_cents')::integer;
  v_igv         integer := (p->>'igv_cents')::integer;
  v_ship        jsonb   := coalesce(p->'shipping', '{}'::jsonb);
begin
  -- Idempotencia: el mismo doble clic devuelve el pedido ya creado.
  if v_key is not null then
    select * into v_prev from orders where idempotency_key = v_key;
    if found then
      return jsonb_build_object('ok', true, 'id', v_prev.id, 'number', v_prev.number,
        'total_cents', v_prev.total_cents, 'igv_cents', v_prev.igv_cents, 'reused', true);
    end if;
  end if;

  begin
    for v_line in select * from jsonb_array_elements(p->'lines') loop
      if not reserve_stock(v_line->>'slug', (v_line->>'qty')::integer) then
        -- Al salir por la excepción se deshacen también las reservas anteriores.
        raise exception 'no_stock:%', v_line->>'slug';
      end if;
    end loop;

    insert into customers (email, name, phone_e164)
    values (p#>>'{customer,email}', p#>>'{customer,name}', p#>>'{customer,phone_e164}')
    on conflict (email) do update
      set name = excluded.name, phone_e164 = excluded.phone_e164
    returning id into v_customer_id;

    v_number := 'VD-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
                lpad(nextval('order_seq')::text, 6, '0');

    insert into orders (number, customer_id, zone, is_express, pay_method,
                        subtotal_cents, igv_cents, total_cents, idempotency_key)
    values (v_number, v_customer_id, p->>'zone', (p->>'is_express')::boolean,
            (p->>'pay_method')::pay_method, v_subtotal, v_igv, v_subtotal, v_key)
    returning id into v_order_id;

    insert into order_items (order_id, product_slug, product_name, qty, unit_cents, line_cents)
    select v_order_id, l->>'slug', l->>'name', (l->>'qty')::integer,
           (l->>'unit_cents')::integer, (l->>'qty')::integer * (l->>'unit_cents')::integer
      from jsonb_array_elements(p->'lines') l;

    insert into stock_moves (product_slug, delta, reason, order_id)
    select l->>'slug', -(l->>'qty')::integer, 'venta', v_order_id
      from jsonb_array_elements(p->'lines') l;

    insert into shipping_details (order_id, district, address, reference, city, agency, dni)
    values (v_order_id, v_ship->>'district', v_ship->>'address', v_ship->>'reference',
            v_ship->>'city', v_ship->>'agency', v_ship->>'dni');

    return jsonb_build_object('ok', true, 'id', v_order_id, 'number', v_number,
      'total_cents', v_subtotal, 'igv_cents', v_igv, 'reused', false);
  exception
    when raise_exception then
      if sqlerrm like 'no_stock:%' then
        return jsonb_build_object('ok', false, 'reason', 'no_stock', 'slug', substr(sqlerrm, 10));
      end if;
      raise;
    when unique_violation then
      -- Doble clic simultáneo: el otro pedido ganó la carrera por la misma clave.
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

-- Libera la reserva cuando un pedido se cancela o se rechaza.
create or replace function release_stock(p_order_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update inventory i
     set reserved = greatest(0, i.reserved - oi.qty), updated_at = now()
    from order_items oi
   where oi.order_id = p_order_id
     and i.product_slug = oi.product_slug;
$$;

-- ─────────────────────────── libro de reclamaciones ───────────────────────────
-- Numeración CORRELATIVA: el D.S. 011-2011-PCM lo exige.
create or replace function create_claim(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sheet text;
  v_claim claims%rowtype;
begin
  v_sheet := 'LR-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
             lpad(nextval('claim_seq')::text, 6, '0');

  insert into claims (sheet_number, kind, name, doc_id, email, phone, address, guardian,
                      product, order_number, amount_cents, detail, request, due_at)
  values (v_sheet, (p->>'kind')::claim_kind, p->>'name', p->>'doc_id', p->>'email', p->>'phone',
          p->>'address', p->>'guardian', p->>'product', p->>'order_number',
          (p->>'amount_cents')::integer, p->>'detail', p->>'request', (p->>'due_at')::timestamptz)
  returning * into v_claim;

  insert into claim_events (claim_id, event) values (v_claim.id, 'recibido');

  return jsonb_build_object('id', v_claim.id, 'sheet_number', v_claim.sheet_number,
                            'due_at', v_claim.due_at);
end $$;

-- ─────────────────────────── permisos ───────────────────────────
-- Solo el servidor (service_role) puede llamarlas; la anon key no.
revoke execute on function create_order(jsonb)   from public, anon, authenticated;
revoke execute on function release_stock(bigint) from public, anon, authenticated;
revoke execute on function create_claim(jsonb)   from public, anon, authenticated;
revoke execute on function reserve_stock(text, integer) from public, anon, authenticated;
grant  execute on function create_order(jsonb)   to service_role;
grant  execute on function release_stock(bigint) to service_role;
grant  execute on function create_claim(jsonb)   to service_role;
grant  execute on function reserve_stock(text, integer) to service_role;
