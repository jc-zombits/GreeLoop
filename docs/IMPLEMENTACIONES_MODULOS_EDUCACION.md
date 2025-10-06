# Implementaciones y estado de los 6 módulos de Educación

Este documento resume los metadatos, funcionalidades y mejoras aplicadas a los 6 módulos del área de Educación.

## Resumen general
- Índice de módulos: definido en `frontend/src/app/education/page.tsx` con `id`, `title`, `duration`, `level`, `topics` y `icon`.
- Estilos del quiz: se estandarizaron radios y labels para mejorar accesibilidad, foco visible y área clicable.
- Feedback del quiz: se añadió feedback por respuesta en Comunidad Sostenible y se mejoró la visualización en Consumo Responsable.
- Recursos y acciones: Comunidad Sostenible fue enriquecido con recursos locales y acciones con métricas claras.
- Seguimiento de avance: botón “Finalizar módulo” en cada módulo; progreso persistido en `localStorage` bajo `education_completed_modules`.

## Metadatos del índice (página Educación)
- `Economía Circular` (`economia-circular`) — Duración: `45 min`, Nivel: `Principiante`
- `Huella de Carbono` (`huella-carbono`) — Duración: `35 min`, Nivel: `Intermedio`
- `Consumo Responsable` (`consumo-responsable`) — Duración: `40 min`, Nivel: `Principiante`
- `Energía Renovable` (`energia-renovable`) — Duración: `50 min`, Nivel: `Intermedio`
- `Biodiversidad y Ecosistemas` (`biodiversidad`) — Duración: `55 min`, Nivel: `Avanzado`
- `Comunidad Sostenible` (`comunidad-sostenible`) — Duración: `40 min`, Nivel: `Intermedio` (actualizado)

## Detalle por módulo

### Economía Circular
- Ruta: `/education/modules/economia-circular`
- Metadatos: Nivel `Principiante`, Duración `45 min`, Temas: Reducir, Reutilizar, Reciclar, Intercambio sostenible.
- Quiz: estilos accesibles estandarizados (radios y labels con foco visible y área clicable ampliada).
- Feedback: mantiene esquema de cálculo de puntaje al finalizar.
- Recursos/Acciones: sin cambios funcionales recientes.
- Progreso: botón “Finalizar módulo” para marcar completado.

### Huella de Carbono
- Ruta: `/education/modules/huella-carbono`
- Metadatos: Nivel `Intermedio`, Duración `35 min`, Temas: Cálculo de emisiones, Reducción de CO₂, Impacto ambiental.
- Quiz: estilos accesibles estandarizados (radios/labels).
- Feedback: mantiene esquema de cálculo de puntaje.
- Recursos/Acciones: sin cambios funcionales recientes.
- Progreso: botón “Finalizar módulo”.

### Consumo Responsable
- Ruta: `/education/modules/consumo-responsable`
- Metadatos: Nivel `Principiante`, Duración `40 min`, Temas: Compra consciente, Necesidad vs deseo, Alternativas sostenibles.
- Quiz: estilos accesibles estandarizados (radios/labels).
- Feedback: visualización mejorada del feedback tras seleccionar respuesta.
- Recursos/Acciones: sin cambios funcionales recientes.
- Progreso: botón “Finalizar módulo”.

### Energía Renovable
- Ruta: `/education/modules/energia-renovable`
- Metadatos: Nivel `Intermedio`, Duración `50 min`, Temas: Solar, Eólica, Eficiencia energética, Ahorro.
- Quiz: estilos accesibles estandarizados (radios/labels).
- Feedback: mantiene esquema de cálculo de puntaje.
- Recursos/Acciones: sin cambios funcionales recientes.
- Progreso: botón “Finalizar módulo”.

### Biodiversidad y Ecosistemas
- Ruta: `/education/modules/biodiversidad`
- Metadatos: Nivel `Avanzado`, Duración `55 min`, Temas: Ecosistemas, Especies en peligro, Conservación, Impacto humano.
- Quiz: estilos accesibles estandarizados (radios/labels).
- Feedback: mantiene esquema de cálculo de puntaje.
- Recursos/Acciones: sin cambios funcionales recientes.
- Progreso: botón “Finalizar módulo”.

### Comunidad Sostenible
- Ruta: `/education/modules/comunidad-sostenible`
- Metadatos: Nivel `Intermedio`, Duración `40 min` (actualizado desde `30 min`), Temas: Colaboración, Iniciativas locales, Redes de intercambio.
- Quiz: expandido con 2 nuevas preguntas y feedback inmediato por respuesta, con explicaciones educativas.
- Accesibilidad: estilos de radios/labels consistentes con el resto de módulos.
- Recursos: añadidos enlaces locales de búsqueda (p.ej., mercados de trueque, voluntariado, compostaje comunitario).
- Acciones prácticas: incorporadas métricas claras (participantes, kg compostados/mes, porcentaje de movilidad sostenible, actividades inclusivas).
- Progreso: botón “Finalizar módulo”.

## Notas de accesibilidad
- Inputs de tipo `radio` con estilos consistentes y foco visible.
- Labels con área clicable ampliada y contraste adecuado.
- Feedback inmediato con texto claro donde aplica; se recomienda `aria-live="polite"` para futuras mejoras.

## Próximas mejoras sugeridas
- Añadir `fieldset`/`legend` en cada bloque de preguntas.
- Persistencia de puntaje por módulo en `localStorage` y vista de historial.
- Insignias/medallas por módulo y sección de logros.
- Homogeneizar botones (primarios/outline) y estados de foco/hover.

Fecha: documento creado para acompañar la entrega de las mejoras de educación.