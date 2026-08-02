import { useMemo } from "react";
import {
  RuntimeAdapterProvider,
  useAuiState,
  type RemoteThreadListAdapter,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import {
  createChatThread,
  getChatThreadById,
  listChatThreads,
} from "@/services/chatApi";
import { useChatThreadStore } from "@/store/useChatThreadStore";
import { createAskThreadHistoryAdapter } from "./askThreadHistoryAdapter";

type RemoteThreadMetadata = {
  status: "regular" | "archived";
  remoteId: string;
  title?: string;
  lastMessageAt?: Date;
};

function AskThreadProvider({ children }: { children?: React.ReactNode }) {
  const remoteId = useAuiState(
    (s) =>
      (s as unknown as { threadListItem?: { remoteId?: string } })
        .threadListItem?.remoteId,
  );

  const historyAdapter = useMemo(
    () => (remoteId ? createAskThreadHistoryAdapter(remoteId) : undefined),
    [remoteId],
  );

  return (
    <RuntimeAdapterProvider adapters={{ history: historyAdapter }}>
      {children}
    </RuntimeAdapterProvider>
  );
}

export function useAskThreadListAdapter(): RemoteThreadListAdapter {
  return useMemo<RemoteThreadListAdapter>(
    () => ({
      async list() {
        try {
          const [activeThreads, archivedThreads] = await Promise.all([
            listChatThreads(),
            listChatThreads("ARCHIVED"),
          ]);

          const activeMetadata: RemoteThreadMetadata[] = activeThreads.map(
            (t) => ({
              status: "regular",
              remoteId: t.id,
              title: t.title,
              lastMessageAt: new Date(t.lastMessageAt),
            }),
          );

          const archivedMetadata: RemoteThreadMetadata[] = archivedThreads.map(
            (t) => ({
              status: "archived",
              remoteId: t.id,
              title: t.title,
              lastMessageAt: new Date(t.lastMessageAt),
            }),
          );

          return { threads: [...activeMetadata, ...archivedMetadata] };
        } catch {
          return { threads: [] };
        }
      },

      async fetch(id: string): Promise<RemoteThreadMetadata> {
        const detail = await getChatThreadById(id);
        return {
          status: detail.thread.status === "ARCHIVED" ? "archived" : "regular",
          remoteId: detail.thread.id,
          title: detail.thread.title,
          lastMessageAt: new Date(detail.thread.lastMessageAt),
        };
      },

      async rename(id: string, title: string) {
        await useChatThreadStore.getState().rename(id, title);
      },

      async archive(id: string) {
        await useChatThreadStore.getState().archive(id);
      },

      async unarchive(id: string) {
        await useChatThreadStore.getState().unarchive(id);
      },

      async delete(id: string) {
        await useChatThreadStore.getState().remove(id);
      },

      async generateTitle() {
        return createAssistantStream(async () => {});
      },

      // The runtime awaits this before it will run the first ask, so it has to
      // return a real id up front — the thread is created empty here and named
      // by the backend once the first question lands.
      async initialize() {
        const thread = await createChatThread();
        return { remoteId: thread.id };
      },

      unstable_Provider: AskThreadProvider,
    }),
    [],
  );
}
