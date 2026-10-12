begin;
-- Run after 0011. Retain historical awards, disable the old issuance RPC.
revoke execute on function first_purchase_reward(uuid,boolean,integer) from service_role;
alter table orders add column checkout_phone text;
create table reward_stock (sku text primary key, available integer not null default 0 check(available>=0));
create table reward_pool (
  tier text not null, position integer not null, prize text not null,
  label text not null, practical_label text not null, weight integer not null check(weight>0),
  credit_cents integer not null default 0, minimum_cents integer not null default 0,
  primary key(tier,position)
);
insert into reward_pool values
 ('sorpresa',1,'credit5','Crédito S/ 5','Crédito S/ 5',40,500,6000),
 ('sorpresa',2,'bracelet','Pulsera sorpresa','Organizadores de cables',25,0,0),
 ('sorpresa',3,'ring','Anillo ajustable','Paño + estuche',20,0,0),
 ('sorpresa',4,'stand','Soporte para celular','Soporte para celular',10,0,0),
 ('sorpresa',5,'necklace','Collar sorpresa','Accesorio práctico sorpresa',5,0,0),
 ('plus',1,'credit10','Crédito S/ 10','Crédito S/ 10',30,1000,10000),
 ('plus',2,'necklace','Collar sorpresa','Accesorio práctico sorpresa',25,0,0),
 ('plus',3,'pack2','Pack de 2 accesorios','Pack de 2 accesorios prácticos',25,0,0),
 ('plus',4,'credit15','Crédito S/ 15','Crédito S/ 15',15,1500,15000),
 ('plus',5,'pack3','Pack de 3 accesorios','Pack de 3 accesorios prácticos',5,0,0),
 ('premium',1,'credit20','Crédito S/ 20','Crédito S/ 20',35,2000,20000),
 ('premium',2,'pack2premium','Pack de 2 seleccionados','Pack de 2 prácticos seleccionados',30,0,0),
 ('premium',3,'pack3','Pack de 3 accesorios','Pack de 3 accesorios prácticos',25,0,0),
 ('premium',4,'credit30','Crédito S/ 30','Crédito S/ 30',10,3000,30000);
-- No fabricated inventory. Each physical SKU represents one complete gift/pack.
insert into reward_stock(sku) select distinct prize||':'||family from reward_pool cross join (values('style'),('practical')) f(family) where credit_cents=0;
create table order_rewards (
 id uuid primary key default gen_random_uuid(), order_id bigint not null unique references orders(id),
 user_id uuid not null references auth.users(id), email text not null, phone text not null,
 tier text not null, family text not null, prize text not null, label text not null,
 min_order_cents integer not null, coupon_id bigint unique references coupons(id), stock_sku text references reward_stock(sku),
 created_at timestamptz not null default now(), activated_at timestamptz,
 review_resolved_at timestamptz
);
create index order_rewards_identity_idx on order_rewards(phone,created_at);
create index order_rewards_user_idx on order_rewards(user_id,created_at);
alter table reward_pool enable row level security;
alter table reward_stock enable row level security;
alter table order_rewards enable row level security;
revoke all on reward_pool,reward_stock,order_rewards from anon,authenticated;

create or replace function create_order(p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_coupon coupons%rowtype; v_owner uuid; v_email text; v_result jsonb;
begin
 if nullif(p->>'coupon_code','') is not null then
  select * into v_coupon from coupons where code=upper(trim(p->>'coupon_code')) for update;
  select user_id,email into v_owner,v_email from (
   select user_id,email,coupon_id from first_purchase_rewards union all select user_id,email,coupon_id from order_rewards
  ) rewards where coupon_id=v_coupon.id;
  if v_owner is not null and (coalesce(p->>'verified_user_id','')<>v_owner::text or lower(trim(p#>>'{customer,email}')) is distinct from v_email) then
   return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','account_required');
  end if;
 end if;
 v_result := create_order_before_rewards(p);
 if (v_result->>'ok')::boolean and not (v_result->>'reused')::boolean then
  update orders set checkout_email=lower(trim(p#>>'{customer,email}')),checkout_phone=p#>>'{customer,phone_e164}' where id=(v_result->>'id')::bigint;
 end if;
 return v_result;
end $$;

-- Freeze order contact once captured. Changing recipients requires staff review,
-- not editing a phone to reset the anti-duplicate window.
create function freeze_reward_contact() returns trigger language plpgsql set search_path=public as $$
begin
 if (old.checkout_phone is not null and new.checkout_phone is distinct from old.checkout_phone)
 or (old.checkout_email is not null and new.checkout_email is distinct from old.checkout_email) then
  raise exception 'checkout_contact_immutable';
 end if;
 return new;
end $$;
create trigger freeze_reward_contact before update on orders for each row execute function freeze_reward_contact();

create function sync_order_reward() returns trigger language plpgsql security definer set search_path=public as $$
declare r order_rewards%rowtype;
begin
 select * into r from order_rewards where order_id=new.id for update;
 if not found or r.coupon_id is null then return new; end if;
 if new.status in ('cancelled','rejected') or new.subtotal_cents-new.discount_cents<r.min_order_cents then
  update coupons set max_uses=0 where id=r.coupon_id;
 elsif new.status in ('paid','shipped','delivered') then
  if r.activated_at is null then
   update order_rewards set activated_at=now() where id=r.id;
   update coupons set starts_at=now(),ends_at=now()+interval '30 days',max_uses=1 where id=r.coupon_id;
  else
   update coupons set max_uses=1 where id=r.coupon_id;
  end if;
 else
  update coupons set max_uses=0 where id=r.coupon_id;
 end if;
 return new;
end $$;
create trigger sync_order_reward after update of status,subtotal_cents,discount_cents on orders for each row execute function sync_order_reward();

create function order_reward_game(p_user uuid,p_order bigint,p_spin boolean,p_roll integer,p_family text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_email text; o orders%rowtype; r order_rewards%rowtype; c coupons%rowtype;
 t text; min_order integer; prize reward_pool%rowtype; v_sku text; current_state text;
begin
 select lower(email) into v_email from auth.users where id=p_user and email_confirmed_at is not null;
 if v_email is null then raise exception 'verified_account_required'; end if;
 -- Global game lock makes account/phone checks and stock reservation atomic,
 -- including simultaneous requests from two different accounts sharing a phone.
 perform pg_advisory_xact_lock(121012,1);
 select * into o from orders where id=p_order and checkout_email=v_email for update;
 if not found then return jsonb_build_object('state','pending'); end if;
 select * into r from order_rewards where order_id=o.id;
 if found then
  if r.user_id<>p_user then return jsonb_build_object('state','blocked'); end if;
  select * into c from coupons where id=r.coupon_id;
  current_state := case
   when o.status in ('cancelled','rejected') or o.subtotal_cents-o.discount_cents<r.min_order_cents then 'review'
   when r.coupon_id is not null and c.uses>0 then 'used'
   when r.coupon_id is not null and c.ends_at<=now() then 'expired'
   when o.status in ('paid','shipped','delivered') then 'won' else 'reserved' end;
  return jsonb_build_object('state',current_state,'tier',r.tier,'label',r.label,
   'kind',case when r.coupon_id is null then 'physical' else 'credit' end,
   'code',case when current_state='won' then c.code else null end,'minimum',c.min_subtotal_cents/100,
   'expiresAt',case when r.activated_at is not null then c.ends_at else null end);
 end if;
 if o.checkout_phone is null or o.checkout_phone !~ '^\+519[0-9]{8}$' then return jsonb_build_object('state','pending'); end if;
 if o.status not in ('confirmed','paid') then return jsonb_build_object('state','pending'); end if;
 min_order := case when o.subtotal_cents-o.discount_cents>=23000 then 23000 when o.subtotal_cents-o.discount_cents>=12000 then 12000 when o.subtotal_cents-o.discount_cents>=6000 then 6000 else 0 end;
 if min_order=0 then return jsonb_build_object('state','pending'); end if;
 t := case min_order when 23000 then 'premium' when 12000 then 'plus' else 'sorpresa' end;
 if exists(select 1 from order_rewards a join orders previous on previous.id=a.order_id
   where (a.user_id=p_user or a.email=v_email or a.phone=o.checkout_phone) and (
    a.created_at>now()-interval '24 hours'
    or abs(extract(epoch from (previous.created_at-o.created_at)))<86400
    or (a.review_resolved_at is null and (previous.status not in ('paid','shipped','delivered') or previous.subtotal_cents-previous.discount_cents<a.min_order_cents))
   )) then return jsonb_build_object('state','blocked'); end if;
 if p_family not in ('style','practical') or p_family is null then raise exception 'invalid_family'; end if;
 -- Preserve advertised odds: pause rather than silently substitute out-of-stock prizes.
 if exists(select 1 from reward_pool p left join reward_stock s on s.sku=p.prize||':'||p_family where p.tier=t and p.credit_cents=0 and coalesce(s.available,0)<1)
 then return jsonb_build_object('state','unavailable','tier',t); end if;
 if not p_spin then return jsonb_build_object('state','eligible','tier',t); end if;
 if p_roll is null or p_roll<0 or p_roll>=100 then raise exception 'invalid_roll'; end if;
 select p.* into prize from reward_pool p where p.tier=t and
 (select sum(weight) from reward_pool q where q.tier=t and q.position<=p.position)>p_roll order by p.position limit 1;
 if prize.credit_cents>0 then
  insert into coupons(code,kind,value,min_subtotal_cents,starts_at,ends_at,max_uses,max_uses_per_customer)
  values('REGALO-'||upper(replace(gen_random_uuid()::text,'-','')),'amount',prize.credit_cents,prize.minimum_cents,'infinity','infinity',0,1) returning * into c;
 else
  v_sku := prize.prize||':'||p_family;
  update reward_stock set available=available-1 where reward_stock.sku=v_sku and available>0;
  if not found then raise exception 'gift_out_of_stock'; end if;
 end if;
 insert into order_rewards(order_id,user_id,email,phone,tier,family,prize,label,min_order_cents,coupon_id,stock_sku)
 values(o.id,p_user,v_email,o.checkout_phone,t,p_family,prize.prize,
 case when p_family='practical' then prize.practical_label else prize.label end,min_order,c.id,v_sku);
 -- Activate immediately if this order was already paid; confirmed COD stays reserved.
 update orders set status=status where id=o.id;
 return order_reward_game(p_user,p_order,false,0,p_family);
end $$;
revoke all on function order_reward_game(uuid,bigint,boolean,integer,text) from public,anon,authenticated;
grant execute on function order_reward_game(uuid,bigint,boolean,integer,text) to service_role;
revoke all on function sync_order_reward(),freeze_reward_contact() from public,anon,authenticated;
commit;
