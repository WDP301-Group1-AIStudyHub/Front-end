import React, { useState } from "react";
import { SourcesPanel } from "./SourcesPanel";
import { useThreadSources } from "./useThreadSources";
import { useSourcesPanel } from "./sourcesPanelStore";
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
  // Must stay above the early return — hooks cannot be called conditionally,
  // and `sources` goes from empty to populated as the first answer lands.
  const [isHidden, setIsHidden] = useState(false);

  if (!sources || sources.length === 0) {
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
            onClick={() => setIsHidden(!isHidden)}
            aria-expanded={!isHidden}
            aria-label={isHidden ? "Show sources panel" : "Hide sources panel"}
          >
            {isHidden ? <ChevronsLeftIcon /> : <ChevronsRightIcon />}
          </Button>
        </div>

        <div
          aria-hidden={isHidden}
          className="flex flex-col gap-2 overflow-y-auto scrollbar-none max-h-[calc(100vh-4rem)] transition-transform duration-300"
        >
          <SourcesPanel />
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
        className="w-80 p-0 border-0 shadow-2xl bg-transparent focus:outline-none"
      >
        <SourcesPanel collapsible={false} />
      </PopoverContent>
    </Popover>
  );
};
