import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Aviso = Esquema<"AvisoSalida">;

export const clavesAvisos = { lista: ["avisos"] as const };

export const listarAvisos = async (): Promise<Aviso[]> => (await api.get<Aviso[]>("/avisos")).data;

/** `departamento_ids` vacío = para todos los departamentos. */
export const crearAviso = async (d: Esquema<"AvisoCrear">): Promise<Aviso> => (await api.post<Aviso>("/avisos", d)).data;

export const retirarAviso = async (id: string): Promise<Aviso> => (await api.post<Aviso>(`/avisos/${id}/retirar`)).data;
