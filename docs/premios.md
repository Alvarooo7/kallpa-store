# Regalo de primera compra

> Esquema anterior. La implementación actual por pedido, filtros de celular sin SMS, regalos físicos y crédito hasta S/30 está documentada en **docs/ruleta.md**. Conservar esta guía solo como referencia de configuración OTP/Google; las reglas económicas de abajo fueron reemplazadas.

Implementación local en `/reclama-tu-premio`. No activada en producción por defecto.

## Activación pendiente

1. Aplicar `supabase/migrations/0011_first_purchase_rewards.sql` una sola vez, después de 0010. Hacer copia de seguridad y probar primero en staging. No se ha aplicado remotamente desde esta tarea.
2. Configurar Supabase Auth con email habilitado, SMTP de producción, límites de envío/verificación y protección antiabuso. En la plantilla Magic Link mostrar `{{ .Token }}` para enviar un código, no solo un enlace. Documentación: https://supabase.com/docs/guides/auth/auth-email-passwordless
3. Configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (pública, nunca service role). REWARDS_ENABLED=true solo después de validar la migración y el correo.
4. El responsable de pagos debe marcar el pedido como paid únicamente tras verificar el pago. No hay pasarela automática ni pantalla administrativa nueva. Shipped/delivered también cuentan como compra completada. Confirmed/pending no habilitan giros.
5. Pedidos históricos no tienen checkout_email: revisarlos manualmente contra evidencia de compra antes de rellenar ese campo. No se infiere propiedad desde customers porque el checkout puede actualizar su correo. Las compras nuevas guardan el correo en el propio pedido. No modificarlo después.

## Reglas

## Acceso con Google

El botón usa Supabase OAuth con PKCE y regresa a `/reclama-tu-premio`. El SDK intercambia automáticamente el código y guarda la sesión en el navegador; las APIs siguen verificando al usuario mediante getUser. No se solicita acceso a Drive, Gmail ni contactos. Usar el mismo correo del pedido.

Pendiente de configuración externa (consulta pública confirmó google=false):

1. Google Cloud / Google Auth Platform: configurar marca y audiencia externa; crear cliente OAuth de tipo aplicación web. Para clientes reales, publicar la audiencia en producción, no limitarla a test users.
2. URI de redirección autorizado en Google: `https://epwpptziswltoumcztpo.supabase.co/auth/v1/callback`.
3. Supabase Authentication → Sign In / Providers → Google: habilitar y guardar Client ID y Client Secret. El secreto va solo en Supabase, nunca en NEXT_PUBLIC ni en el repositorio.
4. Supabase URL Configuration: Site URL `https://kallpita.store`; Redirect URLs exactas `https://kallpita.store/reclama-tu-premio` y, para desarrollo, `http://localhost:3000/reclama-tu-premio`.
5. Probar selección de cuenta, cancelación, retorno, sesión persistida y logout. En móviles, usar navegador externo si el navegador embebido de WhatsApp bloquea Google. No se verificó un login real en esta tarea.

Referencia: https://supabase.com/docs/guides/auth/social-login/auth-google

S/5 desde S/60 (40%), S/10 desde S/100 (30%), S/15 desde S/160 (20%), S/25 desde S/230 (8%), S/50 desde S/330 (2%). Un giro por correo/cuenta y pedido; 30 días desde emisión, solo productos, sin combinar cupones. El mínimo excluye envío. Un cliente puede intentar crear varias identidades: el sistema limita cuenta/correo y pedido, no verifica identidad civil.

El servidor valida el token con getUser y usa crypto.randomInt. La transacción SQL bloquea por correo, reutiliza premios previos y crea un cupón con máximo un uso. El checkout bloquea el cupón y exige el UUID verificado del titular. RPCs solo para service_role. No se aceptan UUID ni probabilidades enviados por el navegador.

La reserva del cupón ocurre al registrar el pedido, igual que los cupones actuales. Cancelación/rechazo requiere atención manual; no se promete reemisión automática. El frontend soporta reintento después de perder la respuesta y no genera un premio nuevo. Las tarjetas se deslizan horizontalmente con teclado/touch y tienen botón explícito accesible para girar; movimiento reducido respeta preferencias.

## Pruebas antes de activar

- OTP correcto/incorrecto/vencido, reenvío limitado, logout y sesión caducada.
- Usuario sin compra, pedido pending/confirmed, paid, y compra histórica sin snapshot.
- Dos POST simultáneos dan mismo cupón; refresh no permite nuevo giro.
- Otro usuario/correo no canjea el cupón; doble checkout no lo usa dos veces.
- Mínimo exacto y un céntimo debajo para cada premio; vencimiento 30 días; cancelaciones.
- Web y móvil 360/393/1440 px, teclado, reducción de movimiento.

No se enviaron correos reales ni se modificaron pedidos o pagos para probar esta tarea.
