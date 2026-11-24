import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Morosidad = Esquema<"MorosidadSalida">;

export const clavesReportes = {
  morosidad: (soloConDeuda: boolean) => ["reportes", "morosidad", soloConDeuda] as const,
};

export const getMorosidad = async (soloConDeuda: boolean): Promise<Morosidad> =>
  (await api.get<Morosidad>("/reportes/morosidad", { params: { solo_con_deuda: soloConDeuda } })).data;
