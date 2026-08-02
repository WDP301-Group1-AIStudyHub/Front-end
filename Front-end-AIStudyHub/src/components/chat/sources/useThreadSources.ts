import { useEffect, useRef } from "react";
import { useAuiState } from "@assistant-ui/react";
import type { ChatSource } from "@/types/chat";
import { useSourcesPanel } from "./sourcesPanelStore";

interface ThreadMessage {
  id: string;
  role: string;
  metadata?: {
    custom?: Record<string, unknown>;
  };
}

export function useThreadSources(): {
  sources: ChatSource[];
  citedSources: ChatSource[];
  messageId: string | undefined;
} {
  const messages = useAuiState(
    (s) =>
      (s as unknown as { thread?: { messages?: readonly ThreadMessage[] } })
        ?.thread?.messages,
  );
  const { focus, setFocus } = useSourcesPanel();

  const assistantMessages = Array.isArray(messages)
    ? messages.filter((m) => m.role === "assistant")
    : [];

  const latestAssistantMessage = assistantMessages.slice().reverse().find((m) => {
    const rawSources = m.metadata?.custom?.sources;
    return Array.isArray(rawSources) && rawSources.length > 0;
  });

  // Clear focus when a NEW assistant answer arrives. This has to key off the
  // latest id *changing over time* — comparing it to the focused id instead
  // would clear focus the moment an older message is focused, which is the
  // whole point of cross-message focus.
  const latestId = latestAssistantMessage?.id;
  const previousLatestId = useRef(latestId);

  useEffect(() => {
    if (previousLatestId.current === latestId) return;
    previousLatestId.current = latestId;
    setFocus(null);
  }, [latestId, setFocus]);

  let activeMessage: ThreadMessage | undefined;

  if (focus) {
    activeMessage = assistantMessages.find((m) => m.id === focus.messageId);
  }

  if (!activeMessage) {
    activeMessage = latestAssistantMessage;
  }

  const rawSources = activeMessage?.metadata?.custom?.sources;
  const rawCited = activeMessage?.metadata?.custom?.citedSources;

  const sources: ChatSource[] = Array.isArray(rawSources)
    ? (rawSources as ChatSource[])
    : [];
  const citedSources: ChatSource[] = Array.isArray(rawCited)
    ? (rawCited as ChatSource[])
    : [];

  return {
    sources,
    citedSources,
    messageId: activeMessage?.id,
  };
}
