import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center select-none justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0052cc]/30 dark:focus-visible:ring-brand-400/30",
  {
    variants: {
      variant: {
        default:
          "bg-[#0052cc] text-white hover:bg-[#003d9b] active:scale-[0.98] shadow-sm dark:bg-brand-500 dark:hover:bg-brand-600",
        outline:
          "border border-[#c3c6d6] bg-white text-[#0b1c30] hover:bg-[#eff4ff] hover:border-[#0052cc] dark:border-gray-700 dark:bg-transparent dark:text-gray-100 dark:hover:bg-white/5 dark:hover:border-brand-400",
        ghost:
          "text-[#434654] hover:bg-[#eff4ff] hover:text-[#0052cc] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-brand-400",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
        link: "text-[#0052cc] underline-offset-4 hover:underline dark:text-brand-400",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-12 px-6 text-base",
        icon: "size-9",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderIcon className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
