import { formatStorageBytes } from "../../utils/formatStorage";
import type { StorageStatus } from "../../types/storage";

const TONE_BY_STATUS: Record<StorageStatus, string> = {
  OK: "bg-primary",
  WARNING: "bg-amber-500",
  CRITICAL: "bg-destructive",
  FULL: "bg-destructive",
};

export function StorageUsageBar({
  className = "",
  quotaBytes,
  showLabel = true,
  status,
  usedBytes,
}: {
  className?: string;
  quotaBytes: number;
  showLabel?: boolean;
  status: StorageStatus;
  usedBytes: number;
}) {
  const percent =
    quotaBytes > 0
      ? Math.max(0, Math.min(100, (usedBytes / quotaBytes) * 100))
      : 100;
  const label = `${formatStorageBytes(usedBytes)} / ${formatStorageBytes(quotaBytes)}`;

  return (
    <div className={className}>
      <div
        aria-label={`${label} of storage used`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(percent)}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${TONE_BY_STATUS[status]}`}
          style={{ width: `${percent.toFixed(1)}%` }}
        />
      </div>
      {/* Always render the numbers: status must never be conveyed by colour alone. */}
      {showLabel ? (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-semibold">
            {percent.toFixed(percent >= 10 ? 0 : 1)}%
          </span>
        </div>
      ) : null}
    </div>
  );
}
