import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { Paginador, Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { aplicarErroresApi } from "@/shared/lib/formularios";
import { requerido } from "@/shared/lib/validacion";
import { clavesTipos, listarTipos } from "@/features/configuracion/services/tipos.service";
import { clavesDepartamentos, crearDepartamento, listarDepartamentos } from "../services/departamentos.service";

type Activo = "todos" | "si" | "no";

export default function DepartamentosPage() {
  const navigate = useNavigate();
  const { puede } = usePermisos();
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState<Activo>("si");
  const [offset, setOffset] = useState(0);
  const [nuevo, setNuevo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(texto.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [texto]);

  const filtro = { q, activo: activo === "todos" ? undefined : activo === "si", offset, limit: 50 };
  const lista = useQuery({ queryKey: clavesDepartamentos.lista(filtro), queryFn: () => listarDepartamentos(filtro), placeholderData: keepPreviousData });
  const tipos = useQuery({ queryKey: clavesTipos.lista, queryFn: listarTipos, enabled: puede("finanzas.ver") });
  const nombreTipo = (id: string | null) => (id ? (tipos.data?.find((t) => t.id === id)?.nombre ?? "…") : "—");

  return (
    <>
      <Encabezado
        titulo="Departamentos"
        descripcion="Unidades del condominio con sus anexos, ocupantes y cuenta financiera."
        acciones={
          puede("departamentos.gestionar") && (
            <Button onClick={() => setNuevo(true)}>
              <PlusIcon className="size-4" /> Nuevo departamento
            </Button>
          )
        }
      />
      <Tarjeta>
        <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por código" className="pl-9" />
          </div>
          <Select
            value={activo}
            onChange={(e) => {
              setActivo(e.target.value as Activo);
              setOffset(0);
            }}
            className="w-44"
          >
            <option value="si">Activos</option>
            <option value="no">Desactivados</option>
            <option value="todos">Todos</option>
          </Select>
        </div>
        <Tabla
          columnas={[
            { titulo: "Código", celda: (d) => <span className="font-semibold text-gray-900">{d.codigo}</span> },
            { titulo: "Piso", celda: (d) => d.piso ?? "—" },
            ...(puede("finanzas.ver") ? [{ titulo: "Tipo", celda: (d: { tipo_departamento_id: string | null }) => nombreTipo(d.tipo_departamento_id) }] : []),
            { titulo: "Estado", celda: (d) => (d.activo ? <Etiqueta tono="verde">Activo</Etiqueta> : <Etiqueta tono="rojo">Desactivado</Etiqueta>) },
          ]}
          filas={lista.data?.items}
          clave={(d) => d.id}
          cargando={lista.isPending}
          error={lista.error}
          vacio={q ? "No hay departamentos con ese código." : "No hay departamentos."}
          onFila={(d) => navigate(`/departamentos/${d.id}`)}
          pie={lista.data && <Paginador {...lista.data} onOffset={setOffset} />}
        />
      </Tarjeta>
      <NuevoDepartamento abierto={nuevo} onCerrar={() => setNuevo(false)} onCreado={(id) => navigate(`/departamentos/${id}`)} />
    </>
  );
}

const esquema = z.object({
  codigo: requerido(20),
  piso: z.string().trim().regex(/^-?\d*$/, "Número entero"),
});
type Valores = z.infer<typeof esquema>;

function NuevoDepartamento({ abierto, onCerrar, onCreado }: { abierto: boolean; onCerrar: () => void; onCreado: (id: string) => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: { codigo: "", piso: "" } });
  const crear = useMutation({
    mutationFn: (v: Valores) => crearDepartamento({ codigo: v.codigo, piso: v.piso === "" ? null : Number(v.piso) }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: clavesDepartamentos.todos });
      form.reset();
      onCerrar();
      onCreado(d.id);
    },
    onError: (e) => setError(aplicarErroresApi(e, form.setError)),
  });
  const cerrar = () => {
    form.reset();
    setError(null);
    onCerrar();
  };
  const { errors } = form.formState;

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Nuevo departamento"
      ancho="sm"
      onSubmit={form.handleSubmit((v) => {
        setError(null);
        crear.mutate(v);
      })}
      pie={
        <>
          <Button type="button" variant="outline" onClick={cerrar} disabled={crear.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={crear.isPending}>
            Crear
          </Button>
        </>
      }
    >
      <Campo id="codigo" label="Código" error={errors.codigo?.message} ayuda="Hasta 20 caracteres; se guarda en mayúsculas.">
        <Input id="codigo" autoFocus aria-invalid={!!errors.codigo} {...form.register("codigo")} />
      </Campo>
      <Campo id="piso" label="Piso (opcional)" error={errors.piso?.message}>
        <Input id="piso" inputMode="numeric" aria-invalid={!!errors.piso} {...form.register("piso")} />
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
