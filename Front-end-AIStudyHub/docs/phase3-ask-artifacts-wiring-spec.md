# Phase 3 — Wire artifacts into the `/ask` agent UI

Phase 1 gave the agent materials-aware artifact tools; Phase 2 built the shared store and dialogs. Neither is reachable from the UI yet: `AskPage` still drops the `artifact_created` SSE event on the floor, and nothing imports `src/components/chat/artifacts/`.

This phase makes artifacts visible in `/ask` in two places — an inline card in the message where the agent called `create_artifact`, and a panel in the right rail that survives reloads — and hands the store the real remote thread id so its polling targets the right thread.

Frontend only. No backend changes.

## User Review Required

> [!IMPORTANT]
> **The inline card is session-only.** `createAskThreadHistoryAdapter` rebuilds assistant messages as a single text part — tool-call parts are not persisted or restored. After a reload the inline card is gone and the artifact appears only in the rail panel. Making it survive would require the backend to persist tool calls on `ChatHistory`, which is not in this plan. If the card must survive reloads, say so now; it changes the design.

> [!IMPORTANT]
> This changes how **every** assistant message groups its parts, not just ones with artifacts (see the `groupBy` change below). Regression-check a plain Q&A turn with two `search_documents` calls: they must still collapse into one "2 tool calls" group.

> [!WARNING]
> `useAssistantToolUI` / `makeAssistantToolUI` — the obvious way to register a per-tool renderer — are **deprecated** in the installed `@assistant-ui/react` 0.14.29 (`node_modules/@assistant-ui/core/dist/react/model-context/useAssistantToolUI.d.ts`). Do not use them. They are also the only route to `display: "standalone"`, which is why this spec reaches the same outcome through `groupBy` instead. The `tools.by_name` config on `MessagePrimitive.Parts` is current, but `thread.tsx` uses `MessagePrimitive.GroupedParts` with a render function, which bypasses `components` entirely — so routing happens in that render function.

> [!WARNING]
> `groupPartByType` "ships a stable memo fingerprint so the tree survives unrelated re-renders" (per its own docs); an inline arrow function does not. The replacement `groupBy` **must** be declared at module scope in `thread.tsx`, not inline in JSX, or every render rebuilds the group tree.

## Open Questions

> [!IMPORTANT]
> **Right-rail layout.** `SourcesAside` is absolutely positioned by `AskPage` (`absolute top-17 right-4 max-w-90`) and owns its own slide-away toggle. Two independently-positioned asides would overlap. Recommended: extract a `ChatRightRail` that owns the absolute positioning and the single slide-away toggle, and stack `ArtifactsPanel` above `SourcesPanel` inside it (artifacts first — a deliverable outranks a trace). That means editing `SourcesAside`, which is now allowed. The alternative — leaving `SourcesAside` alone and giving artifacts a separate toggle — is less work and worse. Confirm before building.

> [!IMPORTANT]
> **How the artifact id reaches the card.** `artifact_created` carries the id and arrives between `tool_start` and `tool_end` for the same tool call. The message part shape is fixed by the library (`type`/`toolCallId`/`toolName`/`args`/`argsText`/`result`), so a custom top-level field would likely be stripped by the enrichment pipeline. Assumed below: stamp it into `args.artifactId`. Do **not** stamp it into `result` — `tool_end` overwrites `result` immediately afterwards with the summary string. The alternative is a `toolCallId → artifactId` map in the store; cleaner message parts, more store API.

## Proposed Changes

### Thread rendering

---

#### [MODIFY] [thread.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/thread.tsx)

- Extend the exported `ThreadComponents` type with `toolsByName?: Record<string, ToolCallMessagePartComponent> | undefined`. It sits alongside the existing `ToolFallback` / `ToolGroup` / `ReasoningGroup` slots the file already exposes.
- In the `AssistantMessage` render switch, change `case "tool-call"` to consult it before falling back:

  ```tsx
  case "tool-call": {
    const ByName = toolsByName?.[part.toolName];
    if (ByName) return <ByName {...part} />;
    return part.toolUI ?? <ToolFallbackComponent {...part} />;
  }
  ```

  `part.toolUI` stays ahead of the fallback so nothing else changes.
- Replace the `groupPartByType({...})` call with a module-scope `groupBy` so `create_artifact` parts stay **ungrouped** — otherwise the card is buried inside a `group-tool` collapsible that is closed by default, and the user has to expand a "3 tool calls" row to find what they asked for. Returning `null` leaves a part ungrouped and delivers it as a leaf to the same render function.

  ```tsx
  const UNGROUPED_TOOLS = new Set(["create_artifact"]);

  const groupAskParts = (part: PartState): readonly string[] | null => {
    if (part.type === "reasoning") return ["group-chainOfThought", "group-reasoning"];
    if (part.type === "tool-call") {
      if (UNGROUPED_TOOLS.has(part.toolName)) return null;
      return ["group-chainOfThought", "group-tool"];
    }
    return null;
  };
  ```

  Keep the existing `group-chainOfThought` / `group-tool` / `group-reasoning` cases in the switch exactly as they are. The docs for `GroupedParts.groupBy` explicitly sanction an inline function for "branching on `part.toolName`", which is precisely this.
- No other change to `thread.tsx`. Do not touch the composer.

#### [NEW] [ArtifactToolCard.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/ArtifactToolCard.tsx)

The inline card, typed as `ToolCallMessagePartComponent`.

- Reads `args.artifactId` (see Open Questions) and looks the record up in `useArtifacts()`. Until the id lands or the record appears, render from `args.type` / `args.title` in a generating state — the args stream in at `tool_start`, well before the artifact exists.
- Three visual states, using `TYPE_META` for icon and label: **generating** (spinner, title, "Generating…"), **completed** (type icon, title, clickable → opens `ArtifactPreviewDialog`), **failed** (warning icon, `record.error`, retry via `retry(record)`).
- Failed state must use `border-destructive/30` / `bg-destructive/10` / `text-destructive`. The equivalent rows in the legacy `ArtifactsPanel` use `border-red-200` / `bg-red-50/50` / `text-red-600`; those are an AGENTS.md violation and must not be copied.
- Row-shaped click target, so a raw `<button>` with the sanctioned focus ring (`outline-none focus-visible:ring-3 focus-visible:ring-ring/50`) per the AGENTS.md exception, not `Button`.

### Right rail

---

#### [NEW] [ArtifactsPanel.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/ArtifactsPanel.tsx)

A new panel (not the legacy `src/components/chat/ArtifactsPanel.tsx`, which stays untouched and dies with `/aichatbox`).

- Consumes `useArtifacts()` — no props for data. Renders the five `TYPE_META` create buttons, then the record list, reusing the same three states as the card.
- Mirrors `SourcesPanel`'s shell: `Collapsible`, `rounded-xl bg-card border border-border shadow-md`, header with a count badge. Match that file's current classes so the two panels read as one rail.
- Owns `ArtifactPreviewDialog` and `CreateArtifactDialog` instances and the `createType` state.
- `create()` rejects on failure (Phase 2 left it propagating) — `CreateArtifactDialog` already catches and displays it, so pass `create` straight through.
- Renders nothing when the list is empty **and** no generation is in flight, so it does not occupy the rail on a fresh chat.

#### [MODIFY] [SourcesAside.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/sources/SourcesAside.tsx)

Per the recommended layout answer: extract the absolute positioning and the hide/slide toggle into an exported `ChatRightRail` (same file or a sibling), rendering `<ArtifactsPanel />` above `<SourcesPanel />`. Preserve the existing behaviour: the rail hides itself when there is nothing to show, and the toggle button reveals on hover. The early `return null` must now depend on *both* sources and artifacts being empty.

`SourcesOverlay` (the mobile popover used by `AskTopbar`) keeps working against sources only; artifacts get their own entry point via the tab below.

#### [MODIFY] [AskTopbar.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/layout/AskTopbar.tsx)

Replace the non-functional `Images` tab with `Artifacts` (keep `Answer`; `Links` stays dead for now). Selecting it toggles rail visibility. The tab is currently local state wired to nothing — give the toggle a home on the artifacts context so `AskTopbar`, which renders deep inside `Thread`, can reach it without prop drilling.

### Page wiring

---

#### [MODIFY] [AskPage.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/pages/AskPage.tsx)

- Wrap the tree in `<ArtifactsProvider threadId={threadId}>`, inside `AssistantRuntimeProvider` and alongside `SourcesPanelProvider`.
- In the model adapter, immediately after `const { remoteId } = await threadListItemRuntime.initialize()`, call `setThreadId(remoteId)`. **This is the load-bearing line of the phase** — without it a first-turn artifact is created against a thread the store isn't polling, and the Phase 2 placeholder-merge is the only thing keeping the card on screen.
- Add the missing branch to the stream loop:

  ```ts
  } else if (event.type === "artifact_created") {
    addOptimistic(event);
    const toolPart = [...parts].reverse().find(
      (p) => p.type === "tool-call" && p.toolName === "create_artifact" && !("result" in p),
    );
    if (toolPart) toolPart.args = { ...toolPart.args, artifactId: event.artifactId };
    yield { content: [...parts] };
  }
  ```

  The reverse-find mirrors the existing `tool_end` correlation directly above it. The `yield` is required — without it the stamped id never reaches the renderer.
- Pass `components={{ toolsByName: { create_artifact: ArtifactToolCard } }}` to `<Thread />`. Memoize it; a fresh object each render defeats `ThreadComponentsContext`.
- Render `<ChatRightRail />` in place of the current `<SourcesAside … />`.
- The adapter closure needs `addOptimistic` and `setThreadId` from `useArtifacts()`, which means `runtimeHook` must be able to see them. `useRemoteThreadListRuntime` calls `runtimeHook` as a hook, so `useArtifacts()` can be called inside it — but only if `ArtifactsProvider` sits **above** the component calling `useRemoteThreadListRuntime`. If it does not, lift the provider one level (a small wrapper component around the current `AskPage` body) rather than reaching for a ref.

## Explicitly Out of Scope

- **The composer document picker** and any `documentId`/`documentIds`/`subjectId`/`scope` fields on the ask payload — Phase 4. Artifacts created in this phase inherit `library_all`, exactly as today. Do not add a picker "while you're in there".
- **`tool-fallback.tsx` display names** for the five new tools — Phase 5.
- **`src/components/chat/ArtifactsPanel.tsx`, `new-AIChatboxPage.tsx`, `MindmapView.tsx`** — the legacy page stays untouched.
- **The Phase 2 files' internals** — `artifactsStore.tsx`, `ArtifactPreviewDialog.tsx`, `CreateArtifactDialog.tsx`, `artifactTypes.ts` are consumed as-is. If one genuinely needs a change, flag it rather than editing silently; the panel-visibility state on the context (for the topbar tab) is the one sanctioned addition.
- **Anything under `backendd/`**, including persisting tool calls to make the inline card survive reloads.
- The dead `Links` tab. Leave it.

## Verification Plan

### Automated

```bash
npx tsc -b
```

```bash
npm run build
```

Both exit 0. Then confirm the design-token rules held — the failed-state styling is where this phase is most likely to regress:

```bash
grep -rhoE '\b(bg|text|border)-(slate|gray|zinc|red|orange|amber|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)-[0-9]{2,3}' src/components/chat/artifacts | wc -l
```

Must stay `0`. Repo-wide `dark:` and `!important` counts must not rise.

### Manual

Needs a running backend and `npm run dev`. Phase 1's tools are live, so the agent can create artifacts unprompted.

1. **First-turn artifact (the `setThreadId` path).** New chat, ask "make me flashcards from my documents". The inline card must appear in the message, show a spinner, and **still be there after 10 seconds** — i.e. across at least four poll ticks. If it vanishes after ~2.5 s, `setThreadId` is not being called before the artifact is created. This is the single most important check in the phase.
2. **Completion.** The same card flips to the completed state without a reload, and clicking it opens the preview with real flashcards.
3. **Not buried.** The card renders outside the collapsed tool group — visible without expanding anything — while `search_documents` calls in the same message still collapse into their group.
4. **Grouping regression.** A plain question with two searches and no artifact still shows one "2 tool calls" group, closed by default.
5. **Rail.** The panel lists the artifact, create buttons work, delete removes it, a failed artifact offers retry. On a chat with no artifacts and no sources the rail is absent entirely.
6. **Reload.** Refresh the thread: the inline card is gone (expected, see User Review) and the artifact is still listed in the rail with its content intact.
7. **Thread switch.** Move between two threads with different artifacts; each rail shows only its own, and no stale record survives the switch.
8. **Failure path.** With a document still processing, use a create button — the backend 409 must appear inside `CreateArtifactDialog` and the dialog must stay open.
