-- Pedidos mínimos por WhatsApp: el correo deja de ser obligatorio y el
-- recargo express queda congelado en la orden.
alter table customers alter column email drop not null;

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
  v_shipping    integer := coalesce((p->>'shipping_cents')::integer, 0);
  v_ship        jsonb   := coalesce(p->'shipping', '{}'::jsonb);
begin
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
        raise exception 'no_stock:%', v_line->>'slug';
      end if;
    end loop;

    select id into v_customer_id from customers
      where phone_e164 = p#>>'{customer,phone_e164}' order by id desc limit 1;
    if v_customer_id is null then
      insert into customers (email, name, phone_e164)
      values (null, p#>>'{customer,name}', p#>>'{customer,phone_e164}')
      returning id into v_customer_id;
    else
      update customers set name = p#>>'{customer,name}' where id = v_customer_id;
    end if;

    v_number := 'VD-' || to_char(now() at time zone 'America/Lima', 'YYYY') || '-' ||
                lpad(nextval('order_seq')::text, 6, '0');

    insert into orders (number, customer_id, zone, is_express, pay_method,
                        subtotal_cents, shipping_cents, igv_cents, total_cents, idempotency_key)
    values (v_number, v_customer_id, p->>'zone', (p->>'is_express')::boolean,
            (p->>'pay_method')::pay_method, v_subtotal, v_shipping, v_igv, v_subtotal + v_shipping, v_key)
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

revoke execute on function create_order(jsonb) from public, anon, authenticated;
grant execute on function create_order(jsonb) to service_role;
