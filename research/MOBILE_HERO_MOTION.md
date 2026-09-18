# Investigación del hero móvil de Vendemia

Fecha: 17 de septiembre de 2026. Investigación y propuestas; no se modificó la web.

## Diagnóstico

El hero oculta toda la escena visual a 760 px o menos: figura naranja, modelo, productos e interacción. En la captura de 390 px predominan texto, información de envío y botones. Mi interpretación es que falta una composición visual propia para móvil; añadir animaciones a los mismos recuadros no resuelve ese problema.

Lucho no es un requisito para esta propuesta. El concepto de escritorio puede seguir siendo independiente.

## Referencias observadas

- [Apple AirPods Pro](https://www.apple.com/airpods-pro/): revisado en un viewport de 390 × 844. Producto en primer plano, composición vertical y control para pausar el movimiento. Interesa la escala y el protagonismo del producto; no copiar el tamaño completo de su hero.
- [Demo interactiva de Timothy Ricks](https://bike-interaction.webflow.io/): revisada al mismo tamaño. Al tocar un punto «+», la composición acerca y reencuadra una pieza y muestra información. Referencia concreta para detalles táctiles, sin depender de hover.
- [Teenage Engineering OB-4](https://teenage.engineering/products/ob-4): revisado en móvil. Fotografía, contraste y tipografía construyen identidad sin un modelo. Referencia de dirección visual, no una plantilla de navegación que copiar.
- [Caso de diseño de Jolly Moth](https://www.jollymoth.com/feature-page): el contenido indexado describe una caja que revela una recompensa. No se verificó en vivo. Es una referencia conceptual de revelado; la propuesta de pedido de Vendemia es una adaptación propia, no una referencia de hero comercial observada.

## Tres direcciones para comparar

| Dirección | Movimiento e interacción propuestos | Encaje con Vendemia | Material necesario |
| --- | --- | --- | --- |
| Producto en primer plano | Una foto grande sobre una figura naranja; deslizar cambia el producto con un breve desplazamiento. Tocar un detalle lo acerca. Precio y botón + visibles. | Mantiene productos reales y la compra como centro. Mi recomendación para una primera versión. | Fotos existentes, recortes y composición específica para móvil. No simular un giro 360° con una única foto. |
| Abrir tu pedido | Tocar una caja naranja abre la tapa; los productos aparecen y se acomodan con un movimiento breve. Catálogo y compra siguen accesibles sin completar la animación. | Refuerza «Hoy lo pides. Hoy lo tienes» y ofrece una idea más propia de la marca. | Ilustración de caja y recortes de productos. Evitar repetir la apertura en cada cambio. |
| Escenas de uso | Clips breves o fotografías con movimiento discreto: reloj en una muñeca entrenando, audífonos colocados y lentes en uso. Cambiar de producto cambia la escena. | Muestra la utilidad y puede dar una sensación más humana. Lucho sería opcional. | Tomas reales o material de catálogo revisado. Ya existen tres vídeos locales, pero su calidad, duración y encuadre aún requieren evaluación. |

## Criterios para una prueba posterior

Probar primero las dos primeras direcciones en un teléfono real: producto reconocible, texto legible, acción visible, respuesta táctil y continuidad del carrito. Evitar flotación infinita, aparición tardía de elementos y desplazamientos que obliguen a esperar para comprar. No hay datos todavía para afirmar que una dirección mejora la conversión.

Usar principalmente transformaciones y opacidad para el movimiento, y medir el resultado en el dispositivo; [web.dev explica las implicaciones de rendimiento](https://web.dev/articles/animations-guide). Mantener una versión estática equivalente con movimiento reducido, según [la orientación de W3C sobre animaciones por interacción](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). Si se eligen clips, revisar el peso y cargar sólo el material necesario para la escena activa.

La siguiente fase sería comparar composiciones móviles de «Producto en primer plano» y «Abrir tu pedido». La elección de librería viene después de elegir la interacción; no hace falta comenzar con 3D o una nueva dependencia.
