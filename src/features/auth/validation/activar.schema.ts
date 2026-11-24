import { z } from "zod";

// Ayuda en cliente; el backend decide (mínimo 10 caracteres, D-027).
export const activarSchema = z
  .object({
    nombreUsuario: z.string().trim().min(1, "El usuario es requerido").max(50, "Máximo 50 caracteres"),
    codigo: z.string().trim().min(1, "El código es requerido").max(200, "Máximo 200 caracteres"),
    password: z.string().min(10, "Mínimo 10 caracteres").max(72, "Máximo 72 caracteres"),
    confirmacion: z.string(),
  })
  .refine((d) => d.password === d.confirmacion, { path: ["confirmacion"], message: "Las contraseñas no coinciden" });

export type ActivarSchema = z.infer<typeof activarSchema>;
