import { ChevronRightIcon, MenuIcon } from "lucide-react";
import { useMatches } from "react-router-dom";
import { nombrePeriodo } from "@/shared/lib/formato";
import { periodoActualMock as periodo } from "@/shared/mocks/app.mock";

type AppHeaderProps = {
  onToggleSidebar: () => void;
};

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const titulo = useMatches()
    .map((m) => (m.handle as { titulo?: string } | undefined)?.titulo)
    .filter(Boolean)
    .at(-1);

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center gap-3 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        aria-label="Abrir menú"
      >
        <MenuIcon className="size-5" />
      </button>

      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <span>Moravia</span>
        {titulo && (
          <>
            <ChevronRightIcon className="size-3.5" />
            <span className="font-bold text-gray-800">{titulo}</span>
          </>
        )}
      </div>

      <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-success-50 text-success-700 border border-success-200">
        Periodo {nombrePeriodo(periodo.anio, periodo.mes)} · {periodo.estado}
      </span>
    </header>
  );
}
