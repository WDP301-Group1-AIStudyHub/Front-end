import React from "react";
import { useAuiState } from "@assistant-ui/react";
import type { ChatSource, GroupedSource } from "@/types/chat";
import { SourceHoverCard } from "./SourceHoverCard";
import { useSourcesPanel } from "./sourcesPanelStore";

interface CitationMarkerProps {
  citationId?: number;
  children?: React.ReactNode;
}

export const CitationMarker: React.FC<CitationMarkerProps> = ({
  citationId,
  children,
}) => {
  const { setFocus, setOverlayOpen } = useSourcesPanel();

  const messageId = useAuiState(
    (s) => (s as { message?: { id?: string } })?.message?.id,
  );

  const customMetadata = useAuiState(
    (s) =>
      (s as { message?: { metadata?: { custom?: Record<string, unknown> } } })
        ?.message?.metadata?.custom,
  );

  if (citationId === undefined || citationId <= 0) {
    return <>{children}</>;
  }

  const rawCited = customMetadata?.citedSources;
  const citedSources: ChatSource[] = Array.isArray(rawCited)
    ? (rawCited as ChatSource[])
    : [];

  const matchedSource = citedSources.find(
    (source) => source.citationId === citationId,
  );

  if (!matchedSource) {
    return <>{children}</>;
  }

  const group: GroupedSource = {
    documentId: matchedSource.documentId,
    title: matchedSource.title || "Untitled Document",
    chunks: [matchedSource],
    isDeleted: matchedSource.sourceStatus === "DELETED",
  };

  const handleClick = () => {
    if (messageId && citationId) {
      setFocus({ messageId, citationId });
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setOverlayOpen(true);
      }
    }
  };

  return (
    <sup className="inline-flex items-baseline mx-0.5 select-none align-center">
      <SourceHoverCard group={group}>
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded text-[10px] leading-none font-semibold bg-sidebar-accent text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors cursor-pointer"
        >
          {citationId}
        </button>
      </SourceHoverCard>
    </sup>
  );
};
