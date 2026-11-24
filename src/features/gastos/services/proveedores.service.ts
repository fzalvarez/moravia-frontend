import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Proveedor = Esquema<"ProveedorSalida">;
export type ProveedorCrear = Esquema<"ProveedorCrear">;
export type PaginaProveedores = Esquema<"Pagina_ProveedorSalida_">;
export type Categoria = Esquema<"CategoriaSalida">;

export type FiltroProveedores = { q?: string; activo?: boolean; limit?: number; offset?: number };

export const clavesProveedores = {
  todos: ["proveedores"] as const,
  lista: (f: FiltroProveedores) => ["proveedores", "lista", f] as const,
  uno: (id: string) => ["proveedores", id] as const,
  categorias: ["categorias-gasto"] as const,
};

export const listarProveedores = async (f: FiltroProveedores = {}): Promise<PaginaProveedores> =>
  (await api.get<PaginaProveedores>("/proveedores", { params: { ...f, q: f.q || undefined } })).data;

export const getProveedor = async (id: string): Promise<Proveedor> => (await api.get<Proveedor>(`/proveedores/${id}`)).data;

export const crearProveedor = async (d: ProveedorCrear): Promise<Proveedor> => (await api.post<Proveedor>("/proveedores", d)).data;

export const actualizarProveedor = async (id: string, d: Partial<ProveedorCrear>): Promise<Proveedor> =>
  (await api.patch<Proveedor>(`/proveedores/${id}`, d)).data;

export const cambiarEstadoProveedor = async (id: string, activar: boolean): Promise<Proveedor> =>
  (await api.post<Proveedor>(`/proveedores/${id}/${activar ? "reactivar" : "desactivar"}`)).data;

export const listarCategorias = async (): Promise<Categoria[]> => (await api.get<Categoria[]>("/categorias-gasto")).data;

export const crearCategoria = async (d: Esquema<"CategoriaCrear">): Promise<Categoria> =>
  (await api.post<Categoria>("/categorias-gasto", d)).data;

export const actualizarCategoria = async (id: string, d: Esquema<"CategoriaActualizar">): Promise<Categoria> =>
  (await api.patch<Categoria>(`/categorias-gasto/${id}`, d)).data;
