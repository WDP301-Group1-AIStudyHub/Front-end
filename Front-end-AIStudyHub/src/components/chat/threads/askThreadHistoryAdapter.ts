import {
  ExportedMessageRepository,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import { getChatThreadById } from "@/services/chatApi";

export function createAskThreadHistoryAdapter(
  remoteId: string,
): ThreadHistoryAdapter {
  return {
    async load() {
      const detail = await getChatThreadById(remoteId);
      const sortedMessages = (detail.messages ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      const exportedMessages = sortedMessages.flatMap((item) => [
        {
          id: `${item.id}-user`,
          role: "user" as const,
          content: [{ type: "text" as const, text: item.question }],
          createdAt: new Date(item.createdAt),
        },
        {
          id: `${item.id}-assistant`,
          role: "assistant" as const,
          content: [{ type: "text" as const, text: item.answer }],
          metadata: {
            custom: {
              sources: item.sources ?? [],
              citedSources: item.citedSources ?? [],
            },
          },
          createdAt: new Date(item.createdAt),
        },
      ]);

      return ExportedMessageRepository.fromArray(exportedMessages);
    },
    async append() {
      // Deliberately omitted: /api/agent/ask/stream already persists turns server-side
    },
  };
}
