begin;
-- Reparto exacto: el crédito S/ 5 queda en 65% y el 35% restante se divide en la misma
-- proporción de antes (15:15:10:10:5 = 3:3:2:2:1) con dos decimales. Suma 100.00.
-- Reemplaza los enteros de 0017; se puede correr aunque 0017 no se haya corrido.
alter table reward_pool alter column weight type numeric(5,2);
update reward_pool set weight=case prize
  when 'credit5' then 65 when 'bracelet' then 9.55 when 'necklace' then 9.55
  when 'ring' then 6.36 when 'perfume' then 6.36 when 'gymbox' then 3.18 end
 where tier='sorpresa';
do $$ begin
 if (select sum(weight) from reward_pool where tier='sorpresa')<>100 then raise exception 'reward_pool sorpresa must sum 100'; end if;
end $$;

-- El sorteo trabaja en centésimas de punto (0-9999), con o sin carta con poder: cada peso se
-- pasa a entero antes de operar. La API debe enviar siempre una tirada de 0 a 9999.
create or replace function welcome_reward(p_user uuid,p_name text,p_phone text,p_spin boolean,p_roll integer,p_family text,p_pick text default null)
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
  -- Sin carta con poder: misma tirada 0-9999, sin bonificación (0-99 no alcanza para 9.55%).
  if p_roll<0 or p_roll>=10000 then raise exception 'invalid_spin'; end if;
  v_roll:=p_roll;
 else
  if p_roll<0 or p_roll>=10000 then raise exception 'invalid_spin'; end if;
  v_roll:=p_roll;
  select (weight*100)::integer into v_pick from reward_pool where tier='sorpresa' and prize=p_pick;
  if v_pick is null then raise exception 'invalid_pick'; end if;
  v_other:=10000-v_pick;
  select 10000-coalesce(sum((weight*100)::integer*(v_other-200)/v_other),0) into v_pick_new from reward_pool where tier='sorpresa' and prize<>p_pick;
 end if;
 for q in select * from reward_pool where tier='sorpresa' order by position loop
  v_weight:=case when v_pick is null then (q.weight*100)::integer when q.prize=p_pick then v_pick_new else (q.weight*100)::integer*(v_other-200)/v_other end;
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
commit;
