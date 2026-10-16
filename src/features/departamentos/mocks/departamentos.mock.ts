// MAQUETA: datos ficticios con la forma exacta de la API. Se reemplazan por
// los services/ de este feature al integrar; nada de aquí se calcula en el front.
import type { Pagina } from "@/shared/types/api.types";
import type {
  AnexoApi,
  DepartamentoApi,
  DepartamentoFicha,
  MorosidadApi,
  MorosidadFilaApi,
  PagoApi,
  PersonaApi,
  RecaudacionTotalesApi,
  TipoAnexo,
  TipoDepartamentoApi,
  TipoVinculo,
} from "../types";
import { periodoActualMock } from "@/shared/mocks/app.mock";


const TIPOS: Record<string, TipoDepartamentoApi> = {
  EST: { id: "tip-est", codigo: "EST", nombre: "Estándar" },
  DUP: { id: "tip-dup", codigo: "DUP", nombre: "Dúplex" },
  PH: { id: "tip-ph", codigo: "PH", nombre: "Penthouse" },
};

const CONCEPTOS: Record<string, [string, string, string][]> = {
  // [código, nombre, método] en el orden del detalle de liquidación.
  base: [
    ["MANT", "Mantenimiento", "homogeneo"],
    ["VIG", "Vigilancia", "por_tipo"],
    ["AGUA", "Agua", "consumo_proporcional"],
  ],
};

type PersonaSemilla = [nombres: string, apellidos: string, dni: string, telefono: string, correo: string];
type OcupanteSemilla = [persona: PersonaSemilla, tipo: TipoVinculo, principal: boolean, desde: string];
type PagoSemilla = [fecha: string, importe: string, referencia: string, motivoAnulacion?: string];

interface Semilla {
  codigo: string;
  piso: number;
  tipo: keyof typeof TIPOS;
  activo?: boolean;
  anexos?: [TipoAnexo, string][];
  ocupantes?: OcupanteSemilla[];
  /** Importes por concepto (MANT, VIG, AGUA) y total, tal como los devuelve la liquidación. */
  cuota?: { importes: [string, string, string]; total: string };
  cuenta: { deudaAnterior: string; multas: string; pagos: string; ajustes: string; saldo: string };
  morosidad?: Partial<MorosidadFilaApi>;
  pagos?: PagoSemilla[];
}

const seccion = (total: string) => ({ total, movimientos: [] });

function construir(s: Semilla): DepartamentoFicha {
  const id = `dep-${s.codigo}`;
  const activo = s.activo ?? true;
  const departamento: DepartamentoApi = {
    id,
    codigo: s.codigo,
    piso: s.piso,
    activo,
    tipo_departamento_id: TIPOS[s.tipo].id,
    creado_en: "2025-01-10T15:00:00Z",
  };
  const anexos: AnexoApi[] = (s.anexos ?? []).map(([tipo, codigo]) => ({
    id: `anx-${codigo}`,
    tipo,
    codigo,
    departamento_id: id,
  }));
  const ocupantes = (s.ocupantes ?? []).map(([p, tipo, principal, desde]) => {
    const persona: PersonaApi = {
      id: `per-${p[2]}`,
      nombres: p[0],
      apellidos: p[1],
      tipo_documento: "DNI",
      numero_documento: p[2],
      telefono: p[3],
      correo: p[4],
      creado_en: "2025-01-10T15:00:00Z",
    };
    return {
      persona,
      vinculo: {
        id: `vin-${s.codigo}-${p[2]}`,
        persona_id: persona.id,
        departamento_id: id,
        tipo,
        fecha_inicio: desde,
        fecha_fin: null,
        es_principal: principal,
        vigente: true,
      },
    };
  });
  const pagos: PagoApi[] = (s.pagos ?? []).map(([fecha, importe, referencia, motivo], i) => ({
    id: `pag-${s.codigo}-${i}`,
    departamento_id: id,
    fecha,
    importe,
    referencia,
    anulado: motivo !== undefined,
    motivo_anulacion: motivo ?? null,
    creado_en: `${fecha}T14:00:00Z`,
  }));
  const p = periodoActualMock;

  return {
    departamento,
    tipo: TIPOS[s.tipo],
    anexos,
    ocupantes,
    pagos,
    liquidacion: s.cuota
      ? {
          id: `liq-${s.codigo}-2026-10`,
          periodo_id: p.id,
          departamento_id: id,
          departamento_codigo: null,
          estado: "emitida",
          total: s.cuota.total,
          corrige_a_id: null,
          emitida_en: "2026-10-01T13:00:00Z",
          anulada_en: null,
          motivo_anulacion: null,
          detalles: CONCEPTOS.base.map(([codigo, nombre, metodo], i) => ({
            concepto_id: `con-${codigo}`,
            concepto_codigo: codigo,
            concepto_nombre: nombre,
            metodo,
            importe_calculado: s.cuota!.importes[i],
            importe: s.cuota!.importes[i],
            calculo: {},
          })),
          configuracion: {},
        }
      : null,
    estadoCuenta: {
      departamento_id: id,
      departamento_codigo: s.codigo,
      periodo_id: p.id,
      anio: p.anio,
      mes: p.mes,
      fecha_limite: p.fecha_limite,
      deuda_anterior: seccion(s.cuenta.deudaAnterior),
      cuota_actual: seccion(s.cuota?.total ?? "0.00"),
      multas: seccion(s.cuenta.multas),
      pagos: seccion(s.cuenta.pagos),
      ajustes: seccion(s.cuenta.ajustes),
      saldo_total: s.cuenta.saldo,
      saldo_actual: s.cuenta.saldo,
    },
    morosidad: {
      departamento_id: id,
      departamento_codigo: s.codigo,
      activo,
      saldo: s.cuenta.saldo,
      deuda_vencida: "0.00",
      periodos_pendientes: [],
      antiguedad_dias: 0,
      vencido_desde: null,
      multas_cantidad: 0,
      multas_total: "0.00",
      multas_pendientes: "0.00",
      ajustes_pendientes: "0.00",
      ...s.morosidad,
    },
  };
}

const EST: [string, string, string] = ["180.00", "120.00", "58.33"];
const DUP: [string, string, string] = ["180.00", "210.00", "122.40"];
const PH: [string, string, string] = ["180.00", "380.00", "330.10"];
const PAGADO = (pagos: string) => ({ deudaAnterior: "0.00", multas: "0.00", pagos, ajustes: "0.00", saldo: "0.00" });

export const departamentosMock: DepartamentoFicha[] = [
  {
    codigo: "101", piso: 1, tipo: "EST",
    anexos: [["estacionamiento", "E-01"]],
    ocupantes: [[["Rosa", "Quispe Huamán", "40218876", "987 654 321", "rosa.quispe@gmail.com"], "propietario", true, "2019-03-01"]],
    cuota: { importes: EST, total: "358.33" },
    cuenta: PAGADO("-358.33"),
    pagos: [["2026-10-05", "358.33", "Transferencia BCP 004512"], ["2026-09-08", "352.10", "Yape 99812"]],
  },
  {
    codigo: "102", piso: 1, tipo: "EST",
    anexos: [["estacionamiento", "E-02"], ["deposito", "D-01"]],
    ocupantes: [
      [["Luis", "Paredes Soto", "45512309", "955 120 448", "lparedes@outlook.com"], "inquilino", true, "2025-02-01"],
      [["Carmen", "Vidal Rojas", "09881245", "999 301 552", "carmen.vidal@gmail.com"], "propietario", false, "2015-06-10"],
    ],
    cuota: { importes: EST, total: "358.33" },
    cuenta: { deudaAnterior: "352.10", multas: "17.61", pagos: "0.00", ajustes: "0.00", saldo: "728.04" },
    morosidad: {
      deuda_vencida: "352.10", antiguedad_dias: 25, vencido_desde: "2026-09-20",
      multas_cantidad: 1, multas_total: "17.61", multas_pendientes: "17.61",
      periodos_pendientes: [
        { periodo_id: "per-2026-09", anio: 2026, mes: 9, pendiente: "352.10", vence: "2026-09-20" },
        { periodo_id: "per-2026-10", anio: 2026, mes: 10, pendiente: "358.33", vence: "2026-10-20" },
      ],
    },
    pagos: [["2026-08-14", "349.80", "Depósito BBVA 7781"]],
  },
  {
    codigo: "201", piso: 2, tipo: "DUP",
    anexos: [["estacionamiento", "E-05"], ["estacionamiento", "E-06"]],
    ocupantes: [
      [["Jorge", "Salinas Medina", "41023987", "981 442 019", "jsalinas@gmail.com"], "propietario", true, "2021-11-15"],
      [["Patricia", "Núñez Arce", "41877120", "981 442 020", "pnunez@gmail.com"], "residente", false, "2021-11-15"],
    ],
    cuota: { importes: DUP, total: "512.40" },
    cuenta: { deudaAnterior: "0.00", multas: "0.00", pagos: "0.00", ajustes: "0.00", saldo: "512.40" },
    morosidad: {
      periodos_pendientes: [{ periodo_id: "per-2026-10", anio: 2026, mes: 10, pendiente: "512.40", vence: "2026-10-20" }],
    },
    pagos: [["2026-09-18", "505.90", "Transferencia Interbank 3321"]],
  },
  {
    codigo: "202", piso: 2, tipo: "EST",
    anexos: [["estacionamiento", "E-07"]],
    ocupantes: [[["Ana", "Pérez Gálvez", "46620114", "944 210 873", "ana.perez@gmail.com"], "propietario", true, "2023-01-09"]],
    cuota: { importes: EST, total: "358.33" },
    cuenta: { deudaAnterior: "0.00", multas: "0.00", pagos: "-200.00", ajustes: "0.00", saldo: "158.33" },
    morosidad: {
      periodos_pendientes: [{ periodo_id: "per-2026-10", anio: 2026, mes: 10, pendiente: "158.33", vence: "2026-10-20" }],
    },
    pagos: [["2026-10-10", "200.00", "Yape 55120"], ["2026-09-12", "352.10", "Transferencia BCP 003310"]],
  },
  {
    codigo: "301", piso: 3, tipo: "EST",
    anexos: [["deposito", "D-04"]],
    ocupantes: [[["Miguel", "Torres Ramos", "07765432", "996 001 287", "mtorres@yahoo.com"], "propietario", true, "2018-05-20"]],
    cuota: { importes: EST, total: "358.33" },
    cuenta: { deudaAnterior: "701.90", multas: "35.10", pagos: "-200.00", ajustes: "0.00", saldo: "895.33" },
    morosidad: {
      deuda_vencida: "501.90", antiguedad_dias: 56, vencido_desde: "2026-08-20",
      multas_cantidad: 2, multas_total: "35.10", multas_pendientes: "35.10",
      periodos_pendientes: [
        { periodo_id: "per-2026-08", anio: 2026, mes: 8, pendiente: "149.80", vence: "2026-08-20" },
        { periodo_id: "per-2026-09", anio: 2026, mes: 9, pendiente: "352.10", vence: "2026-09-20" },
        { periodo_id: "per-2026-10", anio: 2026, mes: 10, pendiente: "358.33", vence: "2026-10-20" },
      ],
    },
    pagos: [
      ["2026-10-02", "200.00", "Efectivo · recibo 0142"],
      ["2026-09-25", "352.10", "Cheque 00981", "Cheque sin fondos"],
      ["2026-07-15", "340.00", "Transferencia BCP 001208"],
    ],
  },
  {
    codigo: "302", piso: 3, tipo: "EST",
    ocupantes: [[["Elena", "Bustamante Ríos", "42298810", "912 887 450", "elena.bustamante@gmail.com"], "propietario", true, "2020-08-01"]],
    cuota: { importes: EST, total: "358.33" },
    cuenta: PAGADO("-358.33"),
    pagos: [["2026-10-03", "358.33", "Transferencia BCP 004401"]],
  },
  {
    codigo: "401", piso: 4, tipo: "EST",
    anexos: [["estacionamiento", "E-10"]],
    ocupantes: [
      [["Diego", "Fernández Castro", "47120098", "933 650 112", "diego.fc@gmail.com"], "inquilino", true, "2026-03-01"],
      [["Sofía", "Rossi Valdivia", "10223344", "998 776 120", "sofia.rossi@gmail.com"], "propietario", false, "2012-04-18"],
    ],
    cuota: { importes: EST, total: "358.33" },
    cuenta: PAGADO("-358.33"),
    pagos: [["2026-10-07", "358.33", "Plin 23019"]],
  },
  {
    codigo: "402", piso: 4, tipo: "EST", activo: false,
    cuenta: { deudaAnterior: "0.00", multas: "0.00", pagos: "0.00", ajustes: "0.00", saldo: "0.00" },
  },
  {
    codigo: "501", piso: 5, tipo: "DUP",
    anexos: [["estacionamiento", "E-11"], ["estacionamiento", "E-12"]],
    ocupantes: [[["Ricardo", "Gamarra León", "06654321", "997 300 845", "rgamarra@gmail.com"], "propietario", true, "2017-09-01"]],
    cuota: { importes: DUP, total: "512.40" },
    cuenta: PAGADO("-512.40"),
    pagos: [["2026-10-01", "512.40", "Transferencia BBVA 9022"]],
  },
  {
    codigo: "1001", piso: 10, tipo: "PH",
    anexos: [["estacionamiento", "E-14"], ["estacionamiento", "E-15"], ["deposito", "D-03"]],
    ocupantes: [[["Valeria", "Mendoza Ugarte", "40001122", "999 120 330", "valeria.mendoza@gmail.com"], "propietario", true, "2016-02-12"]],
    cuota: { importes: PH, total: "890.10" },
    cuenta: PAGADO("-890.10"),
    pagos: [["2026-10-04", "890.10", "Transferencia BCP 004498"]],
  },
].map((s) => construir(s as Semilla));

/** Totales de `GET /departamentos` (total de la página) por filtro `activo`. */
export const totalesDepartamentosMock = { todos: 48, activos: 47, desactivados: 1 };

export const paginaDepartamentosMock: Pick<Pagina<unknown>, "total" | "limit" | "offset"> = {
  total: 48,
  limit: 10,
  offset: 0,
};

/** `GET /reportes/morosidad` (solo cabecera; las filas van en cada ficha). */
export const morosidadMock: Omit<MorosidadApi, "filas"> & { con_deuda_vencida: number } = {
  fecha: "2026-10-15",
  departamentos: 48,
  saldo_total: "6318.45",
  deuda_vencida_total: "2864.30",
  // Conteo de filas con deuda_vencida > 0; solo presentación.
  con_deuda_vencida: 6,
};

/** `GET /reportes/recaudacion?periodo_id=…` → totales. */
export const recaudacionMock: RecaudacionTotalesApi = {
  cantidad_pagos: 29,
  pagos: "10842.37",
  reversiones: "352.10",
  neto: "10490.27",
};
