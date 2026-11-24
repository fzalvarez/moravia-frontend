import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Departamento = Esquema<"DepartamentoSalida">;
export type PaginaDepartamentos = Esquema<"Pagina_DepartamentoSalida_">;
export type DepartamentoCrear = Esquema<"DepartamentoCrear">;
export type DepartamentoActualizar = Esquema<"DepartamentoActualizar">;
export type Anexo = Esquema<"AnexoSalida">;
export type TipoAnexo = Esquema<"TipoAnexo">;

export type FiltroDepartamentos = { q?: string; activo?: boolean; limit?: number; offset?: number };

export const clavesDepartamentos = {
  todos: ["departamentos"] as const,
  lista: (f: FiltroDepartamentos) => ["departamentos", "lista", f] as const,
  uno: (id: string) => ["departamentos", id] as const,
  anexos: (id: string) => ["departamentos", id, "anexos"] as const,
};

export const listarDepartamentos = async (f: FiltroDepartamentos = {}): Promise<PaginaDepartamentos> =>
  (await api.get<PaginaDepartamentos>("/departamentos", { params: { ...f, q: f.q || undefined } })).data;

export const getDepartamento = async (id: string): Promise<Departamento> =>
  (await api.get<Departamento>(`/departamentos/${id}`)).data;

export const crearDepartamento = async (d: DepartamentoCrear): Promise<Departamento> =>
  (await api.post<Departamento>("/departamentos", d)).data;

export const actualizarDepartamento = async (id: string, d: DepartamentoActualizar): Promise<Departamento> =>
  (await api.patch<Departamento>(`/departamentos/${id}`, d)).data;

export const desactivarDepartamento = async (id: string): Promise<Departamento> =>
  (await api.post<Departamento>(`/departamentos/${id}/desactivar`)).data;

export const reactivarDepartamento = async (id: string): Promise<Departamento> =>
  (await api.post<Departamento>(`/departamentos/${id}/reactivar`)).data;

export const asignarTipoDepartamento = async (id: string, tipoId: string | null): Promise<Departamento> =>
  (await api.put<Departamento>(`/departamentos/${id}/tipo`, { tipo_departamento_id: tipoId })).data;

export const listarAnexos = async (id: string): Promise<Anexo[]> =>
  (await api.get<Anexo[]>(`/departamentos/${id}/anexos`)).data;

export const crearAnexo = async (id: string, tipo: TipoAnexo, codigo: string): Promise<Anexo> =>
  (await api.post<Anexo>(`/departamentos/${id}/anexos`, { tipo, codigo })).data;

export const actualizarAnexo = async (anexoId: string, codigo: string): Promise<Anexo> =>
  (await api.patch<Anexo>(`/anexos/${anexoId}`, { codigo })).data;

export const borrarAnexo = async (anexoId: string): Promise<void> => {
  await api.delete(`/anexos/${anexoId}`);
};

export const NOMBRE_ANEXO: Record<TipoAnexo, string> = { estacionamiento: "Estacionamiento", deposito: "Depósito" };

/** Todos los departamentos (recorre las páginas de 200), para configuraciones por departamento. */
export const listarTodosDepartamentos = async (activo?: boolean): Promise<Departamento[]> => {
  const todos: Departamento[] = [];
  for (let offset = 0; ; offset += 200) {
    const p = await listarDepartamentos({ activo, limit: 200, offset });
    todos.push(...p.items);
    if (todos.length >= p.total || p.items.length === 0) return todos;
  }
};

/** Solo sin historial (D-062); si no, el backend responde 409 y hay que desactivarlo. */
export const eliminarDepartamento = async (id: string): Promise<void> => {
  await api.delete(`/departamentos/${id}`);
};
