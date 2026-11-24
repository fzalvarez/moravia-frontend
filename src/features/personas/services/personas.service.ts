import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Persona = Esquema<"PersonaSalida">;
export type PaginaPersonas = Esquema<"Pagina_PersonaSalida_">;

export type FiltroPersonas = { q?: string; limit?: number; offset?: number };

export const listarPersonas = async (f: FiltroPersonas = {}): Promise<PaginaPersonas> =>
  (await api.get<PaginaPersonas>("/personas", { params: { ...f, q: f.q || undefined } })).data;

export const getPersona = async (id: string): Promise<Persona> => (await api.get<Persona>(`/personas/${id}`)).data;

export const nombreCompleto = (p: Pick<Persona, "nombres" | "apellidos">) => `${p.nombres} ${p.apellidos}`;
