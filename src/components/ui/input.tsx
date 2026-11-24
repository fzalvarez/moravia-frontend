import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0b1c30] placeholder:text-[#9ca3af] outline-none transition-all",
        "focus:border-brand-400 focus:ring-3 focus:ring-brand-500/15",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };
