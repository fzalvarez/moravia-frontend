import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { Encabezado, Etiqueta, Pestanas, Tarjeta } from "@/shared/components/app/Pagina";
import { Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, hoyLima, MESES, nombrePeriodo } from "@/shared/lib/formato";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { ConceptosCatalogo } from "@/features/configuracion/components/ConceptosCatalogo";
import { TiposCatalogo } from "@/features/configuracion/components/TiposCatalogo";
import { clavesPeriodos, crearPeriodo, listarPeriodos } from "../services/periodos.service";

type Vista = "periodos" | "conceptos" | "tipos";

export default function PeriodosPage() {
  const [vista, setVista] = useState<Vista>("periodos");
  return (
    <>
      <Encabezado titulo="Periodos y cuotas" descripcion="Periodos mensuales, conceptos de cobro y tipos de departamento." />
      <Pestanas
        valor={vista}
        onChange={setVista}
        opciones={[
          { valor: "periodos", label: "Periodos" },
          { valor: "conceptos", label: "Conceptos de cobro" },
          { valor: "tipos", label: "Tipos de departamento" },
        ]}
      />
      {vista === "periodos" && <ListaPeriodos />}
      {vista === "conceptos" && <ConceptosCatalogo />}
      {vista === "tipos" && <TiposCatalogo />}
    </>
  );
}

function ListaPeriodos() {
  const navigate = useNavigate();
  const { puede } = usePermisos();
  const [nuevo, setNuevo] = useState(false);
  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos });
  const orden = periodos.data && [...periodos.data].sort((a, b) => b.anio - a.anio || b.mes - a.mes);

  return (
    <Tarjeta
      titulo="Periodos"
      acciones={
        puede("finanzas.gestionar") && (
          <Button size="sm" onClick={() => setNuevo(true)}>
            <PlusIcon className="size-4" /> Nuevo periodo
          </Button>
        )
      }
    >
      <Tabla
        columnas={[
          { titulo: "Periodo", celda: (p) => <span className="font-semibold text-gray-900">{nombrePeriodo(p.anio, p.mes)}</span> },
          { titulo: "Fecha límite", celda: (p) => formatFecha(p.fecha_limite) },
          { titulo: "Estado", celda: (p) => (p.estado === "abierto" ? <Etiqueta tono="verde">Abierto</Etiqueta> : <Etiqueta>Cerrado</Etiqueta>) },
        ]}
        filas={orden}
        clave={(p) => p.id}
        cargando={periodos.isPending}
        error={periodos.error}
        vacio="No hay periodos. Cree el primero para configurar las cuotas."
        onFila={(p) => navigate(`/periodos/${p.id}`)}
      />
      {nuevo && <NuevoPeriodo onCerrar={() => setNuevo(false)} onCreado={(id) => navigate(`/periodos/${id}`)} />}
    </Tarjeta>
  );
}

function NuevoPeriodo({ onCerrar, onCreado }: { onCerrar: () => void; onCreado: (id: string) => void }) {
  const qc = useQueryClient();
  const [anioHoy, mesHoy] = hoyLima().split("-").map(Number);
  const [anio, setAnio] = useState(String(anioHoy));
  const [mes, setMes] = useState(String(mesHoy));
  const [fecha, setFecha] = useState("");
  const [copiar, setCopiar] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const crear = useMutation({
    mutationFn: () => crearPeriodo({ anio: Number(anio), mes: Number(mes), fecha_limite: fecha, copiar_configuracion: copiar }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: clavesPeriodos.lista });
      toast.success(`Periodo ${nombrePeriodo(p.anio, p.mes)} creado.`);
      onCerrar();
      onCreado(p.id);
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo crear el periodo."));
    },
  });

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Nuevo periodo"
      ancho="sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!fecha) return setErrores({ fecha_limite: "Requerida" });
        setError(null);
        crear.mutate();
      }}
      pie={
        <>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={crear.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={crear.isPending}>
            Crear
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Campo id="mes" label="Mes" error={errores.mes}>
          <Select id="mes" value={mes} onChange={(e) => setMes(e.target.value)}>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo id="anio" label="Año" error={errores.anio}>
          <Input id="anio" inputMode="numeric" value={anio} onChange={(e) => setAnio(e.target.value)} />
        </Campo>
      </div>
      <Campo id="fecha_limite" label="Fecha límite de pago" error={errores.fecha_limite} ayuda="No puede ser anterior al día 1 del mes.">
        <Input id="fecha_limite" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Campo>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <Checkbox className="mt-0.5" checked={copiar} onCheckedChange={(v) => setCopiar(!!v)} />
        <span>
          Copiar la configuración y los presupuestos del periodo anterior
          <span className="block text-[12px] text-gray-400">Las lecturas de consumo nunca se copian.</span>
        </span>
      </label>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
