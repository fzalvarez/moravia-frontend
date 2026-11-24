import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConMotivo } from "@/shared/components/app/Dialogos";
import { Importe } from "@/shared/components/app/Importe";
import { Datos, Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta, Tabla } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, formatFechaHora, nombrePeriodo } from "@/shared/lib/formato";
import { NOMBRE_METODO, type Metodo } from "@/features/periodos/services/periodos.service";
import { anularLiquidacion, clavesLiquidaciones, getLiquidacion, NOMBRE_ESTADO_LIQ, TONO_LIQ } from "../services/liquidaciones.service";

/** Datos del cálculo tal como los guarda el backend. */
function Json({ valor }: { valor: unknown }) {
  return <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 border border-gray-100 p-3 text-[12px] text-gray-700">{JSON.stringify(valor, null, 2)}</pre>;
}

export default function LiquidacionPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("finanzas.gestionar");
  const [anular, setAnular] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const liq = useQuery({ queryKey: clavesLiquidaciones.una(id), queryFn: () => getLiquidacion(id) });

  if (liq.isPending) return <TableStateBlock variant="loading" />;
  if (liq.isError) return <ErrorConsulta error={liq.error} />;
  const l = liq.data;
  const periodo = l.anio && l.mes ? nombrePeriodo(l.anio, l.mes) : "";

  return (
    <>
      <Encabezado
        volver={{ to: `/liquidaciones?periodo=${l.periodo_id}`, label: "Liquidaciones" }}
        titulo={
          <span className="flex items-center gap-3">
            {l.departamento_codigo} · {periodo} <Etiqueta tono={TONO_LIQ[l.estado]}>{NOMBRE_ESTADO_LIQ[l.estado]}</Etiqueta>
          </span>
        }
        acciones={
          <>
            <Button variant="outline" asChild>
              <Link to={`/departamentos/${l.departamento_id}`}>Ver departamento</Link>
            </Button>
            {gestionar && l.estado === "emitida" && (
              <Button variant="destructive" onClick={() => setAnular(true)}>
                Anular
              </Button>
            )}
          </>
        }
      />
      <div className="space-y-5">
        <Tarjeta titulo="Resumen">
          <Datos
            items={[
              { label: "Total", valor: <Importe valor={l.total} className="font-bold" /> },
              { label: "Fecha límite", valor: l.fecha_limite ? formatFecha(l.fecha_limite) : "—" },
              { label: "Emitida", valor: l.emitida_en ? formatFechaHora(l.emitida_en) : "—" },
              ...(l.corrige_a_id
                ? [{ label: "Corrige a", valor: <Link className="text-brand-600 hover:underline" to={`/liquidaciones/${l.corrige_a_id}`}>Liquidación anulada</Link> }]
                : []),
              ...(l.anulada_en ? [{ label: "Anulada", valor: formatFechaHora(l.anulada_en) }] : []),
              ...(l.motivo_anulacion ? [{ label: "Motivo de anulación", valor: l.motivo_anulacion }] : []),
            ]}
          />
        </Tarjeta>
        <Tarjeta titulo="Detalle por concepto">
          <Tabla
            columnas={[
              { titulo: "Concepto", celda: (d) => <span><span className="font-semibold text-gray-900">{d.concepto_codigo}</span> <span className="text-gray-500">{d.concepto_nombre}</span></span> },
              { titulo: "Método", celda: (d) => NOMBRE_METODO[d.metodo as Metodo] ?? d.metodo },
              { titulo: "Calculado", celda: (d) => <span className="tabular-nums text-gray-500">{d.importe_calculado}</span>, className: "text-right" },
              { titulo: "Importe", celda: (d) => <Importe valor={d.importe} className="font-semibold" />, className: "text-right" },
              {
                titulo: "",
                className: "text-right",
                celda: (d) => (
                  <Button size="sm" variant="ghost" onClick={() => setAbierto(abierto === d.concepto_id ? null : d.concepto_id)}>
                    {abierto === d.concepto_id ? "Ocultar cálculo" : "Ver cálculo"}
                  </Button>
                ),
              },
            ]}
            filas={l.detalles}
            clave={(d) => d.concepto_id}
            vacio="Sin conceptos."
          />
          {abierto && (
            <div className="px-5 pb-5">
              <Json valor={l.detalles.find((d) => d.concepto_id === abierto)?.calculo} />
            </div>
          )}
        </Tarjeta>
        <Tarjeta titulo="Configuración usada">
          <div className="p-5">
            <Json valor={l.configuracion} />
          </div>
        </Tarjeta>
      </div>
      {anular && (
        <ConMotivo
          titulo="Anular liquidación"
          descripcion="Crea una reversión del cargo. Si el departamento ya pagó parte de esta deuda, primero hay que anular esos pagos (el mensaje indica cuánto)."
          onCerrar={() => setAnular(false)}
          onConfirmar={async (motivo) => {
            await anularLiquidacion(id, motivo);
            qc.invalidateQueries({ queryKey: clavesLiquidaciones.una(id) });
            qc.invalidateQueries({ queryKey: ["periodos", l.periodo_id] });
            qc.invalidateQueries({ queryKey: ["departamentos", l.departamento_id] });
            toast.success("Liquidación anulada.");
          }}
        />
      )}
    </>
  );
}
