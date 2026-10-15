import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border border-[#c3c6d6] bg-white px-4 py-3 text-sm text-[#0b1c30] placeholder:text-[#9ca3af] outline-none transition-all",
        "focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };
