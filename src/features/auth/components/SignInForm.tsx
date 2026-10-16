import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInSchema } from "../validation/signIn.schema";
import { useAuthStore } from "../store/auth.store";
import { login } from "../services/login.service";
import { getMe } from "../services/getMe.service";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const setToken = useAuthStore((s) => s.setToken);
  const setUsuario = useAuthStore((s) => s.setUsuario);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInSchema>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (data: SignInSchema) => {
    setLoginError(null);
    const res = await login(data.nombreUsuario, data.password);
    if (!res.success || !res.data) {
      setLoginError(res.error ?? "No se pudo iniciar sesión.");
      return;
    }
    setToken(res.data.access_token, res.data.expires_in);
    const me = await getMe();
    if (!me.success || !me.data) {
      setLoginError(me.error ?? "No se pudo cargar la sesión.");
      return;
    }
    // AuthLayout redirige al ver la sesión iniciada.
    setUsuario(me.data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nombreUsuario">Usuario</Label>
        <Input
          id="nombreUsuario"
          autoComplete="username"
          autoFocus
          placeholder="Su nombre de usuario"
          aria-invalid={!!errors.nombreUsuario}
          {...register("nombreUsuario")}
        />
        {errors.nombreUsuario && <p className="text-[13px] text-error-600">{errors.nombreUsuario.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            className="pr-10"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-[13px] text-error-600">{errors.password.message}</p>}
      </div>

      {loginError && (
        <p role="alert" className="text-[13px] text-error-700 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
          {loginError}
        </p>
      )}

      <Button type="submit" className="w-full h-11 mt-2 rounded-xl" loading={isSubmitting}>
        {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}
