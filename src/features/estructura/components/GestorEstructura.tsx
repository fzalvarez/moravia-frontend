import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2Icon, MinusIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { Campo, Select } from "@/shared/components/app/Formulario";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import {
  actualizarDepartamento,
  crearDepartamento,
  eliminarDepartamento,
  listarTodosDepartamentos,
  type Departamento,
} from "@/features/departamentos/services/departamentos.service";
import {
  actualizarTorre,
  clavesEstructura,
  codigoSugerido,
  crearTorre,
  eliminarTorre,
  NOMBRE_NOMENCLATURA,
  nombreSugerido,
  type Estructura,
  type Torre,
} from "../services/estructura.service";
import { Dato, Titulo } from "./AsistenteEstructura";

const CLAVE_DEPTOS_ESTRUCTURA = ["departamentos", "todos", "estructura"] as const;

type Dialogo =
  | { tipo: "torre"; torre: Torre | null }
  | { tipo: "eliminar"; torre: Torre }
  | { tipo: "depto"; torre: Torre; piso: number }
  | { tipo: "asignar"; depto: Departamento }
  | { tipo: "acciones"; depto: Departamento }
  | { tipo: "eliminar-depto"; depto: Departamento }
  | null;

/** Torres, pisos y departamentos de una estructura ya definida (referencia 001). */
export function GestorEstructura({ estructura: e, editable }: { estructura: Estructura; editable: boolean }) {
  const qc = useQueryClient();
  const [torreId, setTorreId] = useState(e.torres[0]?.id ?? "");
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const navigate = useNavigate();
  const deptos = useQuery({ queryKey: CLAVE_DEPTOS_ESTRUCTURA, queryFn: () => listarTodosDepartamentos() });
  const torre = e.torres.find((t) => t.id === torreId) ?? e.torres[0];
  const condominio = e.tipo === "condominio";

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: clavesEstructura.estructura });
    qc.invalidateQueries({ queryKey: ["departamentos"] });
  };

  const pisos = useMutation({
    mutationFn: (n: number) => actualizarTorre(torre.id, { pisos: n }),
    onSuccess: refrescar,
    onError: (err) => toast.error(getApiErrorMessage(err, "No se pudo cambiar los pisos.")),
  });

  const deTorre = deptos.data?.filter((d) => d.torre_id === torre?.id) ?? [];
  const sinTorre = deptos.data?.filter((d) => !d.torre_id) ?? [];
  const totalPisos = e.torres.reduce((s, t) => s + t.pisos, 0);
  const totalDeptos = e.torres.reduce((s, t) => s + t.departamentos, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      <div className="lg:col-span-8 space-y-4">
        {condominio && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {e.torres.map((t) => {
              const activa = t.id === torre?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTorreId(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap shadow-theme-xs transition",
                    activa ? "bg-brand-500 text-white" : "bg-white text-gray-600 hover:bg-surface-container"
                  )}
                >
                  <Building2Icon className={cn("size-4", activa ? "text-white" : "text-gray-400")} />
                  <span className="text-left">
                    <span className="block text-[13px] font-bold leading-tight">Torre {t.nombre}</span>
                    <span className={cn("block text-[11px] leading-tight", activa ? "text-brand-100" : "text-gray-400")}>
                      {t.pisos} pisos · {t.departamentos} deptos
                    </span>
                  </span>
                </button>
              );
            })}
            {editable && (
              <Button variant="secondary" onClick={() => setDialogo({ tipo: "torre", torre: null })}>
                <PlusIcon className="size-4" /> Agregar torre
              </Button>
            )}
          </div>
        )}

        {torre && (
          <div className="bg-white rounded-2xl px-5 py-4 shadow-theme-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-gray-900">{condominio ? `Torre ${torre.nombre}` : e.nombre || "Edificio"}</p>
              <p className="text-[12px] text-gray-500">
                {torre.pisos} pisos · {torre.departamentos} departamentos
              </p>
            </div>
            {editable && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl bg-surface-container p-1">
                  <Button size="sm" variant="ghost" onClick={() => pisos.mutate(torre.pisos - 1)} disabled={torre.pisos <= 1 || pisos.isPending}>
                    <MinusIcon className="size-3.5" /> Quitar piso
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => pisos.mutate(torre.pisos + 1)} disabled={pisos.isPending}>
                    <PlusIcon className="size-3.5" /> Añadir piso
                  </Button>
                </div>
                {condominio && (
                  <>
                    <Button size="icon-sm" variant="ghost" onClick={() => setDialogo({ tipo: "torre", torre })} aria-label="Editar torre">
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setDialogo({ tipo: "eliminar", torre })} aria-label="Eliminar torre" disabled={e.torres.length <= 1}>
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {torre &&
          Array.from({ length: torre.pisos }, (_, i) => torre.pisos - i).map((piso) => {
            const enPiso = deTorre.filter((d) => d.piso === piso).sort((a, b) => a.codigo.localeCompare(b.codigo));
            return (
              <div key={piso} className="relative overflow-hidden bg-white rounded-2xl shadow-theme-xs px-5 py-3.5">
                <span className={cn("absolute left-0 top-0 bottom-0 w-1", enPiso.length ? "bg-brand-500" : "bg-gray-200")} />
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold", enPiso.length ? "bg-brand-50 text-brand-700" : "bg-surface-container text-gray-400")}>
                    {piso}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900">Piso {piso}</p>
                    <p className="text-[11px] text-gray-400">{enPiso.length ? `${enPiso.length} departamento${enPiso.length === 1 ? "" : "s"}` : "Sin departamentos"}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {enPiso.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => (editable ? setDialogo({ tipo: "acciones", depto: d }) : navigate(`/departamentos/${d.id}`))}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[12px] font-bold transition",
                          d.activo ? "bg-surface-container text-gray-800 hover:bg-brand-50 hover:text-brand-700" : "bg-gray-50 text-gray-400 line-through"
                        )}
                      >
                        {d.codigo}
                      </button>
                    ))}
                  </div>
                  {editable && (
                    <Button size="sm" variant="secondary" onClick={() => setDialogo({ tipo: "depto", torre, piso })}>
                      <PlusIcon className="size-3.5" /> Depto
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-theme-xs space-y-4">
          <h3 className="font-bold text-gray-900">Balance estructural</h3>
          <div className="grid grid-cols-2 gap-2">
            {condominio && <Dato label="Torres" valor={e.torres.length} />}
            <Dato label="Pisos totales" valor={totalPisos} />
            <Dato label="Departamentos" valor={totalDeptos} tono="brand" />
            <Dato label="Sin ubicar" valor={e.sin_torre} tono={e.sin_torre ? "warning" : "success"} />
          </div>
          <div className="text-[12px] text-gray-500 space-y-1">
            <p>
              Tipo: <strong className="text-gray-800">{condominio ? "Condominio de torres" : "Edificio"}</strong>
            </p>
            {e.nomenclatura && (
              <p>
                Torres: <strong className="text-gray-800">{NOMBRE_NOMENCLATURA[e.nomenclatura]}</strong>
              </p>
            )}
          </div>
        </div>

        {sinTorre.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-theme-xs space-y-3">
            <Titulo texto="Departamentos sin ubicar" />
            <p className="text-[12px] text-gray-500">Registrados antes de definir la estructura. Asigne su torre y piso.</p>
            <div className="flex flex-wrap gap-1.5">
              {sinTorre.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={!editable}
                  onClick={() => setDialogo({ tipo: "asignar", depto: d })}
                  className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-warning-50 text-warning-800 hover:bg-warning-100 disabled:opacity-60"
                >
                  {d.codigo}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {dialogo?.tipo === "torre" && (
        <TorreDialogo
          estructura={e}
          torre={dialogo.torre}
          onCerrar={() => setDialogo(null)}
          onHecho={(t) => {
            refrescar();
            setTorreId(t.id);
          }}
        />
      )}
      {dialogo?.tipo === "eliminar" && (
        <Confirmar
          abierto
          onCerrar={() => setDialogo(null)}
          titulo={`Eliminar torre ${dialogo.torre.nombre}`}
          descripcion="Solo se puede eliminar una torre sin departamentos."
          confirmar="Eliminar"
          peligro
          onConfirmar={async () => {
            await eliminarTorre(dialogo.torre.id);
            setTorreId(e.torres.find((t) => t.id !== dialogo.torre.id)?.id ?? "");
            refrescar();
            toast.success("Torre eliminada.");
          }}
        />
      )}
      {dialogo?.tipo === "depto" && (
        <NuevoEnPiso
          estructura={e}
          torre={dialogo.torre}
          piso={dialogo.piso}
          existentes={deptos.data?.map((d) => d.codigo) ?? []}
          onCerrar={() => setDialogo(null)}
          onHecho={refrescar}
        />
      )}
      {dialogo?.tipo === "acciones" && (
        <Confirmar
          abierto
          onCerrar={() => setDialogo(null)}
          titulo={`Departamento ${dialogo.depto.codigo}`}
          descripcion={`${condominio ? `Torre ${torre?.nombre} · ` : ""}Piso ${dialogo.depto.piso}${dialogo.depto.activo ? "" : " · desactivado"}`}
          confirmar="Abrir ficha"
          onConfirmar={async () => navigate(`/departamentos/${dialogo.depto.id}`)}
        >
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDialogo({ tipo: "asignar", depto: dialogo.depto })} disabled={!dialogo.depto.activo}>
              Mover de piso o torre
            </Button>
            <Button variant="outline" className="text-error-600" onClick={() => setDialogo({ tipo: "eliminar-depto", depto: dialogo.depto })}>
              <Trash2Icon className="size-3.5" /> Eliminar
            </Button>
          </div>
        </Confirmar>
      )}
      {dialogo?.tipo === "eliminar-depto" && (
        <Confirmar
          abierto
          onCerrar={() => setDialogo(null)}
          titulo={`Eliminar ${dialogo.depto.codigo}`}
          descripcion="Solo para corregir un alta errónea: se borra con sus estacionamientos y depósitos. Con ocupantes, cuenta de acceso, liquidaciones, pagos u otro historial no se puede eliminar; en ese caso desactívelo o muévalo a otra torre."
          confirmar="Eliminar definitivamente"
          peligro
          onConfirmar={async () => {
            await eliminarDepartamento(dialogo.depto.id);
            refrescar();
            toast.success(`Departamento ${dialogo.depto.codigo} eliminado.`);
          }}
        />
      )}
      {dialogo?.tipo === "asignar" && <Asignar estructura={e} depto={dialogo.depto} onCerrar={() => setDialogo(null)} onHecho={refrescar} />}
    </div>
  );
}

function TorreDialogo({ estructura, torre, onCerrar, onHecho }: { estructura: Estructura; torre: Torre | null; onCerrar: () => void; onHecho: (t: Torre) => void }) {
  const [nombre, setNombre] = useState(torre?.nombre ?? nombreSugerido(estructura.nomenclatura ?? "letras", estructura.torres.length));
  const [pisos, setPisos] = useState(String(torre?.pisos ?? estructura.torres.at(-1)?.pisos ?? 10));
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={torre ? `Editar torre ${torre.nombre}` : "Agregar torre"}
      confirmar="Guardar"
      deshabilitado={!nombre.trim() || !/^\d+$/.test(pisos)}
      onConfirmar={async () => {
        const t = torre ? await actualizarTorre(torre.id, { nombre: nombre.trim(), pisos: Number(pisos) }) : await crearTorre(nombre.trim(), Number(pisos));
        onHecho(t);
        toast.success(torre ? "Torre actualizada." : "Torre agregada.");
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        <Campo id="nombre" label="Nombre" className="col-span-2">
          <Input id="nombre" value={nombre} onChange={(ev) => setNombre(ev.target.value)} autoFocus />
        </Campo>
        <Campo id="pisos" label="Pisos">
          <Input id="pisos" inputMode="numeric" value={pisos} onChange={(ev) => setPisos(ev.target.value)} />
        </Campo>
      </div>
    </Confirmar>
  );
}

function NuevoEnPiso({ estructura, torre, piso, existentes, onCerrar, onHecho }: { estructura: Estructura; torre: Torre; piso: number; existentes: string[]; onCerrar: () => void; onHecho: () => void }) {
  const [codigo, setCodigo] = useState(codigoSugerido(estructura, torre, piso, existentes));
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={`Nuevo departamento · ${estructura.tipo === "condominio" ? `Torre ${torre.nombre} · ` : ""}Piso ${piso}`}
      descripcion="El código es libre y único; la sugerencia se puede cambiar."
      confirmar="Crear departamento"
      deshabilitado={!codigo.trim()}
      onConfirmar={async () => {
        await crearDepartamento({ codigo: codigo.trim(), piso, torre_id: torre.id });
        onHecho();
        toast.success(`Departamento ${codigo.trim().toUpperCase()} creado.`);
      }}
    >
      <Campo id="codigo" label="Código">
        <Input id="codigo" value={codigo} onChange={(ev) => setCodigo(ev.target.value)} autoFocus />
      </Campo>
    </Confirmar>
  );
}

function Asignar({ estructura, depto, onCerrar, onHecho }: { estructura: Estructura; depto: Departamento; onCerrar: () => void; onHecho: () => void }) {
  const [torreId, setTorreId] = useState(depto.torre_id ?? estructura.torres[0]?.id ?? "");
  const torre = estructura.torres.find((t) => t.id === torreId);
  const [piso, setPiso] = useState(String(depto.piso && torre && depto.piso <= torre.pisos && depto.piso >= 1 ? depto.piso : 1));
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={depto.torre_id ? `Mover ${depto.codigo}` : `Ubicar ${depto.codigo}`}
      confirmar="Guardar"
      deshabilitado={!torre || !piso}
      onConfirmar={async () => {
        await actualizarDepartamento(depto.id, { torre_id: torreId, piso: Number(piso) });
        onHecho();
        toast.success(`${depto.codigo} ubicado.`);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {estructura.tipo === "condominio" && (
          <Campo id="torre" label="Torre">
            <Select id="torre" value={torreId} onChange={(ev) => setTorreId(ev.target.value)}>
              {estructura.torres.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          </Campo>
        )}
        <Campo id="piso" label="Piso">
          <Select id="piso" value={piso} onChange={(ev) => setPiso(ev.target.value)}>
            {Array.from({ length: torre?.pisos ?? 0 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Campo>
      </div>
    </Confirmar>
  );
}
