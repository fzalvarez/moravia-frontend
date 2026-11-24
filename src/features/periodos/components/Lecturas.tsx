import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { listarTodosDepartamentos, type Departamento } from "@/features/departamentos/services/departamentos.service";
import type { Concepto } from "@/features/configuracion/services/conceptos.service";
import { clavesPeriodos, fijarLectura, listarLecturas, type Configuracion, type Lectura } from "../services/periodos.service";

type Props = { periodoId: string; concepto: Concepto; config: Configuracion; editable: boolean; onCerrar: () => void };

/** Lecturas por departamento de un concepto por consumo. */
export function Lecturas({ periodoId, concepto, config, editable, onCerrar }: Props) {
  const lecturas = useQuery({ queryKey: clavesPeriodos.lecturas(periodoId, concepto.id), queryFn: () => listarLecturas(periodoId, concepto.id) });
  const departamentos = useQuery({ queryKey: ["departamentos", "todos", true], queryFn: () => listarTodosDepartamentos(true) });
  const excluidos = new Set(config.departamentos.filter((d) => d.excluido).map((d) => d.departamento_id));
  const filas = departamentos.data?.filter((d) => !excluidos.has(d.id)) ?? [];
  const unidad = concepto.unidad_consumo ?? "unidades";

  return (
    <Modal abierto onCerrar={onCerrar} ancho="lg" titulo={`Lecturas de ${concepto.codigo}`} descripcion={`Consumo en ${unidad}. La lectura actual no puede ser menor que la anterior.`} pie={<Button onClick={onCerrar}>Cerrar</Button>}>
      {(lecturas.isPending || departamentos.isPending) && <p className="text-sm text-gray-400">Cargando…</p>}
      <div className="divide-y divide-gray-100">
        <div className="grid grid-cols-[6rem_1fr_1fr_6rem_auto] gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          <span>Depto.</span>
          <span>Anterior</span>
          <span>Actual</span>
          <span>Consumo</span>
          <span />
        </div>
        {lecturas.data &&
          filas.map((d) => (
            <FilaLectura key={d.id} periodoId={periodoId} conceptoId={concepto.id} departamento={d} lectura={lecturas.data.find((l) => l.departamento_id === d.id)} editable={editable} />
          ))}
      </div>
    </Modal>
  );
}

function FilaLectura({ periodoId, conceptoId, departamento, lectura, editable }: { periodoId: string; conceptoId: string; departamento: Departamento; lectura?: Lectura; editable: boolean }) {
  const qc = useQueryClient();
  const [anterior, setAnterior] = useState(lectura?.lectura_anterior ?? "");
  const [actual, setActual] = useState(lectura?.lectura_actual ?? "");
  const [guardando, setGuardando] = useState(false);
  const cambiado = anterior !== (lectura?.lectura_anterior ?? "") || actual !== (lectura?.lectura_actual ?? "");

  const guardar = async () => {
    setGuardando(true);
    try {
      await fijarLectura(periodoId, conceptoId, departamento.id, anterior.trim(), actual.trim());
      await qc.invalidateQueries({ queryKey: clavesPeriodos.lecturas(periodoId, conceptoId) });
      qc.invalidateQueries({ queryKey: clavesPeriodos.validacion(periodoId) });
      toast.success(`Lectura de ${departamento.codigo} guardada.`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo guardar la lectura."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grid grid-cols-[6rem_1fr_1fr_6rem_auto] items-center gap-2 py-2 text-sm">
      <span className="font-semibold text-gray-900">{departamento.codigo}</span>
      <Input className="h-8" inputMode="decimal" value={anterior} onChange={(e) => setAnterior(e.target.value)} disabled={!editable} />
      <Input className="h-8" inputMode="decimal" value={actual} onChange={(e) => setActual(e.target.value)} disabled={!editable} />
      <span className="text-gray-700">{lectura?.consumo ?? "—"}</span>
      {editable ? (
        <Button size="sm" variant="outline" onClick={guardar} disabled={!cambiado || !anterior.trim() || !actual.trim()} loading={guardando}>
          Guardar
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}
