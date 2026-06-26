import {
  AssistantRuntimeProvider,
  useLocalRuntime,
} from "@assistant-ui/react";
import type { ChatModelAdapter, ThreadMessage, ThreadMessageLike } from "@assistant-ui/react";
import {
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
import { getFileBadgeClass } from "../utils/formatters";
import { normalizeSubjectColor } from "../utils/subjectColor";
import type { AskChatPayload, ChatEvaluation, ChatSource } from "../types/chat";
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
};

function ChatThread({ adapter, initialMessages, onClearSelectedDoc, selectedDoc }: ChatThreadProps) {
  const runtime = useLocalRuntime(adapter, { initialMessages });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread onClearSelectedDoc={onClearSelectedDoc} selectedDoc={selectedDoc} />
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
  return getDocumentSubject(doc)?.name || (typeof doc?.subject === "string" ? doc.subject : undefined);
}

function getDocumentSubjectId(doc?: DocumentItem) {
  return getDocumentSubject(doc)?._id || doc?.subjectId;
}

function getDocumentSemester(doc?: DocumentItem) {
  return getDocumentSubject(doc)?.semester?.trim() || "No semester";
}

function getDocumentSubjectKey(doc: DocumentItem) {
  return getDocumentSubjectId(doc) || getDocumentSubjectName(doc) || "No subject";
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
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [lastSources, setLastSources] = useState<ChatSource[]>([]);
  const [lastEvaluation, setLastEvaluation] =
    useState<ChatEvaluation | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [openSemesters, setOpenSemesters] = useState<Set<string>>(new Set());
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [contextPanelWidth, setContextPanelWidth] = useState(340);
  const [isResizingContext, setIsResizingContext] = useState(false);
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
        if (last.documentIds?.length) setSelectedDocIds(last.documentIds);
        else if (last.documentId) setSelectedDocIds([last.documentId]);
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
  const selectedDocIdsRef = useRef<string[]>([]);
  const selectedSubjectIdRef = useRef<string | undefined>(undefined);
  const selectedDocSubjectRef = useRef<string | undefined>(undefined);
  const ragModeRef = useRef<"basic" | "corrective">("basic");
  const onResponseRef = useRef<
    ((sources: ChatSource[], evaluation?: ChatEvaluation) => void) | null
  >(null);

  useEffect(() => {
    ragModeRef.current = ragMode;
  }, [ragMode]);

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
  }, []);

  // Load user documents once on mount
  useEffect(() => {
    listDocuments()
      .then((docs) => {
        setDocuments(docs);
        const subjs = new Set<string>();
        const sems = new Set<string>();
        for (const doc of docs) {
          const subjKey = `${getDocumentSemester(doc)}::${getDocumentSubjectKey(doc)}`;
          const semName = getDocumentSemester(doc);
          subjs.add(subjKey);
          sems.add(semName);
        }
        setOpenSubjects(subjs);
        setOpenSemesters(sems);
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocs(false));
  }, []);

  const groupedDocsBySemester = useMemo(() => {
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

    for (const doc of documents) {
      const subjName = getDocumentSubjectName(doc) || "No subject";
      const subjKey = getDocumentSubjectKey(doc);
      const semesterName = getDocumentSemester(doc);
      const rawColor = getDocumentSubject(doc)?.color;
      const subjColor = normalizeSubjectColor(rawColor);

      if (!map[semesterName]) {
        map[semesterName] = {
          semesterName,
          subjects: {},
        };
      }
      if (!map[semesterName].subjects[subjKey]) {
        map[semesterName].subjects[subjKey] = {
          subjectName: subjName,
          subjectColor: subjColor,
          docs: [],
        };
      }
      map[semesterName].subjects[subjKey].docs.push(doc);
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

  const selectedDocs = useMemo(
    () =>
      selectedDocIds
        .map((id) => documents.find((doc) => doc.id === id))
        .filter((doc): doc is DocumentItem => Boolean(doc)),
    [documents, selectedDocIds],
  );

  const selectedSubjectKey = selectedDocs[0]
    ? getDocumentSubjectKey(selectedDocs[0])
    : undefined;

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

  // Real adapter for POST /api/chat/ask with the selected mode.
  const realAdapter = useMemo<ChatModelAdapter>(
    () => ({
      async *run({ messages, abortSignal }) {
        const lastMsg = [...messages]
          .reverse()
          .find((m) => m.role === "user");
        const question = lastMsg ? getMessageText(lastMsg) : "";

        setIsThinking(true);
        const docIds = selectedDocIdsRef.current;
        const subjectId = selectedSubjectIdRef.current;
        const docSubject = selectedDocSubjectRef.current;
        const mode = ragModeRef.current;

        const payload: AskChatPayload = {
          question,
          subject: docSubject || undefined,
          subjectId: subjectId || undefined,
          scope: docIds.length === 0 ? "library_all" : docIds.length === 1 ? "single_document" : "document_set",
          mode,
        };

        if (docIds.length === 1) {
          payload.documentId = docIds[0];
        } else if (docIds.length > 1) {
          payload.documentIds = docIds;
        }

        let finalAnswer = "";
        try {
          const result = await askChat(payload, abortSignal);
          onResponseRef.current?.(result.sources, result.evaluation);
          finalAnswer = result.answer;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") throw err;
          if (err instanceof ChatApiError && err.status >= 500) {
            if (mode === "corrective") {
              const fallbackPayload = { ...payload, mode: "basic" as const };
              try {
                const fallback = await askChat(fallbackPayload, abortSignal);
                onResponseRef.current?.(fallback.sources, fallback.evaluation);
                finalAnswer = fallback.answer;
              } catch (retryErr) {
                if (retryErr instanceof DOMException && retryErr.name === "AbortError") throw retryErr;
                finalAnswer = "The server is busy or still waking up. Please send the message again in 10-15 seconds.";
              }
            } else {
              finalAnswer = "The server is busy or still waking up. Please send the message again in 10-15 seconds.";
            }
          } else {
            const msg = err instanceof Error ? err.message : "Failed to get answer";
            finalAnswer = `Warning: ${msg}`;
          }
        } finally {
          setIsThinking(false);
        }

        // Stream the text to simulate typewriter running text typing effect
        let currentText = "";
        const chunkSize = 4;
        const delayMs = 12;
        for (let i = 0; i < finalAnswer.length; i += chunkSize) {
          if (abortSignal?.aborted) break;
          currentText += finalAnswer.slice(i, i + chunkSize);
          yield {
            content: [{ type: "text" as const, text: currentText }]
          };
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      },
    }),
    [],
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

  const selectedContextLabel = selectedContext
    ? selectedDocs.length === 1
      ? selectedContext.subject || selectedContext.fileName
      : `${selectedDocs.length} docs - ${selectedContext.subject || "Selected subject"}`
    : "All documents";

  return (
    <main className="botanical-page flex h-svh min-h-0 flex-col overflow-hidden p-3 pb-24 text-foreground sm:p-5 sm:pb-24 lg:pb-5">
      <header className="botanical-card border-border/80 px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="moonlit-title text-xl font-semibold tracking-normal">
                AI Study Chat
              </h1>
              <p className="text-sm text-muted-foreground">
                {ragMode === "corrective"
                  ? "Corrective RAG - Groq - Pinecone"
                  : "Basic RAG - Groq - Pinecone"}
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
              {selectedContextLabel}
            </Button>
            <Button
              variant={ragMode === "corrective" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setRagMode((prev) => (prev === "basic" ? "corrective" : "basic"))
              }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
              title={ragMode === "corrective" ? "Switch back to Basic RAG" : "Turn on Corrective RAG"}
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

      <div
        className="botanical-bento mt-4 grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_8px_var(--context-panel-width)]"
        style={
          {
            "--context-panel-width": `${contextPanelWidth}px`,
          } as React.CSSProperties
        }
      >
        <section className="min-h-0 bg-transparent">
          {loadingHistory ? (
            <LoadingState className="m-5 h-[calc(100%-2.5rem)]" label="Loading chat history..." tone="mist" />
          ) : (
            <ChatThread
              key={sessionIdsParam ?? historyId ?? "new"}
              adapter={realAdapter}
              initialMessages={historyMessages}
              onClearSelectedDoc={() => setSelectedDocIds([])}
              selectedDoc={selectedContext}
            />
          )}
        </section>

        <div
          aria-label="Resize study context panel"
          className={`hidden cursor-col-resize border-l border-r border-border/50 bg-border/30 transition-colors hover:bg-primary/30 lg:block ${
            isResizingContext ? "bg-primary/35" : ""
          }`}
          onMouseDown={() => setIsResizingContext(true)}
          role="separator"
        />

        <aside className="hidden min-h-0 border-l border-border/80 bg-card/45 p-5 lg:block">
          <div className="flex h-full flex-col gap-5 overflow-y-auto">
            {/* Document context selector */}
            <section className="moonlit-card tone-surface tone-sapphire p-4">
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
                    onClick={() => setSelectedDocIds([])}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      selectedDocIds.length === 0
                        ? "border-primary/60 bg-primary/15 text-primary font-medium "
                        : "border-border/70 bg-background/35 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                    }`}
                  >
                    All documents
                  </button>

                  {/* Semester to Subject to Document */}
                  {Object.entries(groupedDocsBySemester).map(([semesterName, semesterGroup]) => {
                    const semOpen = openSemesters.has(semesterName);
                    const totalDocs = Object.values(semesterGroup.subjects).reduce(
                      (count, subject) => count + subject.docs.length,
                      0,
                    );
                    return (
                      <div
                        key={semesterName}
                        className="overflow-hidden rounded-lg border transition-colors duration-200"
                      >
                        {/* Semester header */}
                        <button
                          onClick={() => toggleSemester(semesterName)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-black/5"
                        >
                          <GraduationCap className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate text-xs font-semibold text-card-foreground">
                            {semesterGroup.semesterName}
                          </span>
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                            {totalDocs} docs
                          </span>
                          <ChevronDown
                            className={`size-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
                              semOpen ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                        </button>

                        {/* Subjects inside this Semester */}
                        {semOpen && (
                          <div className="space-y-1 bg-background/20 px-2 py-1.5 border-t">
                            {Object.entries(semesterGroup.subjects).map(([subjectKey, subjectGroup]) => {
                              const subjectOpenKey = `${semesterName}::${subjectKey}`;
                              const subjectOpen = openSubjects.has(subjectOpenKey);
                              const { docs, subjectColor, subjectName } = subjectGroup;
                              const allSubjectDocsSelected = docs.every((doc) => selectedDocIds.includes(doc.id));
                              const subjectIsActive = selectedSubjectKey === subjectKey;
                              return (
                                <div
                                  key={subjectOpenKey}
                                  className="overflow-hidden rounded-md border"
                                  style={{
                                    borderColor: `color-mix(in srgb, ${subjectColor} 35%, transparent)`,
                                    backgroundColor: `color-mix(in srgb, ${subjectColor} 5%, transparent)`,
                                  }}
                                >
                                  <div
                                    className="flex w-full items-center gap-2 px-2 py-1.5"
                                  >
                                    <button
                                      onClick={() => toggleSubject(subjectOpenKey)}
                                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                    >
                                      <BookOpen className="size-3.5 shrink-0" style={{ color: subjectColor }} />
                                      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-card-foreground">
                                        {subjectName}
                                      </span>
                                      <span className="shrink-0 text-[9px] text-muted-foreground">
                                        {docs.length}
                                      </span>
                                    </button>
                                    <label
                                      className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                                        allSubjectDocsSelected && subjectIsActive
                                          ? "border-primary/60 bg-primary/15 text-primary"
                                          : "border-border/70 bg-background/50 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                                      }`}
                                    >
                                      <input
                                        aria-label={`Select all documents in ${subjectName}`}
                                        checked={allSubjectDocsSelected && subjectIsActive}
                                        className="size-3 rounded border-border"
                                        onChange={() => toggleSubjectSelection(docs)}
                                        style={{ accentColor: subjectColor }}
                                        type="checkbox"
                                      />
                                      All
                                    </label>
                                    <ChevronDown
                                      className={`size-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                        subjectOpen ? "rotate-0" : "-rotate-90"
                                      }`}
                                    />
                                  </div>

                                  {/* Document list */}
                                  {subjectOpen && (
                                    <div className="mb-1 ml-3 space-y-0.5 border-l border-border/40 pl-2">
                                      {docs.map((doc) => {
                                        const isSelected = selectedDocIds.includes(doc.id);
                                        return (
                                          <label
                                            key={doc.id}
                                            className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors border-l-2 ${
                                              isSelected
                                                ? "font-medium"
                                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                            }`}
                                            style={
                                              isSelected
                                                ? {
                                                    backgroundColor: `color-mix(in srgb, ${subjectColor} 14%, transparent)`,
                                                    color: subjectColor,
                                                    borderLeftColor: subjectColor,
                                                  }
                                                : {
                                                    borderLeftColor: "transparent",
                                                  }
                                            }
                                          >
                                            <input
                                              aria-label={`Use ${doc.fileName} as AI source`}
                                              checked={isSelected}
                                              className="size-3.5 shrink-0 rounded border-border"
                                              onChange={() => toggleDocumentSelection(doc)}
                                              style={{ accentColor: subjectColor }}
                                              type="checkbox"
                                            />
                                            <span
                                              className={`admin-icon-badge ${getFileBadgeClass(doc.fileName)} flex size-6 shrink-0 items-center justify-center rounded-md`}
                                              style={{ minHeight: "1.5rem", minWidth: "1.5rem" }}
                                            >
                                              <FileText className="size-3" aria-hidden="true" />
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
              <section className="moonlit-card tone-surface tone-cyan p-4">
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
                          {typeof source.relevanceScore === "number"
                            ? `${Math.round(source.relevanceScore * 100)}%`
                            : "Source"}
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
              <section className="moonlit-card tone-surface tone-gold p-4">
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
              <section className="moonlit-card tone-surface tone-emerald p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <BookOpen
                    className="size-4 text-foreground"
                    aria-hidden="true"
                  />
                  How to use
                </div>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>1. Select a document for narrow answers, or use all documents.</li>
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
