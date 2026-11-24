import { useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { Campo } from "@/shared/components/app/Formulario";
import { Importe } from "@/shared/components/app/Importe";
import { Datos, Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta, Tabla } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, formatFechaHora, hoyLima } from "@/shared/lib/formato";
import { clavesDepartamentos, getDepartamento } from "@/features/departamentos/services/departamentos.service";
import { clavesMultas, generarMultas, getPolitica, guardarPolitica, type Generacion, type Politica } from "../services/multas.service";

export default function MultasPage() {
  const gestionar = usePermisos().puede("finanzas.gestionar");
  const politica = useQuery({ queryKey: clavesMultas.politica, queryFn: getPolitica });
  const [editar, setEditar] = useState(false);
  const [generar, setGenerar] = useState(false);
  const [resultado, setResultado] = useState<Generacion | null>(null);

  return (
    <>
      <Encabezado titulo="Multas por mora" descripcion="Política vigente y generación de multas." />
      <p className="flex gap-2 mb-5 text-[13px] text-brand-900 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
        <InfoIcon className="size-4 shrink-0 mt-0.5" />
        Las multas no se generan solas: hay que generarlas aquí. Repetir la generación no duplica multas (una por departamento y periodo).
      </p>
      {politica.isPending ? (
        <TableStateBlock variant="loading" />
      ) : politica.isError ? (
        <ErrorConsulta error={politica.error} />
      ) : (
        <div className="space-y-5">
          <Tarjeta
            titulo="Política"
            acciones={
              gestionar && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditar(true)}>
                    {politica.data ? "Cambiar política" : "Configurar"}
                  </Button>
                  <Button size="sm" onClick={() => setGenerar(true)} disabled={!politica.data?.activa}>
                    Generar multas
                  </Button>
                </>
              )
            }
          >
            {politica.data ? (
              <Datos
                items={[
                  { label: "Estado", valor: politica.data.activa ? <Etiqueta tono="verde">Activa</Etiqueta> : <Etiqueta>Inactiva</Etiqueta> },
                  { label: "Importe por multa", valor: <Importe valor={politica.data.importe} /> },
                  { label: "Días de gracia", valor: `${politica.data.dias_gracia} días después de la fecha límite` },
                  { label: "Versión desde", valor: formatFechaHora(politica.data.creado_en) },
                ]}
              />
            ) : (
              <p className="p-5 text-sm text-gray-500">Sin configurar. Configure la política para poder generar multas.</p>
            )}
          </Tarjeta>
          {resultado && <Resultado resultado={resultado} />}
        </div>
      )}
      {editar && <EditarPolitica actual={politica.data ?? null} onCerrar={() => setEditar(false)} />}
      {generar && <GenerarMultas onCerrar={() => setGenerar(false)} onHecho={setResultado} />}
    </>
  );
}

function Resultado({ resultado }: { resultado: Generacion }) {
  const ids = [...new Set(resultado.generadas.map((m) => m.departamento_id))];
  const deptos = useQueries({ queries: ids.map((id) => ({ queryKey: clavesDepartamentos.uno(id), queryFn: () => getDepartamento(id) })) });
  const codigo = (id: string) => deptos.find((q) => q.data?.id === id)?.data?.codigo ?? "…";
  return (
    <Tarjeta titulo={`Resultado: ${resultado.generadas.length} multas generadas · ${resultado.ya_existentes} ya existían`}>
      <Tabla
        columnas={[
          { titulo: "Departamento", celda: (m) => <span className="font-semibold text-gray-900">{codigo(m.departamento_id)}</span> },
          { titulo: "Fecha", celda: (m) => formatFecha(m.fecha) },
          { titulo: "Deuda vencida", celda: (m) => <Importe valor={m.deuda_vencida} />, className: "text-right" },
          { titulo: "Multa", celda: (m) => <Importe valor={m.importe} className="font-semibold" />, className: "text-right" },
        ]}
        filas={resultado.generadas}
        clave={(m) => m.id}
        vacio="No se generaron multas nuevas."
      />
    </Tarjeta>
  );
}

function EditarPolitica({ actual, onCerrar }: { actual: Politica | null; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [activa, setActiva] = useState(actual?.activa ?? true);
  const [dias, setDias] = useState(String(actual?.dias_gracia ?? 5));
  const [importe, setImporte] = useState(actual?.importe ?? "");
  const valido = /^\d{1,3}$/.test(dias) && Number(dias) <= 365 && /^\d+(\.\d{1,2})?$/.test(importe.trim()) && !/^0+(\.0+)?$/.test(importe.trim());
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo="Política de multas"
      descripcion="Cada cambio crea una versión nueva; las multas ya generadas no cambian."
      confirmar="Guardar"
      deshabilitado={!valido}
      onConfirmar={async () => {
        qc.setQueryData(clavesMultas.politica, await guardarPolitica({ activa, dias_gracia: Number(dias), importe: importe.trim() }));
        toast.success("Política guardada.");
      }}
    >
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <Checkbox checked={activa} onCheckedChange={(v) => setActiva(!!v)} /> Política activa
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="importe" label="Importe por multa (S/)">
          <Input id="importe" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
        </Campo>
        <Campo id="dias" label="Días de gracia" ayuda="0 a 365, desde la fecha límite.">
          <Input id="dias" inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} />
        </Campo>
      </div>
    </Confirmar>
  );
}

function GenerarMultas({ onCerrar, onHecho }: { onCerrar: () => void; onHecho: (r: Generacion) => void }) {
  const qc = useQueryClient();
  const [fecha, setFecha] = useState(hoyLima());
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo="Generar multas"
      descripcion="Se crea una multa por departamento y periodo con deuda vencida a la fecha de corte. Cada multa se carga en la cuenta del departamento."
      confirmar="Generar"
      onConfirmar={async () => {
        const r = await generarMultas(fecha || null);
        onHecho(r);
        qc.invalidateQueries({ queryKey: ["departamentos"] });
        qc.invalidateQueries({ queryKey: ["reportes"] });
        toast.success(`${r.generadas.length} multas generadas; ${r.ya_existentes} ya existían.`);
      }}
    >
      <Campo id="fecha_corte" label="Fecha de corte" ayuda="Hoy o una fecha pasada.">
        <Input id="fecha_corte" type="date" max={hoyLima()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Campo>
    </Confirmar>
  );
}
