import type { ReactNode } from "react";
import { CheckCircle2, FileText, LockKeyhole } from "lucide-react";

export default function SplitInfoCard({
  eyebrow,
  footer,
  title,
}: {
  eyebrow: string;
  footer: string;
  title: ReactNode;
  variant: "lost" | "found";
}) {
  return (
    <aside className="flex min-h-107.5 flex-col justify-between border-y border-border py-10 md:py-12">
      <div>
        <span className="mb-6 block text-sm font-semibold text-primary">
          {eyebrow}
        </span>
        <h1 className="m-0 mb-6 text-4xl font-semibold leading-tight tracking-[-0.03em]">
          {title}
        </h1>
        <p className="m-0 max-w-82.5 text-lg leading-[1.6] text-muted-foreground">
          Recover access to your study library and continue working with your
          saved material.
        </p>
      </div>
      <div className="my-8 divide-y divide-border border-y border-border text-sm">
        <div className="flex items-center gap-3 py-4">
          <LockKeyhole className="size-4 text-primary" /> Secure reset link
        </div>
        <div className="flex items-center gap-3 py-4">
          <FileText className="size-4 text-primary" /> Your documents remain
          unchanged
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <CheckCircle2 className="size-4 text-primary" />
        <span>{footer}</span>
      </div>
    </aside>
  );
}
