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

## Documentación

El alcance, el contrato de la API, permisos, pantallas y el plan por bloques están en
`moravia-backend/frontend/` (empezar por `STATUS.md`).
