import { useCallback, useMemo } from "react";
import {
  unstable_useMentionAdapter,
  type Unstable_MentionDirective,
} from "@assistant-ui/react";
import type {
  Unstable_DirectiveFormatter,
  Unstable_TriggerAdapter,
  Unstable_TriggerItem,
} from "@assistant-ui/core";
import { PROMPT_COMMANDS, type PromptCommand } from "./promptCommands";

export type UseAskSlashCommandsProps = {
  onCommandSelected?: (command: PromptCommand) => void;
};

export const slashPromptFormatter: Unstable_DirectiveFormatter = {
  serialize: () => "",
  parse: (text: string) => [{ kind: "text", text }],
};

export function useAskSlashCommands({
  onCommandSelected,
}: UseAskSlashCommandsProps = {}): {
  adapter: Unstable_TriggerAdapter;
  directive: Unstable_MentionDirective;
} {
  const items = useMemo(
    () =>
      PROMPT_COMMANDS.map((cmd) => ({
        id: cmd.id,
        type: "command",
        label: cmd.menuLabel,
        description: cmd.description,
        metadata: {
          icon: cmd.icon,
          prompt: cmd.prompt,
          chipLabel: cmd.chipLabel,
        },
      })),
    [],
  );

  const onInserted = useCallback(
    (item: Unstable_TriggerItem) => {
      const command = PROMPT_COMMANDS.find((cmd) => cmd.id === item.id);
      if (command) {
        onCommandSelected?.(command);
      }
    },
    [onCommandSelected],
  );

  const { adapter, directive } = unstable_useMentionAdapter({
    items,
    includeModelContextTools: false,
    formatter: slashPromptFormatter,
    onInserted,
  });

  return { adapter, directive };
}

