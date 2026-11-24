# Moravia Frontend

Frontend MVP de Moravia (gestión de condominios). Consume la API de `moravia-backend`.

Stack y estructura tomados de `tms`: Vite + React 19 + TypeScript, Tailwind 4 + shadcn/Radix,
react-router-dom, react-hook-form + zod, sonner, lucide-react. Paquetes con pnpm.

## Estructura

```
src/
├── app/
│   ├── router.tsx            # rutas (createBrowserRouter)
│   └── layouts/
├── features/<feature>/
│   ├── pages/                # vistas de ruta
│   ├── components/           # UI propia del feature
│   ├── services/             # un archivo por operación, devuelve ServiceResponse<T>
│   ├── types/                # dominio (UI) y contrato de la API
│   ├── mappers/              # API ↔ dominio
│   └── validation/           # esquemas zod
├── shared/                   # componentes, lib, tipos y utilidades transversales
├── components/ui             # primitivos shadcn
└── lib/utils.ts
```

## Desarrollo

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build
pnpm lint
```

El servidor de Vite hace de proxy de `/api` y `/health` hacia `http://localhost:8000`, así que el
backend debe estar corriendo en ese puerto (ver el README de `moravia-backend`; en local requiere
`COOKIE_SECURE=false`).

Tipos de la API: `pnpm api:tipos` los regenera desde `http://localhost:8000/openapi.json` en
`src/api/schema.d.ts` (no se editan a mano). Hay que regenerarlos cuando cambie el backend.

## Despliegue (Vercel)

* Variable de entorno (Production): `VITE_API_URL=https://moravia-api.odyssoft.com`. Vite la
  incorpora al compilar: después de cambiarla hay que volver a desplegar.
* Dominio propio dentro de `odyssoft.com` (por ejemplo `moravia.odyssoft.com`). La cookie de
  refresco es `SameSite=Lax`: desde `*.vercel.app` la sesión no sobrevive a una recarga.
* Ese dominio debe figurar en `CORS_ORIGINS_RAW` del backend.
* Solo para la administración. Las cuentas de departamento usan `moravia-portal`.

## Documentación

El alcance, el contrato de la API, permisos, pantallas y el plan por bloques están en
`moravia-backend/frontend/` (empezar por `STATUS.md`).
