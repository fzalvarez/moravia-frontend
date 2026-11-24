import { Link } from "react-router-dom";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { seccionesVisibles } from "@/shared/navegacion";
import { useAuthStore } from "@/features/auth/store/auth.store";

/** Inicio: accesos según el rol, sin indicadores inventados (SCREENS §11). */
export default function InicioPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const grupos = seccionesVisibles(usePermisos());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Hola, {usuario?.nombre_usuario}</h1>
        <p className="text-sm text-gray-500">Elija una sección para empezar.</p>
      </div>
      {grupos.length === 0 && (
        <p className="text-sm text-gray-500">Su cuenta no tiene permisos asignados. Consulte con el administrador.</p>
      )}
      {grupos.map((g) => (
        <section key={g.label}>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">{g.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.items.map(({ label, descripcion, icon: Icon, to }) => (
              <Link
                key={to}
                to={to}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-brand-300 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-[13px] text-gray-500">{descripcion}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
