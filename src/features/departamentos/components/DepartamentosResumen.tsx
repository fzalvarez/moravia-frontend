import { AlertCircleIcon, Building2Icon, HandCoinsIcon, WalletIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatImporte, nombrePeriodo } from "@/shared/lib/formato";
import { periodoActualMock as periodo } from "@/shared/mocks/app.mock";
import { morosidadMock, recaudacionMock, totalesDepartamentosMock } from "../mocks/departamentos.mock";

type MetricaProps = {
  icon: ReactNode;
  iconClass: string;
  titulo: string;
  extra?: ReactNode;
  valor: ReactNode;
  pie: ReactNode;
};

function Metrica({ icon, iconClass, titulo, extra, valor, pie }: MetricaProps) {
  return (
    <div className="flex items-center gap-3.5 py-3 sm:py-0 sm:px-4 first:sm:pl-0 last:sm:pr-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconClass}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-gray-500">
          <span className="truncate">{titulo}</span>
          {extra}
        </div>
        <div className="mt-0.5 text-xl font-extrabold tracking-tight text-gray-900">{valor}</div>
        <div className="mt-0.5 text-[11px] text-gray-500 truncate">{pie}</div>
      </div>
    </div>
  );
}

/**
 * Cifras de los reportes reales: total de `GET /departamentos`,
 * `GET /reportes/recaudacion` del periodo y `GET /reportes/morosidad`.
 */
export function DepartamentosResumen() {
  const t = totalesDepartamentosMock;
  const m = morosidadMock;
  const r = recaudacionMock;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-theme-xs p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 xl:divide-x divide-gray-100 gap-y-3">
      <Metrica
        icon={<Building2Icon className="size-5" />}
        iconClass="bg-brand-50 text-brand-600 border-brand-100"
        titulo="Departamentos activos"
        valor={
          <>
            {t.activos} <span className="text-xs font-semibold text-gray-400">/ {t.todos}</span>
          </>
        }
        pie={`${t.desactivados} desactivado${t.desactivados === 1 ? "" : "s"}`}
      />
      <Metrica
        icon={<HandCoinsIcon className="size-5" />}
        iconClass="bg-success-50 text-success-600 border-success-200"
        titulo={`Recaudado · ${nombrePeriodo(periodo.anio, periodo.mes)}`}
        valor={formatImporte(r.neto)}
        pie={`${r.cantidad_pagos} pagos · reversiones ${formatImporte(r.reversiones)}`}
      />
      <Metrica
        icon={<WalletIcon className="size-5" />}
        iconClass="bg-gray-100 text-gray-700 border-gray-200"
        titulo="Saldo por cobrar"
        valor={formatImporte(m.saldo_total)}
        pie="Incluye cuotas aún no vencidas"
      />
      <Metrica
        icon={<AlertCircleIcon className="size-5" />}
        iconClass="bg-error-50 text-error-600 border-error-200"
        titulo="Deuda vencida"
        extra={
          <span className="px-1.5 rounded border text-[10px] font-bold bg-error-50 text-error-600 border-error-200">
            {m.con_deuda_vencida} deptos.
          </span>
        }
        valor={<span className="text-error-600">{formatImporte(m.deuda_vencida_total)}</span>}
        pie="Ver reporte de morosidad"
      />
    </div>
  );
}
