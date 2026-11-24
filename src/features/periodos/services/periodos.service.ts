import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Periodo = Esquema<"PeriodoSalida">;
export type ResumenLiquidaciones = Esquema<"app__modules__liquidaciones__schemas__ResumenSalida">;

export const listarPeriodos = async (): Promise<Periodo[]> =>
  (await api.get<Periodo[]>("/periodos")).data;

export const getResumenLiquidaciones = async (periodoId: string): Promise<ResumenLiquidaciones> =>
  (await api.get<ResumenLiquidaciones>(`/periodos/${periodoId}/liquidaciones/resumen`)).data;
