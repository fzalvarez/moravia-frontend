import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Periodo = Esquema<"PeriodoSalida">;
export type ResumenLiquidaciones = Esquema<"app__modules__liquidaciones__schemas__ResumenSalida">;
export type Configuracion = Esquema<"ConfiguracionSalida">;
export type ConfiguracionEntrada = Esquema<"ConfiguracionEntrada">;
export type Metodo = Esquema<"MetodoDistribucion">;
export type Base = Esquema<"BaseCalculo">;
export type Presupuesto = Esquema<"app__modules__cuotas__schemas__PresupuestoSalida">;
export type Lectura = Esquema<"LecturaSalida">;
export type Validacion = Esquema<"ValidacionSalida">;

export const clavesPeriodos = {
  lista: ["periodos"] as const,
  uno: (id: string) => ["periodos", id] as const,
  resumen: (id: string) => ["periodos", id, "liquidaciones", "resumen"] as const,
  configuracion: (id: string) => ["periodos", id, "configuracion"] as const,
  presupuestos: (id: string) => ["periodos", id, "presupuestos"] as const,
  lecturas: (id: string, conceptoId: string) => ["periodos", id, "lecturas", conceptoId] as const,
  validacion: (id: string) => ["periodos", id, "validacion"] as const,
};

export const listarPeriodos = async (): Promise<Periodo[]> => (await api.get<Periodo[]>("/periodos")).data;

export const getPeriodo = async (id: string): Promise<Periodo> => (await api.get<Periodo>(`/periodos/${id}`)).data;

export const crearPeriodo = async (d: Esquema<"PeriodoCrear">): Promise<Periodo> =>
  (await api.post<Periodo>("/periodos", d)).data;

export const actualizarPeriodo = async (id: string, fechaLimite: string): Promise<Periodo> =>
  (await api.patch<Periodo>(`/periodos/${id}`, { fecha_limite: fechaLimite })).data;

export const getResumenLiquidaciones = async (periodoId: string): Promise<ResumenLiquidaciones> =>
  (await api.get<ResumenLiquidaciones>(`/periodos/${periodoId}/liquidaciones/resumen`)).data;

export const listarConfiguracion = async (id: string): Promise<Configuracion[]> =>
  (await api.get<Configuracion[]>(`/periodos/${id}/conceptos`)).data;

export const configurarConcepto = async (id: string, conceptoId: string, d: ConfiguracionEntrada): Promise<Configuracion> =>
  (await api.put<Configuracion>(`/periodos/${id}/conceptos/${conceptoId}`, d)).data;

export const quitarConcepto = async (id: string, conceptoId: string): Promise<void> => {
  await api.delete(`/periodos/${id}/conceptos/${conceptoId}`);
};

export const listarPresupuestos = async (id: string): Promise<Presupuesto[]> =>
  (await api.get<Presupuesto[]>(`/periodos/${id}/presupuestos`)).data;

export const fijarPresupuesto = async (id: string, conceptoId: string, importe: string): Promise<Presupuesto> =>
  (await api.put<Presupuesto>(`/periodos/${id}/presupuestos/${conceptoId}`, { importe })).data;

export const quitarPresupuesto = async (id: string, conceptoId: string): Promise<void> => {
  await api.delete(`/periodos/${id}/presupuestos/${conceptoId}`);
};

export const listarLecturas = async (id: string, conceptoId: string): Promise<Lectura[]> =>
  (await api.get<Lectura[]>(`/periodos/${id}/conceptos/${conceptoId}/lecturas`)).data;

export const fijarLectura = async (id: string, conceptoId: string, departamentoId: string, anterior: string, actual: string): Promise<Lectura> =>
  (
    await api.put<Lectura>(`/periodos/${id}/conceptos/${conceptoId}/lecturas/${departamentoId}`, {
      lectura_anterior: anterior,
      lectura_actual: actual,
    })
  ).data;

export const validarPeriodo = async (id: string): Promise<Validacion> =>
  (await api.get<Validacion>(`/periodos/${id}/validacion`)).data;

export const NOMBRE_METODO: Record<Metodo, string> = {
  homogeneo: "Partes iguales",
  porcentaje_individual: "Porcentaje por departamento",
  por_tipo: "Importe por tipo de departamento",
  importe_fijo: "Importe fijo por departamento",
  consumo_proporcional: "Proporcional al consumo",
  consumo_tarifa: "Tarifa por unidad consumida",
};

export const NOMBRE_BASE: Record<Base, string> = { presupuestada: "Presupuesto", gastos_reales: "Gastos reales" };

export const esConsumo = (m: Metodo) => m === "consumo_proporcional" || m === "consumo_tarifa";
export const usaBase = (m: Metodo) => m === "homogeneo" || m === "porcentaje_individual" || m === "consumo_proporcional";
