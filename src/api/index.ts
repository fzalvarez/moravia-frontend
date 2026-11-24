// Tipos generados del OpenAPI del backend (F-011). Regenerar con `pnpm api:tipos`
// con el backend corriendo en :8000; no editar schema.d.ts a mano.
import type { components } from "./schema";

export type Esquemas = components["schemas"];
export type Esquema<K extends keyof Esquemas> = Esquemas[K];
