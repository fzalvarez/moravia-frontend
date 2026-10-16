import { z } from "zod";

export const signInSchema = z.object({
  nombreUsuario: z.string().trim().min(1, "El usuario es requerido").max(50, "Máximo 50 caracteres"),
  password: z.string().min(1, "La contraseña es requerida").max(200, "Máximo 200 caracteres"),
});

export type SignInSchema = z.infer<typeof signInSchema>;
