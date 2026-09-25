-- El cupón llegaba hasta el checkout y no descontaba nada: el campo era
-- decorativo. Esta migración lo valida y aplica el descuento dentro de la
-- misma transacción del pedido — el precio sigue naciendo en el servidor,
-- nunca en lo que mande el cliente.
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
  v_coupon_code  text := upper(nullif(trim(p->>'coupon_code'), ''));
  v_coupon       coupons%rowtype;
  v_redemptions  integer;
  v_discount     integer := 0;
  v_total        integer;
begin
  if v_key is not null then
    select * into v_prev from orders where idempotency_key = v_key;
    if found then
      return jsonb_build_object('ok', true, 'id', v_prev.id, 'number', v_prev.number,
        'total_cents', v_prev.total_cents, 'igv_cents', v_prev.igv_cents,
        'discount_cents', v_prev.discount_cents, 'reused', true);
    end if;
  end if;

  if v_email is null then raise exception 'customer_email_required'; end if;

  -- Cupón: se valida ANTES de reservar stock, para no tocar inventario si
  -- el código está mal, vencido, agotado o ya usado por este correo.
  if v_coupon_code is not null then
    select * into v_coupon from coupons where code = v_coupon_code;
    if not found then
      return jsonb_build_object('ok', false, 'reason', 'invalid_coupon', 'detail', 'not_found');
    end if;
    if now() < v_coupon.starts_at or (v_coupon.ends_at is not null and now() > v_coupon.ends_at) then
      return jsonb_build_object('ok', false, 'reason', 'invalid_coupon', 'detail', 'expired');
    end if;
    if v_subtotal < v_coupon.min_subtotal_cents then
      return jsonb_build_object('ok', false, 'reason', 'invalid_coupon', 'detail', 'min_subtotal',
        'min_subtotal_cents', v_coupon.min_subtotal_cents);
    end if;
    if v_coupon.max_uses is not null and v_coupon.uses >= v_coupon.max_uses then
      return jsonb_build_object('ok', false, 'reason', 'invalid_coupon', 'detail', 'exhausted');
    end if;
    select count(*) into v_redemptions from coupon_redemptions
     where coupon_id = v_coupon.id and email = v_email;
    if v_redemptions >= v_coupon.max_uses_per_customer then
      return jsonb_build_object('ok', false, 'reason', 'invalid_coupon', 'detail', 'already_used');
    end if;

    v_discount := case v_coupon.kind
      when 'percent'      then round(v_subtotal * v_coupon.value / 100.0)::integer
      when 'amount'       then v_coupon.value
      when 'free_express' then v_shipping
      else 0
    end;
    v_discount := greatest(0, least(v_discount, v_subtotal + v_shipping));
  end if;

  v_total := v_subtotal + v_shipping - v_discount;

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

    insert into orders (number, customer_id, zone, is_express, pay_method, subtotal_cents,
                        shipping_cents, discount_cents, igv_cents, total_cents, coupon_id, idempotency_key)
    values (v_number, v_customer_id, p->>'zone', (p->>'is_express')::boolean,
            (p->>'pay_method')::pay_method, v_subtotal, v_shipping, v_discount, v_igv,
            greatest(0, v_total), nullif(v_coupon.id, 0), v_key)
    returning id into v_order_id;

    if v_coupon.id is not null then
      update coupons set uses = uses + 1 where id = v_coupon.id;
      insert into coupon_redemptions (coupon_id, order_id, email) values (v_coupon.id, v_order_id, v_email);
    end if;

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
      'total_cents', greatest(0, v_total), 'igv_cents', v_igv, 'discount_cents', v_discount, 'reused', false);
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
            'total_cents', v_prev.total_cents, 'igv_cents', v_prev.igv_cents,
            'discount_cents', v_prev.discount_cents, 'reused', true);
        end if;
      end if;
      raise;
  end;
end $$;
