-- SOLO LECTURA. Ejecutar antes de repetir migraciones de premios.
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='checkout_email') as checkout_email_exists,
  to_regclass('public.first_purchase_rewards') is not null as first_purchase_rewards_exists,
  to_regprocedure('public.create_order_before_rewards(jsonb)') is not null as checkout_wrapper_exists,
  to_regprocedure('public.first_purchase_reward(uuid,boolean,integer)') is not null as first_reward_rpc_exists,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='checkout_phone') as checkout_phone_exists,
  to_regclass('public.order_rewards') is not null as order_rewards_exists,
  to_regclass('public.reward_stock') is not null as reward_stock_exists,
  to_regprocedure('public.order_reward_game(uuid,bigint,boolean,integer,text)') is not null as order_game_rpc_exists;
