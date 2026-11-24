import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Buscador } from "@/shared/components/app/Buscador";
import { Campo, Select } from "@/shared/components/app/Formulario";
import { Importe } from "@/shared/components/app/Importe";
import { Datos, Encabezado, Pestanas, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta, Tabla } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, nombrePeriodo } from "@/shared/lib/formato";
import { clavesPeriodos, listarPeriodos, type Periodo } from "@/features/periodos/services/periodos.service";
import { listarDepartamentos, type Departamento } from "@/features/departamentos/services/departamentos.service";
import {
  clavesReportes,
  getGastosPresupuesto,
  getMorosidad,
  getRecaudacion,
  getResumenFinanciero,
  type FiltroRecaudacion,
} from "../services/reportes.service";

type Vista = "morosidad" | "recaudacion" | "presupuesto" | "resumen";

/** Solo tablas, sin gráficos ni exportación (F-001, D-057). */
export default function ReportesPage() {
  const { puede } = usePermisos();
  const conGastos = puede("gastos.ver");
  const [vista, setVista] = useState<Vista>("morosidad");
  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos });
  const orden = periodos.data ? [...periodos.data].sort((a, b) => b.anio - a.anio || b.mes - a.mes) : [];

  return (
    <>
      <Encabezado titulo="Reportes" descripcion="Calculados por el backend con los datos al momento de consultar." />
      <Pestanas
        valor={vista}
        onChange={setVista}
        opciones={[
          { valor: "morosidad", label: "Morosidad" },
          { valor: "recaudacion", label: "Recaudación" },
          // Exigen finanzas.ver y gastos.ver (PERMISSIONS §4).
          ...(conGastos
            ? [
                { valor: "presupuesto" as const, label: "Gastos vs. presupuesto" },
                { valor: "resumen" as const, label: "Resumen financiero" },
              ]
            : []),
        ]}
      />
      {vista === "morosidad" && <Morosidad />}
      {vista === "recaudacion" && <Recaudacion periodos={orden} />}
      {vista === "presupuesto" && <ConPeriodo periodos={orden}>{(id) => <GastosPresupuesto periodoId={id} />}</ConPeriodo>}
      {vista === "resumen" && <ConPeriodo periodos={orden}>{(id) => <Resumen periodoId={id} />}</ConPeriodo>}
    </>
  );
}

function SelectorPeriodo({ periodos, valor, onChange, vacio }: { periodos: Periodo[]; valor: string; onChange: (v: string) => void; vacio?: string }) {
  return (
    <Select value={valor} onChange={(e) => onChange(e.target.value)} className="w-52">
      {vacio !== undefined && <option value="">{vacio}</option>}
      {periodos.map((p) => (
        <option key={p.id} value={p.id}>
          {nombrePeriodo(p.anio, p.mes)}
        </option>
      ))}
    </Select>
  );
}

function ConPeriodo({ periodos, children }: { periodos: Periodo[]; children: (periodoId: string) => React.ReactNode }) {
  const [id, setId] = useState("");
  const actual = id || periodos[0]?.id || "";
  if (!actual) return <p className="text-sm text-gray-500">No hay periodos.</p>;
  return (
    <div className="space-y-4">
      <SelectorPeriodo periodos={periodos} valor={actual} onChange={setId} />
      {children(actual)}
    </div>
  );
}

function Morosidad() {
  const navigate = useNavigate();
  const [solo, setSolo] = useState(true);
  const r = useQuery({ queryKey: clavesReportes.morosidad(solo), queryFn: () => getMorosidad(solo) });
  return (
    <Tarjeta
      titulo={r.data ? `Morosidad al ${formatFecha(r.data.fecha)}` : "Morosidad"}
      acciones={
        <label className="flex items-center gap-2 text-[13px] text-gray-600">
          <Checkbox checked={solo} onCheckedChange={(v) => setSolo(!!v)} /> Solo con deuda
        </label>
      }
    >
      {r.data && (
        <Datos
          items={[
            { label: "Departamentos", valor: r.data.departamentos },
            { label: "Saldo total", valor: <Importe valor={r.data.saldo_total} className="font-bold" /> },
            { label: "Deuda vencida", valor: <Importe valor={r.data.deuda_vencida_total} className="font-bold" /> },
          ]}
        />
      )}
      <Tabla
        columnas={[
          { titulo: "Departamento", celda: (f) => <span className="font-semibold text-gray-900">{f.departamento_codigo}</span> },
          { titulo: "Saldo", celda: (f) => <Importe valor={f.saldo} />, className: "text-right" },
          { titulo: "Vencido", celda: (f) => <Importe valor={f.deuda_vencida} />, className: "text-right" },
          { titulo: "Periodos pendientes", celda: (f) => f.periodos_pendientes.map((p) => nombrePeriodo(p.anio, p.mes)).join(", ") || "—" },
          { titulo: "Antigüedad", celda: (f) => (f.antiguedad_dias ? `${f.antiguedad_dias} días` : "—") },
          { titulo: "Multas", celda: (f) => (f.multas_cantidad ? <span>{f.multas_cantidad} · <Importe valor={f.multas_pendientes} /></span> : "—") },
        ]}
        filas={r.data?.filas}
        clave={(f) => f.departamento_id}
        cargando={r.isPending}
        error={r.error}
        vacio={solo ? "Ningún departamento tiene deuda." : "Sin departamentos."}
        onFila={(f) => navigate(`/departamentos/${f.departamento_id}`)}
      />
    </Tarjeta>
  );
}

function Recaudacion({ periodos }: { periodos: Periodo[] }) {
  const [modo, setModo] = useState<"periodo" | "fechas">("periodo");
  const [periodoId, setPeriodoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [depto, setDepto] = useState<Departamento | null>(null);
  // Periodo o rango de fechas, no ambos (el backend responde 422).
  const filtro: FiltroRecaudacion =
    modo === "periodo"
      ? { periodo_id: periodoId || periodos[0]?.id, departamento_id: depto?.id }
      : { desde: desde || undefined, hasta: hasta || undefined, departamento_id: depto?.id };
  const r = useQuery({ queryKey: clavesReportes.recaudacion(filtro), queryFn: () => getRecaudacion(filtro), enabled: modo === "fechas" || !!filtro.periodo_id });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Campo label="Filtrar por">
          <Select value={modo} onChange={(e) => setModo(e.target.value as "periodo" | "fechas")} className="w-40">
            <option value="periodo">Periodo</option>
            <option value="fechas">Rango de fechas</option>
          </Select>
        </Campo>
        {modo === "periodo" ? (
          <Campo label="Periodo">
            <SelectorPeriodo periodos={periodos} valor={periodoId || periodos[0]?.id || ""} onChange={setPeriodoId} />
          </Campo>
        ) : (
          <>
            <Campo label="Desde">
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </Campo>
            <Campo label="Hasta">
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </Campo>
          </>
        )}
        <Campo label="Departamento (opcional)" className="w-64">
          <Buscador
            clave={["departamentos"]}
            buscar={async (q) => (await listarDepartamentos({ q, limit: 20 })).items}
            idDe={(d) => d.id}
            etiqueta={(d) => d.codigo}
            seleccionado={depto}
            onSeleccionar={setDepto}
            placeholder="Todos"
          />
        </Campo>
      </div>
      {r.isPending && r.fetchStatus !== "idle" ? (
        <TableStateBlock variant="loading" />
      ) : r.isError ? (
        <ErrorConsulta error={r.error} />
      ) : (
        r.data && (
          <>
            <Tarjeta titulo="Totales">
              <Datos
                items={[
                  { label: "Pagos", valor: r.data.totales.cantidad_pagos },
                  { label: "Recaudado", valor: <Importe valor={r.data.totales.pagos} /> },
                  { label: "Reversiones", valor: <Importe valor={r.data.totales.reversiones} /> },
                  { label: "Neto", valor: <Importe valor={r.data.totales.neto} className="font-bold" /> },
                ]}
              />
            </Tarjeta>
            <Tarjeta titulo="Por departamento">
              <Tabla
                columnas={[
                  { titulo: "Departamento", celda: (f) => <span className="font-semibold text-gray-900">{f.departamento_codigo}</span> },
                  { titulo: "Pagos", celda: (f) => f.cantidad_pagos },
                  { titulo: "Recaudado", celda: (f) => <Importe valor={f.pagos} />, className: "text-right" },
                  { titulo: "Reversiones", celda: (f) => <Importe valor={f.reversiones} />, className: "text-right" },
                  { titulo: "Neto", celda: (f) => <Importe valor={f.neto} className="font-semibold" />, className: "text-right" },
                ]}
                filas={r.data.por_departamento}
                clave={(f) => f.departamento_id}
                vacio="Sin pagos en este rango."
              />
            </Tarjeta>
            <Tarjeta titulo="Detalle">
              <Tabla
                columnas={[
                  { titulo: "Fecha", celda: (f) => formatFecha(f.fecha) },
                  { titulo: "Departamento", celda: (f) => f.departamento_codigo },
                  { titulo: "Movimiento", celda: (f) => (f.tipo === "pago" ? "Pago" : "Anulación de pago") },
                  { titulo: "Referencia", celda: (f) => f.referencia ?? "—" },
                  { titulo: "Importe", celda: (f) => <Importe valor={f.importe} />, className: "text-right" },
                ]}
                filas={r.data.detalle}
                clave={(f) => f.movimiento_id}
                vacio="Sin movimientos."
              />
            </Tarjeta>
          </>
        )
      )}
    </div>
  );
}

function GastosPresupuesto({ periodoId }: { periodoId: string }) {
  const r = useQuery({ queryKey: clavesReportes.gastosPresupuesto(periodoId), queryFn: () => getGastosPresupuesto(periodoId) });
  return (
    <Tarjeta titulo="Gastos frente a presupuesto">
      {r.data && (
        <Datos
          items={[
            { label: "Presupuesto total", valor: <Importe valor={r.data.presupuesto_total} className="font-bold" /> },
            { label: "Gastos reales", valor: <Importe valor={r.data.gastos_total} className="font-bold" /> },
          ]}
        />
      )}
      <Tabla
        columnas={[
          { titulo: "Concepto", celda: (f) => <span className="font-semibold text-gray-900">{f.concepto_codigo ?? "Sin concepto (no trasladable)"}</span> },
          { titulo: "Presupuesto", celda: (f) => <Importe valor={f.presupuesto} />, className: "text-right" },
          { titulo: "Gastos reales", celda: (f) => <Importe valor={f.gastos_reales} />, className: "text-right" },
          { titulo: "N.º gastos", celda: (f) => f.cantidad_gastos, className: "text-right" },
          { titulo: "Diferencia", celda: (f) => <Importe valor={f.diferencia} />, className: "text-right" },
          { titulo: "Ejecución", celda: (f) => (f.ejecucion_porcentaje ? `${f.ejecucion_porcentaje} %` : "—"), className: "text-right" },
        ]}
        filas={r.data?.filas}
        clave={(f) => f.concepto_id ?? "sin-concepto"}
        cargando={r.isPending}
        error={r.error}
        vacio="Sin presupuestos ni gastos en el periodo."
      />
    </Tarjeta>
  );
}

function Resumen({ periodoId }: { periodoId: string }) {
  const r = useQuery({ queryKey: clavesReportes.resumen(periodoId), queryFn: () => getResumenFinanciero(periodoId) });
  if (r.isPending) return <TableStateBlock variant="loading" />;
  if (r.isError) return <ErrorConsulta error={r.error} />;
  const x = r.data;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Tarjeta titulo="Ingresos y deuda">
        <Datos
          items={[
            { label: "Estado del periodo", valor: x.estado_periodo === "abierto" ? "Abierto" : "Cerrado" },
            { label: "Departamentos", valor: x.departamentos },
            { label: "Liquidado", valor: <Importe valor={x.liquidado} /> },
            { label: "Liquidaciones emitidas / anuladas", valor: `${x.liquidaciones_emitidas} / ${x.liquidaciones_anuladas}` },
            { label: "Multas", valor: <Importe valor={x.multas} /> },
            { label: "Ajustes", valor: <Importe valor={x.ajustes} /> },
            { label: "Recaudado", valor: <Importe valor={x.recaudado} /> },
            { label: "Pendiente de cobro", valor: <Importe valor={x.pendiente_de_cobro} className="font-bold" /> },
          ]}
        />
      </Tarjeta>
      <Tarjeta titulo="Gastos">
        <Datos
          items={[
            { label: "Registrados", valor: <Importe valor={x.gastos_registrados} /> },
            { label: "Trasladables", valor: <Importe valor={x.gastos_trasladables} /> },
            { label: "No trasladables", valor: <Importe valor={x.gastos_no_trasladables} /> },
            { label: "Pagado a proveedores", valor: <Importe valor={x.pagado_a_proveedores} /> },
            { label: "Saldo pendiente con proveedores", valor: <Importe valor={x.saldo_pendiente_proveedores} className="font-bold" /> },
          ]}
        />
      </Tarjeta>
    </div>
  );
}
