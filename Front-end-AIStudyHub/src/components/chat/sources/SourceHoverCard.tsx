import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, FileX } from "lucide-react";
import type { GroupedSource } from "@/types/chat";
import { sourceLocator } from "./groupSources";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SourceHoverCardProps {
  group: GroupedSource;
  children: ReactNode;
}

export const SourceHoverCard: React.FC<SourceHoverCardProps> = ({
  group,
  children,
}) => {
  const isMobile = useIsMobile();
  const visibleChunks = group.chunks.slice(0, 3);
  const remainingCount = group.chunks.length - visibleChunks.length;

  const cardContent = (
    <div className="flex flex-col gap-3 max-w-sm text-xs text-foreground">
      {/* Header */}
      <div className="flex items-center gap-2">
        {group.isDeleted ? (
          <FileX className="h-4 w-4 shrink-0 text-destructive/70" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-primary/70" />
        )}
        <span
          className={cn(
            "font-medium truncate text-sm",
            group.isDeleted && "text-muted-foreground line-through",
          )}
        >
          {group.title}
        </span>
      </div>

      {/* Chunk Excerpts */}
      <ScrollArea className="flex flex-col gap-2.5 max-h-40 pr-2">
        {visibleChunks.map((chunk, idx) => {
          const locator = sourceLocator(chunk);
          return (
            <div
              key={`${chunk.chunkIndex}-${idx}`}
              className="flex flex-col gap-1 rounded "
            >
              {locator && (
                <div className="font-medium text-sm text-foreground truncate">
                  {locator}
                </div>
              )}
              <p className="text-muted-foreground leading-relaxed text-[13px] whitespace-pre-wrap">
                {chunk.contentPreview}
              </p>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div className="text-sm font-medium text-muted-foreground text-center py-0.5">
            +{remainingCount} more section{remainingCount > 1 ? "s" : ""}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
        {group.isDeleted ? (
          <span className="text-[11px] italic text-muted-foreground">
            This document was deleted
          </span>
        ) : (
          <Link
            to={`/documents/${group.documentId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <span>View source</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className="w-80 p-3 shadow-lg border border-border/80"
          align="start"
        >
          {cardContent}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-3.5" align="start">
        {cardContent}
      </HoverCardContent>
    </HoverCard>
  );
};
