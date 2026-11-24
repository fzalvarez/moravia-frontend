import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConMotivo, Confirmar, Modal } from "@/shared/components/app/Dialogos";
import { Campo } from "@/shared/components/app/Formulario";
import { Importe } from "@/shared/components/app/Importe";
import { Datos, Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta, Tabla } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { useIdempotencia } from "@/shared/hooks/useIdempotencia";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { nulo } from "@/shared/lib/formularios";
import { formatFecha, formatImporte, hoyLima, nombrePeriodo } from "@/shared/lib/formato";
import { clavesConceptos, listarConceptos } from "@/features/configuracion/services/conceptos.service";
import { clavesPeriodos, listarPeriodos } from "@/features/periodos/services/periodos.service";
import { clavesProveedores, getProveedor, listarCategorias } from "../services/proveedores.service";
import {
  anularGasto,
  anularPagoProveedor,
  clavesGastos,
  getGasto,
  listarPagosGasto,
  pagarGasto,
  type Gasto,
  type PagoProveedor,
} from "../services/gastos.service";
import { GastoFormulario } from "../components/GastoFormulario";
import { EstadoGasto } from "../components/EstadoGasto";
import { Adjuntos } from "../components/Adjuntos";

type Dialogo = { tipo: "editar" } | { tipo: "anular" } | { tipo: "pagar" } | { tipo: "anular-pago"; pago: PagoProveedor } | { tipo: "comprobantes"; pago: PagoProveedor } | null;

export default function GastoPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const { puede } = usePermisos();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const gasto = useQuery({ queryKey: clavesGastos.uno(id), queryFn: () => getGasto(id) });
  const pagos = useQuery({ queryKey: clavesGastos.pagos(id), queryFn: () => listarPagosGasto(id) });
  const g = gasto.data;
  const proveedor = useQuery({ queryKey: clavesProveedores.uno(g?.proveedor_id ?? ""), queryFn: () => getProveedor(g!.proveedor_id!), enabled: !!g?.proveedor_id });
  const categorias = useQuery({ queryKey: clavesProveedores.categorias, queryFn: listarCategorias });
  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos, enabled: puede("finanzas.ver") });
  const conceptos = useQuery({ queryKey: clavesConceptos.lista, queryFn: () => listarConceptos(), enabled: puede("finanzas.ver") });

  if (gasto.isPending) return <TableStateBlock variant="loading" />;
  if (gasto.isError || !g) return <ErrorConsulta error={gasto.error} />;

  const gestionar = puede("gastos.gestionar") && g.estado !== "anulado";
  const periodo = periodos.data?.find((p) => p.id === g.periodo_id);
  const concepto = conceptos.data?.find((c) => c.id === g.concepto_id);
  const refrescar = (nuevo?: Gasto) => {
    if (nuevo) qc.setQueryData(clavesGastos.uno(id), nuevo);
    else qc.invalidateQueries({ queryKey: clavesGastos.uno(id) });
    qc.invalidateQueries({ queryKey: clavesGastos.pagos(id) });
    qc.invalidateQueries({ queryKey: ["gastos", "lista"] });
    qc.invalidateQueries({ queryKey: ["gastos", "resumen"] });
  };

  return (
    <>
      <Encabezado
        volver={{ to: "/gastos", label: "Gastos" }}
        titulo={g.descripcion}
        descripcion={<EstadoGasto gasto={g} />}
        acciones={
          gestionar && (
            <>
              <Button variant="outline" onClick={() => setDialogo({ tipo: "editar" })}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setDialogo({ tipo: "anular" })}>
                Anular
              </Button>
            </>
          )
        }
      />
      <div className="space-y-5">
        <Tarjeta titulo="Datos del gasto">
          <Datos
            items={[
              { label: "Importe", valor: <Importe valor={g.importe} className="font-bold" /> },
              { label: "Pagado", valor: <Importe valor={g.pagado} /> },
              { label: "Saldo", valor: <Importe valor={g.saldo} className="font-bold" /> },
              { label: "Fecha", valor: formatFecha(g.fecha) },
              { label: "Vencimiento", valor: g.fecha_vencimiento ? formatFecha(g.fecha_vencimiento) : "—" },
              { label: "Periodo", valor: periodo ? nombrePeriodo(periodo.anio, periodo.mes) : "…" },
              { label: "Categoría", valor: categorias.data?.find((c) => c.id === g.categoria_id)?.nombre ?? "…" },
              { label: "Proveedor", valor: g.proveedor_id ? (proveedor.data?.nombre ?? "…") : "—" },
              { label: "N.º de comprobante", valor: g.numero_comprobante ?? "—" },
              { label: "Traslado a cuotas", valor: g.concepto_id ? `Sí: ${concepto ? `${concepto.codigo} · ${concepto.nombre}` : "…"}` : "No" },
              ...(g.motivo_anulacion ? [{ label: "Motivo de anulación", valor: g.motivo_anulacion }] : []),
            ]}
          />
        </Tarjeta>

        <Tarjeta
          titulo="Pagos al proveedor"
          acciones={
            gestionar && (
              <Button size="sm" onClick={() => setDialogo({ tipo: "pagar" })}>
                <PlusIcon className="size-4" /> Registrar pago
              </Button>
            )
          }
        >
          <Tabla
            columnas={[
              { titulo: "Fecha", celda: (p) => formatFecha(p.fecha) },
              { titulo: "Importe", celda: (p) => <Importe valor={p.importe} className={p.anulado ? "line-through text-gray-400" : ""} /> },
              { titulo: "Referencia", celda: (p) => p.referencia ?? "—" },
              {
                titulo: "Estado",
                celda: (p) => (p.anulado ? <span title={p.motivo_anulacion ?? ""}><Etiqueta>Anulado</Etiqueta></span> : <Etiqueta tono="verde">Vigente</Etiqueta>),
              },
              {
                titulo: "",
                className: "text-right whitespace-nowrap",
                celda: (p) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setDialogo({ tipo: "comprobantes", pago: p })}>
                      Comprobantes
                    </Button>
                    {puede("gastos.gestionar") && !p.anulado && (
                      <Button size="sm" variant="ghost" onClick={() => setDialogo({ tipo: "anular-pago", pago: p })}>
                        Anular
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            filas={pagos.data}
            clave={(p) => p.id}
            cargando={pagos.isPending}
            error={pagos.error}
            vacio="Sin pagos registrados."
          />
        </Tarjeta>

        <Tarjeta titulo="Comprobantes del gasto">
          <div className="p-5">
            <Adjuntos duenio={{ tipo: "gasto", id }} editable={gestionar} />
          </div>
        </Tarjeta>
      </div>

      {dialogo?.tipo === "editar" && <GastoFormulario gasto={g} onCerrar={() => setDialogo(null)} />}
      {dialogo?.tipo === "anular" && (
        <ConMotivo
          titulo="Anular gasto"
          descripcion="Solo se puede anular si no tiene pagos vigentes. El gasto se conserva como anulado."
          onCerrar={() => setDialogo(null)}
          onConfirmar={async (motivo) => {
            refrescar(await anularGasto(id, motivo));
            toast.success("Gasto anulado.");
          }}
        />
      )}
      {dialogo?.tipo === "anular-pago" && (
        <ConMotivo
          titulo={`Anular pago de ${formatImporte(dialogo.pago.importe)}`}
          descripcion="El pago deja de contar en el saldo del gasto."
          onCerrar={() => setDialogo(null)}
          onConfirmar={async (motivo) => {
            await anularPagoProveedor(dialogo.pago.id, motivo);
            refrescar();
            toast.success("Pago anulado.");
          }}
        />
      )}
      {dialogo?.tipo === "pagar" && (
        <RegistrarPago
          gasto={g}
          onCerrar={() => setDialogo(null)}
          onRegistrado={() => {
            refrescar();
            toast.success("Pago registrado.");
          }}
        />
      )}
      {dialogo?.tipo === "comprobantes" && (
        <Modal abierto onCerrar={() => setDialogo(null)} titulo={`Comprobantes del pago del ${formatFecha(dialogo.pago.fecha)}`} pie={<Button onClick={() => setDialogo(null)}>Cerrar</Button>}>
          <Adjuntos duenio={{ tipo: "pago", id: dialogo.pago.id }} editable={puede("gastos.gestionar") && !dialogo.pago.anulado} />
        </Modal>
      )}
    </>
  );
}

function RegistrarPago({ gasto, onCerrar, onRegistrado }: { gasto: Gasto; onCerrar: () => void; onRegistrado: () => void }) {
  const { clave } = useIdempotencia();
  const [fecha, setFecha] = useState(hoyLima());
  const [importe, setImporte] = useState(gasto.saldo);
  const [referencia, setReferencia] = useState("");
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo="Registrar pago al proveedor"
      descripcion={`Saldo del gasto: ${formatImporte(gasto.saldo)}. El pago no puede superarlo.`}
      confirmar="Registrar pago"
      deshabilitado={!fecha || !/^\d+(\.\d{1,2})?$/.test(importe.trim())}
      onConfirmar={async () => {
        // La misma clave en los reintentos de este envío (F-106).
        await pagarGasto(gasto.id, { fecha, importe: importe.trim(), referencia: nulo(referencia), clave_idempotencia: clave });
        onRegistrado();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="importe" label="Importe (S/)">
          <Input id="importe" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
        </Campo>
        <Campo id="fecha" label="Fecha">
          <Input id="fecha" type="date" max={hoyLima()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
      </div>
      <Campo id="referencia" label="Referencia (opcional)" ayuda="N.º de operación, cheque…">
        <Input id="referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
      </Campo>
    </Confirmar>
  );
}
