import { z } from "zod";

// Ayuda en cliente; el backend decide. Los importes se escriben y envían como
// texto (F-105), nunca como number.
export const importePositivo = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Importe con hasta 2 decimales, sin signo")
  .refine((v) => !/^0+(\.0+)?$/.test(v), "Debe ser mayor que cero");

export const importeConSigno = z
  .string()
  .trim()
  .regex(/^[-+]?\d+(\.\d{1,2})?$/, "Importe con hasta 2 decimales")
  .refine((v) => !/^[-+]?0+(\.0+)?$/.test(v), "No puede ser cero");

export const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha requerida");

export const opcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
export const requerido = (max: number) => z.string().trim().min(1, "Requerido").max(max, `Máximo ${max} caracteres`);
