import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";
import { getHttpStatus } from "@/shared/lib/http-error";

export type Politica = Esquema<"PoliticaSalida">;
export type Generacion = Esquema<"GeneracionSalida">;

export const clavesMultas = { politica: ["multas", "politica"] as const };

/** null si la política nunca se configuró (el backend responde 404). */
export const getPolitica = async (): Promise<Politica | null> => {
  try {
    return (await api.get<Politica>("/multas/politica")).data;
  } catch (e) {
    if (getHttpStatus(e) === 404) return null;
    throw e;
  }
};

export const guardarPolitica = async (d: { activa: boolean; dias_gracia: number; importe: string }): Promise<Politica> =>
  (await api.put<Politica>("/multas/politica", d)).data;

export const generarMultas = async (fechaCorte: string | null): Promise<Generacion> =>
  (await api.post<Generacion>("/multas/generar", { fecha_corte: fechaCorte })).data;
