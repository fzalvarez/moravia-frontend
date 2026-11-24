import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { clavesTipos, listarTipos } from "@/features/configuracion/services/tipos.service";
import { listarTodosDepartamentos } from "@/features/departamentos/services/departamentos.service";
import type { Concepto } from "@/features/configuracion/services/conceptos.service";
import {
  clavesPeriodos,
  configurarConcepto,
  NOMBRE_BASE,
  NOMBRE_METODO,
  usaBase,
  type Base,
  type Configuracion,
  type Metodo,
} from "../services/periodos.service";

type Props = { periodoId: string; concepto: Concepto; actual: Configuracion | null; onCerrar: () => void };

type ParamDepto = { excluido: boolean; porcentaje: string };

/** Formulario de configuración de un concepto en el periodo (SCREENS §5). */
export function ConfigurarConcepto({ periodoId, concepto, actual, onCerrar }: Props) {
  const qc = useQueryClient();
  const [metodo, setMetodo] = useState<Metodo>(actual?.metodo ?? "homogeneo");
  const [base, setBase] = useState<Base>(actual?.base ?? "presupuestada");
  const [importeFijo, setImporteFijo] = useState(actual?.importe_fijo ?? "");
  const [tarifa, setTarifa] = useState(actual?.tarifa ?? "");
  const [porTipo, setPorTipo] = useState<Record<string, string>>(
    Object.fromEntries(actual?.importes_por_tipo.map((i) => [i.tipo_departamento_id, i.importe]) ?? [])
  );
  const [deptos, setDeptos] = useState<Record<string, ParamDepto>>(
    Object.fromEntries(actual?.departamentos.map((d) => [d.departamento_id, { excluido: d.excluido, porcentaje: d.porcentaje ?? "" }]) ?? [])
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const departamentos = useQuery({ queryKey: ["departamentos", "todos", true], queryFn: () => listarTodosDepartamentos(true) });
  const tipos = useQuery({ queryKey: clavesTipos.lista, queryFn: listarTipos, enabled: metodo === "por_tipo" });

  const param = (id: string): ParamDepto => deptos[id] ?? { excluido: false, porcentaje: "" };
  const fijar = (id: string, cambio: Partial<ParamDepto>) => setDeptos((prev) => ({ ...prev, [id]: { ...param(id), ...cambio } }));

  // Suma orientativa; el backend valida que sea 100 al validar o preparar.
  const suma =
    metodo === "porcentaje_individual"
      ? (departamentos.data ?? [])
          .filter((d) => !param(d.id).excluido)
          .reduce((s, d) => s + (Number(param(d.id).porcentaje) || 0), 0)
      : null;

  const guardar = useMutation({
    mutationFn: () =>
      configurarConcepto(periodoId, concepto.id, {
        metodo,
        base: usaBase(metodo) ? base : null,
        importe_fijo: metodo === "importe_fijo" ? importeFijo.trim() : null,
        tarifa: metodo === "consumo_tarifa" ? tarifa.trim() : null,
        importes_por_tipo:
          metodo === "por_tipo"
            ? Object.entries(porTipo)
                .filter(([, v]) => v.trim())
                .map(([tipo_departamento_id, importe]) => ({ tipo_departamento_id, importe: importe.trim() }))
            : [],
        departamentos: Object.entries(deptos)
          .filter(([, p]) => p.excluido || (metodo === "porcentaje_individual" && p.porcentaje.trim()))
          .map(([departamento_id, p]) => ({
            departamento_id,
            excluido: p.excluido,
            porcentaje: !p.excluido && metodo === "porcentaje_individual" ? p.porcentaje.trim() : null,
          })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clavesPeriodos.configuracion(periodoId) });
      qc.invalidateQueries({ queryKey: clavesPeriodos.validacion(periodoId) });
      toast.success(`Concepto ${concepto.codigo} configurado.`);
      onCerrar();
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo guardar la configuración."));
    },
  });

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      ancho="lg"
      titulo={`Configurar ${concepto.codigo} · ${concepto.nombre}`}
      descripcion="Guardar sustituye toda la configuración del concepto en este periodo."
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        guardar.mutate();
      }}
      pie={
        <>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={guardar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardar.isPending}>
            Guardar configuración
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="metodo" label="Método de distribución" error={errores.metodo}>
          <Select id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as Metodo)}>
            {Object.entries(NOMBRE_METODO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Campo>
        {usaBase(metodo) && (
          <Campo id="base" label="Base de cálculo" error={errores.base}>
            <Select id="base" value={base} onChange={(e) => setBase(e.target.value as Base)}>
              {Object.entries(NOMBRE_BASE).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Campo>
        )}
        {metodo === "importe_fijo" && (
          <Campo id="importe_fijo" label="Importe fijo por departamento (S/)" error={errores.importe_fijo}>
            <Input id="importe_fijo" inputMode="decimal" value={importeFijo} onChange={(e) => setImporteFijo(e.target.value)} />
          </Campo>
        )}
        {metodo === "consumo_tarifa" && (
          <Campo id="tarifa" label={`Tarifa por ${concepto.unidad_consumo ?? "unidad"} (S/)`} error={errores.tarifa}>
            <Input id="tarifa" inputMode="decimal" value={tarifa} onChange={(e) => setTarifa(e.target.value)} />
          </Campo>
        )}
      </div>

      {metodo === "por_tipo" && (
        <Campo label="Importe por tipo de departamento (S/)" error={errores.importes_por_tipo}>
          {tipos.data?.length === 0 && <p className="text-[13px] text-gray-500">No hay tipos de departamento. Créelos en «Tipos de departamento».</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {tipos.data?.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <span className="w-32 truncate text-gray-700">{t.nombre}</span>
                <Input inputMode="decimal" value={porTipo[t.id] ?? ""} onChange={(e) => setPorTipo((p) => ({ ...p, [t.id]: e.target.value }))} />
              </label>
            ))}
          </div>
        </Campo>
      )}

      <Campo
        label={metodo === "porcentaje_individual" ? "Porcentaje y exclusiones por departamento" : "Departamentos excluidos"}
        error={errores.departamentos}
        ayuda={metodo.startsWith("consumo") ? "Las lecturas de consumo se cargan aparte, desde la configuración del periodo." : undefined}
      >
        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
          {departamentos.isPending && <p className="px-3 py-2 text-[13px] text-gray-400">Cargando departamentos…</p>}
          {departamentos.data?.map((d) => {
            const p = param(d.id);
            return (
              <div key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-24 font-semibold text-gray-900">{d.codigo}</span>
                <label className="flex items-center gap-2 text-gray-600">
                  <Checkbox checked={p.excluido} onCheckedChange={(v) => fijar(d.id, { excluido: !!v })} /> Excluido
                </label>
                {metodo === "porcentaje_individual" && !p.excluido && (
                  <div className="ml-auto flex items-center gap-1 w-28">
                    <Input inputMode="decimal" value={p.porcentaje} onChange={(e) => fijar(d.id, { porcentaje: e.target.value })} className="h-8" />
                    <span className="text-gray-400">%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {suma !== null && <p className="text-[12px] text-gray-500">Suma orientativa: {suma.toFixed(2)} % (debe ser 100).</p>}
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
