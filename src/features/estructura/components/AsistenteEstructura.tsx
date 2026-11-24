import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2Icon, Building, CheckIcon, MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { cn } from "@/lib/utils";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import {
  clavesEstructura,
  crearEstructura,
  NOMBRE_NOMENCLATURA,
  nombreSugerido,
  type Nomenclatura,
  type TipoEstructura,
} from "../services/estructura.service";

type FilaTorre = { nombre: string; pisos: string };

const TIPOS: { valor: TipoEstructura; titulo: string; texto: string; icono: typeof Building2Icon }[] = [
  { valor: "edificio", titulo: "Edificio", texto: "Un solo edificio. Se indican sus pisos y en cada piso se agregan departamentos.", icono: Building },
  { valor: "condominio", titulo: "Condominio de torres", texto: "Varias torres con administración común. Cada torre tiene su propia cantidad de pisos.", icono: Building2Icon },
];

/** Definición inicial de la estructura (D-061): se hace una sola vez. */
export function AsistenteEstructura({ editable }: { editable: boolean }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<TipoEstructura>("edificio");
  const [nombre, setNombre] = useState("");
  const [pisos, setPisos] = useState("10");
  const [nomenclatura, setNomenclatura] = useState<Nomenclatura>("letras");
  const [torres, setTorres] = useState<FilaTorre[]>([
    { nombre: "A", pisos: "10" },
    { nombre: "B", pisos: "10" },
  ]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const renombrar = (n: Nomenclatura) => {
    setNomenclatura(n);
    setTorres((ts) => ts.map((t, i) => ({ ...t, nombre: nombreSugerido(n, i) })));
  };
  const cantidad = (n: number) =>
    setTorres((ts) => (n > ts.length ? [...ts, ...Array.from({ length: n - ts.length }, (_, i) => ({ nombre: nombreSugerido(nomenclatura, ts.length + i), pisos: ts.at(-1)?.pisos ?? "10" }))] : ts.slice(0, Math.max(n, 1))));
  const fijar = (i: number, cambio: Partial<FilaTorre>) => setTorres((ts) => ts.map((t, j) => (j === i ? { ...t, ...cambio } : t)));

  const totalPisos = tipo === "edificio" ? Number(pisos) || 0 : torres.reduce((s, t) => s + (Number(t.pisos) || 0), 0);

  const crear = useMutation({
    mutationFn: () =>
      crearEstructura(
        tipo === "edificio"
          ? { tipo, nombre: nombre.trim() || null, pisos: Number(pisos), torres: [] }
          : { tipo, nombre: nombre.trim() || null, nomenclatura, torres: torres.map((t) => ({ nombre: t.nombre.trim(), pisos: Number(t.pisos) })) }
      ),
    onSuccess: (e) => {
      qc.setQueryData(clavesEstructura.estructura, e);
      toast.success("Estructura creada. Ya puede agregar departamentos en cada piso.");
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo crear la estructura."));
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      <div className="lg:col-span-8 space-y-6">
        <section className="bg-white rounded-2xl p-6 shadow-theme-xs space-y-4">
          <Titulo n={1} texto="Tipo de predio" />
          <div className="grid gap-3 md:grid-cols-2">
            {TIPOS.map(({ valor, titulo, texto, icono: Icono }) => {
              const activo = tipo === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setTipo(valor)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-4 text-left transition",
                    activo ? "bg-brand-50 ring-1 ring-brand-200" : "bg-surface-container hover:bg-surface-high opacity-80 hover:opacity-100"
                  )}
                >
                  <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", activo ? "bg-brand-500 text-white" : "bg-white text-gray-400")}>
                    <Icono className="size-5" />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between">
                      <span className={cn("text-sm font-bold", activo ? "text-brand-700" : "text-gray-800")}>{titulo}</span>
                      {activo && (
                        <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center">
                          <CheckIcon className="size-3" />
                        </span>
                      )}
                    </span>
                    <span className="block text-[12px] text-gray-500 mt-1">{texto}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-theme-xs space-y-4">
          <Titulo n={2} texto={tipo === "edificio" ? "Datos del edificio" : "Torres y pisos"} />
          <div className="grid gap-4 md:grid-cols-3">
            <Campo id="nombre" label="Nombre de la propiedad (opcional)" className="md:col-span-2">
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Residencial Moravia" />
            </Campo>
            {tipo === "edificio" ? (
              <Campo id="pisos" label="Pisos" error={errores.pisos}>
                <Input id="pisos" inputMode="numeric" value={pisos} onChange={(e) => setPisos(e.target.value)} />
              </Campo>
            ) : (
              <Campo id="nomenclatura" label="Identificador de torres" error={errores.nomenclatura}>
                <Select id="nomenclatura" value={nomenclatura} onChange={(e) => renombrar(e.target.value as Nomenclatura)}>
                  {Object.entries(NOMBRE_NOMENCLATURA).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Campo>
            )}
          </div>

          {tipo === "condominio" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-semibold text-gray-700">Cantidad de torres</span>
                <div className="flex items-center gap-1 rounded-xl bg-surface-container p-1">
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => cantidad(torres.length - 1)} aria-label="Quitar torre">
                    <MinusIcon className="size-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900">{torres.length}</span>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => cantidad(torres.length + 1)} aria-label="Agregar torre">
                    <PlusIcon className="size-3.5" />
                  </Button>
                </div>
                <span className="text-[12px] text-gray-400">Cada torre puede tener distinta cantidad de pisos.</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {torres.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2">
                    <span className="text-[11px] font-bold uppercase text-gray-400 w-10">Torre</span>
                    <Input className="h-8" value={t.nombre} onChange={(e) => fijar(i, { nombre: e.target.value })} aria-label={`Nombre de la torre ${i + 1}`} />
                    <Input className="h-8 w-16" inputMode="numeric" value={t.pisos} onChange={(e) => fijar(i, { pisos: e.target.value })} aria-label={`Pisos de la torre ${i + 1}`} />
                    <span className="text-[11px] text-gray-400">pisos</span>
                  </div>
                ))}
              </div>
              {Object.entries(errores)
                .filter(([k]) => k.startsWith("torres"))
                .map(([k, m]) => (
                  <p key={k} className="text-[13px] text-error-600">
                    Torre {Number(k.split(".")[1]) + 1}: {m}
                  </p>
                ))}
            </div>
          )}
        </section>
      </div>

      <aside className="lg:col-span-4 lg:sticky lg:top-20 bg-white rounded-2xl p-6 shadow-theme-xs space-y-4">
        <h3 className="font-bold text-gray-900">Resumen</h3>
        <div className="grid grid-cols-2 gap-2">
          <Dato label="Tipo" valor={tipo === "edificio" ? "Edificio" : "Condominio"} />
          <Dato label={tipo === "edificio" ? "Pisos" : "Torres"} valor={tipo === "edificio" ? totalPisos : torres.length} />
          {tipo === "condominio" && <Dato label="Pisos totales" valor={totalPisos} />}
        </div>
        <p className="text-[12px] text-gray-500">
          El tipo de predio se define una sola vez. Después podrá {tipo === "condominio" ? "agregar torres, " : ""}agregar o quitar pisos y crear los departamentos de cada piso.
        </p>
        <ErrorFormulario mensaje={error} />
        <Button
          className="w-full"
          disabled={!editable}
          loading={crear.isPending}
          onClick={() => {
            setError(null);
            setErrores({});
            crear.mutate();
          }}
        >
          Crear estructura
        </Button>
        {!editable && <p className="text-[12px] text-gray-400">Solo el personal con permiso para gestionar departamentos puede definirla.</p>}
      </aside>
    </div>
  );
}

export function Titulo({ n, texto }: { n?: number; texto: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-brand-500" />
      <h2 className="text-[15px] font-bold text-gray-900">
        {n ? `${n}. ` : ""}
        {texto}
      </h2>
    </div>
  );
}

export function Dato({ label, valor, tono }: { label: string; valor: React.ReactNode; tono?: "brand" | "success" | "warning" }) {
  return (
    <div className="rounded-xl bg-surface-container px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={cn("text-xl font-bold", tono === "brand" ? "text-brand-600" : tono === "success" ? "text-success-600" : tono === "warning" ? "text-warning-600" : "text-gray-900")}>{valor}</p>
    </div>
  );
}
