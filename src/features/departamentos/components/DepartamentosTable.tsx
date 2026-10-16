import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  MessageSquareIcon,
  SearchIcon,
  WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableStateRow } from "@/shared/components/TableState";
import { esImporteCero, formatImporte, iniciales } from "@/shared/lib/formato";
import type { DepartamentoFicha } from "../types";
import { ETIQUETA_VINCULO, situacionDe } from "../utils/situacion";
import { SituacionBadge } from "./SituacionBadge";

export type FiltroActivo = "todos" | "activos" | "desactivados";

const FILTROS: { valor: FiltroActivo; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "activos", label: "Activos" },
  { valor: "desactivados", label: "Desactivados" },
];

type DepartamentosTableProps = {
  fichas: DepartamentoFicha[];
  totales: Record<FiltroActivo, number>;
  pagina: { total: number; limit: number; offset: number };
  filtro: FiltroActivo;
  onFiltro: (f: FiltroActivo) => void;
  busqueda: string;
  onBusqueda: (q: string) => void;
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
  onMensaje: (ficha: DepartamentoFicha) => void;
};

const BADGE_CODIGO = {
  al_dia: "bg-gray-100 text-gray-800 group-hover:bg-brand-100 group-hover:text-brand-700",
  por_vencer: "bg-warning-50 text-warning-800 border border-warning-200",
  vencido: "bg-error-50 text-error-700 border border-error-200",
  desactivado: "bg-gray-50 text-gray-400 border border-dashed border-gray-300",
};

export function DepartamentosTable({
  fichas,
  totales,
  pagina,
  filtro,
  onFiltro,
  busqueda,
  onBusqueda,
  seleccionadoId,
  onSeleccionar,
  onMensaje,
}: DepartamentosTableProps) {
  const paginas = Math.ceil(pagina.total / pagina.limit);
  const actual = Math.floor(pagina.offset / pagina.limit) + 1;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-theme-sm overflow-hidden">
      {/* Filtros: GET /departamentos?q&activo */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {FILTROS.map(({ valor, label }) => (
            <button
              key={valor}
              type="button"
              onClick={() => onFiltro(valor)}
              className={cn(
                "px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors",
                filtro === valor
                  ? "bg-gray-900 text-white font-bold"
                  : "font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {label}
              <span
                className={cn(
                  "px-1.5 rounded-md text-[10px]",
                  filtro === valor ? "bg-white/20" : "bg-gray-100 text-gray-600"
                )}
              >
                {totales[valor]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            placeholder="Buscar por código…"
            className="w-full md:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-100/80 border border-transparent outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50/90 border-b border-gray-200/80 text-gray-400 uppercase tracking-wider text-[11px] font-bold">
              <th className="py-3.5 px-4">Departamento</th>
              <th className="py-3.5 px-4">Residente principal</th>
              <th className="py-3.5 px-4">Cuota del periodo</th>
              <th className="py-3.5 px-4">Saldo actual</th>
              <th className="py-3.5 px-4">Situación</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {fichas.length === 0 && (
              <TableStateRow colSpan={6} variant="empty" message="No hay departamentos para estos filtros." />
            )}
            {fichas.map((f) => {
              const { departamento: d } = f;
              const situacion = situacionDe(f);
              const principal = f.ocupantes.find((o) => o.vinculo.es_principal);
              const seleccionado = d.id === seleccionadoId;
              const saldo = f.estadoCuenta?.saldo_actual ?? "0.00";

              return (
                <tr
                  key={d.id}
                  onClick={() => onSeleccionar(d.id)}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    seleccionado ? "bg-brand-50/60" : "hover:bg-gray-50",
                    !d.activo && "text-gray-400"
                  )}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "min-w-12 text-center px-2.5 py-1 rounded-lg font-extrabold text-xs tracking-tight transition-colors",
                          seleccionado ? "bg-brand-500 text-white shadow-theme-xs" : BADGE_CODIGO[situacion]
                        )}
                      >
                        {d.codigo}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                        {d.piso !== null && `Piso ${d.piso}`}
                        {f.tipo && ` · ${f.tipo.nombre}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {principal ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center ring-2 ring-gray-100 shrink-0">
                          {iniciales(principal.persona.nombres, principal.persona.apellidos)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 leading-snug truncate">
                            {principal.persona.nombres} {principal.persona.apellidos}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            {ETIQUETA_VINCULO[principal.vinculo.tipo]}
                            {f.ocupantes.length > 1 && ` · +${f.ocupantes.length - 1} ocupante${f.ocupantes.length > 2 ? "s" : ""}`}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="italic text-gray-400">Sin ocupantes vigentes</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {f.liquidacion ? (
                      <>
                        <span className="font-bold text-gray-900 text-sm">{formatImporte(f.liquidacion.total)}</span>
                        <span className="block text-[10px] text-gray-400 font-medium">Liquidación emitida</span>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "font-bold text-sm",
                        situacion === "vencido" ? "text-error-600" : esImporteCero(saldo) ? "text-gray-400" : "text-gray-900"
                      )}
                    >
                      {formatImporte(saldo)}
                    </span>
                    {f.morosidad && !esImporteCero(f.morosidad.deuda_vencida) && (
                      <span className="block text-[10px] text-error-500 font-semibold">
                        Vencido {formatImporte(f.morosidad.deuda_vencida)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <SituacionBadge situacion={situacion} dias={f.morosidad?.antiguedad_dias} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Estado de cuenta"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                      >
                        <FileTextIcon className="size-4" />
                      </button>
                      {f.ocupantes.length > 0 && (
                        <button
                          type="button"
                          title="Mensaje a ocupantes"
                          onClick={() => onMensaje(f)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                        >
                          <MessageSquareIcon className="size-4" />
                        </button>
                      )}
                      {d.activo && !esImporteCero(saldo) && (
                        <button
                          type="button"
                          title="Registrar pago"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                        >
                          <WalletIcon className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación: {items, total, limit, offset} */}
      <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <span className="font-medium">
          Mostrando <strong>{pagina.offset + 1}–{Math.min(pagina.offset + pagina.limit, pagina.total)}</strong> de{" "}
          <strong>{pagina.total}</strong> departamentos
        </span>
        <div className="flex items-center gap-1 font-semibold">
          <button type="button" disabled={actual === 1} className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-40">
            <ChevronLeftIcon className="size-4" />
          </button>
          {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                n === actual ? "bg-brand-500 text-white font-bold" : "text-gray-700 hover:bg-gray-200"
              )}
            >
              {n}
            </button>
          ))}
          <button type="button" disabled={actual === paginas} className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-40">
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
