import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Persona = Esquema<"PersonaSalida">;
export type PaginaPersonas = Esquema<"Pagina_PersonaSalida_">;
export type PersonaCrear = Esquema<"PersonaCrear">;
export type Vinculo = Esquema<"VinculoSalida">;
export type VinculoResultado = Esquema<"VinculoResultado">;
export type TipoVinculo = Esquema<"TipoVinculo">;

export type FiltroPersonas = { q?: string; limit?: number; offset?: number };

export const clavesPersonas = {
  todas: ["personas"] as const,
  lista: (f: FiltroPersonas) => ["personas", "lista", f] as const,
  una: (id: string) => ["personas", id] as const,
  vinculos: (id: string) => ["personas", id, "vinculos"] as const,
  ocupantes: (departamentoId: string, vigentes: boolean) => ["departamentos", departamentoId, "vinculos", vigentes] as const,
};

export const listarPersonas = async (f: FiltroPersonas = {}): Promise<PaginaPersonas> =>
  (await api.get<PaginaPersonas>("/personas", { params: { ...f, q: f.q || undefined } })).data;

export const getPersona = async (id: string): Promise<Persona> => (await api.get<Persona>(`/personas/${id}`)).data;

export const crearPersona = async (d: PersonaCrear): Promise<Persona> => (await api.post<Persona>("/personas", d)).data;

export const actualizarPersona = async (id: string, d: Partial<PersonaCrear>): Promise<Persona> =>
  (await api.patch<Persona>(`/personas/${id}`, d)).data;

export const borrarPersona = async (id: string): Promise<void> => {
  await api.delete(`/personas/${id}`);
};

export const vinculosDePersona = async (id: string): Promise<Vinculo[]> =>
  (await api.get<Vinculo[]>(`/personas/${id}/vinculos`)).data;

export const vinculosDeDepartamento = async (departamentoId: string, vigentes: boolean): Promise<Vinculo[]> =>
  (await api.get<Vinculo[]>(`/departamentos/${departamentoId}/vinculos`, { params: { vigentes } })).data;

export const crearVinculo = async (departamentoId: string, d: Esquema<"VinculoCrear">): Promise<VinculoResultado> =>
  (await api.post<VinculoResultado>(`/departamentos/${departamentoId}/vinculos`, d)).data;

export const cerrarVinculo = async (vinculoId: string, fechaFin: string): Promise<VinculoResultado> =>
  (await api.post<VinculoResultado>(`/vinculos/${vinculoId}/cerrar`, { fecha_fin: fechaFin })).data;

export const designarPrincipal = async (departamentoId: string, vinculoId: string): Promise<Vinculo> =>
  (await api.put<Vinculo>(`/departamentos/${departamentoId}/residente-principal`, { vinculo_id: vinculoId })).data;

export const nombreCompleto = (p: Pick<Persona, "nombres" | "apellidos">) => `${p.nombres} ${p.apellidos}`;

export const NOMBRE_VINCULO: Record<TipoVinculo, string> = { propietario: "Propietario", residente: "Residente", inquilino: "Inquilino" };
