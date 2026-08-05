import type { FC, ComponentType } from "react";
import {
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
  GitFork,
  FileCode,
  Table,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  subject: BookOpen,
  subjects: BookOpen,
  document: FileText,
  documents: FileText,
  flashcards: Layers,
  quiz: HelpCircle,
  mindmap: GitFork,
  report: FileCode,
  table: Table,
};

export type CommandChipProps = {
  iconKey?: string;
  chipLabel: string;
  variant?: "composer" | "message";
  onRemove?: () => void;
  className?: string;
};

export const CommandChip: FC<CommandChipProps> = ({
  iconKey,
  chipLabel,
  variant = "composer",
  onRemove,
  className,
}) => {
  const IconComponent = (iconKey && ICON_MAP[iconKey]) || Sparkles;

  if (variant === "message") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium max-w-40 truncate shrink-0 select-none align-middle mr-1.5",
          className,
        )}
      >
        <IconComponent className="size-3 shrink-0" />
        <span className="truncate">{chipLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium max-w-40 truncate shrink-0 select-none pointer-events-none",
        className,
      )}
    >
      <IconComponent className="size-3.5 shrink-0" />
      <span className="truncate">{chipLabel}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:bg-primary/20 text-primary/80 hover:text-primary rounded-full p-0.5 transition-colors cursor-pointer pointer-events-auto ms-0.5"
          aria-label={`Remove ${chipLabel} command`}
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
};
