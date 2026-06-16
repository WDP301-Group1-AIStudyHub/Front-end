import {
  AssistantRuntimeProvider,
  Suggestions,
  useAui,
  useLocalRuntime,
} from "@assistant-ui/react";
import type { ChatModelAdapter, ThreadMessage, ThreadMessageLike } from "@assistant-ui/react";
import {
  BookMarked,
  BookOpen,
  Brain,
  ChevronDown,
  FileText,
  GraduationCap,
  Library,
  PanelRight,
  Search,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Thread } from "@/components/assistant-ui/thread";
import { Button } from "@/components/ui/button";
import { CelestialInlineLoader, CelestialLoader, LoadingState } from "../components/shared/CelestialLoading";
import { ChatApiError, askChat, getChatHistoryById } from "../services/chatApi";
import { listDocuments } from "../services/documentApi";
import type { ChatEvaluation, ChatSource } from "../types/chat";
import type { DocumentItem } from "../types/document";

// ── Inner component: owns the runtime so key-remount works correctly ──────────
type ChatThreadProps = {
  adapter: ChatModelAdapter;
  initialMessages: readonly ThreadMessageLike[];
  selectedDoc?: { fileName: string; subject?: string };
};

function ChatThread({ adapter, initialMessages, selectedDoc }: ChatThreadProps) {
  const suggestionsAui = useAui(
    { suggestions: Suggestions(quickPrompts) },
    { parent: null },
  );
  const runtime = useLocalRuntime(adapter, { initialMessages });
  return (
    <AssistantRuntimeProvider runtime={runtime} aui={suggestionsAui}>
      <Thread selectedDoc={selectedDoc} />
    </AssistantRuntimeProvider>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const quickPrompts = [
  {
    title: "Summarize sources",
    label: "Turn selected readings into concise exam notes.",
    prompt: "Summarize my selected sources into exam notes.",
  },
  {
    title: "Build a study plan",
    label: "Create a focused schedule for this week's review.",
    prompt: "Create a study plan for neural networks this week.",
  },
  {
    title: "Explain with citations",
    label: "Break down a topic using examples and source references.",
    prompt: "Explain this topic with examples and citations.",
  },
  {
    title: "Generate quiz questions",
    label: "Practice with questions from my research library.",
    prompt: "Generate quiz questions from my research library.",
  },
];

function getMessageText(message: ThreadMessage) {
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export default function NewAIChatboxPage() {
  const [searchParams] = useSearchParams();
  const historyId = searchParams.get("historyId") ?? undefined;
  const sessionIdsParam = searchParams.get("sessionIds") ?? undefined;

  // Support both new ?sessionIds=id1,id2,... and legacy ?historyId=id
  const sessionIds = useMemo(
    () =>
      sessionIdsParam
        ? sessionIdsParam.split(",").filter(Boolean)
        : historyId
        ? [historyId]
        : [],
    [sessionIdsParam, historyId],
  );

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(
    undefined,
  );
  const [lastSources, setLastSources] = useState<ChatSource[]>([]);
  const [lastEvaluation, setLastEvaluation] =
    useState<ChatEvaluation | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [openSemesters, setOpenSemesters] = useState<Set<string>>(new Set());
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [ragMode, setRagMode] = useState<"basic" | "corrective">("basic");

  // History loading
  const [historyMessages, setHistoryMessages] = useState<readonly ThreadMessageLike[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch all items in session and reconstruct full conversation
  useEffect(() => {
    if (sessionIds.length === 0) {
      setHistoryMessages([]);
      return;
    }
    setLoadingHistory(true);
    Promise.all(sessionIds.map((id) => getChatHistoryById(id)))
      .then((items) => {
        const sorted = [...items].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        // Restore context from the most recent item
        const last = sorted[sorted.length - 1];
        if (last.documentId) setSelectedDocId(last.documentId);
        if (last.mode === "basic" || last.mode === "corrective") setRagMode(last.mode);
        if (last.sources?.length) setLastSources(last.sources);
        if (last.evaluation) setLastEvaluation(last.evaluation);
        // Reconstruct full thread: each item → user + assistant message
        const messages: ThreadMessageLike[] = [];
        for (const item of sorted) {
          messages.push({ role: "user", content: item.question, id: `${item.id}-user`, createdAt: new Date(item.createdAt) });
          messages.push({ role: "assistant", content: item.answer, id: `${item.id}-assistant`, createdAt: new Date(item.updatedAt) });
        }
        setHistoryMessages(messages);
      })
      .catch(() => setHistoryMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [sessionIds]);

  // Refs so the stable adapter closure can read latest state
  const selectedDocRef = useRef<string | undefined>(undefined);
  const selectedDocSubjectRef = useRef<string | undefined>(undefined);
  const ragModeRef = useRef<"basic" | "corrective">("basic");
  const onResponseRef = useRef<
    ((sources: ChatSource[], evaluation?: ChatEvaluation) => void) | null
  >(null);

  useEffect(() => {
    ragModeRef.current = ragMode;
  }, [ragMode]);

  useEffect(() => {
    selectedDocRef.current = selectedDocId;
    const doc = documents.find((d) => d.id === selectedDocId);
    selectedDocSubjectRef.current = (typeof doc?.subject === "object" ? doc?.subject?.name : doc?.subject) ?? undefined;
  }, [selectedDocId, documents]);

  // Keep response callback up-to-date without recreating the adapter
  useEffect(() => {
    onResponseRef.current = (sources, evaluation) => {
      setLastSources(sources);
      if (evaluation) setLastEvaluation(evaluation);
    };
  }, []);

  // Load user documents once on mount
  useEffect(() => {
    listDocuments()
      .then((docs) => {
        setDocuments(docs);
        // Pre-open tất cả kỳ và môn học
        const sems = new Set(docs.map((d) => (d.title || "Chưa phân loại").trim().toUpperCase()));
        setOpenSemesters(sems);
        const subjs = new Set<string>();
        for (const doc of docs) {
          const sem = (doc.title || "Chưa phân loại").trim().toUpperCase();
          const subj = (typeof doc.subject === "object" ? doc.subject?.name : doc.subject) || "Không có môn";
          subjs.add(`${sem}::${subj}`);
        }
        setOpenSubjects(subjs);
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocs(false));
  }, []);

  // Group documents: kỳ (title) → môn học (subject) → tài liệu[]
  // Normalize title về UPPERCASE để tránh tách kỳ do khác hoa/thường
  const groupedDocs = useMemo(() => {
    const map: Record<string, Record<string, DocumentItem[]>> = {};
    for (const doc of documents) {
      const sem = (doc.title || "Chưa phân loại").trim().toUpperCase();
      const subj = (typeof doc.subject === "object" ? doc.subject?.name : doc.subject) || "Không có môn";
      if (!map[sem]) map[sem] = {};
      if (!map[sem][subj]) map[sem][subj] = [];
      map[sem][subj].push(doc);
    }
    return map;
  }, [documents]);

  const toggleSemester = (sem: string) => {
    setOpenSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(sem)) next.delete(sem);
      else next.add(sem);
      return next;
    });
  };

  const toggleSubject = (key: string) => {
    setOpenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Real adapter — gọi POST /api/chat/ask với mode do user chọn
  const realAdapter = useMemo<ChatModelAdapter>(
    () => ({
      async run({ messages, abortSignal }) {
        const lastMsg = [...messages]
          .reverse()
          .find((m) => m.role === "user");
        const question = lastMsg ? getMessageText(lastMsg) : "";

        setIsThinking(true);
        const docId = selectedDocRef.current;
        const docSubject = selectedDocSubjectRef.current;
        const mode = ragModeRef.current;

        // Guard: BE requires all 4 fields — documentId & subject must be present
        if (!docId) {
          setIsThinking(false);
          return {
            content: [
              {
                type: "text",
                text: "⚠️ Vui lòng **chọn một tài liệu** từ panel bên phải trước khi đặt câu hỏi.",
              },
            ],
          };
        }

        const payload = {
          question,
          documentId: docId,
          subject: docSubject ?? "",
          mode,
        };
        console.log("[ChatAPI] Request payload:", JSON.stringify(payload, null, 2));

        try {
          const result = await askChat(payload, abortSignal);
          onResponseRef.current?.(result.sources, result.evaluation);
          return { content: [{ type: "text", text: result.answer }] };
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") throw err;
          if (err instanceof ChatApiError && err.status >= 500) {
            // Chỉ retry với basic khi đang dùng corrective (bởi corrective gọi Groq 4-6 lần)
            if (mode === "corrective") {
              const fallbackPayload = { ...payload, mode: "basic" as const };
              console.log("[ChatAPI] Fallback payload:", JSON.stringify(fallbackPayload, null, 2));
              try {
                const fallback = await askChat(fallbackPayload, abortSignal);
                onResponseRef.current?.(fallback.sources, fallback.evaluation);
                return { content: [{ type: "text", text: fallback.answer }] };
              } catch (retryErr) {
                if (retryErr instanceof DOMException && retryErr.name === "AbortError") throw retryErr;
              }
            }
            // Server quá tải hoặc chưa khởi động — gợi ý thử lại
            return {
              content: [
                {
                  type: "text",
                  text: "⚠️ Server đang bận hoặc chưa khởi động (Render free tier). Vui lòng **gửi lại tin nhắn sau 10-15 giây**.",
                },
              ],
            };
          }
          const msg = err instanceof Error ? err.message : "Failed to get answer";
          return { content: [{ type: "text", text: `⚠️ ${msg}` }] };
        } finally {
          setIsThinking(false);
        }
      },
    }),
    [],
  );

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <main className="celestial-page flex h-svh min-h-0 flex-col overflow-hidden p-3 text-foreground sm:p-5">
      <header className="celestial-card tone-surface tone-violet border-border/80 px-5 py-4 backdrop-blur sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="celestial-title text-xl font-semibold tracking-normal">
                AI Study Chat
              </h1>
              <p className="text-sm text-muted-foreground">
                {ragMode === "corrective"
                  ? "Corrective RAG · Groq · Pinecone"
                  : "Basic RAG · Groq · Pinecone"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-2 px-3 py-2"
            >
              <Library className="size-4 text-foreground" aria-hidden="true" />
              {selectedDoc ? (typeof selectedDoc.subject === "object" ? selectedDoc.subject?.name : selectedDoc.subject) ?? selectedDoc.title : "Tất cả tài liệu"}
            </Button>
            <Button
              variant={ragMode === "corrective" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setRagMode((prev) => (prev === "basic" ? "corrective" : "basic"))
              }
              className="inline-flex items-center gap-2 px-3 py-2"
              title={ragMode === "corrective" ? "Click để chuyển về Basic (nhanh hơn)" : "Click để bật Corrective RAG (chính xác hơn)"}
            >
              {isThinking ? (
                <CelestialInlineLoader label="Thinking..." />
              ) : ragMode === "corrective" ? (
                <Brain className="size-4" aria-hidden="true" />
              ) : (
                <Zap className="size-4" aria-hidden="true" />
              )}
              {ragMode === "corrective" ? "Corrective RAG" : "Basic RAG"}
            </Button>
          </div>
        </div>
      </header>

      <div className="celestial-panel mt-4 grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-h-0 bg-transparent">
          {loadingHistory ? (
            <LoadingState className="m-5 h-[calc(100%-2.5rem)]" label="Loading chat history..." tone="violet" />
          ) : (
            <ChatThread
              key={sessionIdsParam ?? historyId ?? "new"}
              adapter={realAdapter}
              initialMessages={historyMessages}
              selectedDoc={
                selectedDoc
                  ? {
                      fileName: selectedDoc.fileName,
                      subject:
                        typeof selectedDoc.subject === "object"
                          ? selectedDoc.subject?.name
                          : selectedDoc.subject,
                    }
                  : undefined
              }
            />
          )}
        </section>

        <aside className="hidden min-h-0 border-l border-border/80 bg-card/45 p-5 lg:block">
          <div className="flex h-full flex-col gap-5 overflow-y-auto">
            {/* Document context selector */}
            <section className="celestial-card tone-surface tone-sapphire p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-card-foreground">
                  Study Context
                </h2>
                <PanelRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              {loadingDocs ? (
                <CelestialLoader label="Loading documents..." size="sm" tone="sapphire" />
              ) : documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No documents yet. Upload one in the Library.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {/* "All documents" option */}
                  <button
                    onClick={() => setSelectedDocId(undefined)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      selectedDocId === undefined
                        ? "border-primary/60 bg-primary/15 text-primary font-medium "
                        : "border-border/70 bg-background/35 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                    }`}
                  >
                    Tất cả tài liệu
                  </button>

                  {/* Kỳ học → Môn học → Tài liệu */}
                  {Object.entries(groupedDocs).map(([sem, subjects]) => {
                    const semOpen = openSemesters.has(sem);
                    const totalDocs = Object.values(subjects).flat().length;
                    return (
                      <div
                        key={sem}
                        className="overflow-hidden rounded-lg border border-border/60 bg-background/25"
                      >
                        {/* Header kỳ */}
                        <button
                          onClick={() => toggleSemester(sem)}
                          className="flex w-full items-center gap-2 bg-[#f5f7ff] px-3 py-2 text-left transition-colors hover:bg-muted/70"
                        >
                          <GraduationCap className="size-3.5 shrink-0 text-primary" />
                          <span className="flex-1 truncate text-xs font-semibold text-card-foreground">
                            {sem}
                          </span>
                          <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                            {totalDocs}
                          </span>
                          <ChevronDown
                            className={`size-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
                              semOpen ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                        </button>

                        {/* Môn học */}
                        {semOpen && (
                          <div className="space-y-px bg-background/20 px-2 py-1.5">
                            {Object.entries(subjects).map(([subj, docs]) => {
                              const subjKey = `${sem}::${subj}`;
                              const subjOpen = openSubjects.has(subjKey);
                              return (
                                <div key={subjKey}>
                                  {/* Header môn học */}
                                  <button
                                    onClick={() => toggleSubject(subjKey)}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                                  >
                                    <BookMarked className="size-3 shrink-0 text-muted-foreground" />
                                    <span className="flex-1 truncate text-[11px] font-medium text-card-foreground">
                                      {subj}
                                    </span>
                                    <span className="shrink-0 text-[9px] text-muted-foreground">
                                      {docs.length}
                                    </span>
                                    <ChevronDown
                                      className={`size-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                        subjOpen ? "rotate-0" : "-rotate-90"
                                      }`}
                                    />
                                  </button>

                                  {/* Danh sách tài liệu */}
                                  {subjOpen && (
                                    <div className="mb-1 ml-3 space-y-0.5 border-l border-border/40 pl-2">
                                      {docs.map((doc) => (
                                        <button
                                          key={doc.id}
                                          onClick={() =>
                                            setSelectedDocId((prev) =>
                                              prev === doc.id ? undefined : doc.id,
                                            )
                                          }
                                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                                            selectedDocId === doc.id
                                              ? "bg-primary/15 text-primary "
                                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                          }`}
                                        >
                                          <FileText className="size-3 shrink-0 text-current" />
                                          <span className="min-w-0 flex-1 truncate text-[11px]">
                                            {doc.fileName}
                                          </span>
                                          {selectedDocId === doc.id && (
                                            <div className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sources returned by the last response */}
            {lastSources.length > 0 && (
              <section className="celestial-card tone-surface tone-cyan p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <Search className="size-4 text-foreground" aria-hidden="true" />
                  Retrieved sources
                </div>
                <div className="space-y-2">
                  {lastSources.map((source, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/70 bg-background/35 p-3 text-xs transition-colors hover:border-[var(--accent-teal)]/60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-card-foreground">
                          {source.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {Math.round(source.relevanceScore * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-muted-foreground">
                        {source.contentPreview}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RAG evaluation metrics */}
            {lastEvaluation && (
              <section className="celestial-card tone-surface tone-gold p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <Zap className="size-4 text-foreground" aria-hidden="true" />
                  RAG evaluation
                </div>
                <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Confidence</dt>
                    <dd className="font-medium text-card-foreground">
                      {Math.round(lastEvaluation.confidenceScore * 100)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Avg relevance</dt>
                    <dd className="font-medium text-card-foreground">
                      {Math.round(lastEvaluation.averageRelevanceScore * 100)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Chunks used</dt>
                    <dd className="font-medium text-card-foreground">
                      {lastEvaluation.relevantChunksCount}/
                      {lastEvaluation.retrievedChunksCount}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Response time</dt>
                    <dd className="font-medium text-card-foreground">
                      {(lastEvaluation.responseTimeMs / 1000).toFixed(1)}s
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Grounded</dt>
                    <dd
                      className={
                        lastEvaluation.isGrounded
                          ? "font-medium text-green-500"
                          : "font-medium text-yellow-500"
                      }
                    >
                      {lastEvaluation.isGrounded ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            {/* How-to hint shown before any response */}
            {!lastEvaluation && (
              <section className="celestial-card tone-surface tone-emerald p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <BookOpen
                    className="size-4 text-foreground"
                    aria-hidden="true"
                  />
                  How to use
                </div>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>1. Select a document context above (optional).</li>
                  <li>2. Ask a question about your study material.</li>
                  <li>
                    3. The AI uses Corrective RAG to answer from your docs.
                  </li>
                </ol>
              </section>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
