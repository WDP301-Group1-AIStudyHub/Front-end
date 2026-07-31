import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pageShellVariants = cva("", {
  variants: {
    variant: {
      default:
        "mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-4 py-12",
      narrow:
        "mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10",
      full: "flex h-full min-h-0 w-full flex-col overflow-hidden p-3 sm:p-5",
      centered: "grid min-h-full place-items-center p-6",
    },
    width: {
      none: "max-w-none",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface PageShellProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageShellVariants> {
  children: ReactNode;
}

export function PageShell({
  children,
  className,
  variant,
  width,
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn(pageShellVariants({ variant, width, className }))}
      {...props}
    >
      {children}
    </div>
  );
}
