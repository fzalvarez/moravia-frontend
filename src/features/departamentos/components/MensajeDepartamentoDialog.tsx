import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, InfoIcon, MailIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { iniciales } from "@/shared/lib/formato";
import { notifyError, notifySuccess } from "@/shared/utils";
import type { DepartamentoFicha, PersonaApi } from "../types";
import {
  enlaceCorreo,
  enlaceWhatsapp,
  plantillasPara,
  resolver,
  valoresVariables,
  VARIABLES,
} from "../utils/mensaje";
import { ETIQUETA_VINCULO, situacionDe } from "../utils/situacion";
import {
  CATEGORIAS_MENSAJE,
  MAX_MENSAJE,
  mensajeSchema,
  type MensajeFormValues,
} from "../validation/mensaje.schema";
import { SituacionBadge } from "./SituacionBadge";

type MensajeDepartamentoDialogProps = {
  ficha: DepartamentoFicha | null;
  onClose: () => void;
};

export function MensajeDepartamentoDialog({ ficha, onClose }: MensajeDepartamentoDialogProps) {
  return (
    <Dialog open={ficha !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {/* key: el formulario se reinicia al cambiar de departamento */}
        {ficha && <MensajeForm key={ficha.departamento.id} ficha={ficha} />}
      </DialogContent>
    </Dialog>
  );
}

const fieldCls =
  "w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all";

function MensajeForm({ ficha }: { ficha: DepartamentoFicha }) {
  const plantillas = plantillasPara(ficha);
  const principal = ficha.ocupantes.find((o) => o.vinculo.es_principal) ?? ficha.ocupantes[0];
  const [plantillaId, setPlantillaId] = useState(plantillas[0].id);
  const cuerpoRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<MensajeFormValues>({
    resolver: zodResolver(mensajeSchema),
    defaultValues: {
      personaIds: principal ? [principal.persona.id] : [],
      categoria: plantillas[0].categoria,
      asunto: plantillas[0].asunto,
      cuerpo: plantillas[0].cuerpo,
    },
  });

  const [personaIds, asunto, cuerpo] = useWatch({ control, name: ["personaIds", "asunto", "cuerpo"] });
  const seleccionados = ficha.ocupantes.filter((o) => personaIds.includes(o.persona.id));
  const vistaPrevia = seleccionados[0]?.persona;
  const { ref: cuerpoRegisterRef, ...cuerpoRegister } = register("cuerpo");

  const aplicarPlantilla = (id: string) => {
    const p = plantillas.find((x) => x.id === id);
    if (!p) return;
    setPlantillaId(id);
    setValue("categoria", p.categoria);
    setValue("asunto", p.asunto, { shouldValidate: !!p.asunto });
    setValue("cuerpo", p.cuerpo, { shouldValidate: true });
  };

  const insertarVariable = (variable: string) => {
    const el = cuerpoRef.current;
    const token = `{${variable}}`;
    const inicio = el?.selectionStart ?? cuerpo.length;
    const fin = el?.selectionEnd ?? cuerpo.length;
    setValue("cuerpo", cuerpo.slice(0, inicio) + token + cuerpo.slice(fin), { shouldValidate: true });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(inicio + token.length, inicio + token.length);
    });
  };

  const togglePersona = (id: string, marcado: boolean) =>
    setValue(
      "personaIds",
      marcado ? [...personaIds, id] : personaIds.filter((x) => x !== id),
      { shouldValidate: true }
    );

  /** Valida el formulario y entrega el texto ya personalizado para la persona. */
  const conMensaje = (persona: PersonaApi, accion: (asunto: string, cuerpo: string) => void) =>
    handleSubmit((values) => {
      const vals = valoresVariables(ficha, persona);
      accion(resolver(values.asunto, vals), resolver(values.cuerpo, vals));
    })();

  const abrirCorreo = (p: PersonaApi) =>
    conMensaje(p, (a, c) => {
      window.location.href = enlaceCorreo(p.correo!, a, c);
    });

  const abrirWhatsapp = (p: PersonaApi) =>
    conMensaje(p, (a, c) => {
      window.open(enlaceWhatsapp(p.telefono!, a, c), "_blank", "noopener");
    });

  const copiar = (p: PersonaApi) =>
    conMensaje(p, (a, c) => {
      navigator.clipboard
        .writeText(`${a}\n\n${c}`)
        .then(() => notifySuccess(`Mensaje para ${p.nombres} copiado.`))
        .catch(() => notifyError("No se pudo copiar al portapapeles."));
    });

  const d = ficha.departamento;

  return (
    <>
      {/* Cabecera */}
      <div className="px-6 py-4 pr-14 border-b border-gray-100 bg-linear-to-r from-gray-50/80 via-white to-brand-50/30 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
          <MailIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-base font-bold text-gray-900 tracking-tight">
              Mensaje a ocupantes
            </DialogTitle>
            <SituacionBadge situacion={situacionDe(ficha)} dias={ficha.morosidad?.antiguedad_dias} />
          </div>
          <DialogDescription className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
              Departamento {d.codigo}
            </span>
            <span>
              {ficha.ocupantes.length} ocupante{ficha.ocupantes.length === 1 ? "" : "s"} vigente
              {ficha.ocupantes.length === 1 ? "" : "s"}
            </span>
          </DialogDescription>
        </div>
      </div>

      <form className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700 flex-1" onSubmit={(e) => e.preventDefault()} noValidate>
        {/* Aviso: el backend aún no envía mensajes */}
        <div className="p-3 rounded-xl bg-warning-50 border border-warning-200 flex gap-2.5 text-warning-800">
          <InfoIcon className="size-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Moravia todavía no envía ni registra mensajes. Redáctelo aquí y ábralo ya personalizado en su correo o en
            WhatsApp. El envío desde el sistema está pedido al backend (<strong>PB-001</strong>).
          </p>
        </div>

        {/* Destinatarios: vínculos vigentes */}
        <section className="space-y-2">
          <Label>Destinatarios</Label>
          <div className="space-y-1.5">
            {ficha.ocupantes.map(({ vinculo: v, persona: p }) => {
              const marcado = personaIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors",
                    marcado ? "bg-brand-50/50 border-brand-200" : "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <Checkbox checked={marcado} onCheckedChange={(c) => togglePersona(p.id, c === true)} />
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                    {iniciales(p.nombres, p.apellidos)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">
                      {p.nombres} {p.apellidos}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {ETIQUETA_VINCULO[v.tipo]}
                      {v.es_principal && <span className="text-brand-600 font-semibold"> · Residente principal</span>}
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-[11px] text-gray-500">
                    <span className={cn(!p.correo && "italic text-gray-300")}>{p.correo ?? "Sin correo"}</span>
                    <span className={cn(!p.telefono && "italic text-gray-300")}>{p.telefono ?? "Sin teléfono"}</span>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.personaIds && <p className="text-[12px] text-error-600">{errors.personaIds.message}</p>}
        </section>

        {/* Categoría y asunto */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoría</Label>
            <select id="categoria" className={fieldCls} {...register("categoria")}>
              {CATEGORIAS_MENSAJE.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="asunto">Asunto</Label>
            <Input id="asunto" className={cn(fieldCls, "h-auto")} aria-invalid={!!errors.asunto} {...register("asunto")} />
            {errors.asunto && <p className="text-[12px] text-error-600">{errors.asunto.message}</p>}
          </div>
        </section>

        {/* Plantillas, variables y cuerpo */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 mr-1">Plantillas:</span>
            {plantillas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => aplicarPlantilla(p.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors",
                  plantillaId === p.id
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <div className="px-2 py-1.5 bg-gray-50/90 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-400">
                <span className="mr-0.5">Insertar:</span>
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertarVariable(v)}
                    className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-[10px]"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
              <span className={cn("text-[10px] font-medium", cuerpo.length > MAX_MENSAJE ? "text-error-600" : "text-gray-400")}>
                {cuerpo.length} / {MAX_MENSAJE.toLocaleString("es-PE")}
              </span>
            </div>
            <textarea
              rows={7}
              placeholder="Escriba el mensaje para los ocupantes…"
              className="w-full p-3.5 text-xs text-gray-800 outline-none resize-none leading-relaxed"
              aria-invalid={!!errors.cuerpo}
              ref={(el) => {
                cuerpoRegisterRef(el);
                cuerpoRef.current = el;
              }}
              {...cuerpoRegister}
            />
          </div>
          {errors.cuerpo && <p className="text-[12px] text-error-600">{errors.cuerpo.message}</p>}
        </section>

        {/* Vista previa con los datos reales del primer destinatario */}
        {vistaPrevia && (
          <section className="space-y-1.5">
            <Label>Vista previa para {vistaPrevia.nombres}</Label>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 max-h-48 overflow-y-auto">
              <p className="font-bold text-gray-900 mb-2">
                {resolver(asunto, valoresVariables(ficha, vistaPrevia)) || "(sin asunto)"}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
                {resolver(cuerpo, valoresVariables(ficha, vistaPrevia))}
              </p>
            </div>
          </section>
        )}

        {/* Envío manual por destinatario */}
        {seleccionados.length > 0 && (
          <section className="space-y-1.5">
            <Label>Enviar a cada destinatario</Label>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
              {seleccionados.map(({ persona: p }) => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="font-semibold text-gray-800 truncate">
                    {p.nombres} {p.apellidos}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!p.correo}
                      title={p.correo ?? "La persona no tiene correo registrado"}
                      onClick={() => abrirCorreo(p)}
                    >
                      <MailIcon className="size-3.5" />
                      Correo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!p.telefono}
                      title={p.telefono ?? "La persona no tiene teléfono registrado"}
                      onClick={() => abrirWhatsapp(p)}
                    >
                      <MessageCircleIcon className="size-3.5" />
                      WhatsApp
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" title="Copiar mensaje" onClick={() => copiar(p)}>
                      <CopyIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </form>

      {/* Pie */}
      <div className="px-6 py-4 bg-gray-50/90 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">El envío por correo o WhatsApp no queda registrado en Moravia.</p>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="rounded-xl text-xs">
              Cerrar
            </Button>
          </DialogClose>
          <span title="Pendiente en el backend (PB-001)">
            <Button type="button" disabled className="rounded-xl text-xs">
              <SendIcon className="size-4" />
              Enviar desde Moravia
              <span className="ml-1 px-1.5 rounded-md bg-white/25 text-[10px]">Pendiente</span>
            </Button>
          </span>
        </div>
      </div>
    </>
  );
}
