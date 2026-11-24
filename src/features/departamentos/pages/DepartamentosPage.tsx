import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { MessageSquareIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/shared/components/app/Formulario";
import { Importe } from "@/shared/components/app/Importe";
import { Etiqueta } from "@/shared/components/app/Pagina";
import { Paginador, Tabla } from "@/shared/components/app/Tabla";
import { cn } from "@/lib/utils";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatImporte, nombrePeriodo } from "@/shared/lib/formato";
import { clavesEstructura, getEstructura } from "@/features/estructura/services/estructura.service";
import { usePeriodoVigente } from "@/features/periodos/hooks/usePeriodoVigente";
import { clavesLiquidaciones, listarLiquidacionesPeriodo } from "@/features/liquidaciones/services/liquidaciones.service";
import { clavesReportes, getMorosidad, getRecaudacion } from "@/features/reportes/services/reportes.service";
import { clavesPersonas, getPersona, NOMBRE_VINCULO, nombreCompleto, vinculosDeDepartamento } from "@/features/personas/services/personas.service";
import { MensajeDepartamento } from "@/features/cuenta/components/MensajeDepartamento";
import { listarTodosDepartamentos, type Departamento } from "../services/departamentos.service";
import { NuevoDepartamento } from "../components/NuevoDepartamento";
import { Inspector } from "../components/Inspector";
import { situacion, type Situacion, ETIQUETA_SITUACION, TONO_SITUACION } from "../utils/situacionReal";

const POR_PAGINA = 20;
type Filtro = "todos" | Situacion;

/** Departamentos y residentes (referencias 002 y 003). */
export default function DepartamentosPage() {
  const navigate = useNavigate();
  const { puede } = usePermisos();
  const finanzas = puede("finanzas.ver");
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [torreId, setTorreId] = useState("");
  const [piso, setPiso] = useState("");
  const [inactivos, setInactivos] = useState(false);
  const [offset, setOffset] = useState(0);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [mensaje, setMensaje] = useState<Departamento | null>(null);

  const deptos = useQuery({ queryKey: ["departamentos", "todos", "lista"], queryFn: () => listarTodosDepartamentos() });
  const estructura = useQuery({ queryKey: clavesEstructura.estructura, queryFn: getEstructura });
  const morosidad = useQuery({ queryKey: clavesReportes.morosidad(false), queryFn: () => getMorosidad(false), enabled: finanzas });
  const { vigente } = usePeriodoVigente();
  const liquidaciones = useQuery({
    queryKey: clavesLiquidaciones.delPeriodo(vigente?.id ?? "", "emitida"),
    queryFn: () => listarLiquidacionesPeriodo(vigente!.id, "emitida"),
    enabled: finanzas && !!vigente,
  });
  const recaudacion = useQuery({
    queryKey: clavesReportes.recaudacion({ periodo_id: vigente?.id }),
    queryFn: () => getRecaudacion({ periodo_id: vigente!.id }),
    enabled: finanzas && !!vigente,
  });

  const fila = useMemo(() => new Map(morosidad.data?.filas.map((f) => [f.departamento_id, f])), [morosidad.data]);
  const cuota = useMemo(() => new Map(liquidaciones.data?.map((l) => [l.departamento_id, l.total])), [liquidaciones.data]);
  const torres = estructura.data?.torres ?? [];
  const nombreTorre = (id: string | null) => torres.find((t) => t.id === id)?.nombre;
  const condominio = estructura.data?.tipo === "condominio";

  const base = (deptos.data ?? []).filter((d) => inactivos || d.activo);
  const sit = (d: Departamento) => situacion(fila.get(d.id), d.activo);
  const conteo = (s: Situacion) => base.filter((d) => sit(d) === s).length;
  const filtrados = base
    .filter((d) => filtro === "todos" || sit(d) === filtro)
    .filter((d) => !torreId || d.torre_id === torreId)
    .filter((d) => !piso || String(d.piso) === piso)
    .filter((d) => !texto.trim() || d.codigo.includes(texto.trim().toUpperCase()))
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }));
  const pagina = filtrados.slice(offset, offset + POR_PAGINA);
  const seleccionado = filtrados.find((d) => d.id === seleccion) ?? pagina[0] ?? null;

  // Residente de las filas visibles: el principal o, si no hay, el propietario.
  const vinculos = useQueries({
    queries: pagina.map((d) => ({ queryKey: clavesPersonas.ocupantes(d.id, true), queryFn: () => vinculosDeDepartamento(d.id, true), enabled: puede("personas.ver") })),
  });
  const titularDe = (d: Departamento) => {
    const vs = vinculos[pagina.indexOf(d)]?.data ?? [];
    return vs.find((v) => v.es_principal) ?? vs.find((v) => v.tipo === "propietario") ?? vs[0];
  };
  const idsPersonas = [...new Set(pagina.map((d) => titularDe(d)?.persona_id).filter(Boolean) as string[])];
  const personas = useQueries({ queries: idsPersonas.map((id) => ({ queryKey: clavesPersonas.una(id), queryFn: () => getPersona(id) })) });
  const persona = (id?: string) => personas.find((q) => q.data?.id === id)?.data;

  const pisosDisponibles = torreId ? (torres.find((t) => t.id === torreId)?.pisos ?? 0) : Math.max(0, ...torres.map((t) => t.pisos));
  const m = morosidad.data;
  const alDia = conteo("al_dia");

  const cambiar = (f: () => void) => {
    f();
    setOffset(0);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {estructura.data?.nombre ?? "Condominio"} <span className="mx-1">/</span> <span className="text-brand-600">Unidades</span>
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Departamentos y residentes <Etiqueta tono="azul">{base.length} unidades</Etiqueta>
          </h1>
        </div>
        {puede("departamentos.gestionar") && (
          <Button onClick={() => setNuevo(true)}>
            <PlusIcon className="size-4" /> Nueva unidad
          </Button>
        )}
      </div>

      {finanzas && (
        <div className="flex flex-wrap items-stretch divide-x divide-gray-100 rounded-2xl bg-white shadow-theme-xs">
          <Indicador
            label={vigente ? `Cobranza · ${nombrePeriodo(vigente.anio, vigente.mes)}` : "Cobranza"}
            valor={recaudacion.data ? formatImporte(recaudacion.data.totales.neto) : "—"}
            detalle={recaudacion.data ? `${recaudacion.data.totales.cantidad_pagos} pagos` : undefined}
          />
          <Indicador label="Unidades al día" valor={m ? `${alDia} / ${base.length}` : "—"} detalle={m && base.length ? `${Math.round((alDia / base.length) * 100)} %` : undefined} barra={base.length ? alDia / base.length : undefined} />
          <Indicador label="Cartera en mora" valor={m ? formatImporte(m.deuda_vencida_total) : "—"} detalle={m ? `${conteo("mora")} unidades` : undefined} tono="rojo" />
          <Indicador label="Saldo por cobrar" valor={m ? formatImporte(m.saldo_total) : "—"} detalle={m ? `${conteo("pendiente")} por vencer` : undefined} tono="ambar" />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-12 items-start">
        <div className="xl:col-span-8 bg-white rounded-2xl shadow-theme-xs overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
            {finanzas &&
              (["todos", "al_dia", "pendiente", "mora"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => cambiar(() => setFiltro(f))}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[12px] font-semibold transition",
                    filtro === f ? "bg-gray-800 text-white" : "bg-surface-container text-gray-600 hover:bg-surface-high"
                  )}
                >
                  {f === "todos" ? "Todos" : ETIQUETA_SITUACION[f]} <span className="opacity-60">{f === "todos" ? base.length : conteo(f)}</span>
                </button>
              ))}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {condominio && (
                <Select className="w-32 h-9" value={torreId} onChange={(e) => cambiar(() => (setTorreId(e.target.value), setPiso("")))}>
                  <option value="">Todas las torres</option>
                  {torres.map((t) => (
                    <option key={t.id} value={t.id}>
                      Torre {t.nombre}
                    </option>
                  ))}
                </Select>
              )}
              {pisosDisponibles > 0 && (
                <Select className="w-28 h-9" value={piso} onChange={(e) => cambiar(() => setPiso(e.target.value))}>
                  <option value="">Todos los pisos</option>
                  {Array.from({ length: pisosDisponibles }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Piso {n}
                    </option>
                  ))}
                </Select>
              )}
              <div className="relative w-36">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <Input value={texto} onChange={(e) => cambiar(() => setTexto(e.target.value))} placeholder="Código" className="h-9 pl-8" />
              </div>
              <label className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <Checkbox checked={inactivos} onCheckedChange={(v) => cambiar(() => setInactivos(!!v))} /> Desactivados
              </label>
            </div>
          </div>
          <Tabla
            columnas={[
              {
                titulo: "Unidad",
                celda: (d) => (
                  <span className="flex items-center gap-3">
                    <span className={cn("px-2 py-1 rounded-lg text-[12px] font-bold", d.activo ? "bg-surface-container text-gray-900" : "bg-gray-50 text-gray-400 line-through")}>{d.codigo}</span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {[nombreTorre(d.torre_id) && condominio ? `Torre ${nombreTorre(d.torre_id)}` : null, d.piso ? `P${d.piso}` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                ),
              },
              {
                titulo: "Residente / contacto",
                celda: (d) => {
                  const v = titularDe(d);
                  const p = persona(v?.persona_id);
                  if (!v) return <span className="text-[12px] text-gray-300">Sin ocupantes</span>;
                  return (
                    <span>
                      <span className="block font-semibold text-gray-900">{p ? nombreCompleto(p) : "…"}</span>
                      <span className="block text-[11px] text-gray-400">{NOMBRE_VINCULO[v.tipo]}{p?.telefono ? ` · ${p.telefono}` : ""}</span>
                    </span>
                  );
                },
              },
              ...(finanzas
                ? [
                    { titulo: "Cuota", className: "text-right", celda: (d: Departamento) => <Importe valor={cuota.get(d.id)} className="font-semibold text-gray-900" /> },
                    {
                      titulo: "Estado",
                      celda: (d: Departamento) => {
                        const s = sit(d);
                        const f = fila.get(d.id);
                        return <Etiqueta tono={TONO_SITUACION[s]}>{s === "mora" && f ? `Mora ${f.antiguedad_dias} d` : ETIQUETA_SITUACION[s]}</Etiqueta>;
                      },
                    },
                  ]
                : []),
              {
                titulo: "",
                className: "text-right w-10",
                celda: (d) =>
                  puede("personas.ver") && (
                    <Button size="icon-sm" variant="ghost" onClick={(e) => (e.stopPropagation(), setMensaje(d))} aria-label={`Mensaje a ${d.codigo}`}>
                      <MessageSquareIcon className="size-3.5" />
                    </Button>
                  ),
              },
            ]}
            filas={pagina}
            clave={(d) => d.id}
            cargando={deptos.isPending}
            error={deptos.error}
            vacio={base.length ? "Ninguna unidad coincide con los filtros." : "No hay departamentos. Créelos desde «Estructura» o con «Nueva unidad»."}
            onFila={(d) => setSeleccion(d.id)}
            pie={<Paginador total={filtrados.length} limit={POR_PAGINA} offset={offset} onOffset={setOffset} />}
          />
        </div>
        <div className="xl:col-span-4 xl:sticky xl:top-20">
          {seleccionado && (
            <Inspector
              departamento={seleccionado}
              torre={condominio ? nombreTorre(seleccionado.torre_id) : undefined}
              fila={fila.get(seleccionado.id)}
              liquidacionId={liquidaciones.data?.find((l) => l.departamento_id === seleccionado.id)?.id}
              onMensaje={() => setMensaje(seleccionado)}
              onAbrir={(pestana) => navigate(`/departamentos/${seleccionado.id}${pestana ? `?pestana=${pestana}` : ""}`)}
            />
          )}
        </div>
      </div>

      {nuevo && <NuevoDepartamento estructura={estructura.data ?? null} onCerrar={() => setNuevo(false)} onCreado={(id) => navigate(`/departamentos/${id}`)} />}
      {mensaje && <MensajeDepartamento departamento={mensaje} onCerrar={() => setMensaje(null)} />}
    </div>
  );
}

function Indicador({ label, valor, detalle, tono, barra }: { label: string; valor: string; detalle?: string; tono?: "rojo" | "ambar"; barra?: number }) {
  return (
    <div className="flex-1 min-w-44 px-5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-lg font-bold tabular-nums", tono === "rojo" ? "text-error-600" : tono === "ambar" ? "text-warning-600" : "text-gray-900")}>{valor}</span>
        {detalle && <span className="text-[11px] text-gray-400">{detalle}</span>}
      </div>
      {barra !== undefined && (
        <div className="mt-1.5 h-1 rounded-full bg-surface-container overflow-hidden">
          <div className="h-full bg-success-500" style={{ width: `${Math.round(barra * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
