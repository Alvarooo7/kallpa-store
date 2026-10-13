begin;
-- 1) La carta que el cliente arrastra suma 2 puntos porcentuales a ese premio; el resto
--    se reduce en proporción. El sorteo usa una tirada de 0 a 9999 (centésimas de punto).
-- 2) El juego ya no pide nombre ni celular: se completan en el checkout y se vinculan al
--    premio cuando se usa en un pedido. Un celular sigue sirviendo para un solo premio.
alter table welcome_rewards alter column name drop not null, alter column phone drop not null;

drop function welcome_reward(uuid,text,text,boolean,integer,text);
create function welcome_reward(p_user uuid,p_name text,p_phone text,p_spin boolean,p_roll integer,p_family text,p_pick text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_email text; r welcome_rewards%rowtype; c coupons%rowtype; p reward_pool%rowtype; q reward_pool%rowtype;
 v_status text; v_phone text; v_roll integer; v_pick integer; v_other integer; v_pick_new integer; v_weight integer; v_cum integer:=0;
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
 -- Celular opcional; si llega (clientes antiguos) se valida y se respeta un premio por celular.
 v_phone:=nullif(trim(coalesce(p_phone,'')),'');
 if v_phone is not null and v_phone !~ '^\+519[0-9]{8}$' then raise exception 'invalid_phone'; end if;
 if exists(select 1 from welcome_rewards where v_phone is not null and phone=v_phone)
 or exists(select 1 from order_rewards where user_id=p_user or email=v_email or (v_phone is not null and phone=v_phone))
 or exists(select 1 from first_purchase_rewards where user_id=p_user or email=v_email)
 then return jsonb_build_object('state','blocked'); end if;
 if p_family is null or p_family not in ('style','practical') or p_roll is null then raise exception 'invalid_spin'; end if;
 if p_pick is null then
  -- Llamada sin carta elegida: tirada 0-99 de versiones anteriores, sin bonificación.
  if p_roll<0 or p_roll>=100 then raise exception 'invalid_spin'; end if;
  v_roll:=p_roll*100;
 else
  if p_roll<0 or p_roll>=10000 then raise exception 'invalid_spin'; end if;
  v_roll:=p_roll;
  select weight*100 into v_pick from reward_pool where tier='sorpresa' and prize=p_pick;
  if v_pick is null then raise exception 'invalid_pick'; end if;
  v_other:=10000-v_pick;
  select 10000-coalesce(sum(weight*100*(v_other-200)/v_other),0) into v_pick_new from reward_pool where tier='sorpresa' and prize<>p_pick;
 end if;
 for q in select * from reward_pool where tier='sorpresa' order by position loop
  v_weight:=case when v_pick is null then q.weight*100 when q.prize=p_pick then v_pick_new else q.weight*100*(v_other-200)/v_other end;
  v_cum:=v_cum+v_weight;
  if v_roll<v_cum then p:=q; exit; end if;
 end loop;
 if p.prize is null then raise exception 'invalid_spin'; end if;
 if p.credit_cents>0 then
  insert into coupons(code,kind,value,min_subtotal_cents,starts_at,ends_at,max_uses,max_uses_per_customer)
  values('REGALO-'||upper(replace(gen_random_uuid()::text,'-','')),'amount',p.credit_cents,6000,now(),now()+interval '30 days',1,1) returning * into c;
 end if;
 insert into welcome_rewards(user_id,email,name,phone,family,prize,label,coupon_id)
 values(p_user,v_email,nullif(trim(coalesce(p_name,'')),''),v_phone,p_family,p.prize,
 case when p_family='practical' then p.practical_label else p.label end,c.id);
 return welcome_reward(p_user,null,null,false,0,p_family);
end $$;
revoke all on function welcome_reward(uuid,text,text,boolean,integer,text,text) from public,anon,authenticated;
grant execute on function welcome_reward(uuid,text,text,boolean,integer,text,text) to service_role;

create or replace function create_order(p jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare r welcome_rewards%rowtype; code_reward welcome_rewards%rowtype; c coupons%rowtype; result jsonb; o orders%rowtype; v_phone text;
begin
 -- Same lock order as the game. A coupon and physical reservation cannot be spent twice.
 perform pg_advisory_xact_lock(121012,1);
 v_phone:=p#>>'{customer,phone_e164}';
 if nullif(p->>'coupon_code','') is not null then
  select w.* into code_reward from welcome_rewards w join coupons cp on cp.id=w.coupon_id where cp.code=upper(trim(p->>'coupon_code'));
  if found and (coalesce(p->>'verified_user_id','')<>code_reward.user_id::text
   or lower(trim(p#>>'{customer,email}')) is distinct from code_reward.email
   or (code_reward.phone is not null and v_phone is distinct from code_reward.phone)) then
   return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','account_required');
  end if;
 end if;
 select * into r from welcome_rewards where user_id::text=p->>'verified_user_id' for update;
 if found and r.order_id is null and r.expires_at>now() then
  if lower(trim(p#>>'{customer,email}')) is distinct from r.email or (r.phone is not null and v_phone is distinct from r.phone) then
   return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','account_required');
  end if;
  -- El celular se vincula al usar el premio: no puede tener ya otro premio de bienvenida o de pedido.
  if r.phone is null and (exists(select 1 from welcome_rewards where phone=v_phone and id<>r.id)
   or exists(select 1 from order_rewards where phone=v_phone and user_id<>r.user_id)) then
   return jsonb_build_object('ok',false,'reason','invalid_coupon','detail','phone_used');
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
  update welcome_rewards set order_id=o.id, phone=coalesce(phone,v_phone), name=coalesce(name,nullif(trim(p#>>'{customer,name}'),''))
   where id=r.id and order_id is null;
 end if;
 select * into r from welcome_rewards where order_id=o.id;
 if found then result:=result||jsonb_build_object('reward',jsonb_build_object('id',r.id,'label',r.label,'kind',case when r.coupon_id is null then 'physical' else 'credit' end)); end if;
 return result;
end $$;
revoke all on function create_order(jsonb) from public,anon,authenticated;
grant execute on function create_order(jsonb) to service_role;
commit;
