import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CircleAlertIcon, CircleCheckIcon, LockIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { Campo } from "@/shared/components/app/Formulario";
import { Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta, Tabla } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, formatImporte, nombrePeriodo } from "@/shared/lib/formato";
import { clavesConceptos, listarConceptos, type Concepto } from "@/features/configuracion/services/conceptos.service";
import {
  actualizarPeriodo,
  clavesPeriodos,
  esConsumo,
  fijarPresupuesto,
  getPeriodo,
  getResumenLiquidaciones,
  listarConfiguracion,
  listarPresupuestos,
  NOMBRE_BASE,
  NOMBRE_METODO,
  quitarConcepto,
  quitarPresupuesto,
  validarPeriodo,
  type Configuracion,
} from "../services/periodos.service";
import { ConfigurarConcepto } from "../components/ConfigurarConcepto";
import { Lecturas } from "../components/Lecturas";

type Dialogo =
  | { tipo: "configurar"; concepto: Concepto; config: Configuracion | null }
  | { tipo: "quitar"; concepto: Concepto }
  | { tipo: "lecturas"; concepto: Concepto; config: Configuracion }
  | { tipo: "presupuesto"; concepto: Concepto; importe: string }
  | { tipo: "fecha" }
  | null;

export default function PeriodoPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("finanzas.gestionar");
  const [dialogo, setDialogo] = useState<Dialogo>(null);

  const periodo = useQuery({ queryKey: clavesPeriodos.uno(id), queryFn: () => getPeriodo(id) });
  const resumen = useQuery({ queryKey: clavesPeriodos.resumen(id), queryFn: () => getResumenLiquidaciones(id) });
  const conceptos = useQuery({ queryKey: clavesConceptos.lista, queryFn: () => listarConceptos() });
  const config = useQuery({ queryKey: clavesPeriodos.configuracion(id), queryFn: () => listarConfiguracion(id) });
  const presupuestos = useQuery({ queryKey: clavesPeriodos.presupuestos(id), queryFn: () => listarPresupuestos(id) });
  const validacion = useQuery({ queryKey: clavesPeriodos.validacion(id), queryFn: () => validarPeriodo(id) });

  if (periodo.isPending) return <TableStateBlock variant="loading" />;
  if (periodo.isError) return <ErrorConsulta error={periodo.error} />;
  const p = periodo.data;

  // D-050: cerrado o con liquidaciones emitidas → configuración bloqueada (el 409 del backend manda).
  const cerrado = p.estado === "cerrado";
  const conEmitidas = (resumen.data?.emitidas ?? 0) > 0;
  const editable = gestionar && !cerrado && !conEmitidas;

  const configDe = (c: Concepto) => config.data?.find((x) => x.concepto_id === c.id) ?? null;
  const presupuestoDe = (c: Concepto) => presupuestos.data?.find((x) => x.concepto_id === c.id) ?? null;
  const filas = conceptos.data?.filter((c) => c.activo || configDe(c));
  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ["periodos", id] });
  };

  return (
    <>
      <Encabezado
        volver={{ to: "/periodos", label: "Periodos" }}
        titulo={
          <span className="flex items-center gap-3">
            {nombrePeriodo(p.anio, p.mes)} {cerrado ? <Etiqueta>Cerrado</Etiqueta> : <Etiqueta tono="verde">Abierto</Etiqueta>}
          </span>
        }
        descripcion={`Fecha límite de pago: ${formatFecha(p.fecha_limite)}`}
        acciones={
          <>
            {gestionar && !cerrado && (
              <Button variant="outline" onClick={() => setDialogo({ tipo: "fecha" })}>
                Cambiar fecha límite
              </Button>
            )}
            <Button asChild>
              <Link to={`/liquidaciones?periodo=${p.id}`}>Liquidaciones</Link>
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        {(cerrado || conEmitidas) && (
          <p className="flex gap-2 text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <LockIcon className="size-4 shrink-0 mt-0.5" />
            {cerrado
              ? "El periodo está cerrado: la configuración, los presupuestos y las lecturas no se pueden cambiar."
              : "El periodo tiene liquidaciones emitidas: para cambiar la configuración hay que anularlas antes."}
          </p>
        )}

        <Tarjeta titulo="Validación">
          <div className="p-5 space-y-2 text-sm">
            {validacion.isPending && <p className="text-gray-400">Validando…</p>}
            {validacion.isError && <ErrorConsulta error={validacion.error} />}
            {validacion.data && (
              <>
                {validacion.data.valido ? (
                  <p className="flex items-center gap-2 font-semibold text-success-700">
                    <CircleCheckIcon className="size-4" /> Configuración válida
                  </p>
                ) : (
                  <p className="flex items-center gap-2 font-semibold text-error-700">
                    <CircleAlertIcon className="size-4" /> Con problemas: no se puede preparar, emitir ni cerrar
                  </p>
                )}
                {validacion.data.problemas.map((x, i) => (
                  <p key={`p${i}`} className="text-error-700">
                    • {x.concepto && <strong>{x.concepto}: </strong>}
                    {x.mensaje}
                  </p>
                ))}
                {validacion.data.advertencias.map((x, i) => (
                  <p key={`a${i}`} className="flex gap-1 text-warning-800">
                    <TriangleAlertIcon className="size-3.5 mt-0.5 shrink-0" />
                    {x.concepto && <strong>{x.concepto}: </strong>}
                    {x.mensaje}
                  </p>
                ))}
              </>
            )}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Conceptos del periodo">
          <Tabla
            columnas={[
              {
                titulo: "Concepto",
                celda: (c) => (
                  <span>
                    <span className="font-semibold text-gray-900">{c.codigo}</span> <span className="text-gray-500">{c.nombre}</span>
                    {!c.activo && <Etiqueta>Desactivado</Etiqueta>}
                  </span>
                ),
              },
              {
                titulo: "Configuración",
                celda: (c) => {
                  const k = configDe(c);
                  if (!k) return <span className="text-gray-400">Sin configurar</span>;
                  const extra = [
                    k.base && `base: ${NOMBRE_BASE[k.base]}`,
                    k.importe_fijo && formatImporte(k.importe_fijo),
                    k.tarifa && `${formatImporte(k.tarifa)} / ${c.unidad_consumo ?? "unidad"}`,
                    k.departamentos.some((d) => d.excluido) && `${k.departamentos.filter((d) => d.excluido).length} excluidos`,
                  ].filter(Boolean);
                  return (
                    <span>
                      {NOMBRE_METODO[k.metodo]}
                      {extra.length > 0 && <span className="block text-[12px] text-gray-500">{extra.join(" · ")}</span>}
                    </span>
                  );
                },
              },
              {
                titulo: "Presupuesto",
                celda: (c) => {
                  const k = configDe(c);
                  const pr = presupuestoDe(c);
                  if (k?.base !== "presupuestada" && !pr) return <span className="text-gray-300">—</span>;
                  return (
                    <span className="flex items-center gap-2">
                      {pr ? formatImporte(pr.importe) : <span className="text-warning-700">Falta</span>}
                      {editable && (
                        <Button size="sm" variant="ghost" onClick={() => setDialogo({ tipo: "presupuesto", concepto: c, importe: pr?.importe ?? "" })}>
                          {pr ? "Cambiar" : "Fijar"}
                        </Button>
                      )}
                    </span>
                  );
                },
              },
              {
                titulo: "",
                className: "text-right whitespace-nowrap",
                celda: (c) => {
                  const k = configDe(c);
                  return (
                    <div className="flex justify-end gap-1">
                      {k && esConsumo(k.metodo) && (
                        <Button size="sm" variant="ghost" onClick={() => setDialogo({ tipo: "lecturas", concepto: c, config: k })}>
                          Lecturas
                        </Button>
                      )}
                      {editable && c.activo && (
                        <Button size="sm" variant="ghost" onClick={() => setDialogo({ tipo: "configurar", concepto: c, config: k })}>
                          {k ? "Editar" : "Configurar"}
                        </Button>
                      )}
                      {editable && k && (
                        <Button size="sm" variant="ghost" onClick={() => setDialogo({ tipo: "quitar", concepto: c })}>
                          Quitar
                        </Button>
                      )}
                    </div>
                  );
                },
              },
            ]}
            filas={filas}
            clave={(c) => c.id}
            cargando={conceptos.isPending || config.isPending}
            error={conceptos.error ?? config.error}
            vacio="No hay conceptos de cobro. Créelos en «Periodos y cuotas › Conceptos de cobro»."
          />
        </Tarjeta>
      </div>

      {dialogo?.tipo === "configurar" && <ConfigurarConcepto periodoId={id} concepto={dialogo.concepto} actual={dialogo.config} onCerrar={() => setDialogo(null)} />}
      {dialogo?.tipo === "lecturas" && <Lecturas periodoId={id} concepto={dialogo.concepto} config={dialogo.config} editable={editable} onCerrar={() => setDialogo(null)} />}
      <Confirmar
        abierto={dialogo?.tipo === "quitar"}
        onCerrar={() => setDialogo(null)}
        titulo="Quitar concepto del periodo"
        descripcion="Se borra su configuración en este periodo. El concepto sigue existiendo."
        confirmar="Quitar"
        peligro
        onConfirmar={async () => {
          if (dialogo?.tipo !== "quitar") return;
          await quitarConcepto(id, dialogo.concepto.id);
          refrescar();
          toast.success("Concepto quitado del periodo.");
        }}
      />
      {dialogo?.tipo === "presupuesto" && (
        <EditarPresupuesto
          concepto={dialogo.concepto}
          inicial={dialogo.importe}
          onCerrar={() => setDialogo(null)}
          onGuardar={async (importe) => {
            if (importe === null) await quitarPresupuesto(id, dialogo.concepto.id);
            else await fijarPresupuesto(id, dialogo.concepto.id, importe);
            refrescar();
            toast.success("Presupuesto guardado.");
          }}
        />
      )}
      {dialogo?.tipo === "fecha" && (
        <EditarFecha
          inicial={p.fecha_limite}
          onCerrar={() => setDialogo(null)}
          onGuardar={async (f) => {
            qc.setQueryData(clavesPeriodos.uno(id), await actualizarPeriodo(id, f));
            qc.invalidateQueries({ queryKey: clavesPeriodos.lista });
            toast.success("Fecha límite actualizada.");
          }}
        />
      )}
    </>
  );
}

function EditarPresupuesto({ concepto, inicial, onCerrar, onGuardar }: { concepto: Concepto; inicial: string; onCerrar: () => void; onGuardar: (importe: string | null) => Promise<void> }) {
  const [importe, setImporte] = useState(inicial);
  const [quitar, setQuitar] = useState(false);
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={`Presupuesto de ${concepto.codigo}`}
      descripcion="Importe presupuestado del concepto para el periodo."
      confirmar={quitar ? "Quitar presupuesto" : "Guardar"}
      peligro={quitar}
      deshabilitado={!quitar && !/^\d+(\.\d{1,2})?$/.test(importe.trim())}
      onConfirmar={() => onGuardar(quitar ? null : importe.trim())}
    >
      <Campo id="importe" label="Importe (S/)" ayuda="Hasta 2 decimales.">
        <Input id="importe" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} disabled={quitar} autoFocus />
      </Campo>
      {inicial && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={quitar} onChange={(e) => setQuitar(e.target.checked)} /> Quitar el presupuesto
        </label>
      )}
    </Confirmar>
  );
}

function EditarFecha({ inicial, onCerrar, onGuardar }: { inicial: string; onCerrar: () => void; onGuardar: (f: string) => Promise<void> }) {
  const [fecha, setFecha] = useState(inicial);
  return (
    <Confirmar abierto onCerrar={onCerrar} titulo="Cambiar fecha límite" confirmar="Guardar" deshabilitado={!fecha} onConfirmar={() => onGuardar(fecha)}>
      <Campo id="fecha" label="Fecha límite de pago">
        <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Campo>
    </Confirmar>
  );
}
