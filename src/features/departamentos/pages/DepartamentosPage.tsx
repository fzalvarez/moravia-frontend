import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepartamentosResumen } from "../components/DepartamentosResumen";
import { DepartamentosTable, type FiltroActivo } from "../components/DepartamentosTable";
import { DepartamentoInspector } from "../components/DepartamentoInspector";
import { MensajeDepartamentoDialog } from "../components/MensajeDepartamentoDialog";
import type { DepartamentoFicha } from "../types";
import {
  departamentosMock,
  paginaDepartamentosMock,
  totalesDepartamentosMock,
} from "../mocks/departamentos.mock";

export default function DepartamentosPage() {
  const [filtro, setFiltro] = useState<FiltroActivo>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mensajeFicha, setMensajeFicha] = useState<DepartamentoFicha | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(departamentosMock[0]?.departamento.id ?? null);

  // En la maqueta se filtra en memoria; al integrar, `q` y `activo` van al backend.
  const fichas = useMemo(() => {
    const q = busqueda.trim().toUpperCase();
    return departamentosMock.filter(({ departamento: d }) => {
      if (filtro === "activos" && !d.activo) return false;
      if (filtro === "desactivados" && d.activo) return false;
      return !q || d.codigo.includes(q);
    });
  }, [filtro, busqueda]);

  const seleccionada = departamentosMock.find((f) => f.departamento.id === seleccionadoId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900">Departamentos</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-700">
              {totalesDepartamentosMock.todos} departamentos
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Departamentos del condominio, sus ocupantes, anexos y la situación de su cuenta financiera.
          </p>
        </div>
        <Button className="rounded-xl self-start sm:self-auto">
          <PlusIcon className="size-4" />
          Nuevo departamento
        </Button>
      </div>

      <DepartamentosResumen />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          <DepartamentosTable
            fichas={fichas}
            totales={totalesDepartamentosMock}
            pagina={paginaDepartamentosMock}
            filtro={filtro}
            onFiltro={setFiltro}
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
            onMensaje={setMensajeFicha}
          />
        </div>
        <div className="xl:col-span-4 xl:sticky xl:top-20">
          {seleccionada && <DepartamentoInspector ficha={seleccionada} onMensaje={setMensajeFicha} />}
        </div>
      </div>

      <MensajeDepartamentoDialog ficha={mensajeFicha} onClose={() => setMensajeFicha(null)} />
    </div>
  );
}
