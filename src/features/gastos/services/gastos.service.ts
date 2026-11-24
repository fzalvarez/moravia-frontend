import api from "@/shared/lib/axios";
import type { Esquema } from "@/api";

export type Gasto = Esquema<"GastoSalida">;
export type GastoCrear = Esquema<"GastoCrear">;
export type GastoActualizar = Esquema<"GastoActualizar">;
export type PaginaGastos = Esquema<"Pagina_GastoSalida_">;
export type ResumenGastos = Esquema<"app__modules__gastos__schemas__ResumenSalida">;
export type PagoProveedor = Esquema<"app__modules__gastos__schemas__PagoSalida">;
export type Adjunto = Esquema<"AdjuntoSalida">;
export type EstadoPago = Esquema<"EstadoPago">;

export type FiltroGastos = {
  q?: string;
  periodo_id?: string;
  categoria_id?: string;
  proveedor_id?: string;
  concepto_id?: string;
  trasladable?: boolean;
  estado?: EstadoPago;
  vencidos?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  incluir_anulados?: boolean;
};

/** Quita los filtros vacíos para no enviarlos. */
const limpio = (f: object) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== ""));

export const clavesGastos = {
  todos: ["gastos"] as const,
  lista: (f: FiltroGastos, offset: number) => ["gastos", "lista", f, offset] as const,
  resumen: (f: FiltroGastos) => ["gastos", "resumen", f] as const,
  uno: (id: string) => ["gastos", id] as const,
  pagos: (id: string) => ["gastos", id, "pagos"] as const,
  adjuntos: (id: string) => ["gastos", id, "adjuntos"] as const,
  adjuntosPago: (pagoId: string) => ["pagos-proveedor", pagoId, "adjuntos"] as const,
};

export const listarGastos = async (f: FiltroGastos, offset: number, limit = 50): Promise<PaginaGastos> =>
  (await api.get<PaginaGastos>("/gastos", { params: { ...limpio(f), offset, limit } })).data;

export const resumenGastos = async (f: FiltroGastos): Promise<ResumenGastos> =>
  (await api.get<ResumenGastos>("/gastos/resumen", { params: limpio(f) })).data;

export const getGasto = async (id: string): Promise<Gasto> => (await api.get<Gasto>(`/gastos/${id}`)).data;

export const crearGasto = async (d: GastoCrear): Promise<Gasto> => (await api.post<Gasto>("/gastos", d)).data;

export const actualizarGasto = async (id: string, d: GastoActualizar): Promise<Gasto> =>
  (await api.patch<Gasto>(`/gastos/${id}`, d)).data;

export const anularGasto = async (id: string, motivo: string): Promise<Gasto> =>
  (await api.post<Gasto>(`/gastos/${id}/anular`, { motivo })).data;

export const listarPagosGasto = async (id: string): Promise<PagoProveedor[]> =>
  (await api.get<PagoProveedor[]>(`/gastos/${id}/pagos`)).data;

export const pagarGasto = async (id: string, d: Esquema<"PagoCrear">): Promise<PagoProveedor> =>
  (await api.post<PagoProveedor>(`/gastos/${id}/pagos`, d)).data;

export const anularPagoProveedor = async (pagoId: string, motivo: string): Promise<PagoProveedor> =>
  (await api.post<PagoProveedor>(`/pagos-proveedor/${pagoId}/anular`, { motivo })).data;

type Duenio = { tipo: "gasto" | "pago"; id: string };
const rutaDuenio = (d: Duenio) => (d.tipo === "gasto" ? `/gastos/${d.id}/adjuntos` : `/pagos-proveedor/${d.id}/adjuntos`);

export const listarAdjuntos = async (d: Duenio): Promise<Adjunto[]> => (await api.get<Adjunto[]>(rutaDuenio(d))).data;

export const subirAdjunto = async (d: Duenio, archivo: File): Promise<Adjunto> => {
  const form = new FormData();
  form.append("archivo", archivo);
  return (await api.post<Adjunto>(rutaDuenio(d), form)).data;
};

export const borrarAdjunto = async (id: string): Promise<void> => {
  await api.delete(`/adjuntos/${id}`);
};

/** Descarga el comprobante con el token de la sesión y lo abre en otra pestaña. */
export const abrirAdjunto = async (a: Adjunto): Promise<void> => {
  const { data } = await api.get<Blob>(`/adjuntos/${a.id}/contenido`, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([data], { type: a.tipo_contenido }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.target = "_blank";
  enlace.rel = "noopener";
  enlace.download = a.nombre_archivo;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const NOMBRE_ESTADO_PAGO: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagado: "Pagado",
  anulado: "Anulado",
};
