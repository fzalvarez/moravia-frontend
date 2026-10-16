import { z } from "zod";

export const CATEGORIAS_MENSAJE = [
  { valor: "cobranza", label: "Cobranza" },
  { valor: "administrativo", label: "Aviso administrativo" },
  { valor: "mantenimiento", label: "Mantenimiento" },
  { valor: "asamblea", label: "Asamblea" },
  { valor: "otro", label: "Otro" },
] as const;

export const MAX_MENSAJE = 1000;

export const mensajeSchema = z.object({
  personaIds: z.array(z.string()).min(1, "Seleccione al menos un destinatario"),
  categoria: z.enum(["cobranza", "administrativo", "mantenimiento", "asamblea", "otro"]),
  asunto: z.string().trim().min(1, "El asunto es requerido").max(150, "Máximo 150 caracteres"),
  cuerpo: z
    .string()
    .trim()
    .min(1, "Escriba el mensaje")
    .max(MAX_MENSAJE, `Máximo ${MAX_MENSAJE} caracteres`),
});

export type MensajeFormValues = z.infer<typeof mensajeSchema>;
