import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightIcon, MessageSquareIcon, WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Importe } from "@/shared/components/app/Importe";
import { Etiqueta } from "@/shared/components/app/Pagina";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, iniciales } from "@/shared/lib/formato";
import type { Esquema } from "@/api";
import { clavesPersonas, getPersona, NOMBRE_VINCULO, nombreCompleto, vinculosDeDepartamento } from "@/features/personas/services/personas.service";
import { clavesLiquidaciones, getLiquidacion } from "@/features/liquidaciones/services/liquidaciones.service";
import { clavesCuenta, listarPagos } from "@/features/cuenta/services/cuenta.service";
import type { Departamento } from "../services/departamentos.service";
import { ETIQUETA_SITUACION, situacion, TONO_SITUACION } from "../utils/situacionReal";

type Props = {
  departamento: Departamento;
  torre?: string;
  fila?: Esquema<"MorosidadFila">;
  liquidacionId?: string;
  onMensaje: () => void;
  onAbrir: (pestana?: string) => void;
};

/** Panel lateral de la unidad elegida (referencias 002 y 003). */
export function Inspector({ departamento: d, torre, fila, liquidacionId, onMensaje, onAbrir }: Props) {
  const { puede } = usePermisos();
  const finanzas = puede("finanzas.ver");
  const vinculos = useQuery({ queryKey: clavesPersonas.ocupantes(d.id, true), queryFn: () => vinculosDeDepartamento(d.id, true), enabled: puede("personas.ver") });
  const titular = vinculos.data?.find((v) => v.es_principal) ?? vinculos.data?.find((v) => v.tipo === "propietario") ?? vinculos.data?.[0];
  const persona = useQuery({ queryKey: clavesPersonas.una(titular?.persona_id ?? ""), queryFn: () => getPersona(titular!.persona_id), enabled: !!titular });
  const liquidacion = useQuery({ queryKey: clavesLiquidaciones.una(liquidacionId ?? ""), queryFn: () => getLiquidacion(liquidacionId!), enabled: finanzas && !!liquidacionId });
  const pagos = useQuery({ queryKey: clavesCuenta.pagos(d.id), queryFn: () => listarPagos(d.id), enabled: finanzas });
  const s = situacion(fila, d.activo);
  const recientes = pagos.data?.filter((p) => !p.anulado).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3) ?? [];
  const p = persona.data;

  return (
    <aside className="bg-white rounded-2xl shadow-theme-xs overflow-hidden">
      <div className="px-5 pt-5 pb-4 bg-linear-to-br from-brand-50 to-white">
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900">{d.codigo}</span>
          {finanzas && <Etiqueta tono={TONO_SITUACION[s]}>{s === "mora" && fila ? `Mora ${fila.antiguedad_dias} d` : ETIQUETA_SITUACION[s]}</Etiqueta>}
        </div>
        <p className="text-[12px] text-gray-500">{[torre ? `Torre ${torre}` : null, d.piso ? `Piso ${d.piso}` : null].filter(Boolean).join(" · ") || "Sin ubicación"}</p>
      </div>

      <div className="p-5 space-y-5">
        {puede("personas.ver") && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Residente titular</p>
            {titular && p ? (
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 text-[12px] font-bold flex items-center justify-center">{iniciales(p.nombres, p.apellidos)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{nombreCompleto(p)}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {NOMBRE_VINCULO[titular.tipo]}
                    {p.correo ? ` · ${p.correo}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-gray-400">{vinculos.isPending ? "Cargando…" : "Sin ocupantes vigentes."}</p>
            )}
          </section>
        )}

        {finanzas && (
          <>
            <section>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Composición de la cuota</p>
              {liquidacion.data ? (
                <div className="rounded-xl bg-surface-container p-3 space-y-1.5">
                  {liquidacion.data.detalles.map((x) => (
                    <div key={x.concepto_id} className="flex justify-between text-[12px] text-gray-600">
                      <span className="truncate">{x.concepto_nombre}</span>
                      <Importe valor={x.importe} />
                    </div>
                  ))}
                  <div className="flex justify-between pt-1.5 border-t border-gray-200 text-[13px] font-bold text-gray-900">
                    <span>Total del periodo</span>
                    <Importe valor={liquidacion.data.total} />
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-gray-400">Sin liquidación emitida en el periodo vigente.</p>
              )}
            </section>

            <section className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-surface-container px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Saldo pendiente</p>
                <Importe valor={fila?.saldo ?? "0.00"} className="text-sm font-bold text-gray-900" />
              </div>
              <div className="rounded-xl bg-surface-container px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Vencido</p>
                <Importe valor={fila?.deuda_vencida ?? "0.00"} className="text-sm font-bold text-error-600" />
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Pagos recientes</p>
              {recientes.length === 0 ? (
                <p className="text-[12px] text-gray-400">Sin pagos registrados.</p>
              ) : (
                <div className="space-y-1.5">
                  {recientes.map((x) => (
                    <div key={x.id} className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-600">
                        {formatFecha(x.fecha)}
                        {x.referencia ? ` · ${x.referencia}` : ""}
                      </span>
                      <Importe valor={x.importe} className="font-semibold text-gray-900" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          {puede("finanzas.gestionar") && (
            <Button size="sm" onClick={() => onAbrir("cuenta")}>
              <WalletIcon className="size-3.5" /> Registrar pago
            </Button>
          )}
          {puede("personas.ver") && (
            <Button size="sm" variant="secondary" onClick={onMensaje}>
              <MessageSquareIcon className="size-3.5" /> Mensaje
            </Button>
          )}
          <Button size="sm" variant="outline" className="col-span-2" onClick={() => onAbrir()}>
            Ver ficha completa <ArrowUpRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
