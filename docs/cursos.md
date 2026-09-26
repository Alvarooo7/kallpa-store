# Cursos Kallpa

Los cursos presenciales viven en `/cursos`, separados del carrito de productos físicos. Se encuentran desde la portada, el catálogo, el menú, el pie y el buscador. La inscripción se coordina al WhatsApp exclusivo de cursos **51955882306**, configurado como `COURSE_CONTACT` en `company.ts`; seleccionar un plan prepara el mensaje, sin reservar cupos ni registrar un pago. Cabecera, pie y burbuja usan ese número solo en las rutas de cursos; productos y pedidos conservan 51907863118.

## Fuentes facilitadas por el propietario

- `C:/Users/INTEL/Pictures/Vendemia/cursos/natación/CLASES GRUPALES NATACIÓN.txt`
- `C:/Users/INTEL/Pictures/Vendemia/cursos/funciona - crossfit/crossfit.txt`
- Los dos videos MP4 de esas carpetas se inspeccionaron mediante fotogramas para la ambientación. No se incorporaron sus promociones fechadas ni los teléfonos de los afiches.
- Búnker Cross: el texto general indica congelamiento desde el trimestral, pero la descripción del mensual y el afiche también lo mencionan. Se ofrece solo desde el trimestral hasta confirmar la condición mensual.
- Natación: el texto añade un turno de sábado a las 2 p.m. que no figura en el afiche; se conservan ambos turnos del texto. No se inventa hora de término para el domingo ni vigencia de los paquetes.

## Imágenes

### Ambientación v4 y material original (activos)

Imagen activa: `public/courses/luchito-natacion-v4.webp`, 1000 × 1000, WebP calidad 85. Generación integrada usando el rostro original `public/uses/lucho-escuchar.png` y el contact sheet del video de natación. Prompt: preserve Luchito exact facial identity and imperfections; swimming breaststroke with black cap and clear goggles; reproduce the top-left video frame architecture: blue starting blocks, white indoor walls with upper balcony railings, tall louvered windows, solid blue rear wall, dark blue bleachers and silver railings, red white yellow lane ropes. No invented pool, hanging flags or outdoor vegetation. Medium shot at water level with venue clearly visible, natural documentary photograph, no text or watermark.

Los videos originales se copiaron sin modificar a `public/courses/natacion-original.mp4` y `public/courses/bunker-original.mp4`. Los afiches de las carpetas se optimizaron como `natacion-afiche.webp` y `bunker-afiche.webp`. Cada detalle de curso muestra ambos; el reproductor y su URL se montan solo tras pulsar reproducir. Los afiches se pueden ampliar. Se advierte que el material original puede incluir promociones, contactos u horarios que requieren confirmación, sin alterar los planes de la página.

### Revisión de identidad v3 (activa)

Herramienta integrada de imágenes; referencia directa `public/uses/lucho-escuchar.png`, no la versión generada de natación. Archivo: `public/courses/luchito-natacion-v3.webp`, 1000 × 1000, WebP calidad 85.

Prompt: Identity-preserve photograph for swimming class website. This reference is the definitive Luchito identity. Preserve EXACT facial proportions: broad nose, rounded strong jaw, mouth shape, thick eyebrows, salt pepper short stubble, tan complexion, age and natural wrinkles, pores and imperfections. Do not substitute another man or beautify him. Change his activity to swimming breaststroke in a blue and white indoor lap pool with high windows and lane ropes. At the breath phase, face visible in same three-quarter angle as reference, eyes open, natural focused relaxed mouth, shoulders near waterline and hands sweeping together forward under water, anatomically coherent swimming not standing. Fitted black swimming cap, clear small swimming goggles so face remains recognizable. No shirt, no earbuds. Medium close sports documentary photo at water level. Natural water droplets and realistic restrained splashes. Square composition, enough breathing room. No text, no watermark. Prioritize faithful likeness over dramatic action.

### Revisión de natación: gorro y movimiento

Edición con la herramienta integrada de imágenes (identity-preserve), usando `public/courses/luchito-natacion.webp` como referencia. Resultado activo: `public/courses/luchito-natacion-v2.webp`, WebP de 1000 × 1000, calidad 85. Se conserva el original. Tarjetas limitadas a 430 px de ancho en escritorio, imagen 4:3 y espacios y títulos más compactos.

Prompt: Edit identity-preserve. Website swimming course photograph. Use supplied image as identity and indoor pool reference. Show this exact same middle-aged Peruvian man Luchito actually swimming a technically believable freestyle stroke, viewed at water level from front three-quarter side as he turns naturally for a side breath, one arm extended forward in water and the other in bent-elbow recovery. Add a fitted black silicone swimming cap covering his hair and properly worn swimming goggles with lightly tinted transparent lenses. Preserve recognizable nose, mouth, jaw, gray stubble, tan skin, age, build, pores, wrinkles and natural imperfections. Keep the same blue and white indoor pool architecture, lane ropes, daylight. Realistic anatomy, shoulder rotation and water physics, modest natural splashes, no extra limbs, no plastic retouching. Square photograph with subject centered and enough surrounding water, face and active stroke clearly readable at small thumbnail size. No text, logos or watermark. Natural documentary sports photography, not illustration.

Generadas con la herramienta integrada de imágenes, con la identidad de `public/uses/lucho-escuchar-peruanidad.webp` y los fotogramas como referencia. Exportadas a WebP de 1254 × 1254, calidad 90:

- `public/courses/luchito-natacion.webp`
- `public/courses/luchito-funcional.webp`

### Prompt común

Use case: identity-preserve. Create one photorealistic square course campaign photograph for Kallpa. Image 1 is the exact brand character Luchito: preserve his recognizable face, age around 50, short bleached blond hair, salt-and-pepper stubble, tan skin, natural wrinkles, pores, realistic arms and normal athletic build, not a muscular model. Keep honest natural skin imperfections, no plastic skin or etched fake texture. Image 2 is a contact sheet from the user's actual course video: use ONLY the physical environment as reference, ignore all text overlays/logos/promotions and do not reproduce other people's identities. Single coherent photograph, NOT a collage. No text overlays or watermark. High detail and believable natural cloth/skin texture.

### Extensión del prompt: funcional

Show Luchito doing a controlled kettlebell goblet squat in the reference modest functional gym, three-quarter front view, eyes open focused, feet grounded and elbows close, credible technique. Medium-wide knees-up framing with face and kettlebell clearly readable in a course card. Orange athletic polo with small WHITE HAND EMBROIDERED 'Kallpa' chest logo (raised stitched thread, not printed), black athletic shorts. Slight realistic sweat and wrinkles in polo. Gray walls, black rubber interlocking floor with yellow black station tape, medicine balls and red punching bag in soft background, subtle cool ceiling lighting from reference. No earphones, no glasses. Keep whole head, hands and equipment within frame.

### Extensión del prompt: natación

Show Luchito as an adult swimming learner resting naturally chest-deep at edge of the reference indoor swimming pool, one hand resting on pool edge, other hand holding dark swimming goggles; face clearly visible with eyes open and warm relaxed expression. Hair wet but recognizable bleached blond. Bare shoulders appropriate for pool, realistic body and tiny water droplets, normal fine body hair and skin imperfections. Blue water, red/yellow/blue lane ropes, blue starting platforms, tiled pool deck, white walls and high indoor windows as in video. Natural indoor pool light, believable wet reflections. Medium shot with enough pool context for course cover; focus Luchito face without beauty retouch. No polo in water, no earphones, no sunglasses, no invented signs or logos. Clean professionally composed lifestyle photo, same character as image 1.
