import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Concepto = Esquema<"ConceptoSalida">;

export const clavesConceptos = { lista: ["conceptos"] as const };

export const listarConceptos = async (activo?: boolean): Promise<Concepto[]> =>
  (await api.get<Concepto[]>("/conceptos", { params: { activo } })).data;

export const crearConcepto = async (d: Esquema<"ConceptoCrear">): Promise<Concepto> =>
  (await api.post<Concepto>("/conceptos", d)).data;

export const actualizarConcepto = async (id: string, d: Esquema<"ConceptoActualizar">): Promise<Concepto> =>
  (await api.patch<Concepto>(`/conceptos/${id}`, d)).data;

export const desactivarConcepto = async (id: string): Promise<Concepto> =>
  (await api.post<Concepto>(`/conceptos/${id}/desactivar`)).data;

export const reactivarConcepto = async (id: string): Promise<Concepto> =>
  (await api.post<Concepto>(`/conceptos/${id}/reactivar`)).data;
