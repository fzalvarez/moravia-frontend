import { Button } from "@/components/ui/button";
import { Marca } from "../components/Marca";
import { logout } from "../services/logout.service";

/** Las cuentas de departamento no usan la administración (F-014). */
export default function SoloPortalPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface">
      <Marca />
      <div className="w-full max-w-110 bg-white rounded-2xl border border-gray-200/80 p-8 shadow-theme-lg text-center">
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Esta es la administración</h1>
        <p className="text-sm text-gray-500 mb-6">
          Las cuentas de departamento consultan su estado de cuenta, cuotas y avisos en el portal de departamentos.
        </p>
        <Button variant="outline" className="w-full rounded-xl" onClick={() => logout()}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
