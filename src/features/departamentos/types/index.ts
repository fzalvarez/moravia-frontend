// Contrato de la API (moravia-backend, esquemas *Salida). Importes como texto.

// ── unidades ────────────────────────────────────────────────────────────────
export interface DepartamentoApi {
  id: string;
  codigo: string;
  piso: number | null;
  activo: boolean;
  tipo_departamento_id: string | null;
  creado_en: string;
}

export type TipoAnexo = "estacionamiento" | "deposito";

export interface AnexoApi {
  id: string;
  tipo: TipoAnexo;
  codigo: string;
  departamento_id: string;
}

// ── cuotas ──────────────────────────────────────────────────────────────────
export interface TipoDepartamentoApi {
  id: string;
  codigo: string;
  nombre: string;
}

export interface PeriodoApi {
  id: string;
  anio: number;
  mes: number;
  fecha_limite: string;
  estado: "abierto" | "cerrado";
}

// ── personas ────────────────────────────────────────────────────────────────
export interface PersonaApi {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  telefono: string | null;
  correo: string | null;
  creado_en: string;
}

export type TipoVinculo = "propietario" | "residente" | "inquilino";

export interface VinculoApi {
  id: string;
  persona_id: string;
  departamento_id: string;
  tipo: TipoVinculo;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_principal: boolean;
  vigente: boolean;
}

// ── liquidaciones y cuenta ──────────────────────────────────────────────────
export type TipoMovimiento =
  | "cargo_liquidacion"
  | "reversion_liquidacion"
  | "pago"
  | "reversion_pago"
  | "multa"
  | "ajuste";

export interface MovimientoApi {
  id: string;
  tipo: TipoMovimiento;
  fecha: string;
  importe: string;
  periodo_id: string | null;
  liquidacion_id: string | null;
  pago_id: string | null;
  multa_id: string | null;
  ajuste_id: string | null;
}

export interface DetalleLiquidacionApi {
  concepto_id: string;
  concepto_codigo: string;
  concepto_nombre: string;
  metodo: string;
  importe_calculado: string;
  importe: string;
  calculo: Record<string, unknown>;
}

export interface LiquidacionDetalleApi {
  id: string;
  periodo_id: string;
  departamento_id: string;
  departamento_codigo: string | null;
  estado: "borrador" | "emitida" | "anulada";
  total: string;
  corrige_a_id: string | null;
  emitida_en: string | null;
  anulada_en: string | null;
  motivo_anulacion: string | null;
  detalles: DetalleLiquidacionApi[];
  configuracion: Record<string, unknown>;
}

export interface ResumenLiquidacionesApi {
  periodo_id: string;
  estado_periodo: string;
  borradores: number;
  emitidas: number;
  anuladas: number;
  total_emitido: string;
  pendientes_de_emitir: string[];
}

// ── pagos ───────────────────────────────────────────────────────────────────
export interface PagoApi {
  id: string;
  departamento_id: string;
  fecha: string;
  importe: string;
  referencia: string | null;
  anulado: boolean;
  motivo_anulacion: string | null;
  creado_en: string;
}

export interface SeccionApi {
  total: string;
  movimientos: MovimientoApi[];
}

export interface EstadoCuentaApi {
  departamento_id: string;
  departamento_codigo: string;
  periodo_id: string | null;
  anio: number | null;
  mes: number | null;
  fecha_limite: string | null;
  deuda_anterior: SeccionApi;
  cuota_actual: SeccionApi;
  multas: SeccionApi;
  pagos: SeccionApi;
  ajustes: SeccionApi;
  saldo_total: string;
  saldo_actual: string;
}

// ── reportes ────────────────────────────────────────────────────────────────
export interface MorosidadFilaApi {
  departamento_id: string;
  departamento_codigo: string;
  activo: boolean;
  saldo: string;
  deuda_vencida: string;
  periodos_pendientes: { periodo_id: string; anio: number; mes: number; pendiente: string; vence: string }[];
  antiguedad_dias: number;
  vencido_desde: string | null;
  multas_cantidad: number;
  multas_total: string;
  multas_pendientes: string;
  ajustes_pendientes: string;
}

export interface MorosidadApi {
  fecha: string;
  departamentos: number;
  saldo_total: string;
  deuda_vencida_total: string;
  filas: MorosidadFilaApi[];
}

export interface RecaudacionTotalesApi {
  cantidad_pagos: number;
  pagos: string;
  reversiones: string;
  neto: string;
}

// ── Vista ───────────────────────────────────────────────────────────────────
/**
 * Lo que la pantalla reúne de cada departamento. Al integrar sale de
 * `GET /departamentos` + `/anexos` + `/vinculos` (+ `/personas/{id}`),
 * `/estado-cuenta`, `/liquidaciones` y `/pagos`, más la fila de morosidad.
 */
export interface DepartamentoFicha {
  departamento: DepartamentoApi;
  tipo: TipoDepartamentoApi | null;
  anexos: AnexoApi[];
  ocupantes: { vinculo: VinculoApi; persona: PersonaApi }[];
  morosidad: MorosidadFilaApi | null;
  estadoCuenta: EstadoCuentaApi | null;
  liquidacion: LiquidacionDetalleApi | null;
  pagos: PagoApi[];
}

/** Situación de pago para la etiqueta; se lee de la morosidad, no se calcula. */
export type SituacionPago = "al_dia" | "por_vencer" | "vencido" | "desactivado";
