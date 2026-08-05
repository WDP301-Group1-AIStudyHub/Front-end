import type { FC } from "react";
import { useAuiState } from "@assistant-ui/react";
import { findCommandByPrefix } from "./promptCommands";
import { CommandChip } from "./CommandChip";

export const CommandAwareText: FC = () => {
  const text = useAuiState((s) => (s.part.type === "text" ? s.part.text : ""));
  const match = findCommandByPrefix(text);

  if (!match) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const { command, rest } = match;

  return (
    <span className="whitespace-pre-wrap">
      <CommandChip
        iconKey={command.icon}
        chipLabel={command.chipLabel}
        variant="message"
      />
      {rest}
    </span>
  );
};
