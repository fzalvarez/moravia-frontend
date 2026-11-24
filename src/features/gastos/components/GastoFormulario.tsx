import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Buscador } from "@/shared/components/app/Buscador";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { useIdempotencia } from "@/shared/hooks/useIdempotencia";
import { nulo } from "@/shared/lib/formularios";
import { hoyLima, nombrePeriodo } from "@/shared/lib/formato";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { clavesConceptos, listarConceptos } from "@/features/configuracion/services/conceptos.service";
import { clavesPeriodos, listarPeriodos } from "@/features/periodos/services/periodos.service";
import { clavesProveedores, getProveedor, listarCategorias, listarProveedores, type Proveedor } from "../services/proveedores.service";
import { actualizarGasto, clavesGastos, crearGasto, type Gasto } from "../services/gastos.service";

const IMPORTE = /^\d+(\.\d{1,2})?$/;

export function GastoFormulario({ gasto, onCerrar, onGuardado }: { gasto?: Gasto; onCerrar: () => void; onGuardado?: (g: Gasto) => void }) {
  const qc = useQueryClient();
  const { clave, renovar } = useIdempotencia();
  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos });
  const categorias = useQuery({ queryKey: clavesProveedores.categorias, queryFn: listarCategorias });
  const conceptos = useQuery({ queryKey: clavesConceptos.lista, queryFn: () => listarConceptos() });
  const proveedorActual = useQuery({
    queryKey: clavesProveedores.uno(gasto?.proveedor_id ?? ""),
    queryFn: () => getProveedor(gasto!.proveedor_id!),
    enabled: !!gasto?.proveedor_id,
  });

  const abierto = periodos.data?.filter((p) => p.estado === "abierto").sort((a, b) => b.anio - a.anio || b.mes - a.mes)[0];
  const [v, setV] = useState({
    periodo_id: gasto?.periodo_id ?? "",
    categoria_id: gasto?.categoria_id ?? "",
    descripcion: gasto?.descripcion ?? "",
    importe: gasto?.importe ?? "",
    fecha: gasto?.fecha ?? hoyLima(),
    concepto_id: gasto?.concepto_id ?? "",
    fecha_vencimiento: gasto?.fecha_vencimiento ?? "",
    numero_comprobante: gasto?.numero_comprobante ?? "",
  });
  const [proveedor, setProveedor] = useState<Proveedor | null | undefined>(gasto?.proveedor_id ? undefined : null);
  const proveedorElegido = proveedor === undefined ? (proveedorActual.data ?? null) : proveedor;
  const periodoId = v.periodo_id || abierto?.id || "";
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const fijar = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));

  const guardar = useMutation({
    mutationFn: () => {
      const datos = {
        periodo_id: periodoId,
        categoria_id: v.categoria_id,
        descripcion: v.descripcion.trim(),
        importe: v.importe.trim(),
        fecha: v.fecha,
        proveedor_id: proveedorElegido?.id ?? null,
        concepto_id: nulo(v.concepto_id),
        fecha_vencimiento: nulo(v.fecha_vencimiento),
        numero_comprobante: nulo(v.numero_comprobante),
      };
      if (!gasto) return crearGasto({ ...datos, clave_idempotencia: clave });
      // Solo lo que cambió: en un periodo bloqueado se puede editar la descripción
      // sin tocar importe, concepto ni periodo.
      const cambios = Object.fromEntries(
        Object.entries(datos).filter(([k, val]) => val !== (gasto as Record<string, unknown>)[k])
      );
      return actualizarGasto(gasto.id, cambios);
    },
    onSuccess: (g) => {
      renovar();
      qc.setQueryData(clavesGastos.uno(g.id), g);
      qc.invalidateQueries({ queryKey: ["gastos", "lista"] });
      qc.invalidateQueries({ queryKey: ["gastos", "resumen"] });
      toast.success(gasto ? "Gasto actualizado." : "Gasto registrado.");
      onGuardado?.(g);
      onCerrar();
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo guardar el gasto."));
    },
  });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const loc: Record<string, string> = {};
    if (!periodoId) loc.periodo_id = "Requerido";
    if (!v.categoria_id) loc.categoria_id = "Requerida";
    if (!v.descripcion.trim()) loc.descripcion = "Requerida";
    if (!IMPORTE.test(v.importe.trim())) loc.importe = "Importe mayor que cero, hasta 2 decimales";
    if (!v.fecha) loc.fecha = "Requerida";
    setErrores(loc);
    if (Object.keys(loc).length) return;
    setError(null);
    guardar.mutate();
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      ancho="lg"
      titulo={gasto ? "Editar gasto" : "Registrar gasto"}
      descripcion="Registrar un gasto no genera cargos a los departamentos. Si se asocia a un concepto, entra en su base de gastos reales."
      onSubmit={enviar}
      pie={
        <>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={guardar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="periodo_id" label="Periodo" error={errores.periodo_id}>
          <Select id="periodo_id" value={periodoId} onChange={fijar("periodo_id")}>
            <option value="">Elija…</option>
            {periodos.data
              ?.slice()
              .sort((a, b) => b.anio - a.anio || b.mes - a.mes)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {nombrePeriodo(p.anio, p.mes)}
                  {p.estado === "cerrado" ? " (cerrado)" : ""}
                </option>
              ))}
          </Select>
        </Campo>
        <Campo id="categoria_id" label="Categoría" error={errores.categoria_id}>
          <Select id="categoria_id" value={v.categoria_id} onChange={fijar("categoria_id")}>
            <option value="">Elija…</option>
            {categorias.data
              ?.filter((c) => c.activo || c.id === v.categoria_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
          </Select>
        </Campo>
        <Campo id="descripcion" label="Descripción" error={errores.descripcion} className="sm:col-span-2">
          <Input id="descripcion" value={v.descripcion} onChange={fijar("descripcion")} />
        </Campo>
        <Campo id="importe" label="Importe (S/)" error={errores.importe}>
          <Input id="importe" inputMode="decimal" value={v.importe} onChange={fijar("importe")} />
        </Campo>
        <Campo id="fecha" label="Fecha" error={errores.fecha}>
          <Input id="fecha" type="date" value={v.fecha} onChange={fijar("fecha")} />
        </Campo>
        <Campo label="Proveedor (opcional)" error={errores.proveedor_id} className="sm:col-span-2">
          <Buscador
            clave={clavesProveedores.todos}
            buscar={async (q) => (await listarProveedores({ q, activo: true, limit: 20 })).items}
            idDe={(p) => p.id}
            etiqueta={(p) => p.nombre}
            detalle={(p) => p.numero_documento}
            seleccionado={proveedorElegido}
            onSeleccionar={setProveedor}
            placeholder="Buscar proveedor"
          />
        </Campo>
        <Campo id="concepto_id" label="Trasladable a cuotas (concepto)" error={errores.concepto_id} ayuda="Vacío: el gasto no se traslada a cuotas.">
          <Select id="concepto_id" value={v.concepto_id} onChange={fijar("concepto_id")}>
            <option value="">No trasladable</option>
            {conceptos.data
              ?.filter((c) => c.activo || c.id === v.concepto_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} · {c.nombre}
                </option>
              ))}
          </Select>
        </Campo>
        <Campo id="fecha_vencimiento" label="Vencimiento (opcional)" error={errores.fecha_vencimiento}>
          <Input id="fecha_vencimiento" type="date" value={v.fecha_vencimiento} onChange={fijar("fecha_vencimiento")} />
        </Campo>
        <Campo id="numero_comprobante" label="N.º de comprobante (opcional)" error={errores.numero_comprobante}>
          <Input id="numero_comprobante" value={v.numero_comprobante} onChange={fijar("numero_comprobante")} />
        </Campo>
      </div>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
