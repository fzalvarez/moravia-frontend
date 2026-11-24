import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";
import { getHttpStatus } from "@/shared/lib/http-error";

export type Estructura = Esquema<"EstructuraSalida">;
export type EstructuraCrear = Esquema<"EstructuraCrear">;
export type Torre = Esquema<"TorreSalida">;
export type TipoEstructura = Esquema<"TipoEstructura">;
export type Nomenclatura = Esquema<"Nomenclatura">;

export const clavesEstructura = { estructura: ["estructura"] as const };

/** null mientras no se haya configurado (el backend responde 404). */
export const getEstructura = async (): Promise<Estructura | null> => {
  try {
    return (await api.get<Estructura>("/estructura")).data;
  } catch (e) {
    if (getHttpStatus(e) === 404) return null;
    throw e;
  }
};

export const crearEstructura = async (d: EstructuraCrear): Promise<Estructura> =>
  (await api.post<Estructura>("/estructura", d)).data;

export const actualizarEstructura = async (d: Esquema<"EstructuraActualizar">): Promise<Estructura> =>
  (await api.patch<Estructura>("/estructura", d)).data;

export const crearTorre = async (nombre: string, pisos: number): Promise<Torre> =>
  (await api.post<Torre>("/torres", { nombre, pisos })).data;

export const actualizarTorre = async (id: string, d: { nombre?: string; pisos?: number }): Promise<Torre> =>
  (await api.patch<Torre>(`/torres/${id}`, d)).data;

export const eliminarTorre = async (id: string): Promise<void> => {
  await api.delete(`/torres/${id}`);
};

export const NOMBRE_NOMENCLATURA: Record<Nomenclatura, string> = {
  letras: "Por letras (A, B, C)",
  numeros: "Por números (1, 2, 3)",
  nombres: "Por nombres (Norte, Sur…)",
};

/** Nombre sugerido para la torre número `i` (desde 0). */
export function nombreSugerido(nomenclatura: Nomenclatura, i: number): string {
  if (nomenclatura === "letras") {
    let n = i;
    let s = "";
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return s;
  }
  if (nomenclatura === "numeros") return String(i + 1);
  return `TORRE ${i + 1}`;
}

/** Código sugerido para un departamento nuevo; es editable (D-030). */
export function codigoSugerido(estructura: Estructura, torre: Torre, piso: number, existentes: string[]): string {
  const base = estructura.tipo === "edificio" ? "" : `${torre.nombre.replace(/\s+/g, "").slice(0, 8)}-`;
  for (let n = 1; n < 100; n++) {
    const codigo = `${base}${piso}${String(n).padStart(2, "0")}`;
    if (!existentes.includes(codigo)) return codigo;
  }
  return `${base}${piso}`;
}
