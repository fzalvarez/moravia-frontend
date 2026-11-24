import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConMotivo, Confirmar } from "@/shared/components/app/Dialogos";
import { Campo, Select, Textarea } from "@/shared/components/app/Formulario";
import { Importe } from "@/shared/components/app/Importe";
import { Etiqueta, Pestanas, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta, Tabla } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { useIdempotencia } from "@/shared/hooks/useIdempotencia";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { nulo } from "@/shared/lib/formularios";
import { formatFecha, formatFechaHora, formatImporte, hoyLima, nombrePeriodo } from "@/shared/lib/formato";
import type { Departamento } from "@/features/departamentos/services/departamentos.service";
import { clavesPeriodos, listarPeriodos } from "@/features/periodos/services/periodos.service";
import {
  clavesLiquidaciones,
  listarLiquidacionesDepartamento,
  NOMBRE_ESTADO_LIQ,
  TONO_LIQ,
} from "@/features/liquidaciones/services/liquidaciones.service";
import {
  anularPago,
  clavesCuenta,
  getEstadoCuenta,
  getHistorial,
  listarAjustes,
  listarMultas,
  listarPagos,
  NOMBRE_MOVIMIENTO,
  registrarAjuste,
  registrarPago,
  type EstadoCuenta,
  type PagoResidente,
  type Seccion,
} from "../services/cuenta.service";
import { MensajeDepartamento } from "./MensajeDepartamento";

type Vista = "estado" | "movimientos" | "liquidaciones" | "pagos" | "ajustes" | "multas";

export function CuentaDepartamento({ departamento: d }: { departamento: Departamento }) {
  const qc = useQueryClient();
  const { puede, esAdministrador } = usePermisos();
  const [vista, setVista] = useState<Vista>("estado");
  const [periodoId, setPeriodoId] = useState("");
  const [dialogo, setDialogo] = useState<"pago" | "ajuste" | "mensaje" | null>(null);
  const [anular, setAnular] = useState<PagoResidente | null>(null);

  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos });
  const estado = useQuery({ queryKey: clavesCuenta.estado(d.id, periodoId), queryFn: () => getEstadoCuenta(d.id, periodoId) });
  const refrescar = () => {
    qc.invalidateQueries({ queryKey: clavesCuenta.todo(d.id) });
    qc.invalidateQueries({ queryKey: ["reportes"] });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {puede("finanzas.gestionar") && (
          <Button onClick={() => setDialogo("pago")} disabled={!estado.data}>
            Registrar pago
          </Button>
        )}
        {esAdministrador && (
          <Button variant="outline" onClick={() => setDialogo("ajuste")}>
            Ajuste
          </Button>
        )}
        {puede("personas.ver") && (
          <Button variant="outline" onClick={() => setDialogo("mensaje")}>
            <MessageSquareIcon className="size-4" /> Mensaje a ocupantes
          </Button>
        )}
        {estado.data && (
          <span className="ml-auto text-sm text-gray-500">
            Saldo actual: <Importe valor={estado.data.saldo_actual} className="font-bold text-gray-900 text-base" />
          </span>
        )}
      </div>

      <Pestanas
        valor={vista}
        onChange={setVista}
        opciones={[
          { valor: "estado", label: "Estado de cuenta" },
          { valor: "movimientos", label: "Movimientos" },
          { valor: "liquidaciones", label: "Liquidaciones" },
          { valor: "pagos", label: "Pagos" },
          { valor: "ajustes", label: "Ajustes" },
          { valor: "multas", label: "Multas" },
        ]}
      />

      {vista === "estado" && (
        <>
          <div className="max-w-xs">
            <Select value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
              <option value="">Último periodo con cargos</option>
              {periodos.data
                ?.slice()
                .sort((a, b) => b.anio - a.anio || b.mes - a.mes)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {nombrePeriodo(p.anio, p.mes)}
                  </option>
                ))}
            </Select>
          </div>
          {estado.isPending ? <TableStateBlock variant="loading" /> : estado.isError ? <ErrorConsulta error={estado.error} /> : <EstadoDeCuenta estado={estado.data} />}
        </>
      )}
      {vista === "movimientos" && <Movimientos departamentoId={d.id} />}
      {vista === "liquidaciones" && <LiquidacionesDepto departamentoId={d.id} />}
      {vista === "pagos" && <Pagos departamentoId={d.id} onAnular={puede("finanzas.gestionar") ? setAnular : undefined} />}
      {vista === "ajustes" && <Ajustes departamentoId={d.id} />}
      {vista === "multas" && <Multas departamentoId={d.id} />}

      {dialogo === "pago" && estado.data && <RegistrarPago departamento={d} saldo={estado.data.saldo_actual} onCerrar={() => setDialogo(null)} onHecho={refrescar} />}
      {dialogo === "ajuste" && <RegistrarAjuste departamento={d} onCerrar={() => setDialogo(null)} onHecho={refrescar} />}
      {dialogo === "mensaje" && <MensajeDepartamento departamento={d} onCerrar={() => setDialogo(null)} />}
      {anular && (
        <ConMotivo
          titulo={`Anular pago de ${formatImporte(anular.importe)}`}
          descripcion="El importe vuelve a la deuda del departamento (reversión)."
          onCerrar={() => setAnular(null)}
          onConfirmar={async (motivo) => {
            await anularPago(anular.id, motivo);
            refrescar();
            toast.success("Pago anulado.");
          }}
        />
      )}
    </div>
  );
}

const SECCIONES: { clave: keyof Pick<EstadoCuenta, "deuda_anterior" | "cuota_actual" | "multas" | "pagos" | "ajustes">; label: string }[] = [
  { clave: "deuda_anterior", label: "Deuda anterior" },
  { clave: "cuota_actual", label: "Cuota del periodo" },
  { clave: "multas", label: "Multas" },
  { clave: "pagos", label: "Pagos" },
  { clave: "ajustes", label: "Ajustes" },
];

function EstadoDeCuenta({ estado: e }: { estado: EstadoCuenta }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  return (
    <Tarjeta titulo={e.anio && e.mes ? `Estado de cuenta · ${nombrePeriodo(e.anio, e.mes)}` : "Estado de cuenta"} acciones={e.fecha_limite && <span className="text-[13px] text-gray-500">Vence el {formatFecha(e.fecha_limite)}</span>}>
      <div className="divide-y divide-gray-100">
        {SECCIONES.map(({ clave, label }) => {
          const s: Seccion = e[clave];
          return (
            <div key={clave}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-gray-50"
                onClick={() => setAbierta(abierta === clave ? null : clave)}
                disabled={s.movimientos.length === 0}
              >
                <span className="text-gray-700">
                  {label} {s.movimientos.length > 0 && <span className="text-[12px] text-gray-400">({s.movimientos.length})</span>}
                </span>
                <Importe valor={s.total} className="font-semibold text-gray-900" />
              </button>
              {abierta === clave && (
                <div className="px-5 pb-3">
                  {s.movimientos.map((m) => (
                    <div key={m.id} className="flex justify-between text-[13px] text-gray-500 py-0.5">
                      <span>
                        {formatFecha(m.fecha)} · {NOMBRE_MOVIMIENTO[m.tipo]}
                      </span>
                      <Importe valor={m.importe} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="flex justify-between px-5 py-3 text-sm bg-gray-50">
          <span className="font-semibold text-gray-700">Saldo al cierre del periodo</span>
          <Importe valor={e.saldo_total} className="font-bold text-gray-900" />
        </div>
        <div className="flex justify-between px-5 py-3 text-sm bg-brand-50/60 rounded-b-2xl">
          <span className="font-semibold text-gray-700">Saldo actual (hoy)</span>
          <Importe valor={e.saldo_actual} className="font-bold text-gray-900" />
        </div>
      </div>
    </Tarjeta>
  );
}

function Movimientos({ departamentoId }: { departamentoId: string }) {
  const h = useQuery({ queryKey: clavesCuenta.historial(departamentoId), queryFn: () => getHistorial(departamentoId) });
  return (
    <Tarjeta titulo="Historial de movimientos">
      <Tabla
        columnas={[
          { titulo: "Fecha", celda: (m) => formatFecha(m.fecha), className: "whitespace-nowrap" },
          { titulo: "Movimiento", celda: (m) => NOMBRE_MOVIMIENTO[m.tipo] },
          { titulo: "Importe", celda: (m) => <Importe valor={m.importe} />, className: "text-right" },
          { titulo: "Saldo", celda: (m) => <Importe valor={m.saldo_acumulado} className="font-semibold" />, className: "text-right" },
          { titulo: "Registrado", celda: (m) => formatFechaHora(m.registrado_en), className: "whitespace-nowrap text-gray-400" },
        ]}
        filas={h.data?.historial}
        clave={(m) => m.id}
        cargando={h.isPending}
        error={h.error}
        vacio="Sin movimientos."
      />
    </Tarjeta>
  );
}

function LiquidacionesDepto({ departamentoId }: { departamentoId: string }) {
  const navigate = useNavigate();
  const l = useQuery({ queryKey: clavesLiquidaciones.delDepartamento(departamentoId), queryFn: () => listarLiquidacionesDepartamento(departamentoId) });
  return (
    <Tarjeta titulo="Liquidaciones">
      <Tabla
        columnas={[
          { titulo: "Periodo", celda: (x) => (x.anio && x.mes ? nombrePeriodo(x.anio, x.mes) : "—") },
          { titulo: "Total", celda: (x) => <Importe valor={x.total} />, className: "text-right" },
          {
            titulo: "Estado",
            celda: (x) => (
              <span className="flex gap-1">
                <Etiqueta tono={TONO_LIQ[x.estado]}>{NOMBRE_ESTADO_LIQ[x.estado]}</Etiqueta>
                {x.corrige_a_id && <Etiqueta tono="azul">Corrección</Etiqueta>}
              </span>
            ),
          },
          { titulo: "Vence", celda: (x) => (x.fecha_limite ? formatFecha(x.fecha_limite) : "—") },
        ]}
        filas={l.data}
        clave={(x) => x.id}
        cargando={l.isPending}
        error={l.error}
        vacio="Sin liquidaciones."
        onFila={(x) => navigate(`/liquidaciones/${x.id}`)}
      />
    </Tarjeta>
  );
}

function Pagos({ departamentoId, onAnular }: { departamentoId: string; onAnular?: (p: PagoResidente) => void }) {
  const p = useQuery({ queryKey: clavesCuenta.pagos(departamentoId), queryFn: () => listarPagos(departamentoId) });
  return (
    <Tarjeta titulo="Pagos del departamento">
      <Tabla
        columnas={[
          { titulo: "Fecha", celda: (x) => formatFecha(x.fecha) },
          { titulo: "Importe", celda: (x) => <Importe valor={x.importe} className={x.anulado ? "line-through text-gray-400" : ""} />, className: "text-right" },
          { titulo: "Referencia", celda: (x) => x.referencia ?? "—" },
          { titulo: "Estado", celda: (x) => (x.anulado ? <span title={x.motivo_anulacion ?? ""}><Etiqueta>Anulado</Etiqueta></span> : <Etiqueta tono="verde">Vigente</Etiqueta>) },
          ...(onAnular
            ? [
                {
                  titulo: "",
                  className: "text-right",
                  celda: (x: PagoResidente) =>
                    !x.anulado && (
                      <Button size="sm" variant="ghost" onClick={() => onAnular(x)}>
                        Anular
                      </Button>
                    ),
                },
              ]
            : []),
        ]}
        filas={p.data}
        clave={(x) => x.id}
        cargando={p.isPending}
        error={p.error}
        vacio="Sin pagos registrados."
      />
    </Tarjeta>
  );
}

function Ajustes({ departamentoId }: { departamentoId: string }) {
  const a = useQuery({ queryKey: clavesCuenta.ajustes(departamentoId), queryFn: () => listarAjustes(departamentoId) });
  return (
    <Tarjeta titulo="Ajustes">
      <Tabla
        columnas={[
          { titulo: "Fecha", celda: (x) => formatFecha(x.fecha) },
          { titulo: "Importe", celda: (x) => <Importe valor={x.importe} />, className: "text-right" },
          { titulo: "Motivo", celda: (x) => x.motivo },
        ]}
        filas={a.data}
        clave={(x) => x.id}
        cargando={a.isPending}
        error={a.error}
        vacio="Sin ajustes."
      />
    </Tarjeta>
  );
}

function Multas({ departamentoId }: { departamentoId: string }) {
  const m = useQuery({ queryKey: clavesCuenta.multas(departamentoId), queryFn: () => listarMultas(departamentoId) });
  return (
    <Tarjeta titulo="Multas" acciones={<Link to="/multas" className="text-[13px] font-semibold text-brand-600 hover:underline">Política y generación</Link>}>
      <Tabla
        columnas={[
          { titulo: "Fecha", celda: (x) => formatFecha(x.fecha) },
          { titulo: "Vencimiento", celda: (x) => formatFecha(x.vencimiento) },
          { titulo: "Deuda vencida", celda: (x) => <Importe valor={x.deuda_vencida} />, className: "text-right" },
          { titulo: "Multa", celda: (x) => <Importe valor={x.importe} className="font-semibold" />, className: "text-right" },
          { titulo: "Motivo", celda: (x) => x.motivo },
        ]}
        filas={m.data}
        clave={(x) => x.id}
        cargando={m.isPending}
        error={m.error}
        vacio="Sin multas."
      />
    </Tarjeta>
  );
}

function RegistrarPago({ departamento, saldo, onCerrar, onHecho }: { departamento: Departamento; saldo: string; onCerrar: () => void; onHecho: () => void }) {
  const { clave } = useIdempotencia();
  const [fecha, setFecha] = useState(hoyLima());
  const [importe, setImporte] = useState("");
  const [referencia, setReferencia] = useState("");
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={`Registrar pago de ${departamento.codigo}`}
      descripcion={`Deuda pendiente hoy: ${formatImporte(saldo)}. El pago reduce la deuda total y no puede superarla.`}
      confirmar={importe ? `Registrar ${formatImporte(importe.trim() || "0")}` : "Registrar pago"}
      deshabilitado={!fecha || !/^\d+(\.\d{1,2})?$/.test(importe.trim())}
      onConfirmar={async () => {
        await registrarPago(departamento.id, { fecha, importe: importe.trim(), referencia: nulo(referencia), clave_idempotencia: clave });
        onHecho();
        toast.success("Pago registrado.");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="importe" label="Importe (S/)">
          <Input id="importe" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
        </Campo>
        <Campo id="fecha" label="Fecha del pago">
          <Input id="fecha" type="date" max={hoyLima()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
      </div>
      <Campo id="referencia" label="Referencia (opcional)" ayuda="N.º de operación, depósito…">
        <Input id="referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
      </Campo>
    </Confirmar>
  );
}

function RegistrarAjuste({ departamento, onCerrar, onHecho }: { departamento: Departamento; onCerrar: () => void; onHecho: () => void }) {
  const { clave } = useIdempotencia();
  const [importe, setImporte] = useState("");
  const [motivo, setMotivo] = useState("");
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={`Ajuste en la cuenta de ${departamento.codigo}`}
      descripcion="Positivo aumenta la deuda; negativo la reduce. No puede dejar el saldo por debajo de cero."
      confirmar="Registrar ajuste"
      deshabilitado={!/^[-+]?\d+(\.\d{1,2})?$/.test(importe.trim()) || /^[-+]?0+(\.0+)?$/.test(importe.trim()) || !motivo.trim()}
      onConfirmar={async () => {
        await registrarAjuste(departamento.id, { importe: importe.trim(), motivo: motivo.trim(), clave_idempotencia: clave });
        onHecho();
        toast.success("Ajuste registrado.");
      }}
    >
      <Campo id="importe" label="Importe (S/)" ayuda="Ejemplo: -15.00 para reducir la deuda.">
        <Input id="importe" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
      </Campo>
      <Campo id="motivo" label="Motivo">
        <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Campo>
    </Confirmar>
  );
}
