import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { Campo, Select } from "@/shared/components/app/Formulario";
import { Etiqueta } from "@/shared/components/app/Pagina";
import { ErrorConsulta } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { actualizarEstructura, clavesEstructura, getEstructura, NOMBRE_NOMENCLATURA, type Estructura, type Nomenclatura } from "../services/estructura.service";
import { AsistenteEstructura } from "../components/AsistenteEstructura";
import { GestorEstructura } from "../components/GestorEstructura";

/** Estructura inmobiliaria (D-061, referencia 001). */
export default function EstructuraPage() {
  const editable = usePermisos().puede("departamentos.gestionar");
  const estructura = useQuery({ queryKey: clavesEstructura.estructura, queryFn: getEstructura });
  const [editar, setEditar] = useState(false);
  const e = estructura.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Configuración <span className="mx-1">/</span> <span className="text-brand-600">Estructura</span>
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            {e?.nombre || "Estructura inmobiliaria"}
            {e && <Etiqueta tono="azul">{e.tipo === "edificio" ? "Edificio" : "Condominio"}</Etiqueta>}
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl mt-1">
            {e
              ? "Torres, pisos y departamentos de cada piso. Agregue o quite pisos y cree los departamentos donde corresponda."
              : "Defina si la instancia es un edificio o un condominio de torres, y cuántos pisos tiene cada uno."}
          </p>
        </div>
        {e && editable && (
          <Button variant="outline" onClick={() => setEditar(true)}>
            <PencilIcon className="size-4" /> Nombre y nomenclatura
          </Button>
        )}
      </div>

      {estructura.isPending ? (
        <TableStateBlock variant="loading" />
      ) : estructura.isError ? (
        <ErrorConsulta error={estructura.error} />
      ) : e ? (
        <GestorEstructura estructura={e} editable={editable} />
      ) : (
        <AsistenteEstructura editable={editable} />
      )}
      {editar && e && <EditarDatos estructura={e} onCerrar={() => setEditar(false)} />}
    </div>
  );
}

function EditarDatos({ estructura, onCerrar }: { estructura: Estructura; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState(estructura.nombre ?? "");
  const [nomenclatura, setNomenclatura] = useState<Nomenclatura | null>(estructura.nomenclatura);
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo="Nombre y nomenclatura"
      descripcion="El tipo de predio no cambia. La nomenclatura solo afecta los nombres sugeridos de torres nuevas."
      confirmar="Guardar"
      onConfirmar={async () => {
        qc.setQueryData(clavesEstructura.estructura, await actualizarEstructura({ nombre: nombre.trim() || null, ...(nomenclatura ? { nomenclatura } : {}) }));
        toast.success("Estructura actualizada.");
      }}
    >
      <Campo id="nombre" label="Nombre de la propiedad">
        <Input id="nombre" value={nombre} onChange={(ev) => setNombre(ev.target.value)} autoFocus />
      </Campo>
      {nomenclatura && (
        <Campo id="nomenclatura" label="Identificador de torres">
          <Select id="nomenclatura" value={nomenclatura} onChange={(ev) => setNomenclatura(ev.target.value as Nomenclatura)}>
            {Object.entries(NOMBRE_NOMENCLATURA).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Campo>
      )}
    </Confirmar>
  );
}
