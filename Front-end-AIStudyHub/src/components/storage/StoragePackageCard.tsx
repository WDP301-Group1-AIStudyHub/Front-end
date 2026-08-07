import { Check, HardDrive } from "lucide-react";
import { formatStorageBytes, formatVnd } from "../../utils/formatStorage";
import type { StoragePackage } from "../../types/storage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StoragePackageCard({
  draggable = false,
  hideAction = false,
  isCurrent,
  onDragEnd,
  onDragStart,
  onSelect,
  pkg,
  unavailableReason,
}: {
  draggable?: boolean;
  hideAction?: boolean;
  isCurrent: boolean;
  onDragEnd?: () => void;
  onDragStart?: (pkg: StoragePackage) => void;
  onSelect: (pkg: StoragePackage) => void;
  pkg: StoragePackage;
  /** Set when the package cannot be bought right now. */
  unavailableReason?: string | null;
}) {
  const disabled = isCurrent || Boolean(unavailableReason);

  return (
    <Card
      className={cn(
        "min-w-0 flex h-full flex-col transition-all duration-150",
        pkg.highlight && "border-primary shadow-sm",
        !disabled &&
          "cursor-pointer hover:border-primary hover:bg-primary/5 active:scale-[0.98]",
        disabled && "opacity-90",
      )}
      draggable={draggable && !disabled}
      onClick={() => {
        // Mouse-only convenience: the whole card selects the plan. The button
        // below stays the keyboard- and screen-reader-accessible control.
        if (!disabled) onSelect(pkg);
      }}
      onDragEnd={onDragEnd}
      onDragStart={(event) => {
        // A custom MIME type keeps unrelated drags (files, text) out of the drop
        // zone, which is what lets the zone reject them cleanly.
        event.dataTransfer.setData("application/x-storage-package", pkg.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(pkg);
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <HardDrive className="size-6" strokeWidth={1.5} aria-hidden="true" />
          {isCurrent ? (
            <Badge variant="secondary">Current plan</Badge>
          ) : pkg.highlight ? (
            <Badge variant="default">Most popular</Badge>
          ) : null}
        </div>

        <div className="mt-2">
          <CardTitle className="text-lg font-medium tracking-tight">
            {pkg.name}
          </CardTitle>
          <p className="mt-1 text-sm font-medium tracking-tight tabular-nums text-foreground">
            {formatStorageBytes(pkg.capacityBytes)}
          </p>
          <p className="mt-1 font-medium text-primary tabular-nums">
            {formatVnd(pkg.priceVnd)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {pkg.description ? (
          <CardDescription className="text-sm leading-5">
            {pkg.description}
          </CardDescription>
        ) : null}

        {pkg.features.length > 0 ? (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {pkg.features.map((feature) => (
              <li className="flex items-start gap-2" key={feature}>
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>

      {!hideAction ? (
        <CardFooter>
          <Button
            className="w-full"
            disabled={disabled}
            variant={
              isCurrent ? "outline" : pkg.highlight ? "default" : "outline"
            }
            onClick={(event) => {
              // The article already handles the click; stop it bubbling so the
              // dialog is not opened twice.
              event.stopPropagation();
              onSelect(pkg);
            }}
            type="button"
          >
            {isCurrent ? "Your current plan" : "Choose this plan"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
