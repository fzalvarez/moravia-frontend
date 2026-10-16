import { ConstructionIcon } from "lucide-react";

export default function EnConstruccion() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <ConstructionIcon className="size-8 text-gray-300" />
      <p className="text-sm text-gray-500">Esta sección todavía no está construida.</p>
    </div>
  );
}
