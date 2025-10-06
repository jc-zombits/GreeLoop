# Recordatorio: Próximos pasos en Educación (Comunidad Sostenible y módulos)

Este documento resume mejoras y tareas sugeridas para abordar más adelante.

## Accesibilidad y UX
- Implementar `fieldset`/`legend` en preguntas del quiz para mejor semántica.
- Añadir `aria-live="polite"` para el feedback inmediato (Correcto/Incorrecto).
- Revisar foco visible en inputs y labels, y consistencia de colores de acento.
- Homogeneizar el estilo del botón `Calcular puntaje` en todos los módulos.

## Funcionalidad y persistencia
- Guardar puntaje y progreso del quiz por usuario (`localStorage`) y mostrar historial básico.
- Ampliar feedback educativo por opción con enlaces a recursos adicionales.
- Añadir insignias/medallas por módulo y enlazar con la sección de certificación.

## Contenido y recursos
- Incorporar más recursos locales y guías municipales relevantes al ODS 11.
- Mantener métricas claras en acciones (participantes, kg compostados/mes, % movilidad sostenible, actividades inclusivas).

## Calidad y entrega
- Generar changelog y tag de versión (p.ej. `v0.4.0-education`).
- Verificar build/lint en CI/CD y warnings en consola.

## Opcional
- Internacionalización (i18n) si se requiere audiencias múltiples.
- Pruebas de accesibilidad básicas (renderizado de `fieldset`, feedback por `aria-live`).

Fecha de creación: mantener este documento para seguimiento en futuras iteraciones.