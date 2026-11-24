# 001 — Consumo de la API en la administración

Conectar `moravia-frontend` (solo administración, F-014) a la API real del backend V1,
siguiendo `moravia-backend/frontend/` (SCREENS, PERMISSIONS, API_CONTRACT, IMPLEMENTATION_PLAN).
Decisiones: F-009 a F-015. Cierre de cada fase: `pnpm build` y `pnpm lint` en verde (F-012),
verificación contra el backend local, commit y push.

## Fases

- [x] F1 Base técnica: TanStack Query, tipos generados (`pnpm api:tipos`), `VITE_API_URL` con credenciales (F-015), helpers de error y paginación
- [x] F2 Sesión: `/activar`, menú según permisos, bloqueo de cuentas de departamento (F-014), periodo vigente real en el menú, inicio sin maqueta
- [x] F3 Componentes comunes: tabla con paginador, campo con error del backend, confirmación, panel de código de activación, estados 403/404, clave de idempotencia
- [ ] F4 Cuentas, roles y permisos (SCREENS §2)
- [ ] F5 Departamentos y anexos (SCREENS §3), sustituye la maqueta
- [ ] F6 Personas y ocupantes (SCREENS §4)
- [ ] F7 Configuración financiera: tipos, conceptos, periodos y su configuración (SCREENS §5)
- [ ] F8 Gastos, proveedores, categorías y comprobantes (SCREENS §6)
- [ ] F9 Liquidaciones del periodo y cierre (SCREENS §8)
- [ ] F10 Cuenta del departamento: estado de cuenta, movimientos, pagos, ajustes y multas (SCREENS §7)
- [ ] F11 Multas: política y generación (SCREENS §9)
- [ ] F12 Reportes (SCREENS §10)
- [ ] F13 Avisos de la administración (D-060): crear, retirar y ver lecturas (T010 de la spec 002)
- [ ] F14 Despliegue: variables de producción y dominio en el mismo sitio que la API (P-003)
