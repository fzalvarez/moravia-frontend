import { useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { Marca } from "../components/Marca";
import { activarCuenta } from "../services/activar.service";
import { activarSchema, type ActivarSchema } from "../validation/activar.schema";

// Campos del backend → campos del formulario.
const CAMPOS: Record<string, keyof ActivarSchema> = {
  nombre_usuario: "nombreUsuario",
  codigo: "codigo",
  password: "password",
};

export default function ActivarPage() {
  const navigate = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ActivarSchema>({ resolver: zodResolver(activarSchema) });

  const onSubmit = async (d: ActivarSchema) => {
    setErrorGeneral(null);
    try {
      await activarCuenta(d.nombreUsuario, d.codigo, d.password);
      toast.success("Cuenta activada. Ya puede iniciar sesión.");
      navigate("/login", { replace: true });
    } catch (error) {
      for (const [campo, mensaje] of Object.entries(getApiErrorDetails(error))) {
        if (CAMPOS[campo]) setError(CAMPOS[campo], { message: mensaje });
      }
      setErrorGeneral(getApiErrorMessage(error, "No se pudo activar la cuenta."));
    }
  };

  const campo = (id: keyof ActivarSchema, label: string, props: ComponentProps<typeof Input>) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!errors[id]} {...props} {...register(id)} />
      {errors[id] && <p className="text-[13px] text-error-600">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Marca />
      <div className="w-full max-w-110 bg-white rounded-2xl border border-gray-200/80 p-8 md:p-10 shadow-theme-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">Activar cuenta</h1>
          <p className="text-sm text-gray-500">Use el código que le entregó el administrador para fijar su contraseña.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {campo("nombreUsuario", "Usuario", { autoComplete: "username", autoFocus: true })}
          {campo("codigo", "Código de activación", { autoComplete: "one-time-code" })}
          {campo("password", "Nueva contraseña", { type: "password", autoComplete: "new-password" })}
          {campo("confirmacion", "Repita la contraseña", { type: "password", autoComplete: "new-password" })}
          {errorGeneral && (
            <p role="alert" className="text-[13px] text-error-700 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
              {errorGeneral}
            </p>
          )}
          <Button type="submit" className="w-full h-11 mt-2 rounded-xl" loading={isSubmitting}>
            Activar cuenta
          </Button>
        </form>
        <p className="mt-6 text-xs text-gray-500">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
