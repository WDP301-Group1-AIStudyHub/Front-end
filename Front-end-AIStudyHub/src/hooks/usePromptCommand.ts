import { useCallback, useState } from "react";
import {
  type PromptCommand,
  applyCommandToText,
} from "@/components/composer/promptCommands";

export type UsePromptCommandReturn = {
  activeCommand: PromptCommand | null;
  select: (command: PromptCommand) => void;
  clear: () => void;
  transformText: (text: string) => string;
};

export function usePromptCommand(): UsePromptCommandReturn {
  const [activeCommand, setActiveCommand] = useState<PromptCommand | null>(
    null,
  );

  const select = useCallback((command: PromptCommand) => {
    setActiveCommand(command);
  }, []);

  const clear = useCallback(() => {
    setActiveCommand(null);
  }, []);

  const transformText = useCallback(
    (text: string) => {
      if (!activeCommand) return text;
      const result = applyCommandToText(activeCommand, text);
      setActiveCommand(null);
      return result;
    },
    [activeCommand],
  );

  return {
    activeCommand,
    select,
    clear,
    transformText,
  };
}
