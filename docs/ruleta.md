# Ruletas por pedido (reemplaza el esquema de primera compra)

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
