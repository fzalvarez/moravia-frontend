import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { Encabezado, Etiqueta, Pestanas, Tarjeta } from "@/shared/components/app/Pagina";
import { Paginador, Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { nulo } from "@/shared/lib/formularios";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import {
  actualizarCategoria,
  actualizarProveedor,
  cambiarEstadoProveedor,
  clavesProveedores,
  crearCategoria,
  crearProveedor,
  listarCategorias,
  listarProveedores,
  type Categoria,
  type Proveedor,
} from "../services/proveedores.service";

type Vista = "proveedores" | "categorias";

export default function ProveedoresPage() {
  const [vista, setVista] = useState<Vista>("proveedores");
  return (
    <>
      <Encabezado titulo="Proveedores" descripcion="Proveedores y categorías para clasificar los gastos." />
      <Pestanas
        valor={vista}
        onChange={setVista}
        opciones={[
          { valor: "proveedores", label: "Proveedores" },
          { valor: "categorias", label: "Categorías de gasto" },
        ]}
      />
      {vista === "proveedores" ? <ListaProveedores /> : <ListaCategorias />}
    </>
  );
}

function ListaProveedores() {
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("gastos.gestionar");
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState("si");
  const [offset, setOffset] = useState(0);
  const [editar, setEditar] = useState<{ proveedor: Proveedor | null } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(texto.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [texto]);
  const filtro = { q, activo: activo === "todos" ? undefined : activo === "si", offset, limit: 50 };
  const lista = useQuery({ queryKey: clavesProveedores.lista(filtro), queryFn: () => listarProveedores(filtro), placeholderData: keepPreviousData });
  const estado = useMutation({
    mutationFn: (p: Proveedor) => cambiarEstadoProveedor(p.id, !p.activo),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: clavesProveedores.todos });
      toast.success(p.activo ? "Proveedor reactivado." : "Proveedor desactivado.");
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "No se pudo cambiar el estado.")),
  });

  return (
    <Tarjeta
      acciones={
        gestionar && (
          <Button size="sm" onClick={() => setEditar({ proveedor: null })}>
            <PlusIcon className="size-4" /> Nuevo proveedor
          </Button>
        )
      }
      titulo="Proveedores"
    >
      <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre o documento" className="pl-9" />
        </div>
        <Select value={activo} onChange={(e) => (setActivo(e.target.value), setOffset(0))} className="w-40">
          <option value="si">Activos</option>
          <option value="no">Desactivados</option>
          <option value="todos">Todos</option>
        </Select>
      </div>
      <Tabla
        columnas={[
          { titulo: "Nombre", celda: (p) => <span className="font-semibold text-gray-900">{p.nombre}</span> },
          { titulo: "Documento", celda: (p) => (p.numero_documento ? `${p.tipo_documento} ${p.numero_documento}` : "—") },
          { titulo: "Contacto", celda: (p) => [p.telefono, p.correo].filter(Boolean).join(" · ") || "—" },
          { titulo: "Estado", celda: (p) => (p.activo ? <Etiqueta tono="verde">Activo</Etiqueta> : <Etiqueta>Desactivado</Etiqueta>) },
          ...(gestionar
            ? [
                {
                  titulo: "",
                  className: "text-right whitespace-nowrap",
                  celda: (p: Proveedor) => (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditar({ proveedor: p })}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => estado.mutate(p)} disabled={estado.isPending}>
                        {p.activo ? "Desactivar" : "Reactivar"}
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        filas={lista.data?.items}
        clave={(p) => p.id}
        cargando={lista.isPending}
        error={lista.error}
        vacio="No hay proveedores."
        pie={lista.data && <Paginador {...lista.data} onOffset={setOffset} />}
      />
      {editar && <FormularioProveedor proveedor={editar.proveedor} onCerrar={() => setEditar(null)} />}
    </Tarjeta>
  );
}

function FormularioProveedor({ proveedor, onCerrar }: { proveedor: Proveedor | null; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    nombre: proveedor?.nombre ?? "",
    tipo_documento: proveedor?.tipo_documento ?? "",
    numero_documento: proveedor?.numero_documento ?? "",
    telefono: proveedor?.telefono ?? "",
    correo: proveedor?.correo ?? "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const guardar = useMutation({
    mutationFn: () => {
      const d = {
        nombre: v.nombre.trim(),
        tipo_documento: nulo(v.tipo_documento),
        numero_documento: nulo(v.numero_documento),
        telefono: nulo(v.telefono),
        correo: nulo(v.correo),
      };
      return proveedor ? actualizarProveedor(proveedor.id, d) : crearProveedor(d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clavesProveedores.todos });
      toast.success("Proveedor guardado.");
      onCerrar();
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo guardar el proveedor."));
    },
  });
  const campo = (k: keyof typeof v, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Campo id={k} label={label} error={errores[k]}>
      <Input id={k} value={v[k]} onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))} aria-invalid={!!errores[k]} {...props} />
    </Campo>
  );
  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={proveedor ? "Editar proveedor" : "Nuevo proveedor"}
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.nombre.trim()) return setErrores({ nombre: "Requerido" });
        if (!v.tipo_documento.trim() !== !v.numero_documento.trim()) return setErrores({ numero_documento: "Indique tipo y número, o ninguno" });
        setErrores({});
        setError(null);
        guardar.mutate();
      }}
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
      {campo("nombre", "Nombre o razón social", { autoFocus: true })}
      <div className="grid gap-4 sm:grid-cols-2">
        {campo("tipo_documento", "Tipo de documento", { placeholder: "RUC, DNI…" })}
        {campo("numero_documento", "Número de documento")}
        {campo("telefono", "Teléfono", { inputMode: "tel" })}
        {campo("correo", "Correo", { type: "email" })}
      </div>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}

function ListaCategorias() {
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("gastos.gestionar");
  const categorias = useQuery({ queryKey: clavesProveedores.categorias, queryFn: listarCategorias });
  const [editar, setEditar] = useState<{ categoria: Categoria | null } | null>(null);
  const estado = useMutation({
    mutationFn: (c: Categoria) => actualizarCategoria(c.id, { activo: !c.activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: clavesProveedores.categorias }),
    onError: (e) => toast.error(getApiErrorMessage(e, "No se pudo cambiar el estado.")),
  });
  return (
    <Tarjeta
      titulo="Categorías de gasto"
      acciones={
        gestionar && (
          <Button size="sm" onClick={() => setEditar({ categoria: null })}>
            <PlusIcon className="size-4" /> Nueva categoría
          </Button>
        )
      }
    >
      <Tabla
        columnas={[
          { titulo: "Código", celda: (c) => <span className="font-semibold text-gray-900">{c.codigo}</span> },
          { titulo: "Nombre", celda: (c) => c.nombre },
          { titulo: "Estado", celda: (c) => (c.activo ? <Etiqueta tono="verde">Activa</Etiqueta> : <Etiqueta>Desactivada</Etiqueta>) },
          ...(gestionar
            ? [
                {
                  titulo: "",
                  className: "text-right whitespace-nowrap",
                  celda: (c: Categoria) => (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditar({ categoria: c })}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => estado.mutate(c)} disabled={estado.isPending}>
                        {c.activo ? "Desactivar" : "Reactivar"}
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        filas={categorias.data}
        clave={(c) => c.id}
        cargando={categorias.isPending}
        error={categorias.error}
        vacio="No hay categorías."
      />
      {editar && <FormularioCategoria categoria={editar.categoria} onCerrar={() => setEditar(null)} />}
    </Tarjeta>
  );
}

function FormularioCategoria({ categoria, onCerrar }: { categoria: Categoria | null; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState(categoria?.codigo ?? "");
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const guardar = useMutation({
    mutationFn: () => {
      const d = { codigo: codigo.trim(), nombre: nombre.trim() };
      return categoria ? actualizarCategoria(categoria.id, d) : crearCategoria(d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clavesProveedores.categorias });
      toast.success("Categoría guardada.");
      onCerrar();
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo guardar la categoría."));
    },
  });
  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={categoria ? "Editar categoría" : "Nueva categoría"}
      ancho="sm"
      onSubmit={(e) => {
        e.preventDefault();
        const loc: Record<string, string> = {};
        if (!codigo.trim()) loc.codigo = "Requerido";
        if (!nombre.trim()) loc.nombre = "Requerido";
        setErrores(loc);
        if (Object.keys(loc).length) return;
        setError(null);
        guardar.mutate();
      }}
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
      <Campo id="codigo" label="Código" error={errores.codigo}>
        <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus />
      </Campo>
      <Campo id="nombre" label="Nombre" error={errores.nombre}>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
