import { Link } from "react-router-dom";
import { Marca } from "../components/Marca";
import { SignInForm } from "../components/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Marca />
      <div className="w-full max-w-110 bg-white rounded-2xl border border-gray-200/80 p-8 md:p-10 shadow-theme-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-sm text-gray-500">Ingrese con su cuenta de la administración.</p>
        </div>

        <SignInForm />

        <p className="mt-6 text-xs text-gray-500 leading-relaxed">
          ¿Tiene un código de activación?{" "}
          <Link to="/activar" className="font-semibold text-brand-600 hover:underline">
            Active su cuenta
          </Link>
          . Si olvidó su contraseña, pida al administrador que restablezca su acceso.
        </p>
      </div>
      <p className="mt-10 text-xs font-semibold text-gray-400">Moravia v{__APP_VERSION__}</p>
    </div>
  );
}
