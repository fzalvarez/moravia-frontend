// MAQUETA: datos del marco de la app (sesión y periodo vigente) con la forma de la API.
import type { PeriodoApi, ResumenLiquidacionesApi } from "@/features/departamentos/types";

export const periodoActualMock: PeriodoApi = {
  id: "per-2026-10",
  anio: 2026,
  mes: 10,
  fecha_limite: "2026-10-20",
  estado: "abierto",
};

/** `GET /periodos/{id}/liquidaciones/resumen`. */
export const resumenLiquidacionesMock: ResumenLiquidacionesApi = {
  periodo_id: periodoActualMock.id,
  estado_periodo: "abierto",
  borradores: 0,
  emitidas: 47,
  anuladas: 1,
  total_emitido: "18452.60",
  pendientes_de_emitir: [],
};

/** `GET /auth/me` (subconjunto que usa el marco de la app). */
export const usuarioMock = {
  nombre_usuario: "admin",
  tipo: "personal" as const,
  roles: ["administrador"],
};
