import { Building2Icon, ChevronRightIcon, MenuIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { clavesEstructura, getEstructura } from "@/features/estructura/services/estructura.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMatches } from "react-router-dom";
import { nombrePeriodo } from "@/shared/lib/formato";
import { usePeriodoVigente } from "@/features/periodos/hooks/usePeriodoVigente";

type AppHeaderProps = {
  onToggleSidebar: () => void;
};

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const { vigente } = usePeriodoVigente();
  const estructura = useQuery({ queryKey: clavesEstructura.estructura, queryFn: getEstructura });
  const usuario = useAuthStore((s) => s.usuario);
  const titulo = useMatches()
    .map((m) => (m.handle as { titulo?: string } | undefined)?.titulo)
    .filter(Boolean)
    .at(-1);

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center gap-3 px-4 sm:px-6 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        aria-label="Abrir menú"
      >
        <MenuIcon className="size-5" />
      </button>

      {estructura.data && (
        <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container text-[12px] font-semibold text-gray-800">
          <Building2Icon className="size-4 text-brand-500" />
          {estructura.data.nombre || (estructura.data.tipo === "edificio" ? "Edificio" : "Condominio")}
        </span>
      )}
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <span className="md:hidden">Moravia</span>
        {titulo && (
          <>
            <ChevronRightIcon className="size-3.5" />
            <span className="font-bold text-gray-800">{titulo}</span>
          </>
        )}
      </div>

      <span className="flex-1" />
      {vigente && (
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-success-50 text-success-700 border border-success-200">
          Periodo {nombrePeriodo(vigente.anio, vigente.mes)} · {vigente.estado}
        </span>
      )}
      {usuario && (
        <span className="hidden xl:flex flex-col text-right leading-tight">
          <span className="text-[12px] font-semibold text-gray-900">{usuario.nombre_usuario}</span>
          <span className="text-[11px] text-gray-400 capitalize">{usuario.roles.join(", ").replace(/_/g, " ")}</span>
        </span>
      )}
    </header>
  );
}
