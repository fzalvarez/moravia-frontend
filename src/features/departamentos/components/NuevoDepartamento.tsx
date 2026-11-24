import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { clavesEstructura, type Estructura } from "@/features/estructura/services/estructura.service";
import { crearDepartamento } from "../services/departamentos.service";

/** Alta de un departamento; con estructura definida se indica torre y piso (D-061). */
export function NuevoDepartamento({ estructura, onCerrar, onCreado }: { estructura: Estructura | null; onCerrar: () => void; onCreado: (id: string) => void }) {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState("");
  const [torreId, setTorreId] = useState(estructura?.torres[0]?.id ?? "");
  const [piso, setPiso] = useState(estructura ? "1" : "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const torre = estructura?.torres.find((t) => t.id === torreId);

  const crear = useMutation({
    mutationFn: () => crearDepartamento({ codigo: codigo.trim(), piso: piso === "" ? null : Number(piso), torre_id: estructura ? torreId : null }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["departamentos"] });
      qc.invalidateQueries({ queryKey: clavesEstructura.estructura });
      onCerrar();
      onCreado(d.id);
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo crear el departamento."));
    },
  });

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Nueva unidad"
      ancho="sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!codigo.trim()) return setErrores({ codigo: "Requerido" });
        if (piso !== "" && !/^-?\d+$/.test(piso)) return setErrores({ piso: "Número entero" });
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
      <Campo id="codigo" label="Código" error={errores.codigo} ayuda="Hasta 20 caracteres; se guarda en mayúsculas.">
        <Input id="codigo" autoFocus value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-invalid={!!errores.codigo} />
      </Campo>
      {estructura ? (
        <div className="grid grid-cols-2 gap-3">
          {estructura.tipo === "condominio" && (
            <Campo id="torre" label="Torre" error={errores.torre_id}>
              <Select id="torre" value={torreId} onChange={(e) => (setTorreId(e.target.value), setPiso("1"))}>
                {estructura.torres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
            </Campo>
          )}
          <Campo id="piso" label="Piso" error={errores.piso}>
            <Select id="piso" value={piso} onChange={(e) => setPiso(e.target.value)}>
              {Array.from({ length: torre?.pisos ?? 0 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Campo>
        </div>
      ) : (
        <Campo id="piso" label="Piso (opcional)" error={errores.piso} ayuda="Defina la estructura en «Estructura» para ubicarlo en torre y piso.">
          <Input id="piso" inputMode="numeric" value={piso} onChange={(e) => setPiso(e.target.value)} />
        </Campo>
      )}
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
