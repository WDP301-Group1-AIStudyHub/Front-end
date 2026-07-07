import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type {
  ChatModelAdapter,
  ThreadMessage,
  ThreadMessageLike,
} from "@assistant-ui/react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  GripVertical,
  Library,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Timer,
  Zap,
  CircleAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Thread } from "@/components/assistant-ui/thread";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArtifactsPanel } from "../components/chat/ArtifactsPanel";
import {
  CelestialLoader,
  LoadingState,
} from "../components/shared/CelestialLoading";
import {
  deleteArtifact,
  initiateArtifact,
  listArtifacts,
} from "../services/artifactApi";
import type { ArtifactRecord, ArtifactType } from "../services/artifactApi";
import {
  ChatApiError,
  askAgentStream,
  getChatThreadById,
} from "../services/chatApi";
import { listDocuments } from "../services/documentApi";
import { extractArtifacts } from "../utils/extractArtifacts";
import { getFileBadgeClass } from "../utils/formatters";
import { normalizeSubjectColor } from "../utils/subjectColor";
import type {
  AskChatPayload,
  ChatEvaluation,
  ChatScope,
  ChatSource,
} from "../types/chat";
import type { DocumentItem } from "../types/document";

// ── Inner component: owns the runtime so key-remount works correctly ──────────
type ChatThreadProps = {
  adapter: ChatModelAdapter;
  initialMessages: readonly ThreadMessageLike[];
  onClearSelectedDoc?: () => void;
  selectedDoc?: {
    fileName: string;
    subject?: string;
    subjectColor?: string;
    semester?: string;
  };
  sourcesCount: number;
};

function ChatThread({
  adapter,
  initialMessages,
  onClearSelectedDoc,
  selectedDoc,
  sourcesCount,
}: ChatThreadProps) {
  const runtime = useLocalRuntime(adapter, { initialMessages });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread
        onClearSelectedDoc={onClearSelectedDoc}
        selectedDoc={selectedDoc}
        sourcesCount={sourcesCount}
      />
    </AssistantRuntimeProvider>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function getMessageText(message: ThreadMessage) {
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function getDocumentSubject(doc?: DocumentItem) {
  return doc && typeof doc.subject === "object" ? doc.subject : null;
}

function getDocumentSubjectName(doc?: DocumentItem) {
  return (
    getDocumentSubject(doc)?.name ||
    (typeof doc?.subject === "string" ? doc.subject : undefined)
  );
}

function getDocumentSubjectId(doc?: DocumentItem) {
  return getDocumentSubject(doc)?._id || doc?.subjectId;
}

function getDocumentSemester(doc?: DocumentItem) {
  return getDocumentSubject(doc)?.semester?.trim() || "No semester";
}

function getDocumentSubjectKey(doc: DocumentItem) {
  return (
    getDocumentSubjectId(doc) || getDocumentSubjectName(doc) || "No subject"
  );
}

export default function NewAIChatboxPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const threadId = useMemo(
    () => searchParams.get("threadId") ?? undefined,
    [searchParams],
  );

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [lastSources, setLastSources] = useState<ChatSource[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<ChatEvaluation | null>(
    null,
  );
  const [contextPanelWidth, setContextPanelWidth] = useState(340);
  const [isResizingContext, setIsResizingContext] = useState(false);
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);

  // History loading
  const [historyMessages, setHistoryMessages] = useState<
    readonly ThreadMessageLike[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Completed AI answers in this session; artifacts are derived from these.
  const [sessionAnswers, setSessionAnswers] = useState<
    { id: string; text: string }[]
  >([]);

  // Backend-generated artifacts (flashcards, quiz, mindmap, report, table).
  const [backendArtifacts, setBackendArtifacts] = useState<ArtifactRecord[]>(
    [],
  );

  // Fetch all messages in the thread and reconstruct full conversation
  useEffect(() => {
    if (!threadId) {
      setHistoryMessages([]);
      setLastSources([]);
      setLastEvaluation(null);
      setSessionAnswers([]);
      // Show artifacts created from a fresh chat before its thread existed.
      listArtifacts("none")
        .then(setBackendArtifacts)
        .catch(() => setBackendArtifacts([]));
      return;
    }
    setLoadingHistory(true);
    listArtifacts(threadId)
      .then(setBackendArtifacts)
      .catch(() => setBackendArtifacts([]));
    getChatThreadById(threadId)
      .then((detail) => {
        const sorted = [...detail.messages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        // Restore context from the thread snapshot first, then the latest message.
        const last = sorted[sorted.length - 1];
        if (detail.thread.documentIds?.length)
          setSelectedDocIds(detail.thread.documentIds);
        else if (detail.thread.documentId)
          setSelectedDocIds([detail.thread.documentId]);
        else if (last?.documentIds?.length) setSelectedDocIds(last.documentIds);
        else if (last?.documentId) setSelectedDocIds([last.documentId]);
        else setSelectedDocIds([]);
        if (last?.sources?.length) setLastSources(last.sources);
        else setLastSources([]);
        if (last?.evaluation) setLastEvaluation(last.evaluation);
        else setLastEvaluation(null);
        // Reconstruct full thread: each item → user + assistant message
        const messages: ThreadMessageLike[] = [];
        for (const item of sorted) {
          messages.push({
            role: "user",
            content: item.question,
            id: `${item.id}-user`,
            createdAt: new Date(item.createdAt),
          });
          messages.push({
            role: "assistant",
            content: item.answer,
            id: `${item.id}-assistant`,
            createdAt: new Date(item.updatedAt),
          });
        }
        setHistoryMessages(messages);
        // Fallback "couldn't answer" responses aren't artifacts worth keeping.
        setSessionAnswers(
          sorted
            .filter((item) => !item.evaluation?.fallbackGenerated)
            .map((item) => ({ id: item.id, text: item.answer })),
        );
      })
      .catch(() => setHistoryMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [threadId]);

  // Refs so the stable adapter closure can read latest state
  const selectedDocIdsRef = useRef<string[]>([]);
  const selectedSubjectIdRef = useRef<string | undefined>(undefined);
  const selectedDocSubjectRef = useRef<string | undefined>(undefined);
  const currentThreadIdRef = useRef<string | undefined>(threadId);
  const onResponseRef = useRef<
    ((sources: ChatSource[], evaluation?: ChatEvaluation) => void) | null
  >(null);
  const onAnswerRef = useRef<((answer: string) => void) | null>(null);
  const onArtifactCreatedRef = useRef<
    | ((event: {
        artifactId: string;
        artifactType: string;
        title: string;
      }) => void)
    | null
  >(null);

  useEffect(() => {
    currentThreadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    if (!isResizingContext) return;

    const handleMouseMove = (event: MouseEvent) => {
      const nextWidth = window.innerWidth - event.clientX - 20;
      setContextPanelWidth(Math.min(Math.max(nextWidth, 280), 520));
    };

    const handleMouseUp = () => setIsResizingContext(false);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingContext]);

  useEffect(() => {
    selectedDocIdsRef.current = selectedDocIds;
    const firstDoc = documents.find((d) => d.id === selectedDocIds[0]);
    selectedSubjectIdRef.current = getDocumentSubjectId(firstDoc);
    selectedDocSubjectRef.current = getDocumentSubjectName(firstDoc);
  }, [selectedDocIds, documents]);

  // Keep response callback up-to-date without recreating the adapter
  useEffect(() => {
    onResponseRef.current = (sources, evaluation) => {
      setLastSources(sources);
      if (evaluation) setLastEvaluation(evaluation);
    };
    onAnswerRef.current = (answer) => {
      setSessionAnswers((current) => [
        ...current,
        { id: crypto.randomUUID(), text: answer },
      ]);
    };
    onArtifactCreatedRef.current = (event) => {
      // Optimistic placeholder; polling replaces it with the real record.
      setBackendArtifacts((current) => {
        if (current.some((artifact) => artifact._id === event.artifactId)) {
          return current;
        }
        const now = new Date().toISOString();
        const placeholder: ArtifactRecord = {
          _id: event.artifactId,
          userId: "",
          threadId: currentThreadIdRef.current,
          type: event.artifactType as ArtifactType,
          status: "GENERATING",
          title: event.title,
          sourceDocumentIds: [],
          createdAt: now,
          updatedAt: now,
        };
        return [placeholder, ...current];
      });
    };
  }, []);

  // Poll while any artifact is still generating (same pattern as the study
  // materials pages).
  useEffect(() => {
    const hasGenerating = backendArtifacts.some(
      (artifact) =>
        artifact.status === "PENDING" || artifact.status === "GENERATING",
    );
    if (!hasGenerating) return;

    const interval = setInterval(async () => {
      const activeThreadId = threadId ?? currentThreadIdRef.current;
      try {
        const fresh = await listArtifacts(activeThreadId ?? "none");
        setBackendArtifacts(fresh);
      } catch {
        // Transient fetch failure; next tick retries.
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [backendArtifacts, threadId]);

  // Load user documents once on mount
  useEffect(() => {
    listDocuments()
      .then((docs) => {
        setDocuments(docs);
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocs(false));
  }, []);

  const artifacts = useMemo(
    () =>
      sessionAnswers.flatMap((answer) =>
        extractArtifacts(answer.text, answer.id),
      ),
    [sessionAnswers],
  );

  // Same scope fields the chat payload uses, built from the current selection.
  const buildArtifactScope = () => {
    const firstDoc = documents.find((doc) => doc.id === selectedDocIds[0]);
    return {
      subject: getDocumentSubjectName(firstDoc) || undefined,
      subjectId: getDocumentSubjectId(firstDoc) || undefined,
      scope: (selectedDocIds.length === 0
        ? "library_all"
        : selectedDocIds.length === 1
          ? "single_document"
          : "document_set") as ChatScope,
      documentId: selectedDocIds.length === 1 ? selectedDocIds[0] : undefined,
      documentIds: selectedDocIds.length > 1 ? selectedDocIds : undefined,
    };
  };

  const handleCreateArtifact = async (
    type: ArtifactType,
    instructions: string,
  ) => {
    const record = await initiateArtifact({
      type,
      instructions: instructions || undefined,
      threadId: threadId ?? currentThreadIdRef.current,
      ...buildArtifactScope(),
    });
    setBackendArtifacts((current) => [record, ...current]);
  };

  const handleDeleteArtifact = (id: string) => {
    setBackendArtifacts((current) =>
      current.filter((artifact) => artifact._id !== id),
    );
    deleteArtifact(id).catch(() => {});
  };

  const handleRetryArtifact = async (record: ArtifactRecord) => {
    try {
      const fresh = await initiateArtifact({
        type: record.type,
        title: record.title,
        instructions: record.instructions,
        threadId: record.threadId,
        documentId:
          record.sourceDocumentIds.length === 1
            ? record.sourceDocumentIds[0]
            : undefined,
        documentIds:
          record.sourceDocumentIds.length > 1
            ? record.sourceDocumentIds
            : undefined,
        subjectId: record.subjectId,
        scope: record.scope as ChatScope | undefined,
      });
      setBackendArtifacts((current) => [
        fresh,
        ...current.filter((artifact) => artifact._id !== record._id),
      ]);
      deleteArtifact(record._id).catch(() => {});
    } catch (err) {
      console.error("Failed to retry artifact generation", err);
    }
  };

  const selectedDocs = useMemo(
    () =>
      selectedDocIds
        .map((id) => documents.find((doc) => doc.id === id))
        .filter((doc): doc is DocumentItem => Boolean(doc)),
    [documents, selectedDocIds],
  );

  const toggleDocumentSelection = (doc: DocumentItem) => {
    const docSubjectKey = getDocumentSubjectKey(doc);
    setSelectedDocIds((current) => {
      const selectedFromSameSubject =
        current.length === 0 ||
        documents
          .filter((item) => current.includes(item.id))
          .every((item) => getDocumentSubjectKey(item) === docSubjectKey);

      if (!selectedFromSameSubject) {
        return [doc.id];
      }

      return current.includes(doc.id)
        ? current.filter((id) => id !== doc.id)
        : [...current, doc.id];
    });
  };

  const toggleSubjectSelection = (docs: DocumentItem[]) => {
    const ids = docs.map((doc) => doc.id);
    const allSelected = ids.every((id) => selectedDocIds.includes(id));
    setSelectedDocIds(allSelected ? [] : ids);
  };

  // Real adapter: POST /api/chat/ask (DR-RAG pipeline) or /api/agent/ask
  // (agentic engine), depending on the header toggle.
  const realAdapter = useMemo<ChatModelAdapter>(
    () => ({
      async *run({ messages, abortSignal }) {
        const lastMsg = [...messages].reverse().find((m) => m.role === "user");
        const question = lastMsg ? getMessageText(lastMsg) : "";

        const docIds = selectedDocIdsRef.current;
        const subjectId = selectedSubjectIdRef.current;
        const docSubject = selectedDocSubjectRef.current;

        const payload: AskChatPayload = {
          question,
          threadId: currentThreadIdRef.current,
          subject: docSubject || undefined,
          subjectId: subjectId || undefined,
          scope:
            docIds.length === 0
              ? "library_all"
              : docIds.length === 1
                ? "single_document"
                : "document_set",
        };

        if (docIds.length === 1) {
          payload.documentId = docIds[0];
        } else if (docIds.length > 1) {
          payload.documentIds = docIds;
        }

        try {
          const stream = askAgentStream(payload, abortSignal);
          let createdThreadId: string | undefined;
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
            } else if (event.type === "artifact_created") {
              onArtifactCreatedRef.current?.(event);
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
              if (result.threadId) {
                createdThreadId = result.threadId;
                currentThreadIdRef.current = result.threadId;
              }
              onResponseRef.current?.(result.sources, result.evaluation);
              if (!result.evaluation?.fallbackGenerated) {
                onAnswerRef.current?.(result.answer);
              }

              // Instantly switch to typing effect for the final verified response
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
                };
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              }
            } else if (event.type === "error") {
              parts.push({
                type: "text",
                text: `Error: ${event.message}`,
              });
              yield { content: [...parts] };
            }
          }

          if (!threadId && createdThreadId) {
            navigate(`/aichatbox?threadId=${createdThreadId}`, {
              replace: true,
            });
          }
          window.dispatchEvent(new Event("chat-threads:refresh"));
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError")
            throw err;
          let errorAnswer: string;
          if (err instanceof ChatApiError && err.status >= 500) {
            errorAnswer =
              "The server is busy or still waking up. Please send the message again in 10-15 seconds.";
          } else {
            const msg =
              err instanceof Error ? err.message : "Failed to get answer";
            errorAnswer = `Warning: ${msg}`;
          }
          yield {
            content: [{ type: "text" as const, text: errorAnswer }],
          };
        }
      },
    }),
    [navigate, threadId],
  );

  const selectedContext = selectedDocs[0]
    ? {
        fileName:
          selectedDocs.length === 1
            ? selectedDocs[0].fileName
            : `${selectedDocs.length} documents selected`,
        subject: getDocumentSubjectName(selectedDocs[0]),
        subjectColor: getDocumentSubject(selectedDocs[0])?.color,
        semester: getDocumentSemester(selectedDocs[0]),
      }
    : undefined;

  // selectedContextLabel is used by the mobile context sheet trigger
  const _selectedContextLabel = selectedContext
    ? selectedDocs.length === 1
      ? selectedContext.subject || selectedContext.fileName
      : `${selectedDocs.length} docs - ${selectedContext.subject || "Selected subject"}`
    : "All documents";
  void _selectedContextLabel;

  return (
    <main className="botanical-page flex h-svh min-h-0 w-full flex-col overflow-hidden p-3 pb-24 text-foreground sm:p-5 sm:pb-24 lg:pb-5">
      <header className="border-b border-border px-2 pb-4 sm:px-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="moonlit-title page-title page-title--compact">
                AI Study Chat
              </h1>
              <p className="text-sm text-muted-foreground">
                Searches and verifies before answering
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {threadId && (
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 border-primary/30 px-3 py-2 text-primary hover:bg-primary/10"
                onClick={() => {
                  navigate("/aichatbox");
                }}
              >
                <Plus className="size-4" />
                New conversation
              </Button>
            )}
            <Button
              className="inline-flex items-center gap-2 px-3 py-2 lg:hidden"
              onClick={() => setIsMobileContextOpen(true)}
              size="sm"
              variant="outline"
            >
              <Library className="size-4" aria-hidden="true" />
              Study context
            </Button>

          </div>
        </div>
      </header>

      <div
        className="botanical-bento mt-4 grid min-h-0 w-full flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_12px_var(--context-panel-width)]"
        style={
          {
            "--context-panel-width": `${contextPanelWidth}px`,
          } as React.CSSProperties
        }
      >
        <section className="min-h-0 w-full bg-transparent">
          {loadingHistory ? (
            <LoadingState
              className="m-5 h-[calc(100%-2.5rem)]"
              label="Loading chat history..."
              tone="mist"
            />
          ) : (
            <ChatThread
              key={threadId ?? "new"}
              adapter={realAdapter}
              initialMessages={historyMessages}
              onClearSelectedDoc={() => setSelectedDocIds([])}
              selectedDoc={selectedContext}
              sourcesCount={lastSources.length}
            />
          )}
        </section>

        {/* ── Resizer drag handle ──────────────────────────── */}
        <div
          aria-label="Resize study context panel"
          className={`group/resizer relative hidden cursor-col-resize lg:flex items-center justify-center transition-colors ${
            isResizingContext
              ? "bg-primary/20"
              : "bg-transparent hover:bg-primary/10"
          }`}
          onMouseDown={() => setIsResizingContext(true)}
          role="separator"
        >
          <div
            className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${
              isResizingContext
                ? "text-primary"
                : "text-muted-foreground group-hover/resizer:text-primary"
            }`}
          >
            <GripVertical className="size-3" />
          </div>
        </div>

        <aside className="hidden min-h-0 border-l border-border bg-[#f7f8f7] p-5 lg:block">
          <div className="flex h-full flex-col gap-5 overflow-y-auto">
            {/* Document context selector */}
            <section className="border-b border-border pb-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-card-foreground">
                  Study Context
                </h2>
              </div>

              <DocumentPickerList
                documents={documents}
                selectedDocIds={selectedDocIds}
                onToggleDoc={toggleDocumentSelection}
                onToggleSubject={toggleSubjectSelection}
                onClearSelection={() => setSelectedDocIds([])}
                loading={loadingDocs}
              />
            </section>

            {/* Things the AI created in this session */}
            <ArtifactsPanel
              artifacts={artifacts}
              backendArtifacts={backendArtifacts}
              onCreate={handleCreateArtifact}
              onDelete={handleDeleteArtifact}
              onRetry={handleRetryArtifact}
            />

            {/* Sources returned by the last response */}
            {lastSources.length > 0 && (
              <section className="border-b border-border pb-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                    <Search
                      className="size-4 text-foreground"
                      aria-hidden="true"
                    />
                    Retrieved sources
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {lastSources.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {lastSources.map((source, i) => {
                    const pct =
                      typeof source.relevanceScore === "number"
                        ? Math.round(source.relevanceScore * 100)
                        : null;
                    return (
                      <div
                        key={i}
                        className="group/source rounded-lg border border-border/70 bg-background/35 p-3 text-xs transition-all hover:border-primary/40 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                              <FileText
                                className="size-3 text-primary"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="truncate font-medium text-card-foreground">
                              {source.title}
                            </span>
                          </div>
                          {pct !== null && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                pct >= 80
                                  ? "bg-emerald-100 text-emerald-700"
                                  : pct >= 50
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {pct}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-muted-foreground leading-relaxed">
                          {source.contentPreview}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* RAG evaluation metrics */}
            {lastEvaluation && (
              <section className="border-b border-border pb-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <Zap className="size-4 text-foreground" aria-hidden="true" />
                  RAG evaluation
                </div>
                <div className="space-y-3">
                  {/* Confidence */}
                  <EvalMetricBar
                    label="Confidence"
                    value={lastEvaluation.confidenceScore}
                  />
                  {/* Avg relevance */}
                  <EvalMetricBar
                    label="Avg relevance"
                    value={lastEvaluation.averageRelevanceScore}
                  />
                  {/* Chunks used */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Chunks used</span>
                    <span className="font-semibold text-card-foreground">
                      <span className="text-primary">
                        {lastEvaluation.relevantChunksCount}
                      </span>
                      <span className="text-muted-foreground">
                        /{lastEvaluation.retrievedChunksCount}
                      </span>
                    </span>
                  </div>
                  {/* Response time */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Timer className="size-3" aria-hidden="true" />
                      Response time
                    </span>
                    <span className="font-semibold text-card-foreground">
                      {(lastEvaluation.responseTimeMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  {/* Grounded chip */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Grounded</span>
                    {lastEvaluation.isGrounded ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <ShieldCheck className="size-3" aria-hidden="true" />
                        Grounded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Shield className="size-3" aria-hidden="true" />
                        Not grounded
                      </span>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* How-to hint shown before any response */}
            {!lastEvaluation && (
              <section className="border-b border-border pb-5">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <BookOpen
                    className="size-4 text-foreground"
                    aria-hidden="true"
                  />
                  How to use
                </div>
                <ol className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      1
                    </span>
                    <span>
                      Select a document for narrow answers, or use all
                      documents.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      2
                    </span>
                    <span>Ask a question about your study material.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      3
                    </span>
                    <span>The AI uses DR-RAG to answer from your docs.</span>
                  </li>
                </ol>
              </section>
            )}
          </div>
        </aside>
      </div>

      <Sheet open={isMobileContextOpen} onOpenChange={setIsMobileContextOpen}>
        <SheetContent
          className="w-[min(92vw,420px)] flex flex-col h-full overflow-hidden"
          side="right"
        >
          <SheetHeader className="shrink-0">
            <SheetTitle>Study context</SheetTitle>
            <SheetDescription>
              Select the documents AI can use for this conversation.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-1">
            <DocumentPickerList
              documents={documents}
              selectedDocIds={selectedDocIds}
              onToggleDoc={toggleDocumentSelection}
              onToggleSubject={toggleSubjectSelection}
              onClearSelection={() => setSelectedDocIds([])}
              loading={loadingDocs}
            />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

// ── Shared Document Picker Component ──────────────────────────────────────────

type DocumentPickerListProps = {
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleDoc: (doc: DocumentItem) => void;
  onToggleSubject: (docs: DocumentItem[]) => void;
  onClearSelection: () => void;
  loading?: boolean;
};

function DocumentPickerList({
  documents,
  selectedDocIds,
  onToggleDoc,
  onToggleSubject,
  onClearSelection,
  loading,
}: DocumentPickerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());

  // Filter documents by file name or subject name
  const filteredDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((doc) => {
      const fileName = (doc.fileName || "").toLowerCase();
      const subjectName = (getDocumentSubjectName(doc) || "").toLowerCase();
      return fileName.includes(query) || subjectName.includes(query);
    });
  }, [documents, searchQuery]);

  // Group filtered documents by Semester and Subject
  const grouped = useMemo(() => {
    const map: Record<
      string,
      {
        semesterName: string;
        subjects: Record<
          string,
          {
            subjectName: string;
            subjectColor: string;
            docs: DocumentItem[];
          }
        >;
      }
    > = {};

    for (const doc of filteredDocs) {
      const subjName = getDocumentSubjectName(doc) || "No subject";
      const subjKey = getDocumentSubjectKey(doc);
      const semesterName = getDocumentSemester(doc);
      const rawColor = getDocumentSubject(doc)?.color;
      const subjectColor = normalizeSubjectColor(rawColor);

      if (!map[semesterName]) {
        map[semesterName] = {
          semesterName,
          subjects: {},
        };
      }
      if (!map[semesterName].subjects[subjKey]) {
        map[semesterName].subjects[subjKey] = {
          subjectName: subjName,
          subjectColor: subjectColor,
          docs: [],
        };
      }
      map[semesterName].subjects[subjKey].docs.push(doc);
    }
    return map;
  }, [filteredDocs]);

  // Auto-expand all subjects when search query changes to make found docs visible
  useEffect(() => {
    if (searchQuery.trim()) {
      const subjs = new Set<string>();
      for (const doc of filteredDocs) {
        const subjKey = getDocumentSubjectKey(doc);
        const semesterName = getDocumentSemester(doc);
        subjs.add(`${semesterName}::${subjKey}`);
      }
      setOpenSubjects(subjs);
    }
  }, [searchQuery, filteredDocs]);

  // Initialize all subjects as open on first mount when documents load
  useEffect(() => {
    if (documents.length > 0 && openSubjects.size === 0 && !searchQuery) {
      const subjs = new Set<string>();
      for (const doc of documents) {
        const subjKey = getDocumentSubjectKey(doc);
        const semesterName = getDocumentSemester(doc);
        subjs.add(`${semesterName}::${subjKey}`);
      }
      setOpenSubjects(subjs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <CelestialLoader
          label="Loading documents..."
          size="sm"
          tone="sapphire"
        />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No documents yet. Upload one in the Library.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search documents or subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
        />
      </div>

      {/* "All documents" button */}
      <button
        onClick={onClearSelection}
        className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-colors flex items-center justify-between ${
          selectedDocIds.length === 0
            ? "border-primary/60 bg-primary/10 text-primary font-medium"
            : "border-border/70 bg-background text-muted-foreground hover:border-primary/35 hover:text-foreground"
        }`}
      >
        <span>All documents</span>
        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
          {documents.length}
        </span>
      </button>

      {filteredDocs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No matches found.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([semesterName, semesterGroup]) => (
            <div key={semesterName} className="space-y-2">
              {/* Semester name: plain text label */}
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {semesterGroup.semesterName}
              </div>

              {/* Subject rows */}
              <div className="space-y-2.5 pl-1">
                {Object.entries(semesterGroup.subjects).map(
                  ([subjectKey, subjectGroup]) => {
                    const subjectOpenKey = `${semesterName}::${subjectKey}`;
                    const subjectOpen = openSubjects.has(subjectOpenKey);
                    const { docs, subjectColor, subjectName } = subjectGroup;
                    const allSubjectDocsSelected = docs.every((doc) =>
                      selectedDocIds.includes(doc.id),
                    );

                    return (
                      <div key={subjectOpenKey} className="space-y-1">
                        {/* Subject lightweight row */}
                        <div className="flex items-center justify-between py-1 px-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenSubjects((prev) => {
                                const next = new Set(prev);
                                if (next.has(subjectOpenKey)) {
                                  next.delete(subjectOpenKey);
                                } else {
                                  next.add(subjectOpenKey);
                                }
                                return next;
                              });
                            }}
                            className="flex flex-1 min-w-0 items-center gap-2 text-left"
                          >
                            {/* Tinted dot representing the subject color */}
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: subjectColor }}
                            />
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-card-foreground">
                              {subjectName}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground font-medium">
                              ({docs.length})
                            </span>
                            <ChevronDown
                              className={`size-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                subjectOpen ? "rotate-0" : "-rotate-90"
                              }`}
                            />
                          </button>

                          <label
                            className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ml-2 select-none border ${
                              allSubjectDocsSelected &&
                              docs.some((d) => selectedDocIds.includes(d.id))
                                ? "border-primary/60 bg-primary/10 text-primary"
                                : "border-border/70 bg-background text-muted-foreground hover:border-primary/35 hover:text-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                allSubjectDocsSelected &&
                                docs.some((d) => selectedDocIds.includes(d.id))
                              }
                              onChange={() => onToggleSubject(docs)}
                              className="size-3 rounded border-border"
                              style={{ accentColor: subjectColor }}
                            />
                            All
                          </label>
                        </div>

                        {/* Documents list */}
                        {subjectOpen && (
                          <div className="ml-2.5 pl-2.5 border-l border-border/60 space-y-1 pt-0.5">
                            {docs.map((doc) => {
                              const isSelected = selectedDocIds.includes(
                                doc.id,
                              );
                              return (
                                <label
                                  key={doc.id}
                                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all text-xs ${
                                    isSelected
                                      ? "text-foreground font-medium bg-muted/30"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  }`}
                                  style={
                                    isSelected
                                      ? {
                                          borderLeft: `2px solid ${subjectColor}`,
                                          paddingLeft: "6px",
                                        }
                                      : undefined
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onToggleDoc(doc)}
                                    className="size-3.5 shrink-0 rounded border-border"
                                    style={{ accentColor: subjectColor }}
                                  />
                                  <span
                                    className={`admin-icon-badge ${getFileBadgeClass(doc.fileName)} flex size-5 shrink-0 items-center justify-center rounded`}
                                  >
                                    <FileText
                                      className="size-3"
                                      aria-hidden="true"
                                    />
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-[11px]">
                                    {doc.fileName}
                                  </span>
                                  {isSelected && (
                                    <div
                                      className="ml-auto size-1.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: subjectColor }}
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Evaluation Metric Bar ─────────────────────────────────────────────────────

function EvalMetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const barColor =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-card-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
