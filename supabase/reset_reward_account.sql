-- RESETEO COMPLETO DEL JUEGO DE PREMIOS PARA UNA CUENTA (pruebas).
-- 1. Cambia el correo en la línea marcada con <<<.
-- 2. Ejecuta TODO el script en el SQL editor del proyecto epwpptziswltoumcztpo.
--    Corre como una sola transacción: si algo falla, no se borra nada.
-- Borra: premio de bienvenida (aunque ya se haya usado en un pedido), premios antiguos por
-- pedido y de primera compra, y los cupones de esos premios que ningún pedido usó.
-- NO borra pedidos ni la cuenta de acceso (ver el paso opcional al final).

create temp table reset_target on commit drop as
  select lower(trim('correo@ejemplo.com')) as email;  -- <<< tu correo aquí

create temp table reset_coupons on commit drop as
  select coupon_id as id from welcome_rewards where email = (select email from reset_target) and coupon_id is not null
  union select coupon_id from order_rewards where lower(email) = (select email from reset_target) and coupon_id is not null
  union select coupon_id from first_purchase_rewards where lower(email) = (select email from reset_target);

delete from welcome_rewards where email = (select email from reset_target);
delete from order_rewards where lower(email) = (select email from reset_target);
delete from first_purchase_rewards where lower(email) = (select email from reset_target);

-- Los cupones ya usados en un pedido se conservan: el pedido los necesita.
delete from coupons c using reset_coupons r
 where c.id = r.id
   and not exists (select 1 from orders o where o.coupon_id = c.id)
   and not exists (select 1 from coupon_redemptions cr where cr.coupon_id = c.id)
   and not exists (select 1 from subscribers s where s.coupon_id = c.id);

-- Comprobación: las tres columnas deben salir en 0.
select
  (select count(*) from welcome_rewards where email = (select email from reset_target)) as premio_bienvenida,
  (select count(*) from order_rewards where lower(email) = (select email from reset_target)) as premios_por_pedido,
  (select count(*) from first_purchase_rewards where lower(email) = (select email from reset_target)) as premios_primera_compra;

-- OPCIONAL: borrar también la cuenta de acceso (la persona tendrá que volver a registrarse;
-- con Google se recrea sola al ingresar). Ejecútalo aparte, después del reseteo:
-- delete from auth.users where lower(email) = 'correo@ejemplo.com';
