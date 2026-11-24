import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Departamento = Esquema<"DepartamentoSalida">;
export type PaginaDepartamentos = Esquema<"Pagina_DepartamentoSalida_">;

export type FiltroDepartamentos = { q?: string; activo?: boolean; limit?: number; offset?: number };

export const listarDepartamentos = async (f: FiltroDepartamentos = {}): Promise<PaginaDepartamentos> =>
  (await api.get<PaginaDepartamentos>("/departamentos", { params: { ...f, q: f.q || undefined } })).data;

export const getDepartamento = async (id: string): Promise<Departamento> =>
  (await api.get<Departamento>(`/departamentos/${id}`)).data;
