import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  useThreadListItemRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Thread, type ThreadComponents } from "@/components/thread";
import { askAgentStream, ChatApiError } from "@/services/chatApi";
import type { AskChatPayload, AskChatResponse } from "@/types/chat";
import { PageShell } from "@/components/layout/PageShell";
import { SourcesPanelProvider } from "@/components/chat/sources/sourcesPanelStore";
import { ChatRightRail } from "@/components/chat/sources/SourcesAside";
import { useAskThreadListAdapter } from "@/components/chat/threads/useAskThreadListAdapter";
import { useChatThreadStore } from "@/store/useChatThreadStore";
import {
  ArtifactsProvider,
  useArtifacts,
} from "@/components/chat/artifacts/artifactsStore";
import { ArtifactToolCard } from "@/components/chat/artifacts/ArtifactToolCard";

function AskPageContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const threadId = searchParams.get("threadId") ?? undefined;
  const { addOptimistic, setThreadId } = useArtifacts();

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
            setThreadId(remoteId);
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parts: any[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let currentReasoningPart: any = null;
          // Survives the agent_step reset, so post-answer phases can find the
          // block that is already rendered above the answer.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let lastReasoningPart: any = null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let currentTextPart: any = null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolPartsMap = new Map<string, any>();
          let pendingAnswerDeltas = "";
          let isDone = false;
          let finalResult: AskChatResponse | null = null;
          let revisedReason: "grounding_failed" | "empty_answer" | null = null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let finalMetadata: any = null;

          const REVISION_NOTICE: Record<string, string> = {
            grounding_failed:
              "*Revised — the first draft was not supported by your documents.*",
            empty_answer: "*Revised — the first attempt returned nothing.*",
          };

          const stream = askAgentStream(payload, abortSignal);
          const streamPromise = (async () => {
            try {
              for await (const event of stream) {
                if (abortSignal?.aborted) break;

                if (event.type === "agent_step") {
                  currentReasoningPart = null;
                  if (currentTextPart) {
                    // Pre-tool prose discard: text generated before a tool step is not final answer
                    const idx = parts.indexOf(currentTextPart);
                    if (idx !== -1) parts.splice(idx, 1);
                    currentTextPart = null;
                    pendingAnswerDeltas = "";
                  }
                } else if (event.type === "thought") {
                  if (!currentReasoningPart) {
                    currentReasoningPart = { type: "reasoning", text: "" };
                    parts.push(currentReasoningPart);
                  }
                  lastReasoningPart = currentReasoningPart;
                  currentReasoningPart.text =
                    (currentReasoningPart.text
                      ? currentReasoningPart.text.trimEnd() + "\n\n"
                      : "") + event.text;
                } else if (event.type === "phase") {
                  // The narration floor. It appends rather than only creating
                  // a part when absent, so a second search within one step
                  // keeps its query.
                  const detailStr =
                    event.detail ??
                    (event.phase === "retrieving"
                      ? "Searching your notes..."
                      : event.phase === "verifying"
                      ? "Verifying answer against your notes..."
                      : "Applying citations...");

                  // `verifying` and `citing` run after the answer has already
                  // streamed, and the last agent_step cleared
                  // currentReasoningPart — so creating a part for them here
                  // would append it after the text part and render a second
                  // "Reasoning" disclosure *below* the answer. Route them into
                  // the block that is already above it instead.
                  const isPostAnswer =
                    event.phase === "verifying" || event.phase === "citing";
                  let target = isPostAnswer
                    ? lastReasoningPart
                    : currentReasoningPart;

                  if (!target) {
                    target = { type: "reasoning", text: "" };
                    const textIdx = currentTextPart
                      ? parts.indexOf(currentTextPart)
                      : -1;
                    if (isPostAnswer && textIdx !== -1) {
                      parts.splice(textIdx, 0, target);
                    } else {
                      parts.push(target);
                    }
                    if (!isPostAnswer) currentReasoningPart = target;
                    lastReasoningPart = target;
                  }

                  // Blank line between entries: this renders as markdown, so a
                  // single newline collapses and consecutive narration lines
                  // run together into one paragraph.
                  const existing = target.text ?? "";
                  if (!existing.trimEnd().endsWith(detailStr)) {
                    target.text =
                      (existing ? existing.trimEnd() + "\n\n" : "") + detailStr;
                  }
                } else if (event.type === "tool_start") {
                  const toolPart = {
                    type: "tool-call",
                    toolCallId: event.toolCallId,
                    toolName: event.tool,
                    args: (event.input ?? {}) as Record<string, unknown>,
                    argsText: JSON.stringify(event.input ?? {}),
                  };
                  toolPartsMap.set(event.toolCallId, toolPart);
                  parts.push(toolPart);
                } else if (event.type === "tool_end") {
                  const toolPart =
                    toolPartsMap.get(event.toolCallId) ??
                    [...parts]
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
                } else if (event.type === "artifact_created") {
                  addOptimistic(event);
                  // `artifact_created` carries no toolCallId — it is emitted
                  // from inside create_artifact, between that call's
                  // tool_start and tool_end — so the open call is found by
                  // scanning back for the most recent unresolved one.
                  const toolPart = [...parts]
                    .reverse()
                    .find(
                      (p) =>
                        p.type === "tool-call" &&
                        p.toolName === "create_artifact" &&
                        !("result" in p),
                    );
                  if (toolPart) {
                    toolPart.args = {
                      ...toolPart.args,
                      artifactId: event.artifactId,
                    };
                  }
                } else if (event.type === "answer_delta") {
                  pendingAnswerDeltas += event.text;
                } else if (event.type === "answer_revised") {
                  // Drop the streamed draft and remember why. The notice is
                  // held in a flag rather than written into the text part,
                  // because `final` overwrites that part wholesale — writing
                  // it here would erase it a moment later and the replacement
                  // would read as a glitch.
                  pendingAnswerDeltas = "";
                  revisedReason = event.reason;
                  if (currentTextPart) {
                    currentTextPart.text = "";
                  }
                } else if (event.type === "final") {
                  finalResult = event.data;
                } else if (event.type === "error") {
                  parts.push({
                    type: "text",
                    text: `Error: ${event.message}`,
                  });
                }
              }
            } catch (error) {
              if ((error as Error).name !== "AbortError") {
                let errorAnswer: string;
                if (error instanceof ChatApiError && error.status >= 500) {
                  errorAnswer =
                    "The server is busy or still waking up. Please send the message again in 10-15 seconds.";
                } else {
                  const msg =
                    error instanceof Error ? error.message : "Failed to get answer";
                  errorAnswer = `Warning: ${msg}`;
                }
                parts.push({ type: "text", text: errorAnswer });
              }
            } finally {
              isDone = true;
            }
          })();

          const chunkSize = 4;
          const delayMs = 12;

          while (!isDone || pendingAnswerDeltas.length > 0 || finalResult !== null) {
            if (abortSignal?.aborted) break;

            // Widened local: `finalResult` is only ever assigned inside the
            // stream task above, which TypeScript's control-flow analysis
            // cannot see, so it narrows the variable to `never` here.
            const settled: AskChatResponse | null =
              finalResult as AskChatResponse | null;

            // `final` outranks the pacing buffer. Gemini delivers an answer in
            // a few chunks milliseconds apart, so at this point the buffer can
            // still hold most of the answer — draining it at 4 chars / 12 ms
            // would hold the authoritative text and its citation chips back by
            // more than a second for no reason.
            if (settled !== null) {
              pendingAnswerDeltas = "";
              if (!currentTextPart) {
                currentTextPart = { type: "text", text: "" };
                parts.push(currentTextPart);
              }
              const notice = revisedReason
                ? `${REVISION_NOTICE[revisedReason]}\n\n`
                : "";
              currentTextPart.text = notice + settled.answer;
              finalMetadata = {
                custom: {
                  sources: settled.sources ?? [],
                  citedSources: settled.citedSources ?? [],
                },
              };
              yield { content: [...parts], metadata: finalMetadata };
              break;
            }

            if (pendingAnswerDeltas.length > 0) {
              if (!currentTextPart) {
                currentTextPart = { type: "text", text: "" };
                parts.push(currentTextPart);
              }
              const chunk = pendingAnswerDeltas.slice(0, chunkSize);
              pendingAnswerDeltas = pendingAnswerDeltas.slice(chunkSize);
              currentTextPart.text += chunk;

              yield { content: [...parts] };
              await new Promise((res) => setTimeout(res, delayMs));
              continue;
            }

            yield { content: [...parts] };
            await new Promise((res) => setTimeout(res, 30));
          }

          // The loop above can exit while asleep in its 30 ms tick — the
          // stream sets isDone from another task, so parts pushed just before
          // that (an `error` event, or the catch block's message) would never
          // be yielded and the message would render empty. Flush once, keeping
          // the metadata from `final` so this does not drop the source chips.
          if (!abortSignal?.aborted) {
            yield finalMetadata
              ? { content: [...parts], metadata: finalMetadata }
              : { content: [...parts] };
          }

          await streamPromise;

          // The thread already exists by this point (the runtime initialized
          // it before running); refresh picks up the title the backend just
          // derived from the first question.
          useChatThreadStore.getState().refresh();
        },
      }),
      [threadListItemRuntime, addOptimistic, setThreadId],
    );

    return useLocalRuntime(modelAdapter);
  }, [addOptimistic, setThreadId]);

  const runtime = useRemoteThreadListRuntime({
    threadId,
    onThreadIdChange: handleThreadIdChange,
    adapter,
    runtimeHook,
  });

  const threadComponents: ThreadComponents = useMemo(
    () => ({
      toolsByName: {
        create_artifact: ArtifactToolCard,
      },
    }),
    [],
  );

  return (
    <PageShell variant={"chatbot"}>
      <AssistantRuntimeProvider runtime={runtime}>
        <SourcesPanelProvider>
          <Thread components={threadComponents} />
          <ChatRightRail className="absolute top-17 right-4 max-w-90" />
        </SourcesPanelProvider>
      </AssistantRuntimeProvider>
    </PageShell>
  );
}

export default function AskPage() {
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get("threadId") ?? undefined;

  return (
    <ArtifactsProvider threadId={threadId}>
      <AskPageContent />
    </ArtifactsProvider>
  );
}
