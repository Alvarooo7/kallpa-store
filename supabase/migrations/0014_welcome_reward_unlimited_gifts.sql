begin;
-- Los regalos físicos de bienvenida no tienen límite de stock: el juego nunca se pausa
-- por existencias ni descuenta reward_stock. El resto de la función es idéntico a 0013.
create or replace function welcome_reward(p_user uuid,p_name text,p_phone text,p_spin boolean,p_roll integer,p_family text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_email text; r welcome_rewards%rowtype; c coupons%rowtype; p reward_pool%rowtype; v_status text;
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
 select q.* into p from reward_pool q where q.tier='sorpresa' and (select sum(weight) from reward_pool z where z.tier=q.tier and z.position<=q.position)>p_roll order by q.position limit 1;
 if p.credit_cents>0 then
  insert into coupons(code,kind,value,min_subtotal_cents,starts_at,ends_at,max_uses,max_uses_per_customer)
  values('REGALO-'||upper(replace(gen_random_uuid()::text,'-','')),'amount',p.credit_cents,6000,now(),now()+interval '30 days',1,1) returning * into c;
 end if;
 insert into welcome_rewards(user_id,email,name,phone,family,prize,label,coupon_id)
 values(p_user,v_email,trim(p_name),p_phone,p_family,p.prize,
 case when p_family='practical' then p.practical_label else p.label end,c.id);
 return welcome_reward(p_user,p_name,p_phone,false,0,p_family);
end $$;
revoke all on function welcome_reward(uuid,text,text,boolean,integer,text) from public,anon,authenticated;
grant execute on function welcome_reward(uuid,text,text,boolean,integer,text) to service_role;
commit;
