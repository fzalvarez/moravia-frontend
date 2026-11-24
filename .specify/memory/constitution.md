# Constitución de Moravia (frontend de administración)

Principios que toda especificación, plan e implementación de este repositorio debe
respetar. El arnés de documentación está en `moravia-backend/frontend/` (contrato de la
API, permisos, pantallas, decisiones F-xxx); aquí solo se fija lo que no se negocia.

## Principios

### I. El backend es la fuente de verdad
La interfaz no recalcula importes, saldos, deudas, estados de pago ni multas: muestra
lo que devuelve la API (F-002). Los importes viajan y se muestran como texto, nunca
como `number` de JavaScript (F-105).

### II. El backend autoriza
Las acciones se ocultan según `GET /auth/me` solo por usabilidad; el 403 y el 404 se
manejan siempre (F-003). El token de acceso vive solo en memoria y la sesión se
recupera con la cookie httpOnly; no se guardan contraseñas ni secretos en el
navegador (F-004).

### III. Nada simulado como real
No se simulan funcionalidades que la API no ofrece ni se presentan datos ficticios como
reales (F-006). Lo que falta se registra como pedido al backend (`PEDIDOS_BACKEND.md`).
Las maquetas con datos de ejemplo existen solo en desarrollo y se identifican como tales.

### IV. Formularios seguros
Sin reenvío mientras hay una petición en curso; éxito solo con 2xx; no se pierde lo
escrito si falla; errores junto al campo; confirmación antes de operaciones financieras
o destructivas; clave de idempotencia reutilizada en reintentos (F-005, F-106).

### V. Simplicidad
Formularios, tablas y filtros sencillos, en español y adaptables a móvil (F-001). Sin
dependencias ni pantallas fuera del alcance aprobado.

## Restricciones técnicas

- Vite + React 19 + TypeScript, Tailwind 4 + shadcn/Radix, react-router, react-hook-form
  + zod, axios y zustand para la sesión (F-009), TanStack Query para los datos (F-010),
  pnpm.
- Tipos de la API generados del OpenAPI (`pnpm api:tipos`, F-011); no se escriben a mano.
- Estructura por feature (`pages`, `components`, `services`, `hooks`, `validation`); un
  servicio por operación. Los servicios que usa TanStack Query lanzan el error de axios.
- Fechas de calendario en `America/Lima`, igual que el backend (D-059).
- `pnpm build` y `pnpm lint` deben pasar antes de cerrar una unidad (F-012).

## Flujo de trabajo

1. `/speckit-specify` → `specs/NNN-nombre/spec.md`.
2. `/speckit-clarify` si hay decisiones de producto abiertas.
3. `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
4. Al cerrar: actualizar `moravia-backend/frontend/STATUS.md` y registrar decisiones
   en `moravia-backend/frontend/DECISIONS.md`.

Se trabaja en `master`, sin ramas. Un commit por unidad cerrada.

## Gobierno

Esta constitución prevalece sobre las especificaciones y planes. Modificarla requiere
aprobación del usuario y una nueva versión (semver).

**Versión**: 1.1.0 | **Ratificada**: 2026-11-15 | **Última enmienda**: 2026-11-24 (F-010 a F-012, aprobadas por el usuario)
