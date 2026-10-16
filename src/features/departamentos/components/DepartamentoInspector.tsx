import {
  CarIcon,
  ExternalLinkIcon,
  MailIcon,
  MessageSquareIcon,
  PackageIcon,
  PhoneIcon,
  WalletIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  esImporteCero,
  esImporteNegativo,
  formatFecha,
  formatImporte,
  iniciales,
  nombrePeriodo,
} from "@/shared/lib/formato";
import type { DepartamentoFicha } from "../types";
import { ETIQUETA_ANEXO, ETIQUETA_VINCULO, situacionDe } from "../utils/situacion";
import { SituacionBadge } from "./SituacionBadge";

function Seccion({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{titulo}</h4>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Linea({ label, valor, fuerte }: { label: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", fuerte ? "font-bold text-gray-900" : "text-gray-600")}>
      <span>{label}</span>
      <span className={cn("font-semibold", esImporteNegativo(valor) ? "text-success-600" : "text-gray-900")}>
        {formatImporte(valor)}
      </span>
    </div>
  );
}

const linkCls = "text-[11px] text-brand-500 hover:text-brand-700 hover:underline font-bold";

/**
 * Ficha resumida: GET /departamentos/{id}, /anexos, /vinculos?vigentes,
 * /estado-cuenta, /liquidaciones (detalle) y /pagos.
 */
type DepartamentoInspectorProps = {
  ficha: DepartamentoFicha;
  onMensaje: (ficha: DepartamentoFicha) => void;
};

export function DepartamentoInspector({ ficha, onMensaje }: DepartamentoInspectorProps) {
  const { departamento: d, tipo, anexos, ocupantes, estadoCuenta: ec, liquidacion, pagos } = ficha;
  const situacion = situacionDe(ficha);
  const saldo = ec?.saldo_actual ?? "0.00";
  const periodo = ec?.anio && ec.mes ? nombrePeriodo(ec.anio, ec.mes) : null;

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl shadow-theme-md p-5 space-y-5">
      {/* Cabecera */}
      <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl font-extrabold text-sm flex items-center justify-center shrink-0",
            d.activo
              ? "bg-linear-to-tr from-brand-700 to-brand-500 text-white shadow-md shadow-brand-500/30"
              : "bg-gray-100 text-gray-400"
          )}
        >
          {d.codigo}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Departamento {d.codigo}</h3>
            <SituacionBadge situacion={situacion} dias={ficha.morosidad?.antiguedad_dias} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {d.piso !== null && `Piso ${d.piso}`}
            {tipo ? ` · Tipo ${tipo.nombre}` : " · Sin tipo asignado"}
          </p>
        </div>
      </div>

      {!d.activo && (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3">
          Departamento desactivado: no participa en nuevas liquidaciones y su cuenta de acceso quedó desactivada.
        </p>
      )}

      {/* Ocupantes vigentes */}
      <Seccion
        titulo="Ocupantes vigentes"
        extra={
          <div className="flex items-center gap-3">
            {ocupantes.length > 0 && (
              <button type="button" className={`${linkCls} inline-flex items-center gap-1`} onClick={() => onMensaje(ficha)}>
                <MessageSquareIcon className="size-3.5" />
                Mensaje
              </button>
            )}
            <a className={linkCls} href="#">Historial</a>
          </div>
        }
      >
        {ocupantes.length === 0 ? (
          <p className="text-xs italic text-gray-400">Sin vínculos vigentes.</p>
        ) : (
          <div className="space-y-2">
            {ocupantes.map(({ vinculo: v, persona: p }) => (
              <div key={v.id} className="p-3 rounded-xl bg-gray-50/90 border border-gray-200/70 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {iniciales(p.nombres, p.apellidos)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {p.nombres} {p.apellidos}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {ETIQUETA_VINCULO[v.tipo]}
                    {v.es_principal && <span className="text-brand-600 font-semibold"> · Residente principal</span>}
                    {" · desde "}
                    {formatFecha(v.fecha_inicio)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.telefono && (
                    <a
                      href={`tel:${p.telefono.replace(/\s/g, "")}`}
                      title={p.telefono}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200"
                    >
                      <PhoneIcon className="size-3.5" />
                    </a>
                  )}
                  {p.correo && (
                    <a
                      href={`mailto:${p.correo}`}
                      title={p.correo}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200"
                    >
                      <MailIcon className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      {/* Anexos */}
      <Seccion titulo="Estacionamientos y depósitos">
        {anexos.length === 0 ? (
          <p className="text-xs italic text-gray-400">Sin anexos asociados.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {anexos.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-700"
              >
                {a.tipo === "estacionamiento" ? (
                  <CarIcon className="size-3.5 text-gray-400" />
                ) : (
                  <PackageIcon className="size-3.5 text-gray-400" />
                )}
                {ETIQUETA_ANEXO[a.tipo]} {a.codigo}
              </span>
            ))}
          </div>
        )}
      </Seccion>

      {/* Cuota del periodo: detalle de la liquidación emitida */}
      {liquidacion && (
        <Seccion titulo={`Cuota ${periodo ?? ""}`}>
          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2 text-xs">
            {liquidacion.detalles.map((det) => (
              <Linea key={det.concepto_id} label={det.concepto_nombre} valor={det.importe} />
            ))}
            <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between font-bold text-gray-900">
              <span>Total de la liquidación</span>
              <span className="text-sm text-brand-600">{formatImporte(liquidacion.total)}</span>
            </div>
          </div>
        </Seccion>
      )}

      {/* Estado de cuenta del periodo */}
      {ec && d.activo && (
        <Seccion
          titulo="Estado de cuenta"
          extra={<a className={linkCls} href="#">Ver movimientos</a>}
        >
          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2 text-xs">
            <Linea label="Deuda anterior" valor={ec.deuda_anterior.total} />
            <Linea label="Cuota actual" valor={ec.cuota_actual.total} />
            {!esImporteCero(ec.multas.total) && <Linea label="Multas" valor={ec.multas.total} />}
            <Linea label="Pagos" valor={ec.pagos.total} />
            {!esImporteCero(ec.ajustes.total) && <Linea label="Ajustes" valor={ec.ajustes.total} />}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 text-[10px] block font-medium">Saldo al cierre</span>
              <span className="font-bold text-gray-900">{formatImporte(ec.saldo_total)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-400 text-[10px] block font-medium">Saldo actual</span>
              <span
                className={cn(
                  "font-extrabold",
                  esImporteCero(saldo) ? "text-success-600" : situacion === "vencido" ? "text-error-600" : "text-warning-600"
                )}
              >
                {formatImporte(saldo)}
              </span>
            </div>
          </div>
          {ec.fecha_limite && !esImporteCero(saldo) && (
            <p className="mt-2 text-[11px] text-gray-500">
              Fecha límite del periodo: <strong>{formatFecha(ec.fecha_limite)}</strong>
            </p>
          )}
        </Seccion>
      )}

      {/* Pagos recientes */}
      <Seccion titulo="Pagos recientes" extra={pagos.length > 0 && <a className={linkCls} href="#">Ver todos</a>}>
        {pagos.length === 0 ? (
          <p className="text-xs italic text-gray-400">Sin pagos registrados.</p>
        ) : (
          <div className="space-y-1.5 text-xs">
            {pagos.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50/60 border border-transparent hover:border-gray-200"
              >
                <div className="min-w-0">
                  <span className={cn("font-semibold text-gray-800", p.anulado && "line-through text-gray-400")}>
                    {formatFecha(p.fecha)}
                  </span>
                  <span className="block text-[10px] text-gray-400 truncate">
                    {p.anulado ? `Anulado · ${p.motivo_anulacion}` : p.referencia ?? "Sin referencia"}
                  </span>
                </div>
                <span className={cn("font-bold", p.anulado ? "line-through text-gray-400" : "text-gray-800")}>
                  {formatImporte(p.importe)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      {/* Acciones */}
      <div className="pt-1 flex items-center gap-2">
        <Button variant="outline" className="flex-1 rounded-xl text-xs">
          <ExternalLinkIcon className="size-4" />
          Ver ficha
        </Button>
        <Button
          className="flex-1 rounded-xl text-xs"
          disabled={!d.activo || esImporteCero(saldo)}
          title={esImporteCero(saldo) ? "Sin deuda pendiente: el backend no admite pagos por encima del saldo" : undefined}
        >
          <WalletIcon className="size-4" />
          Registrar pago
        </Button>
      </div>
    </div>
  );
}
