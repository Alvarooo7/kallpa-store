begin;
-- Immutable checkout email: do NOT infer historic ownership from mutable customers.
alter table orders add column if not exists checkout_email text;
create table first_purchase_rewards (
  user_id uuid primary key references auth.users(id),
  email text not null unique,
  order_id bigint not null unique references orders(id),
  coupon_id bigint not null unique references coupons(id),
  created_at timestamptz not null default now()
);
alter table first_purchase_rewards enable row level security;
revoke all on first_purchase_rewards from anon, authenticated;

create function first_purchase_reward(p_user uuid, p_spin boolean, p_roll integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_email text; v_order bigint; v_coupon coupons%rowtype;
  v_amount integer; v_min integer;
begin
  select lower(email) into v_email from auth.users where id=p_user and email_confirmed_at is not null;
  if v_email is null then raise exception 'verified_account_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_email, 11));
  select c.* into v_coupon from coupons c join first_purchase_rewards r on r.coupon_id=c.id where r.user_id=p_user or r.email=v_email;
  if found then
    return jsonb_build_object('state', case when v_coupon.uses>0 then 'used' when v_coupon.ends_at<=now() then 'expired' else 'won' end,
      'code',v_coupon.code,'amount',v_coupon.value/100,'minimum',v_coupon.min_subtotal_cents/100,'expiresAt',v_coupon.ends_at);
  end if;
  select id into v_order from orders where checkout_email=v_email and status in ('paid','shipped','delivered') order by created_at,id limit 1;
  if v_order is null then return jsonb_build_object('state','pending'); end if;
  if not p_spin then return jsonb_build_object('state','eligible'); end if;
  if p_roll is null or p_roll<0 or p_roll>=100 then raise exception 'invalid_roll'; end if;
  v_amount := case when p_roll<40 then 500 when p_roll<70 then 1000 when p_roll<90 then 1500 when p_roll<98 then 2500 else 5000 end;
  v_min := case when p_roll<40 then 6000 when p_roll<70 then 10000 when p_roll<90 then 16000 when p_roll<98 then 23000 else 33000 end;
  insert into coupons(code,kind,value,min_subtotal_cents,ends_at,max_uses,max_uses_per_customer)
    values ('REGALO-'||upper(replace(gen_random_uuid()::text,'-','')), 'amount',v_amount,v_min,now()+interval '30 days',1,1) returning * into v_coupon;
  insert into first_purchase_rewards(user_id,email,order_id,coupon_id) values(p_user,v_email,v_order,v_coupon.id);
  return jsonb_build_object('state','won','code',v_coupon.code,'amount',v_amount/100,'minimum',v_min/100,'expiresAt',v_coupon.ends_at);
end $$;
revoke all on function first_purchase_reward(uuid,boolean,integer) from public,anon,authenticated;
grant execute on function first_purchase_reward(uuid,boolean,integer) to service_role;

-- Wrap existing checkout: serialize coupon redemption and require verified owner.
alter function create_order(jsonb) rename to create_order_before_rewards;
revoke all on function create_order_before_rewards(jsonb) from public,anon,authenticated;
create function create_order(p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_coupon coupons%rowtype; v_owner uuid; v_email text; v_result jsonb;
begin
  if nullif(p->>'coupon_code','') is not null then
    select * into v_coupon from coupons where code=upper(trim(p->>'coupon_code')) for update;
    select user_id,email into v_owner,v_email from first_purchase_rewards where coupon_id=v_coupon.id;
    if v_owner is not null and (coalesce(p->>'verified_user_id','')<>v_owner::text or lower(trim(p#>>'{customer,email}')) is distinct from v_email) then
      return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','account_required');
    end if;
  end if;
  v_result := create_order_before_rewards(p);
  if (v_result->>'ok')::boolean and not (v_result->>'reused')::boolean then
    update orders set checkout_email=lower(trim(p#>>'{customer,email}')) where id=(v_result->>'id')::bigint;
  end if;
  return v_result;
end $$;
revoke all on function create_order(jsonb) from public,anon,authenticated;
grant execute on function create_order(jsonb) to service_role;
commit;
