import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Morosidad = Esquema<"MorosidadSalida">;
export type Recaudacion = Esquema<"RecaudacionSalida">;
export type GastosPresupuesto = Esquema<"app__modules__reportes__schemas__PresupuestoSalida">;
export type ResumenFinanciero = Esquema<"ResumenFinancieroSalida">;

export type FiltroRecaudacion = { periodo_id?: string; desde?: string; hasta?: string; departamento_id?: string };

export const clavesReportes = {
  morosidad: (soloConDeuda: boolean) => ["reportes", "morosidad", soloConDeuda] as const,
  recaudacion: (f: FiltroRecaudacion) => ["reportes", "recaudacion", f] as const,
  gastosPresupuesto: (periodoId: string) => ["reportes", "gastos-presupuesto", periodoId] as const,
  resumen: (periodoId: string) => ["reportes", "resumen", periodoId] as const,
};

export const getMorosidad = async (soloConDeuda: boolean): Promise<Morosidad> =>
  (await api.get<Morosidad>("/reportes/morosidad", { params: { solo_con_deuda: soloConDeuda } })).data;

export const getRecaudacion = async (f: FiltroRecaudacion): Promise<Recaudacion> =>
  (await api.get<Recaudacion>("/reportes/recaudacion", { params: Object.fromEntries(Object.entries(f).filter(([, v]) => v)) })).data;

export const getGastosPresupuesto = async (periodoId: string): Promise<GastosPresupuesto> =>
  (await api.get<GastosPresupuesto>("/reportes/gastos-presupuesto", { params: { periodo_id: periodoId } })).data;

export const getResumenFinanciero = async (periodoId: string): Promise<ResumenFinanciero> =>
  (await api.get<ResumenFinanciero>(`/reportes/periodos/${periodoId}/resumen-financiero`)).data;
