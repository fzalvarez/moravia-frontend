import { useEffect, useState } from "react";
import { Building2Icon, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHealth } from "../services/getHealth.service";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; value: string }
  | { status: "error"; message: string };

export default function InicioPage() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    getHealth().then((res) =>
      setHealth(
        res.success && res.data
          ? { status: "ok", value: res.data }
          : { status: "error", message: res.error ?? "Error desconocido." }
      )
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center text-white">
          <Building2Icon className="size-5" />
        </div>
        <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
          Moravia
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Backend:</span>
        {health.status === "loading" ? (
          <LoaderIcon className="size-4 animate-spin text-brand-500" />
        ) : (
          <span
            className={cn(
              "font-medium",
              health.status === "ok" ? "text-success-600" : "text-error-600"
            )}
          >
            {health.status === "ok" ? health.value : health.message}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400">v{__APP_VERSION__}</p>
    </div>
  );
}
