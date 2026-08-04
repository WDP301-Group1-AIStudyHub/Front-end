import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  useThreadListItemRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Thread } from "@/components/thread";
import { askAgentStream, ChatApiError } from "@/services/chatApi";
import type { AskChatPayload } from "@/types/chat";
import { PageShell } from "@/components/layout/PageShell";
import { SourcesPanelProvider } from "@/components/chat/sources/sourcesPanelStore";
import { SourcesAside } from "@/components/chat/sources/SourcesAside";
import { useAskThreadListAdapter } from "@/components/chat/threads/useAskThreadListAdapter";
import { useChatThreadStore } from "@/store/useChatThreadStore";

export default function AskPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const threadId = searchParams.get("threadId") ?? undefined;

  const handleThreadIdChange = useCallback(
    (nextThreadId: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextThreadId) {
            next.set("threadId", nextThreadId);
          } else {
            next.delete("threadId");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const adapter = useAskThreadListAdapter();

  const runtimeHook = useCallback(() => {
    const threadListItemRuntime = useThreadListItemRuntime();

    const modelAdapter: ChatModelAdapter = useMemo(
      () => ({
        async *run({ messages, abortSignal }) {
          const lastMessage = messages[messages.length - 1];
          const text =
            lastMessage?.content
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("\n") ?? "";

          // Resolve the id here rather than closing over render-time state: the
          // runtime initializes a new thread immediately before starting this
          // run, so a memoized value would still be undefined and the backend
          // would mint a second thread. Already-initialized threads return their
          // cached id, so this never creates a duplicate.
          const { remoteId } = await threadListItemRuntime.initialize();

          const payload: AskChatPayload = { question: text };
          if (remoteId) {
            payload.threadId = remoteId;
          }

          try {
            const stream = askAgentStream(payload, abortSignal);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parts: any[] = [];
            let toolCallCounter = 0;

            for await (const event of stream) {
              if (abortSignal?.aborted) break;

              if (event.type === "agent_step") {
                let reasoningPart = parts.find((p) => p.type === "reasoning");
                if (!reasoningPart) {
                  reasoningPart = { type: "reasoning", text: "" };
                  parts.push(reasoningPart);
                }
                reasoningPart.text = `Thinking (Step ${event.step})...`;
                yield { content: [...parts] };
              } else if (event.type === "tool_start") {
                toolCallCounter++;
                const toolCallId = `${event.tool}-${toolCallCounter}`;
                parts.push({
                  type: "tool-call",
                  toolCallId,
                  toolName: event.tool,
                  args: (event.input ?? {}) as Record<string, unknown>,
                  argsText: JSON.stringify(event.input ?? {}),
                });
                yield { content: [...parts] };
              } else if (event.type === "tool_end") {
                const toolPart = [...parts]
                  .reverse()
                  .find(
                    (p) =>
                      p.type === "tool-call" &&
                      p.toolName === event.tool &&
                      !("result" in p),
                  );
                if (toolPart) {
                  toolPart.result = event.resultSummary;
                }
                yield { content: [...parts] };
              } else if (event.type === "grounding_check") {
                let reasoningPart = parts.find((p) => p.type === "reasoning");
                if (!reasoningPart) {
                  reasoningPart = { type: "reasoning", text: "" };
                  parts.push(reasoningPart);
                }
                reasoningPart.text = "Verifying answer against your notes...";
                yield { content: [...parts] };
              } else if (event.type === "final") {
                const result = event.data;
                const finalAnswer = result.answer;
                let currentText = "";
                const chunkSize = 4;
                const delayMs = 12;
                for (let i = 0; i < finalAnswer.length; i += chunkSize) {
                  if (abortSignal?.aborted) break;
                  currentText += finalAnswer.slice(i, i + chunkSize);

                  let textPart = parts.find((p) => p.type === "text");
                  if (!textPart) {
                    textPart = { type: "text", text: "" };
                    parts.push(textPart);
                  }
                  textPart.text = currentText;

                  yield {
                    content: [...parts],
                    metadata: {
                      custom: {
                        sources: result.sources ?? [],
                        citedSources: result.citedSources ?? [],
                      },
                    },
                  };
                  await new Promise((res) => setTimeout(res, delayMs));
                }
              } else if (event.type === "error") {
                parts.push({
                  type: "text",
                  text: `Error: ${event.message}`,
                });
                yield { content: [...parts] };
              }
            }

            // The thread already exists by this point (the runtime initialized
            // it before running); refresh picks up the title the backend just
            // derived from the first question.
            useChatThreadStore.getState().refresh();
          } catch (error) {
            if ((error as Error).name === "AbortError") return;
            let errorAnswer: string;
            if (error instanceof ChatApiError && error.status >= 500) {
              errorAnswer =
                "The server is busy or still waking up. Please send the message again in 10-15 seconds.";
            } else {
              const msg =
                error instanceof Error
                  ? error.message
                  : "Failed to get answer";
              errorAnswer = `Warning: ${msg}`;
            }
            yield {
              content: [{ type: "text", text: errorAnswer }],
            };
          }
        },
      }),
      [threadListItemRuntime],
    );

    return useLocalRuntime(modelAdapter);
  }, []);

  const runtime = useRemoteThreadListRuntime({
    threadId,
    onThreadIdChange: handleThreadIdChange,
    adapter,
    runtimeHook,
  });

  return (
    <PageShell variant={"chatbot"}>
      <AssistantRuntimeProvider runtime={runtime}>
        <SourcesPanelProvider>
          <Thread />
          <SourcesAside className="absolute top-17 right-4 max-w-90" />
        </SourcesPanelProvider>
      </AssistantRuntimeProvider>
    </PageShell>
  );
}
