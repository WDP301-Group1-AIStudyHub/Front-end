import React, { useEffect, useRef, useState } from "react";
import { SourcesPanel } from "./SourcesPanel";
import { useThreadSources } from "./useThreadSources";
import { useSourcesPanel } from "./sourcesPanelStore";
import { ArtifactsPanel } from "../artifacts/ArtifactsPanel";
import { useArtifacts } from "../artifacts/artifactsStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SourcesAside: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { sources } = useThreadSources();
  const { artifacts, railToggleCount } = useArtifacts();
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);

  const hasSources = sources && sources.length > 0;
  const hasArtifacts = artifacts && artifacts.length > 0;
  const isGeneratingAny = artifacts?.some(
    (a) => a.status === "PENDING" || a.status === "GENERATING",
  );
  const hasContent = hasSources || hasArtifacts || isGeneratingAny;
  const isVisible = (hasContent || isPinned) && !isHidden;

  const lastToggleCountRef = useRef(railToggleCount);
  useEffect(() => {
    if (lastToggleCountRef.current !== railToggleCount) {
      lastToggleCountRef.current = railToggleCount;
      if (isVisible) {
        setIsHidden(true);
      } else {
        setIsPinned(true);
        setIsHidden(false);
      }
    }
  }, [railToggleCount, isVisible]);

  if (!hasContent && !isPinned) {
    return null;
  }

  return (
    <div className={cn("hidden lg:block group", className)}>
      {/* Button and panel slide together. The distance is the panel's own width
          plus the container's right offset, so the panel clears the viewport
          edge completely and the button — sitting to its left — lands just
          inside it, staying reachable as the handle that slides it back. */}
      <div
        className={cn("relative", isHidden && "translate-x-[calc(100%+2rem)]")}
      >
        <div
          className={cn(
            "absolute top-1 transition-opacity",
            isHidden
              ? "opacity-100 pr-12 -left-20"
              : "pr-2 -left-11 opacity-0 group-hover:opacity-100",
          )}
        >
          <Button
            variant={"ghost"}
            size="icon"
            className="text-muted-foreground transition-colors cursor-pointer bg-background! hover:bg-muted!"
            onClick={() => setIsHidden((prev) => !prev)}
            aria-expanded={!isHidden}
            aria-label={isHidden ? "Show side panel" : "Hide side panel"}
          >
            {isHidden ? <ChevronsLeftIcon /> : <ChevronsRightIcon />}
          </Button>
        </div>

        <div
          aria-hidden={isHidden}
          className="flex flex-col p-1 gap-3 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1 transition-transform duration-300"
        >
          <SourcesPanel />
          <ArtifactsPanel />
        </div>
      </div>
    </div>
  );
};

export const SourcesOverlay: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { sources } = useThreadSources();
  const { isOverlayOpen, setOverlayOpen } = useSourcesPanel();

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Popover open={isOverlayOpen} onOpenChange={setOverlayOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 ring-0 rounded-none shadow-none bg-transparent focus:outline-none"
      >
        <SourcesPanel collapsible={false} />
        <ArtifactsPanel collapsible={false} />
      </PopoverContent>
    </Popover>
  );
};
