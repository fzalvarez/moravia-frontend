import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { Campo, Select, Textarea } from "@/shared/components/app/Formulario";
import { Importe } from "@/shared/components/app/Importe";
import { Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFechaHora, nombrePeriodo } from "@/shared/lib/formato";
import { clavesPeriodos, getResumenLiquidaciones, listarPeriodos, NOMBRE_METODO, type Metodo } from "@/features/periodos/services/periodos.service";
import {
  cerrarPeriodo,
  clavesLiquidaciones,
  descartarBorradores,
  emitirLiquidaciones,
  listarLiquidacionesPeriodo,
  NOMBRE_ESTADO_LIQ,
  prepararLiquidaciones,
  reabrirPeriodo,
  TONO_LIQ,
  type EstadoLiquidacion,
} from "../services/liquidaciones.service";

type Accion = "preparar" | "descartar" | "emitir" | "cerrar" | "reabrir" | null;

export default function LiquidacionesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("finanzas.gestionar");
  const [params, setParams] = useSearchParams();
  const [estado, setEstado] = useState<EstadoLiquidacion | "">("");
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [accion, setAccion] = useState<Accion>(null);
  const [motivo, setMotivo] = useState("");

  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos });
  const orden = periodos.data ? [...periodos.data].sort((a, b) => b.anio - a.anio || b.mes - a.mes) : [];
  const periodoId = params.get("periodo") ?? (orden.find((p) => p.estado === "abierto") ?? orden[0])?.id ?? "";
  const periodo = orden.find((p) => p.id === periodoId);

  const resumen = useQuery({ queryKey: clavesPeriodos.resumen(periodoId), queryFn: () => getResumenLiquidaciones(periodoId), enabled: !!periodoId });
  const lista = useQuery({
    queryKey: clavesLiquidaciones.delPeriodo(periodoId, estado || undefined),
    queryFn: () => listarLiquidacionesPeriodo(periodoId, estado || undefined),
    enabled: !!periodoId,
  });

  const refrescar = () => {
    setSeleccion([]);
    qc.invalidateQueries({ queryKey: ["periodos"] });
  };
  const r = resumen.data;
  const abierto = periodo?.estado === "abierto";
  const borradores = lista.data?.filter((l) => l.estado === "borrador") ?? [];

  return (
    <>
      <Encabezado
        titulo="Liquidaciones"
        descripcion="Preparar borradores, revisar, emitir y cerrar el periodo. Solo la emisión genera deuda."
        acciones={
          <Select
            className="w-48"
            value={periodoId}
            onChange={(e) => {
              setParams({ periodo: e.target.value });
              setSeleccion([]);
            }}
          >
            {orden.map((p) => (
              <option key={p.id} value={p.id}>
                {nombrePeriodo(p.anio, p.mes)} {p.estado === "cerrado" ? "(cerrado)" : ""}
              </option>
            ))}
          </Select>
        }
      />
      {periodos.data?.length === 0 && <p className="text-sm text-gray-500">No hay periodos. Créelos en «Periodos y cuotas».</p>}

      {periodo && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Estado del periodo", valor: abierto ? <Etiqueta tono="verde">Abierto</Etiqueta> : <Etiqueta>Cerrado</Etiqueta> },
              { label: "Borradores", valor: r?.borradores ?? "…" },
              { label: "Emitidas", valor: r?.emitidas ?? "…" },
              { label: "Anuladas", valor: r?.anuladas ?? "…" },
              { label: "Total emitido", valor: r ? <Importe valor={r.total_emitido} /> : "…" },
            ].map((x) => (
              <div key={x.label} className="bg-white border border-gray-200/80 rounded-2xl px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{x.label}</p>
                <div className="text-lg font-bold text-gray-900">{x.valor}</div>
              </div>
            ))}
          </div>

          {r && r.pendientes_de_emitir.length > 0 && (
            <p className="text-[13px] text-warning-900 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3">
              Departamentos sin liquidación emitida: <strong>{r.pendientes_de_emitir.join(", ")}</strong>
            </p>
          )}

          {gestionar && (
            <div className="flex flex-wrap gap-2">
              {abierto && (
                <>
                  <Button onClick={() => setAccion("preparar")}>Preparar borradores</Button>
                  <Button variant="outline" onClick={() => setAccion("emitir")} disabled={!r?.borradores}>
                    {seleccion.length ? `Emitir ${seleccion.length} seleccionadas` : "Emitir todos los borradores"}
                  </Button>
                  <Button variant="outline" onClick={() => setAccion("descartar")} disabled={!r?.borradores}>
                    Descartar borradores
                  </Button>
                  <Button variant="outline" onClick={() => setAccion("cerrar")}>
                    Cerrar periodo
                  </Button>
                </>
              )}
              {!abierto && (
                <Button variant="outline" onClick={() => setAccion("reabrir")}>
                  Reabrir periodo
                </Button>
              )}
            </div>
          )}

          {r && r.conceptos.length > 0 && (
            <Tarjeta titulo="Por concepto">
              <Tabla
                columnas={[
                  { titulo: "Concepto", celda: (c) => <span className="font-semibold text-gray-900">{c.codigo}</span> },
                  { titulo: "Método", celda: (c) => NOMBRE_METODO[c.metodo as Metodo] ?? c.metodo },
                  { titulo: "Base", celda: (c) => <Importe valor={c.importe_base} />, className: "text-right" },
                  { titulo: "Distribuido", celda: (c) => <Importe valor={c.distribuido} />, className: "text-right" },
                  { titulo: "Descuadre", celda: (c) => <Importe valor={c.descuadre} />, className: "text-right" },
                ]}
                filas={r.conceptos}
                clave={(c) => c.concepto_id}
              />
              <p className="px-5 py-3 text-[12px] text-gray-400">Descuadre = base − suma redondeada. No se ajusta (D-036).</p>
            </Tarjeta>
          )}

          <Tarjeta
            titulo="Liquidaciones por departamento"
            acciones={
              <Select className="w-40" value={estado} onChange={(e) => (setEstado(e.target.value as EstadoLiquidacion | ""), setSeleccion([]))}>
                <option value="">Todos los estados</option>
                {Object.entries(NOMBRE_ESTADO_LIQ).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            }
          >
            <Tabla
              columnas={[
                ...(gestionar && abierto
                  ? [
                      {
                        titulo: (
                          <Checkbox
                            checked={borradores.length > 0 && seleccion.length === borradores.length}
                            onCheckedChange={(v) => setSeleccion(v ? borradores.map((b) => b.id) : [])}
                            aria-label="Seleccionar borradores"
                          />
                        ),
                        celda: (l: (typeof borradores)[number]) =>
                          l.estado === "borrador" && (
                            <span onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={seleccion.includes(l.id)}
                                onCheckedChange={(v) => setSeleccion((s) => (v ? [...s, l.id] : s.filter((x) => x !== l.id)))}
                              />
                            </span>
                          ),
                        className: "w-8",
                      },
                    ]
                  : []),
                { titulo: "Departamento", celda: (l) => <span className="font-semibold text-gray-900">{l.departamento_codigo ?? "…"}</span> },
                { titulo: "Total", celda: (l) => <Importe valor={l.total} />, className: "text-right" },
                {
                  titulo: "Estado",
                  celda: (l) => (
                    <span className="flex gap-1">
                      <Etiqueta tono={TONO_LIQ[l.estado]}>{NOMBRE_ESTADO_LIQ[l.estado]}</Etiqueta>
                      {l.corrige_a_id && <Etiqueta tono="azul">Corrección</Etiqueta>}
                    </span>
                  ),
                },
                { titulo: "Emitida", celda: (l) => (l.emitida_en ? formatFechaHora(l.emitida_en) : "—") },
              ]}
              filas={lista.data}
              clave={(l) => l.id}
              cargando={lista.isPending}
              error={lista.error}
              vacio="No hay liquidaciones. Prepare los borradores para empezar."
              onFila={(l) => navigate(`/liquidaciones/${l.id}`)}
            />
          </Tarjeta>
        </div>
      )}

      <Confirmar
        abierto={accion === "preparar"}
        onCerrar={() => setAccion(null)}
        titulo="Preparar borradores"
        descripcion="Valida la configuración y rehace los borradores de los departamentos sin liquidación emitida. No genera deuda."
        confirmar="Preparar"
        onConfirmar={async () => {
          await prepararLiquidaciones(periodoId);
          refrescar();
          toast.success("Borradores preparados.");
        }}
      />
      <Confirmar
        abierto={accion === "descartar"}
        onCerrar={() => setAccion(null)}
        titulo="Descartar borradores"
        descripcion="Se borran todos los borradores del periodo. Las liquidaciones emitidas no cambian."
        confirmar="Descartar"
        peligro
        onConfirmar={async () => {
          await descartarBorradores(periodoId);
          refrescar();
          toast.success("Borradores descartados.");
        }}
      />
      <Confirmar
        abierto={accion === "emitir"}
        onCerrar={() => setAccion(null)}
        titulo="Emitir liquidaciones"
        descripcion={
          seleccion.length
            ? `Se emitirán ${seleccion.length} liquidaciones seleccionadas. Cada una crea un cargo en la cuenta de su departamento.`
            : `Se emitirán todos los borradores (${r?.borradores ?? 0}). Cada uno crea un cargo en la cuenta de su departamento.`
        }
        confirmar="Emitir"
        onConfirmar={async () => {
          const emitidas = await emitirLiquidaciones(periodoId, seleccion.length ? seleccion : null);
          refrescar();
          toast.success(`${emitidas.length} liquidaciones emitidas.`);
        }}
      />
      <Confirmar
        abierto={accion === "cerrar"}
        onCerrar={() => setAccion(null)}
        titulo={`Cerrar ${periodo ? nombrePeriodo(periodo.anio, periodo.mes) : "periodo"}`}
        descripcion="Requiere que no queden borradores ni departamentos sin liquidación emitida. Al cerrar, la configuración queda bloqueada."
        confirmar="Cerrar periodo"
        peligro
        onConfirmar={async () => {
          await cerrarPeriodo(periodoId);
          refrescar();
          toast.success("Periodo cerrado.");
        }}
      />
      <Confirmar
        abierto={accion === "reabrir"}
        onCerrar={() => (setAccion(null), setMotivo(""))}
        titulo="Reabrir periodo"
        descripcion="No cambia las liquidaciones emitidas, que siguen bloqueando la configuración."
        confirmar="Reabrir"
        deshabilitado={!motivo.trim()}
        onConfirmar={async () => {
          await reabrirPeriodo(periodoId, motivo.trim());
          setMotivo("");
          refrescar();
          toast.success("Periodo reabierto.");
        }}
      >
        <Campo id="motivo" label="Motivo">
          <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Campo>
      </Confirmar>
    </>
  );
}
