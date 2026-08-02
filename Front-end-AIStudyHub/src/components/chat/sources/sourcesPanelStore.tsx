import React, { createContext, useContext, useEffect, useState } from "react";

export interface PanelFocus {
  messageId: string;
  citationId: number;
}

interface SourcesPanelContextType {
  focus: PanelFocus | null;
  setFocus: (focus: PanelFocus | null) => void;
  isCollapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isOverlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
}

const STORAGE_KEY = "sources_panel_collapsed";

const SourcesPanelContext = createContext<SourcesPanelContextType | null>(null);

export const SourcesPanelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [focus, setFocus] = useState<PanelFocus | null>(null);
  const [isOverlayOpen, setOverlayOpen] = useState<boolean>(false);

  const [isCollapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    } catch {
      // Ignore quota/access errors
    }
  }, [isCollapsed]);

  return (
    <SourcesPanelContext.Provider
      value={{
        focus,
        setFocus,
        isCollapsed,
        setCollapsed,
        isOverlayOpen,
        setOverlayOpen,
      }}
    >
      {children}
    </SourcesPanelContext.Provider>
  );
};

export const useSourcesPanel = (): SourcesPanelContextType => {
  const context = useContext(SourcesPanelContext);
  if (!context) {
    throw new Error("useSourcesPanel must be used within a SourcesPanelProvider");
  }
  return context;
};
