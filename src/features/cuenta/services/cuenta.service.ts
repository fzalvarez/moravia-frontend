import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type EstadoCuenta = Esquema<"EstadoCuentaSalida">;
export type Seccion = Esquema<"SeccionSalida">;
export type Movimiento = Esquema<"MovimientoSalida">;
export type HistorialCuenta = Esquema<"EstadoCuentaReporte">;
export type PagoResidente = Esquema<"app__modules__pagos__schemas__PagoSalida">;
export type Ajuste = Esquema<"AjusteSalida">;
export type Multa = Esquema<"MultaSalida">;
export type TipoMovimiento = Esquema<"TipoMovimiento">;

export const clavesCuenta = {
  todo: (d: string) => ["departamentos", d, "cuenta"] as const,
  estado: (d: string, periodoId: string) => ["departamentos", d, "cuenta", "estado", periodoId] as const,
  historial: (d: string) => ["departamentos", d, "cuenta", "historial"] as const,
  pagos: (d: string) => ["departamentos", d, "cuenta", "pagos"] as const,
  ajustes: (d: string) => ["departamentos", d, "cuenta", "ajustes"] as const,
  multas: (d: string) => ["departamentos", d, "cuenta", "multas"] as const,
};

/** Sin periodo: el último con cargos (lo decide el backend). */
export const getEstadoCuenta = async (d: string, periodoId?: string): Promise<EstadoCuenta> =>
  (await api.get<EstadoCuenta>(`/departamentos/${d}/estado-cuenta`, { params: { periodo_id: periodoId || undefined } })).data;

/** Historial completo con saldo acumulado. */
export const getHistorial = async (d: string): Promise<HistorialCuenta> =>
  (await api.get<HistorialCuenta>(`/reportes/departamentos/${d}/estado-cuenta`)).data;

export const listarPagos = async (d: string): Promise<PagoResidente[]> => (await api.get<PagoResidente[]>(`/departamentos/${d}/pagos`)).data;

export const registrarPago = async (d: string, datos: Esquema<"PagoCrear">): Promise<PagoResidente> =>
  (await api.post<PagoResidente>(`/departamentos/${d}/pagos`, datos)).data;

export const anularPago = async (pagoId: string, motivo: string): Promise<PagoResidente> =>
  (await api.post<PagoResidente>(`/pagos-residente/${pagoId}/anular`, { motivo })).data;

export const listarAjustes = async (d: string): Promise<Ajuste[]> => (await api.get<Ajuste[]>(`/departamentos/${d}/ajustes`)).data;

export const registrarAjuste = async (d: string, datos: Esquema<"AjusteCrear">): Promise<Ajuste> =>
  (await api.post<Ajuste>(`/departamentos/${d}/ajustes`, datos)).data;

export const listarMultas = async (d: string): Promise<Multa[]> => (await api.get<Multa[]>(`/departamentos/${d}/multas`)).data;

export const NOMBRE_MOVIMIENTO: Record<TipoMovimiento, string> = {
  cargo_liquidacion: "Cuota (liquidación)",
  reversion_liquidacion: "Anulación de cuota",
  pago: "Pago",
  reversion_pago: "Anulación de pago",
  multa: "Multa",
  ajuste: "Ajuste",
};
