import { cn } from "@/lib/utils";

export default function BrandLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-4.5 items-center tracking-tight",
        compact && "[&_.brand-mark]:size-7",
        className,
      )}
    >
      {!compact ? (
        <img src="/logo.svg" alt="AI Study Hub" className="max-h-4.5" />
      ) : (
        <img src="/favicon.svg" alt="AI Study Hub" className="brand-mark" />
      )}
    </span>
  );
}
