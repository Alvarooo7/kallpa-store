begin;
-- A welcome promise, before any order. Existing paid-order awards are retained.
create table welcome_rewards (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id), email text not null unique,
 name text not null, phone text not null unique check(phone ~ '^\+519[0-9]{8}$'),
 family text not null check(family in ('style','practical')), prize text not null, label text not null,
 coupon_id bigint unique references coupons(id), stock_sku text references reward_stock(sku),
 order_id bigint unique references orders(id),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 days'
);
alter table welcome_rewards enable row level security;
revoke all on welcome_rewards from public,anon,authenticated;

create function welcome_reward(p_user uuid,p_name text,p_phone text,p_spin boolean,p_roll integer,p_family text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_email text; r welcome_rewards%rowtype; c coupons%rowtype; p reward_pool%rowtype; v_sku text; v_status text;
begin
 select lower(email) into v_email from auth.users where id=p_user and email_confirmed_at is not null;
 if v_email is null then raise exception 'verified_account_required'; end if;
 perform pg_advisory_xact_lock(121012,1);
 select * into r from welcome_rewards where user_id=p_user or email=v_email;
 if found then
  if r.user_id<>p_user then return jsonb_build_object('state','blocked'); end if;
  select * into c from coupons where id=r.coupon_id;
  select status into v_status from orders where id=r.order_id;
  return jsonb_build_object('id',r.id,'state',case when v_status in ('cancelled','rejected') then 'review' when r.order_id is not null then 'used' when r.expires_at<=now() then 'expired' else 'won' end,
   'tier','sorpresa','prize',r.prize,'label',r.label,'name',r.name,'phone',r.phone,
   'kind',case when r.coupon_id is null then 'physical' else 'credit' end,'code',c.code,'minimum',60,'expiresAt',r.expires_at);
 end if;
 if not p_spin then return jsonb_build_object('state','eligible','tier','sorpresa'); end if;
 if p_phone is null or p_phone !~ '^\+519[0-9]{8}$' or length(trim(coalesce(p_name,'')))<3 then raise exception 'contact_required'; end if;
 if exists(select 1 from welcome_rewards where phone=p_phone)
 or exists(select 1 from order_rewards where user_id=p_user or email=v_email or phone=p_phone)
 or exists(select 1 from first_purchase_rewards where user_id=p_user or email=v_email)
 then return jsonb_build_object('state','blocked'); end if;
 if p_family is null or p_family not in ('style','practical') or p_roll is null or p_roll<0 or p_roll>=100 then raise exception 'invalid_spin'; end if;
 if exists(select 1 from reward_pool q left join reward_stock s on s.sku=q.prize||':'||p_family where q.tier='sorpresa' and q.credit_cents=0 and coalesce(s.available,0)<1)
 then return jsonb_build_object('state','unavailable'); end if;
 select q.* into p from reward_pool q where q.tier='sorpresa' and (select sum(weight) from reward_pool z where z.tier=q.tier and z.position<=q.position)>p_roll order by q.position limit 1;
 if p.credit_cents>0 then
  insert into coupons(code,kind,value,min_subtotal_cents,starts_at,ends_at,max_uses,max_uses_per_customer)
  values('REGALO-'||upper(replace(gen_random_uuid()::text,'-','')),'amount',p.credit_cents,6000,now(),now()+interval '30 days',1,1) returning * into c;
 else
  v_sku:=p.prize||':'||p_family;
  update reward_stock set available=available-1 where sku=v_sku and available>0;
  if not found then raise exception 'gift_out_of_stock'; end if;
 end if;
 insert into welcome_rewards(user_id,email,name,phone,family,prize,label,coupon_id,stock_sku)
 values(p_user,v_email,trim(p_name),p_phone,p_family,p.prize,
 case when p_family='practical' then p.practical_label else p.label end,c.id,v_sku);
 return welcome_reward(p_user,p_name,p_phone,false,0,p_family);
end $$;
revoke all on function welcome_reward(uuid,text,text,boolean,integer,text) from public,anon,authenticated;
grant execute on function welcome_reward(uuid,text,text,boolean,integer,text) to service_role;
revoke execute on function order_reward_game(uuid,bigint,boolean,integer,text) from service_role;

alter function create_order(jsonb) rename to create_order_before_welcome;
revoke all on function create_order_before_welcome(jsonb) from public,anon,authenticated;
create function create_order(p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare r welcome_rewards%rowtype; code_reward welcome_rewards%rowtype; c coupons%rowtype; result jsonb; o orders%rowtype;
begin
 -- Same lock order as the game. A coupon and physical reservation cannot be spent twice.
 perform pg_advisory_xact_lock(121012,1);
 if nullif(p->>'coupon_code','') is not null then
  select w.* into code_reward from welcome_rewards w join coupons cp on cp.id=w.coupon_id where cp.code=upper(trim(p->>'coupon_code'));
  if found and (coalesce(p->>'verified_user_id','')<>code_reward.user_id::text
   or lower(trim(p#>>'{customer,email}')) is distinct from code_reward.email
   or p#>>'{customer,phone_e164}' is distinct from code_reward.phone) then
   return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','account_required');
  end if;
 end if;
 select * into r from welcome_rewards where user_id::text=p->>'verified_user_id' for update;
 if found and r.order_id is null and r.expires_at>now() then
  if lower(trim(p#>>'{customer,email}')) is distinct from r.email or p#>>'{customer,phone_e164}' is distinct from r.phone then
   return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','account_required');
  end if;
  if r.coupon_id is not null and (p->>'subtotal_cents')::integer>=6000 then
   select * into c from coupons where id=r.coupon_id;
   if nullif(trim(p->>'coupon_code'),'') is not null and upper(trim(p->>'coupon_code'))<>c.code then
    return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','not_stackable');
   end if;
   p:=jsonb_set(p,'{coupon_code}',to_jsonb(c.code));
  end if;
 end if;
 result:=create_order_before_welcome(p);
 if not (result->>'ok')::boolean then return result; end if;
 select * into o from orders where id=(result->>'id')::bigint;
 if not coalesce((result->>'reused')::boolean,false) and r.id is not null and r.order_id is null and r.expires_at>now()
  and ((r.coupon_id is not null and o.subtotal_cents>=6000 and o.discount_cents=c.value)
    or (r.coupon_id is null and o.subtotal_cents-o.discount_cents>=6000)) then
  update welcome_rewards set order_id=o.id where id=r.id and order_id is null;
 end if;
 select * into r from welcome_rewards where order_id=o.id;
 if found then result:=result||jsonb_build_object('reward',jsonb_build_object('id',r.id,'label',r.label,'kind',case when r.coupon_id is null then 'physical' else 'credit' end)); end if;
 return result;
end $$;
revoke all on function create_order(jsonb) from public,anon,authenticated;
grant execute on function create_order(jsonb) to service_role;
commit;
