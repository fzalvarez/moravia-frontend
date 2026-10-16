import { LoaderIcon } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#f8f9fe]">
      <div className="flex items-center gap-2 text-2xl font-bold text-brand-600">
        <LoaderIcon className="animate-spin size-7" />
        <span>Moravia</span>
      </div>
      <p className="text-gray-500 text-sm">Cargando...</p>
    </div>
  );
}
