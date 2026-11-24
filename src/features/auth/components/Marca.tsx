import { Building2Icon } from "lucide-react";

export function Marca() {
  return (
    <div className="flex items-center gap-2.5 mb-8">
      <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
        <Building2Icon className="size-5" />
      </div>
      <div>
        <span className="block font-bold text-lg leading-tight tracking-tight text-gray-900">Moravia</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-500">
          Administración del condominio
        </span>
      </div>
    </div>
  );
}
