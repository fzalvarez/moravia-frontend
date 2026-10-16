import { Building2Icon } from "lucide-react";
import { SignInForm } from "../components/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
          <Building2Icon className="size-5" />
        </div>
        <div>
          <span className="block font-bold text-lg leading-tight tracking-tight text-gray-900">Moravia</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-500">
            Gestión de condominio
          </span>
        </div>
      </div>

      <div className="w-full max-w-110 bg-white rounded-2xl border border-gray-200/80 p-8 md:p-10 shadow-theme-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-sm text-gray-500">Ingrese con la cuenta que le entregó la administración.</p>
        </div>

        <SignInForm />

        <p className="mt-6 text-xs text-gray-500 leading-relaxed">
          ¿Olvidó su contraseña o aún no activó su cuenta? Solicite a la administración un código de acceso.
        </p>
      </div>

      <p className="mt-10 text-xs font-semibold text-gray-400">Moravia v{__APP_VERSION__}</p>
    </div>
  );
}
