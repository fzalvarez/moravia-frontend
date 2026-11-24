import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";
import type { Tono } from "@/shared/components/app/Pagina";
import type { Periodo, ResumenLiquidaciones } from "@/features/periodos/services/periodos.service";

export type Liquidacion = Esquema<"LiquidacionSalida">;
export type LiquidacionDetalle = Esquema<"LiquidacionDetalleSalida">;
export type EstadoLiquidacion = Esquema<"EstadoLiquidacion">;

export const clavesLiquidaciones = {
  delPeriodo: (periodoId: string, estado?: EstadoLiquidacion) => ["periodos", periodoId, "liquidaciones", "lista", estado ?? "todas"] as const,
  una: (id: string) => ["liquidaciones", id] as const,
  delDepartamento: (departamentoId: string) => ["departamentos", departamentoId, "liquidaciones"] as const,
};

export const listarLiquidacionesPeriodo = async (periodoId: string, estado?: EstadoLiquidacion): Promise<Liquidacion[]> =>
  (await api.get<Liquidacion[]>(`/periodos/${periodoId}/liquidaciones`, { params: { estado } })).data;

export const prepararLiquidaciones = async (periodoId: string): Promise<ResumenLiquidaciones> =>
  (await api.post<ResumenLiquidaciones>(`/periodos/${periodoId}/liquidaciones/preparar`)).data;

export const descartarBorradores = async (periodoId: string): Promise<void> => {
  await api.delete(`/periodos/${periodoId}/liquidaciones/borradores`);
};

/** `null` emite todos los borradores. */
export const emitirLiquidaciones = async (periodoId: string, ids: string[] | null): Promise<Liquidacion[]> =>
  (await api.post<Liquidacion[]>(`/periodos/${periodoId}/liquidaciones/emitir`, { liquidacion_ids: ids })).data;

export const cerrarPeriodo = async (periodoId: string): Promise<Periodo> =>
  (await api.post<Periodo>(`/periodos/${periodoId}/cerrar`)).data;

export const reabrirPeriodo = async (periodoId: string, motivo: string): Promise<Periodo> =>
  (await api.post<Periodo>(`/periodos/${periodoId}/reabrir`, { motivo })).data;

export const getLiquidacion = async (id: string): Promise<LiquidacionDetalle> =>
  (await api.get<LiquidacionDetalle>(`/liquidaciones/${id}`)).data;

export const anularLiquidacion = async (id: string, motivo: string): Promise<Liquidacion> =>
  (await api.post<Liquidacion>(`/liquidaciones/${id}/anular`, { motivo })).data;

export const listarLiquidacionesDepartamento = async (departamentoId: string): Promise<Liquidacion[]> =>
  (await api.get<Liquidacion[]>(`/departamentos/${departamentoId}/liquidaciones`)).data;

export const NOMBRE_ESTADO_LIQ: Record<EstadoLiquidacion, string> = { borrador: "Borrador", emitida: "Emitida", anulada: "Anulada" };

export const TONO_LIQ: Record<EstadoLiquidacion, Tono> = { borrador: "ambar", emitida: "verde", anulada: "gris" };
