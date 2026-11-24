import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type TipoDepartamento = Esquema<"TipoSalida">;

export const clavesTipos = { lista: ["tipos-departamento"] as const };

export const listarTipos = async (): Promise<TipoDepartamento[]> =>
  (await api.get<TipoDepartamento[]>("/tipos-departamento")).data;

export const crearTipo = async (d: Esquema<"TipoCrear">): Promise<TipoDepartamento> =>
  (await api.post<TipoDepartamento>("/tipos-departamento", d)).data;

export const actualizarTipo = async (id: string, d: Esquema<"TipoActualizar">): Promise<TipoDepartamento> =>
  (await api.patch<TipoDepartamento>(`/tipos-departamento/${id}`, d)).data;
