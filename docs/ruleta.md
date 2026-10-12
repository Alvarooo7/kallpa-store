# Juego de bienvenida — flujo actual

### Acceso en popup (ajuste visual posterior)

El título del juego ahora es «Tu próxima compra, con premio»: no presupone primera compra. Esto NO elimina la restricción de una participación de la campaña en 0013; definir la habilitación recurrente antes de anunciar múltiples giros. Acceso/datos en un dialog modal nativo (foco contenido, fondo inerte, cierre accesible). Google usa ventana auxiliar PKCE y `/auth/popup`, compartiendo sesión con el juego sin navegar la pestaña original. Autorizar `https://kallpita.store/auth/popup` y `http://localhost:3000/auth/popup` en Supabase Redirect URLs. No cambia el callback de Google Cloud. Si el navegador bloquea ventanas auxiliares, mostrar alternativa de correo, no redirigir silenciosamente.

Para confirmar cuentas nuevas dentro del popup, añadir `{{ .Token }}` a la plantilla **Confirm signup**: se valida mediante verifyOtp tipo signup. Se conserva contraseña para futuros accesos, sin guardarla en el borrador. El enlace de confirmación sigue siendo alternativa si no está configurado el código. Probar OAuth y SMTP reales antes de publicar; no se verificaron cuentas reales en esta tarea.

**La migración 0013 reemplaza el flujo de giros por pedido de abajo.** Aplicar una vez después de 0012. No repetir 0011/0012. Nunca se ejecutó remotamente desde esta tarea.

- Invitación al juego reemplaza la captación del 10%; el endpoint de cupones anterior no se usa en esta invitación.
- `/mi-premio` muestra solo el juego y acceso a reglas. Tarjetas en abanico, exploración por swipe/flechas/teclado, botón circular, giro y resultado. No hay selector de niveles: solo Sorpresa. Tablas Plus/Premium conservadas para históricos, no ofrecidas.
- Sin pedido, confirmación ni pago previo. Para el giro definitivo se requiere cuenta verificada, nombre y celular; esta implementación pide esos datos ANTES del sorteo para evitar premios anónimos repetidos. No SMS. Registro no da consentimiento publicitario.
- `welcome_rewards` guarda un resultado por cuenta/correo/celular; incluye los filtros históricos. Cupón personal activo inmediatamente, 30 días desde el giro. Se aplica automáticamente en esa MISMA compra, mínimo S/60 de productos ANTES del descuento de la ruleta. No acumulable con otros cupones. Físico: S/60 después de descuentos, sin envío.
- Stock físico se reserva al girar. Requiere existencias reales para todos los premios de la familia. Reservas vencidas/canceladas NO se reponen automáticamente: revisar manualmente; no hay redibujo ni giro nuevo por vencer/cancelar. No activar sin definir esta operación.
- Al checkout, cuenta/correo/celular deben coincidir. La transacción aplica descuento o vincula regalo y devuelve referencia, que se agrega a WhatsApp y al correo interno del pedido. El juego por sí solo no envía correo interno; el resultado queda en base de datos. WhatsApp no envía automáticamente: el cliente envía el mensaje preparado.
- Sin premio usado en ese pedido, WhatsApp y confirmación incluyen enlace al juego para un pedido posterior. No se alteran retroactivamente pedidos registrados.
- Autorizaciones de retorno de Google/confirmación: `/mi-premio` y `/?checkout=resume` en producción y localhost. Configurar **Confirm signup** con ConfirmationURL y Google, y probar login real antes de activar. Carrito temporal conservado en sessionStorage (30 min), nunca contraseñas.
- Conservar ambos flags apagados hasta aplicar 0013, cargar stock y probar. No se cambió ningún flag ni inventario remoto.

## Historial: esquema previo (no usar para las reglas actuales)

## Implementado, no activado remotamente

- Tres niveles sobre subtotal menos descuentos (sin envío): Sorpresa S/60, Plus S/120, Premium S/230. Tabla en `src/lib/rewards.ts` y `reward_pool`; deben permanecer sincronizadas.
- Estilo/práctico se elige antes de jugar. Un resultado por pedido, incluso si se reintenta, cancela o cambia la familia. Resultado del servidor con `crypto.randomInt(100)`; nunca se manda el premio desde cliente.
- Correo/Google identifica la cuenta. **No hay SMS**. Celular peruano normalizado a +519XXXXXXXX, copiado al pedido desde checkout, enmascarado en la pantalla y no editable desde el juego. No demuestra titularidad. Comparte filtro con cuenta/correo; familias que comparten celular requieren revisión humana.
- Giro en estado confirmed o paid, antes del despacho. Pending no basta. El personal debe confirmar legitimidad y entrega del pedido antes de cambiar el estado.
- Bloquea otro giro si misma cuenta/correo/celular participó en últimas 24 h O si pedidos se crearon con menos de 24 h de diferencia, aun si intentan jugar días después. Premio sin pago o cancelado requiere resolución antes de participar nuevamente; no hay reroll por cancelar.
- Crédito hasta S/30: reservado con max_uses=0 hasta pago; trigger activa 30 días una sola vez. Cancelación/rechazo o reducción por debajo del nivel deshabilita canje. Reconfirmar no renueva vigencia. Cupón personal, sin acumulación con otros cupones; mínimo excluye envío.
- Regalo físico: resta stock al girar; se reserva para el paquete y solo se entrega contra pago. No se restituye automáticamente al cancelar: revisar físicamente antes de devolver stock. Sin inventario de todos los premios de una familia/nivel, se pausa ese nivel, no se alteran probabilidades.
- Carrusel de tarjetas en abanico inspirado en el video: touch/flechas/teclado, indicador, revelación, confeti, reducción de movimiento, vista previa explícita que no sortea. No es selección garantizada de la tarjeta visible.

## Activar con cuidado

### Acceso integrado en la compra

El formulario permite optar por reclamar regalo e ingresar con Google o correo/contraseña. El servidor exige cuenta verificada y correo coincidente cuando se solicita el regalo. Comprar sin cuenta sigue disponible. Tras registrar el pedido se muestra el juego en el mismo modal, pendiente de confirmación por Kallpa; no se confirma un pedido automáticamente. `/mi-premio` permanece para consultar premios anteriores; las condiciones están en `/reglas-premios`.

Autorizar en Supabase Redirect URLs `https://kallpita.store/?checkout=resume` y `http://localhost:3000/?checkout=resume`. El callback de Google Cloud sigue siendo el de Supabase. Para nuevas cuentas con contraseña, habilitar confirmación de correo y conservar `{{ .ConfirmationURL }}` en **Confirm signup** (no confundir con la plantilla Magic Link/OTP). El retorno recupera formulario y carrito en la misma pestaña, guardados temporalmente en sessionStorage por 30 minutos; nunca guarda contraseñas. Si se abre la confirmación en otro dispositivo, volver al checkout original e ingresar.

### Si aparece “checkout_email already exists”

No borrar la columna ni repetir todo a ciegas. Ejecutar `supabase/check_reward_migrations.sql` (solo lectura) y revisar resultados. Si están los cuatro objetos de 0011 y faltan los de 0012, no repetir 0011: corresponde 0012. Si todos existen, revisar historial y definiciones antes de ejecutar algo más. Si solo existe checkout_email, la 0011 actual tolera esa columna, pero comprobar que es text y que no hay otros objetos parciales. Un esquema parcial requiere diagnóstico; `IF NOT EXISTS` no certifica que las definiciones existentes sean correctas.

1. Configurar correo OTP/Google según `docs/premios.md`. Aplicar migraciones 0011 y luego 0012 en staging; 0012 mantiene premios viejos pero revoca su RPC de emisión.
2. Cargar existencias reales en `reward_stock`, cuyos valores iniciales son CERO. Cada SKU representa un regalo/pack completo; concretar con el propietario contenido, diseño y costo de cada pack antes de activar. No se inventaron unidades.
3. Migración NO infiere contactos históricos desde customers (es mutable). Pedidos antiguos/WhatsApp requieren que personal autorizado compruebe compra, correo y teléfono y rellene los snapshots. No se crearon pedidos para Robert ni JM: faltan producto y confirmación de total/estado. No se implementaron enlaces personales para apropiarse de pedidos por número de teléfono.
4. Encargado de despacho consulta `order_rewards` unido a orders por order_id: etiqueta y familia son el regalo reservado. Solo entrega contra pago. No existe panel administrativo nuevo; usar herramientas de operación autorizadas. `review_resolved_at` requiere revisión humana, no puede cambiarlo el cliente; nunca borra el premio ni libera el bloqueo de 24h.
5. Validar integración en staging (OTP/Google, dos sesiones, permisos RLS, refresh, cancelación, pago, montos, entrega). REWARDS_ENABLED=true en servidor y NEXT_PUBLIC_REWARDS_ENABLED=true para mensajes del carrito, luego reconstruir/deploy. No se han cambiado esos flags ni producción.

## Pruebas locales

`node scripts/test-rewards.cjs`: 300 resultados, probabilidades, mínimos, límite crédito.

`node scripts/test-reward-db.cjs`: PostgreSQL embebido PGlite (instalar aparte o indicar PGLITE_MODULE), esquema real de todas las migraciones, datos ficticios. No usa conexión remota. Incluye reserva COD, activación, caducidad, ownership, cuenta/teléfono repetidos, cancelación, stock, permisos y snapshots inmutables. No sustituye prueba multi-conexión ni recorrido de autenticación en staging.

## Límites honestos

No es verificación de identidad ni evita números falsos; requiere revisión de entrega. El 10% de bienvenida NO se crea aquí; si se aplica vía cupón existente, reduce el monto elegible (S/65 menos 10% = S/58.50, no participa). No usar direcciones como bloqueo automático. No pedir DNI para jugar. No modificar stock o reemplazar regalos silenciosamente. No publicar hasta confirmar márgenes, inventario, condiciones y proveedor OAuth.
