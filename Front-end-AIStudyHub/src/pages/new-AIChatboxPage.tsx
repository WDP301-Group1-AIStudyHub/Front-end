import {
  AssistantRuntimeProvider,
  Suggestions,
  useAui,
  useLocalRuntime,
} from "@assistant-ui/react";
import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";
import {
  BookOpen,
  Brain,
  FileText,
  Library,
  PanelRight,
  Search,
} from "lucide-react";

import { Thread } from "@/components/assistant-ui/thread";
import { Button } from "@/components/ui/button";

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

const sourceContexts = [
  {
    title: "Neural Network Topologies.epub",
    meta: "AI Research • 12.8 MB",
    status: "Indexed",
  },
  {
    title: "Ethics in AI",
    meta: "Course notes • 56 highlights",
    status: "Ready",
  },
  {
    title: "Deep Space Neural Topologies",
    meta: "Shared library",
    status: "Synced",
  },
];

function getMessageText(message: ThreadMessage) {
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function waitForMockReply(abortSignal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (abortSignal.aborted) {
      reject(new DOMException("The request was cancelled.", "AbortError"));
      return;
    }

    const timeout = window.setTimeout(resolve, 850);
    abortSignal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("The request was cancelled.", "AbortError"));
      },
      { once: true },
    );
  });
}

function createMockReply(prompt: string) {
  const trimmedPrompt = prompt || "this study request";

  return [
    `I will work from this study request: "${trimmedPrompt}"`,
    "",
    "Here is a useful first pass:",
    "1. Identify the core concept and define it in one sentence.",
    "2. Pull out the two or three ideas that explain why it matters.",
    "3. Connect each idea to a source, example, or likely exam question.",
    "",
    "Next, I would turn this into a concise outline and attach citations from the selected library sources once a real AI backend is connected.",
  ].join("\n");
}

const studyMockAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    await waitForMockReply(abortSignal);

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    const prompt = latestUserMessage ? getMessageText(latestUserMessage) : "";

    return {
      content: [{ type: "text", text: createMockReply(prompt) }],
    };
  },
};

export default function NewAIChatboxPage() {
  const suggestionsAui = useAui(
    {
      suggestions: Suggestions(quickPrompts),
    },
    { parent: null },
  );
  const runtime = useLocalRuntime(studyMockAdapter);
  const selectedSources = sourceContexts.filter(
    (source) => source.status !== "Synced",
  ).length;

  return (
    <main className="celestial-page flex h-svh min-h-0 flex-col overflow-hidden p-3 text-foreground sm:p-5">
      <header className="celestial-card border-border/80 px-5 py-4 backdrop-blur sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-normal text-card-foreground">
                AI Study Chat
              </h1>
              <p className="text-sm text-muted-foreground">
                assistant-ui thread, local runtime, study-focused mock
                responses.
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
              {selectedSources} sources selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-2 px-3 py-2"
            >
              <Brain className="size-4 text-foreground" aria-hidden="true" />
              LocalRuntime mock
            </Button>
          </div>
        </div>
      </header>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card/70 shadow-[var(--shadow-soft)] backdrop-blur lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-h-0 bg-transparent">
          <AssistantRuntimeProvider runtime={runtime} aui={suggestionsAui}>
            <Thread />
          </AssistantRuntimeProvider>
        </section>

        <aside className="hidden min-h-0 border-l border-border/80 bg-card/70 p-5 lg:block">
          <div className="flex h-full flex-col gap-5 overflow-y-auto">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-card-foreground">
                  Study Context
                </h2>
                <PanelRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-3">
                {sourceContexts.map((source) => (
                  <article
                    className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-border/70 bg-background/35 p-3"
                    key={source.title}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-card/70 text-primary">
                      <FileText className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-card-foreground">
                          {source.title}
                        </p>
                        <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {source.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {source.meta}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Search className="size-4 text-foreground" aria-hidden="true" />
                Suggested workflow
              </div>
              <ol className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>1. Start with an assistant-ui suggestion.</li>
                <li>2. Ask follow-ups in the Thread composer.</li>
                <li>
                  3. Use edit, regenerate, copy, and export actions from the
                  message toolbar.
                </li>
              </ol>
            </section>

            <section className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <BookOpen
                  className="size-4 text-foreground"
                  aria-hidden="true"
                />
                Runtime notes
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The chat UI is now powered by assistant-ui. The model adapter is
                local and deterministic, so no API key or backend route is
                needed yet.
              </p>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
