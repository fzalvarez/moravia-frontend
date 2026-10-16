import { esImporteCero, formatFecha, formatImporte, nombrePeriodo } from "@/shared/lib/formato";
import type { DepartamentoFicha, PersonaApi } from "../types";
import type { MensajeFormValues } from "../validation/mensaje.schema";

/** Variables que se pueden insertar en el asunto y el cuerpo. */
export const VARIABLES = [
  "nombre",
  "departamento",
  "periodo",
  "cuota",
  "saldo",
  "deuda_vencida",
  "fecha_limite",
] as const;

type Variable = (typeof VARIABLES)[number];

/** Valores tomados de la respuesta del backend; no se calcula ningún importe. */
export function valoresVariables(ficha: DepartamentoFicha, persona: PersonaApi): Record<Variable, string> {
  const ec = ficha.estadoCuenta;
  return {
    nombre: `${persona.nombres} ${persona.apellidos}`,
    departamento: ficha.departamento.codigo,
    periodo: ec?.anio && ec.mes ? nombrePeriodo(ec.anio, ec.mes) : "",
    cuota: ficha.liquidacion ? formatImporte(ficha.liquidacion.total) : "",
    saldo: formatImporte(ec?.saldo_actual ?? "0.00"),
    deuda_vencida: formatImporte(ficha.morosidad?.deuda_vencida ?? "0.00"),
    fecha_limite: ec?.fecha_limite ? formatFecha(ec.fecha_limite) : "",
  };
}

export function resolver(texto: string, valores: Record<Variable, string>): string {
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => (k in valores ? valores[k as Variable] : m));
}

type Plantilla = { id: string; label: string } & Pick<MensajeFormValues, "categoria" | "asunto" | "cuerpo">;

const FIRMA = "\n\nAtentamente,\nLa administración";

/** Plantillas aplicables según la situación real de la cuenta. */
export function plantillasPara(ficha: DepartamentoFicha): Plantilla[] {
  const saldo = ficha.estadoCuenta?.saldo_actual ?? "0.00";
  const vencida = ficha.morosidad?.deuda_vencida ?? "0.00";
  const lista: Plantilla[] = [];

  if (!esImporteCero(vencida)) {
    lista.push({
      id: "deuda-vencida",
      label: "Deuda vencida",
      categoria: "cobranza",
      asunto: "Deuda vencida — Departamento {departamento}",
      cuerpo:
        "Estimado(a) {nombre}:\n\nLe informamos que el departamento {departamento} registra una deuda vencida de {deuda_vencida}. " +
        "El saldo total de la cuenta es {saldo}.\n\nLe pedimos regularizar el pago a la brevedad. Si ya lo realizó, envíenos el comprobante." +
        FIRMA,
    });
  }
  if (!esImporteCero(saldo)) {
    lista.push({
      id: "recordatorio",
      label: "Recordatorio de pago",
      categoria: "cobranza",
      asunto: "Recordatorio de pago — {periodo}",
      cuerpo:
        "Estimado(a) {nombre}:\n\nLe recordamos que el departamento {departamento} tiene un saldo pendiente de {saldo}. " +
        "La fecha límite del periodo {periodo} es el {fecha_limite}.\n\nSi ya realizó el pago, por favor envíenos el comprobante." +
        FIRMA,
    });
  }
  if (ficha.liquidacion) {
    lista.push({
      id: "cuota",
      label: "Cuota del periodo",
      categoria: "cobranza",
      asunto: "Cuota de {periodo} — Departamento {departamento}",
      cuerpo:
        "Estimado(a) {nombre}:\n\nLa cuota de {periodo} del departamento {departamento} es de {cuota}, " +
        "con fecha límite de pago el {fecha_limite}." +
        FIRMA,
    });
  }
  lista.push({
    id: "aviso",
    label: "Aviso general",
    categoria: "administrativo",
    asunto: "",
    cuerpo: "Estimado(a) {nombre}:\n\n" + FIRMA.trimStart(),
  });
  return lista;
}

/** Número para wa.me: solo dígitos; los celulares peruanos de 9 dígitos llevan 51. */
export function numeroWhatsapp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length === 9 ? `51${digitos}` : digitos;
}

export function enlaceCorreo(correo: string, asunto: string, cuerpo: string): string {
  return `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

export function enlaceWhatsapp(telefono: string, asunto: string, cuerpo: string): string {
  return `https://wa.me/${numeroWhatsapp(telefono)}?text=${encodeURIComponent(`*${asunto}*\n\n${cuerpo}`)}`;
}
