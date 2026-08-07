import type { FC, ReactNode, ComponentType } from "react";
import { ComposerPrimitive } from "@assistant-ui/react";
import type {
  Unstable_TriggerAdapter,
  Unstable_TriggerItem,
  Unstable_TriggerCategory,
} from "@assistant-ui/core";
import {
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
  GitFork,
  FileCode,
  Table,
  ChevronLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

// Keyed by both the item's `metadata.icon` and the category's `id`, which is
// why the plural forms are here too — categories are `subjects` / `documents`.
const DEFAULT_ICON_MAP: Record<string, ComponentType<IconProps>> = {
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

export type ComposerTriggerPopoverProps = {
  char: string;
  adapter: Unstable_TriggerAdapter;
  isLoading?: boolean;
  behavior: ReactNode;
  iconMap?: Record<string, ComponentType<IconProps>>;
  fallbackIcon?: ComponentType<IconProps>;
  emptyLabel?: string;
};

export const ComposerTriggerPopover: FC<ComposerTriggerPopoverProps> = ({
  char,
  adapter,
  isLoading = false,
  behavior,
  iconMap = DEFAULT_ICON_MAP,
  fallbackIcon = Sparkles,
  emptyLabel = "No results found",
}) => {
  const getIcon = (iconKey?: string) => {
    if (iconKey && iconMap[iconKey]) {
      return iconMap[iconKey];
    }
    return fallbackIcon;
  };

  return (
    <ComposerPrimitive.Unstable_TriggerPopover
      char={char}
      adapter={adapter}
      isLoading={isLoading}
      className="bg-popover/95 text-popover-foreground border-border/80 absolute bottom-full mb-2 z-50 max-h-80 w-80 overflow-y-auto rounded-xl border p-1 shadow-lg backdrop-blur-sm scrollbar-thin animate-in fade-in-0 zoom-in-95"
    >
      {behavior}

      {/* Drill-down Back button */}
      <ComposerPrimitive.Unstable_TriggerPopoverBack asChild>
        <button
          type="button"
          className="hover:bg-accent text-muted-foreground hover:text-foreground mb-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          <span>Back to categories</span>
        </button>
      </ComposerPrimitive.Unstable_TriggerPopoverBack>

      {/* Loading state */}
      {isLoading && (
        <div className="animate-slide-up-fade absolute bottom-full px-1 pb-3 text-muted-foreground flex items-center justify-center gap-2 text-xs">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading options...</span>
        </div>
      )}

      {/* Categories View */}
      <ComposerPrimitive.Unstable_TriggerPopoverCategories>
        {(categories: readonly Unstable_TriggerCategory[]) =>
          categories.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {categories.map((cat) => {
                const IconComponent = getIcon(cat.id);
                return (
                  <ComposerPrimitive.Unstable_TriggerPopoverCategoryItem
                    key={cat.id}
                    categoryId={cat.id}
                    className="hover:bg-accent/80 data-[highlighted=true]:bg-accent data-[highlighted=true]:text-accent-foreground group flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left text-xs transition-colors outline-none"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
                        <IconComponent className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold leading-tight text-foreground">
                          {cat.label}
                        </span>
                      </div>
                    </div>
                  </ComposerPrimitive.Unstable_TriggerPopoverCategoryItem>
                );
              })}
            </div>
          ) : null
        }
      </ComposerPrimitive.Unstable_TriggerPopoverCategories>

      {/* Items View */}
      <ComposerPrimitive.Unstable_TriggerPopoverItems>
        {(items: readonly Unstable_TriggerItem[]) => {
          if (!isLoading && items.length === 0) {
            return (
              <div className="text-muted-foreground p-3 text-center text-xs">
                {emptyLabel}
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-0.5">
              {items.map((item, index) => {
                const iconKey = (item.metadata?.icon as string) || item.type;
                const IconComponent = getIcon(iconKey);
                const isDisabled = Boolean(item.metadata?.disabled);
                const ragStatus = item.metadata?.ragStatus as
                  | string
                  | undefined;
                const switchesContext = Boolean(item.metadata?.switchesContext);

                return (
                  <ComposerPrimitive.Unstable_TriggerPopoverItem
                    key={item.id}
                    item={item}
                    index={index}
                    // `aria-disabled`, not `disabled`: keyboard selection is
                    // resolved from the item list inside the library, never
                    // through this button, so a real `disabled` would block the
                    // mouse while `Enter` sailed past it. The row stays
                    // interactive and the adapter's `onInserted` rejects it,
                    // which keeps both paths giving the same feedback.
                    aria-disabled={isDisabled || undefined}
                    className={cn(
                      "hover:bg-accent/80 data-[highlighted=true]:bg-accent data-[highlighted=true]:text-accent-foreground group flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left text-xs transition-colors outline-none",
                      isDisabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="bg-muted text-muted-foreground group-hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md transition-colors">
                        <IconComponent className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium leading-tight text-foreground">
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-muted-foreground truncate text-[11px]">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 ml-2">
                      {switchesContext && (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
                          Switches context
                        </span>
                      )}
                      {ragStatus && isDisabled && (
                        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium capitalize whitespace-nowrap">
                          {ragStatus.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </ComposerPrimitive.Unstable_TriggerPopoverItem>
                );
              })}
            </div>
          );
        }}
      </ComposerPrimitive.Unstable_TriggerPopoverItems>
    </ComposerPrimitive.Unstable_TriggerPopover>
  );
};
