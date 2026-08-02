import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink, FileX } from "lucide-react";
import { groupSources, sourceLocator } from "./groupSources";
import { useThreadSources } from "./useThreadSources";
import { useSourcesPanel } from "./sourcesPanelStore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SourcesPanelProps {
  className?: string;
  /**
   * When false the panel is always expanded and renders no chevron. The overlay
   * passes false so a collapse persisted from the docked panel cannot leave it
   * showing a header with no content and no way to open it.
   */
  collapsible?: boolean;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  className,
  collapsible = true,
}) => {
  const { sources, citedSources, messageId } = useThreadSources();
  const { focus, isCollapsed, setCollapsed } = useSourcesPanel();
  const listRef = useRef<HTMLDivElement>(null);

  const groups = groupSources(sources);
  const isOpen = collapsible ? !isCollapsed : true;

  // Auto-scroll to focused citation entry. Scoped to this panel's own list —
  // the docked aside stays mounted (CSS-hidden) at every width, so a global
  // id lookup would resolve to the hidden copy whenever the overlay is open.
  useEffect(() => {
    if (!focus || !messageId || focus.messageId !== messageId) return;

    const targetSource = citedSources.find(
      (s) => s.citationId === focus.citationId,
    );
    if (!targetSource) return;

    const el = listRef.current?.querySelector(
      `[data-source-entry="${CSS.escape(targetSource.documentId)}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus, messageId, citedSources]);

  if (groups.length === 0) {
    return null;
  }

  const headerIsTrigger = collapsible && !isOpen;
  const headerClassName =
    "flex items-center justify-between px-3.5 py-2.5 select-none w-full text-left transition-colors";

  const headerContent = (
    <>
      <div className="flex items-center gap-2 font-medium text-foreground">
        <span>Sources</span>
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground">
          {groups.length}
        </span>
      </div>

      {collapsible &&
        (headerIsTrigger ? (
          // The header itself is the trigger here — a nested button would be
          // invalid markup and would toggle twice as the click bubbles.
          <span className="p-1 text-muted-foreground" aria-hidden="true">
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </span>
        ) : (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label="Collapse panel"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </CollapsibleTrigger>
        ))}
    </>
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => setCollapsed(!open)}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-xs overflow-hidden text-sm transition-all",
        className,
      )}
    >
      {/* Header — the whole bar is the trigger while collapsed, so the panel is
          easy to reopen; expanded, only the chevron collapses it, leaving the
          rest of the bar inert. */}
      {headerIsTrigger ? (
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(headerClassName, "cursor-pointer hover:bg-muted/40")}
            aria-label="Expand panel"
          >
            {headerContent}
          </button>
        </CollapsibleTrigger>
      ) : (
        <div className={headerClassName}>{headerContent}</div>
      )}

      {/* Content Body */}
      <CollapsibleContent>
        <div
          ref={listRef}
          className="flex flex-col max-h-[calc(100vh-14rem)] divide-y divide-accent overflow-y-auto"
        >
          {groups.map((group) => {
            const locator = sourceLocator(group.chunks[0]);
            const citedIds = [
              ...new Set(
                citedSources
                  .filter(
                    (s) =>
                      s.documentId === group.documentId &&
                      s.citationId !== undefined,
                  )
                  .map((s) => s.citationId!),
              ),
            ].sort((a, b) => a - b);

            const isFocused =
              focus &&
              messageId &&
              focus.messageId === messageId &&
              citedSources.some(
                (s) =>
                  s.documentId === group.documentId &&
                  s.citationId === focus.citationId,
              );

            return (
              <div
                key={group.documentId}
                data-source-entry={group.documentId}
                className={cn(
                  "flex flex-col gap-1.5 transition-all duration-200 px-3.5 py-3",
                  isFocused
                    ? "border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/40"
                    : "border-border/50 bg-card/50 hover:bg-muted/30 hover:border-border",
                )}
              >
                {/* Title & Document Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {group.isDeleted ? (
                      <FileX className="h-3.5 w-3.5 shrink-0 text-destructive/70" />
                    ) : null}
                    {group.isDeleted ? (
                      <span className="font-semibold truncate text-sm text-muted-foreground line-through">
                        {group.title}
                      </span>
                    ) : (
                      <Link
                        to={`/documents/${group.documentId}`}
                        className="font-medium truncate text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                        title={group.title}
                      >
                        <span className="truncate">{group.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1 shrink-0">
                    {citedIds.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[11px] font-medium rounded bg-muted ">
                        [{citedIds.join(",")}]
                      </span>
                    )}
                    {group.chunks.length > 1 && (
                      <span className="px-0.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        ×{group.chunks.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subheading / Locator */}
                {locator && (
                  <div className="text-xs font-medium text-muted-foreground truncate">
                    {locator}
                  </div>
                )}

                {/* Content Excerpt */}
                <p className="line-clamp-3 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {group.chunks[0]?.contentPreview}
                </p>

                {/* Deleted document notice */}
                {group.isDeleted && (
                  <div className="text-[10px] italic text-muted-foreground/80 pt-1 border-t border-border/30">
                    This document was deleted
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
