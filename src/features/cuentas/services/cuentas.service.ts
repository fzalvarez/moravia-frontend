import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Cuenta = Esquema<"app__modules__auth__schemas__CuentaSalida">;
export type PaginaCuentas = Esquema<"CuentasPagina">;
export type CuentaCrear = Esquema<"CuentaCrear">;
export type CodigoActivacion = Esquema<"CodigoActivacionSalida">;
export type Rol = Esquema<"RolSalida">;
export type Permiso = Esquema<"PermisoSalida">;
export type CodigoRol = Esquema<"CodigoRol">;

export const clavesCuentas = {
  todas: ["cuentas"] as const,
  lista: (offset: number) => ["cuentas", "lista", offset] as const,
  una: (id: string) => ["cuentas", id] as const,
  roles: ["roles"] as const,
  permisos: ["permisos"] as const,
};

export const listarCuentas = async (offset: number, limit = 50): Promise<PaginaCuentas> =>
  (await api.get<PaginaCuentas>("/cuentas", { params: { offset, limit } })).data;

export const getCuenta = async (id: string): Promise<Cuenta> => (await api.get<Cuenta>(`/cuentas/${id}`)).data;

export const crearCuenta = async (datos: CuentaCrear): Promise<CodigoActivacion> =>
  (await api.post<CodigoActivacion>("/cuentas", datos)).data;

export const asignarRoles = async (id: string, roles: CodigoRol[]): Promise<Cuenta> =>
  (await api.put<Cuenta>(`/cuentas/${id}/roles`, { roles })).data;

export const desactivarCuenta = async (id: string): Promise<Cuenta> =>
  (await api.post<Cuenta>(`/cuentas/${id}/desactivar`)).data;

export const reactivarCuenta = async (id: string): Promise<Cuenta> =>
  (await api.post<Cuenta>(`/cuentas/${id}/reactivar`)).data;

export const restablecerAcceso = async (id: string): Promise<CodigoActivacion> =>
  (await api.post<CodigoActivacion>(`/cuentas/${id}/restablecer-acceso`)).data;

export const listarRoles = async (): Promise<Rol[]> => (await api.get<Rol[]>("/roles")).data;

export const listarPermisos = async (): Promise<Permiso[]> => (await api.get<Permiso[]>("/permisos")).data;

export const actualizarPermisosRol = async (codigo: string, permisos: string[]): Promise<Rol> =>
  (await api.put<Rol>(`/roles/${codigo}/permisos`, { permisos })).data;

export const ROLES_PERSONALES: { codigo: CodigoRol; label: string }[] = [
  { codigo: "administrador", label: "Administrador" },
  { codigo: "junta_directiva", label: "Junta directiva" },
  { codigo: "personal_operativo", label: "Personal operativo" },
];

export const nombreRol = (codigo: string) =>
  ROLES_PERSONALES.find((r) => r.codigo === codigo)?.label ?? (codigo === "departamento" ? "Departamento" : codigo);
