import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/shared/components/app/Formulario";
import { Importe } from "@/shared/components/app/Importe";
import { Encabezado, Tarjeta } from "@/shared/components/app/Pagina";
import { Paginador, Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, nombrePeriodo } from "@/shared/lib/formato";
import { clavesPeriodos, listarPeriodos } from "@/features/periodos/services/periodos.service";
import { clavesProveedores, listarCategorias } from "../services/proveedores.service";
import { clavesGastos, listarGastos, NOMBRE_ESTADO_PAGO, resumenGastos, type EstadoPago, type FiltroGastos } from "../services/gastos.service";
import { GastoFormulario } from "../components/GastoFormulario";
import { EstadoGasto } from "../components/EstadoGasto";

export default function GastosPage() {
  const navigate = useNavigate();
  const { puede } = usePermisos();
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<FiltroGastos>({});
  const [offset, setOffset] = useState(0);
  const [nuevo, setNuevo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setFiltro((f) => ({ ...f, q: texto.trim() || undefined }));
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [texto]);

  const cambiar = (cambio: Partial<FiltroGastos>) => {
    setFiltro((f) => ({ ...f, ...cambio }));
    setOffset(0);
  };

  const lista = useQuery({ queryKey: clavesGastos.lista(filtro, offset), queryFn: () => listarGastos(filtro, offset), placeholderData: keepPreviousData });
  const resumen = useQuery({ queryKey: clavesGastos.resumen(filtro), queryFn: () => resumenGastos(filtro), placeholderData: keepPreviousData });
  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos, enabled: puede("finanzas.ver") });
  const categorias = useQuery({ queryKey: clavesProveedores.categorias, queryFn: listarCategorias });
  const categoria = (id: string) => categorias.data?.find((c) => c.id === id)?.nombre ?? "…";

  return (
    <>
      <Encabezado
        titulo="Gastos"
        descripcion="Gastos del condominio, sus pagos a proveedores y comprobantes."
        acciones={
          puede("gastos.gestionar") && (
            <Button onClick={() => setNuevo(true)}>
              <PlusIcon className="size-4" /> Registrar gasto
            </Button>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-4 mb-5">
        {[
          { label: "Gastos", valor: resumen.data ? String(resumen.data.cantidad) : "…" },
          { label: "Importe", valor: resumen.data && <Importe valor={resumen.data.importe} /> },
          { label: "Pagado", valor: resumen.data && <Importe valor={resumen.data.pagado} /> },
          { label: "Saldo por pagar", valor: resumen.data && <Importe valor={resumen.data.saldo} /> },
        ].map((x) => (
          <div key={x.label} className="bg-white border border-gray-200/80 rounded-2xl px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{x.label}</p>
            <p className="text-lg font-bold text-gray-900">{x.valor ?? "…"}</p>
          </div>
        ))}
      </div>

      <Tarjeta>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Descripción o comprobante" className="pl-9" />
          </div>
          {periodos.data && (
            <Select className="w-44" value={filtro.periodo_id ?? ""} onChange={(e) => cambiar({ periodo_id: e.target.value || undefined })}>
              <option value="">Todos los periodos</option>
              {[...periodos.data]
                .sort((a, b) => b.anio - a.anio || b.mes - a.mes)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {nombrePeriodo(p.anio, p.mes)}
                  </option>
                ))}
            </Select>
          )}
          <Select className="w-44" value={filtro.categoria_id ?? ""} onChange={(e) => cambiar({ categoria_id: e.target.value || undefined })}>
            <option value="">Todas las categorías</option>
            {categorias.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Select className="w-36" value={filtro.estado ?? ""} onChange={(e) => cambiar({ estado: (e.target.value || undefined) as EstadoPago | undefined })}>
            <option value="">Todo estado</option>
            {Object.entries(NOMBRE_ESTADO_PAGO).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
          <Select
            className="w-40"
            value={filtro.trasladable === undefined ? "" : String(filtro.trasladable)}
            onChange={(e) => cambiar({ trasladable: e.target.value === "" ? undefined : e.target.value === "true" })}
          >
            <option value="">Trasladables y no</option>
            <option value="true">Trasladables</option>
            <option value="false">No trasladables</option>
          </Select>
          <label className="flex items-center gap-2 text-[13px] text-gray-600">
            <Checkbox checked={!!filtro.vencidos} onCheckedChange={(v) => cambiar({ vencidos: v ? true : undefined })} /> Vencidos
          </label>
          <label className="flex items-center gap-2 text-[13px] text-gray-600">
            <Checkbox checked={!!filtro.incluir_anulados} onCheckedChange={(v) => cambiar({ incluir_anulados: v ? true : undefined })} /> Incluir anulados
          </label>
        </div>
        <Tabla
          columnas={[
            { titulo: "Fecha", celda: (g) => formatFecha(g.fecha), className: "whitespace-nowrap" },
            {
              titulo: "Descripción",
              celda: (g) => (
                <span>
                  <span className="font-semibold text-gray-900">{g.descripcion}</span>
                  <span className="block text-[12px] text-gray-500">
                    {categoria(g.categoria_id)}
                    {g.trasladable && " · trasladable"}
                    {g.numero_comprobante && ` · ${g.numero_comprobante}`}
                  </span>
                </span>
              ),
            },
            { titulo: "Importe", celda: (g) => <Importe valor={g.importe} />, className: "text-right" },
            { titulo: "Saldo", celda: (g) => <Importe valor={g.saldo} />, className: "text-right" },
            { titulo: "Estado", celda: (g) => <EstadoGasto gasto={g} /> },
          ]}
          filas={lista.data?.items}
          clave={(g) => g.id}
          cargando={lista.isPending}
          error={lista.error}
          vacio="No hay gastos para estos filtros."
          onFila={(g) => navigate(`/gastos/${g.id}`)}
          pie={lista.data && <Paginador {...lista.data} onOffset={setOffset} />}
        />
      </Tarjeta>
      {nuevo && <GastoFormulario onCerrar={() => setNuevo(false)} onGuardado={(g) => navigate(`/gastos/${g.id}`)} />}
    </>
  );
}
