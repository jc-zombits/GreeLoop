# Changelog

## v0.3.0 (2025-10-06)

### Mejoras de UI (Admin)
- Fondo con gradiente verdoso suave en `/admin` (`from-emerald-50` → `to-emerald-100`).
- Tarjetas de "Usuarios" e "Items" con tono verde, bordes sutiles y sombras (`card-verdoso`, `shadow-md`, `hover:shadow-lg`).
- Encabezados de tabla más legibles (`text-gray-800`, `font-semibold`).
- Texto más oscuro en la columna "Name" para mejor contraste (`text-gray-900`).
- Efecto hover verdoso suave en filas de tabla (`hover-verdoso-suave`).

### Tema "Verdoso Oscuro" (Opcional)
- Toggle de "Verdoso Oscuro" en `/settings` que aplica clase global para variante más oscura.
- Clases utilitarias añadidas en `frontend/src/app/globals.css`:
  - `admin-bg`, `card-verdoso`, `card-verdoso-oscuro`, `texto-oscuro`, `hover-verdoso-suave`.

### Backend y tipos
- Estructura inicial para endpoints y modelos de admin:
  - `backend/app/api/v1/admin.py`
  - `backend/app/models/admin_user.py`
  - `backend/app/schemas/admin.py`
- Ajustes menores en tipos y utilidades del frontend.

### Notas de despliegue
- Sin migraciones de base de datos.
- Reiniciar el frontend para ver estilos actualizados si fuera necesario.
- No se requieren cambios de configuración.

### Créditos
- Implementado por el equipo, con foco en accesibilidad y contraste.