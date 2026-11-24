import { NavLink, useNavigate } from "react-router-dom";
import { Building2Icon, HomeIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFecha, nombrePeriodo } from "@/shared/lib/formato";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { seccionesVisibles } from "@/shared/navegacion";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { logout } from "@/features/auth/services/logout.service";
import { usePeriodoVigente } from "@/features/periodos/hooks/usePeriodoVigente";

type AppSidebarProps = {
  isMobileOpen: boolean;
  onNavigate: () => void;
};

const ROLES: Record<string, string> = {
  administrador: "Administrador",
  junta_directiva: "Junta directiva",
  personal_operativo: "Personal operativo",
};

export function AppSidebar({ isMobileOpen, onNavigate }: AppSidebarProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const permisos = usePermisos();
  const { vigente, resumen } = usePeriodoVigente();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors",
      isActive
        ? "bg-brand-500 text-white font-semibold shadow-md shadow-brand-500/25"
        : "text-gray-600 hover:text-gray-900 hover:bg-surface-container"
    );

  return (
    <nav
      className={cn(
        "fixed left-0 top-0 h-full w-64 z-50 flex flex-col bg-white shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-5 pb-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
          <Building2Icon className="size-5" />
        </div>
        <div className="flex-1">
          <span className="block font-bold text-lg leading-tight tracking-tight text-gray-900">Moravia</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-500">Administración</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600 border border-brand-100">
          v{__APP_VERSION__}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3.5 py-4 space-y-5">
        <NavLink to="/" end onClick={onNavigate} className={linkCls}>
          <HomeIcon className="size-4 shrink-0" />
          <span>Inicio</span>
        </NavLink>

        {seccionesVisibles(permisos).map((group) => (
          <div key={group.label}>
            <h2 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{group.label}</h2>
            <div className="space-y-0.5">
              {group.items.map(({ label, icon: Icon, to }) => (
                <NavLink key={to} to={to} onClick={onNavigate} className={linkCls}>
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {vigente && (
          <div className="mx-1 p-3.5 rounded-xl bg-linear-to-br from-brand-50 to-brand-25 border border-brand-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-brand-900">{nombrePeriodo(vigente.anio, vigente.mes)}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-bold border",
                  vigente.estado === "abierto"
                    ? "bg-success-50 text-success-700 border-success-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                )}
              >
                {vigente.estado === "abierto" ? "Abierto" : "Cerrado"}
              </span>
            </div>
            {resumen && (
              <p className="text-[11px] text-gray-500 leading-snug">
                {resumen.emitidas} liquidaciones emitidas
                {resumen.pendientes_de_emitir.length > 0 && ` · ${resumen.pendientes_de_emitir.length} por emitir`}
              </p>
            )}
            <p className="text-[11px] text-gray-500 leading-snug">
              Fecha límite: <strong className="text-gray-700">{formatFecha(vigente.fecha_limite)}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="p-3.5 border-t border-gray-100">
        <div className="flex items-center gap-2.5 p-2 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center ring-2 ring-brand-50">
            {usuario?.nombre_usuario.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{usuario?.nombre_usuario}</p>
            <p className="text-[11px] text-brand-500 font-medium truncate">
              {usuario?.roles.map((r) => ROLES[r] ?? r).join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-gray-100 transition-colors"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
