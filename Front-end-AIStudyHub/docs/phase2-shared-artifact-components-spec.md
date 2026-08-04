# Phase 2 — Shared artifact components and thread-scoped artifact store

Artifact UI currently lives entirely inside `ArtifactsPanel.tsx`, which is consumed only by the legacy `/aichatbox` page, and its lifecycle logic (initial load, optimistic insert, generation polling, retry) is inlined as `useState`/`useEffect` blocks in `new-AIChatboxPage.tsx`. The new `/ask` page has no access to either.

This phase carves out the reusable half — the type metadata, the two dialogs, and a thread-scoped store that owns artifact state and polling — into `src/components/chat/artifacts/`. Nothing consumes it yet; Phase 3 wires it into `/ask`. Splitting it out first keeps Phase 3 a wiring change rather than a wiring-and-extraction change.

Frontend only. No backend, no route changes, no changes to any existing file.

## User Review Required

> [!IMPORTANT]
> This phase deliberately **duplicates** ~250 lines rather than refactoring `ArtifactsPanel.tsx` to import from the new module. That follows the decision to leave `/aichatbox` untouched until it is deleted. The duplication is temporary and dies with that page — but until then, a fix to a preview dialog must be applied in two places. If that trade is wrong, say so now: pointing `ArtifactsPanel.tsx` at the new module instead is a ~10-line edit.

> [!WARNING]
> Nothing imports these files at the end of this phase. `npx tsc -b` will still pass (`noUnusedLocals` governs locals inside a file, not unexported-but-unused modules), but `npm run lint` may add new warnings to its existing ~28. Per `AGENTS.md`, lint is not a gate — just do not let the count grow in files this phase touches.

## Open Questions

> [!IMPORTANT]
> Is the `threadId` in the `/ask` URL the backend thread id, or an assistant-ui-internal id? `AskPage` feeds it straight into `useRemoteThreadListRuntime({ threadId })`, and the history adapter fetches with `getChatThreadById(remoteId)`, which strongly implies they are the same value — but this has not been proven at runtime. The store below is designed so it does not matter: it seeds from a prop and accepts an explicit `setThreadId` from the caller after `threadListItemRuntime.initialize()` resolves the real remote id. Confirm during Phase 3.

> [!IMPORTANT]
> Should the store fall back to `listArtifacts("none")` — artifacts created before a thread existed — the way `new-AIChatboxPage.tsx` does on a fresh chat? Assumed yes, mirroring the old behaviour, since the agent can create an artifact on the very first turn before the thread id is known to the UI.

## Proposed Changes

### Shared artifact module

A new `src/components/chat/artifacts/` directory, sitting alongside the existing `src/components/chat/sources/` and following its conventions: PascalCase files for components, camelCase for the store and helpers, no barrel file (the sources directory has none).

---

#### [NEW] [artifactTypes.ts](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/artifactTypes.ts)

Pure data and helpers, no JSX. Copied from `ArtifactsPanel.tsx` lines 52–82 and 167–182.

- `TYPE_META: Record<ArtifactType, { label: string; icon: LucideIcon }>` — the five entries (FLASHCARD/Layers, QUIZ/ListChecks, MINDMAP/Network, REPORT/FileText, DATA_TABLE/Table). Type the icon as `LucideIcon` from `lucide-react` rather than the source file's `typeof Code2`, which was incidental.
- `MARKDOWN_PREVIEW_CLASS` — the shared prose/table utility string, verbatim.
- `dataTableToMarkdown(columns, rows)` and `recordToCopyText(record)`.
- `recordToStudyMaterial(record): StudyMaterial` — the adapter that lets an `ArtifactRecord` render through `FlashcardStudy` / `McqQuiz`.

Imports `ArtifactRecord` / `ArtifactType` from `@/services/artifactApi` and `StudyMaterial` from `@/services/studyMaterialApi`.

#### [NEW] [ArtifactPreviewDialog.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/ArtifactPreviewDialog.tsx)

The typed-content preview, copied from `ArtifactsPanel.tsx` lines 84–113 and 184–288.

- `CopyButton({ text })` — exported, since the inline card in Phase 3 wants it too.
- `ArtifactPreviewDialog({ record, onClose })` — renamed from `BackendArtifactPreviewDialog`; the old name distinguished it from the markdown-scraped `ChatArtifact` variant, which is not part of this module. Branches per `record.type`: `FlashcardStudy` for FLASHCARD, `McqQuiz` for QUIZ, `ReactMarkdown` + `CopyButton` for REPORT, a bordered `<table>` + `CopyButton` for DATA_TABLE, `MindmapView` for MINDMAP.
- Keep importing `MindmapView` from `@/components/chat/MindmapView` — it stays where it is, shared by both pages.

Do **not** port `ArtifactPreviewDialog` for `ChatArtifact` (the markdown-extracted code/table/note artifacts from `extractArtifacts`). That path is a `/aichatbox` feature and is not being carried into `/ask`.

#### [NEW] [CreateArtifactDialog.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/CreateArtifactDialog.tsx)

Copied from `ArtifactsPanel.tsx` lines 292–371, with one change: the helper text currently reads "Generated from the documents currently selected in Study Context", which names a `/aichatbox` panel that does not exist in `/ask`. Take the copy as a `scopeHint?: string` prop, defaulting to a neutral "Generated from the documents attached to this conversation." Phase 4 passes the real selection summary once the composer picker exists.

Keeps the existing behaviour: resets on `type` change, Enter submits, Shift+Enter newlines, disabled while submitting.

#### [NEW] [artifactsStore.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/artifactsStore.tsx)

Context provider in the shape of `sources/sourcesPanelStore.tsx` — `createContext` + a provider component + a `useArtifacts()` hook that throws outside the provider. Not Zustand: this is per-thread view state with no cross-route consumers, and the sources panel set the local precedent.

Owns the logic currently inlined in `new-AIChatboxPage.tsx` at lines 167–182 (initial load), 294–314 (optimistic insert), 319–337 (polling), and 373–419 (create/delete/retry).

Provider props: `{ threadId?: string; children }`.

State and exposed value:
- `artifacts: ArtifactRecord[]`
- `setThreadId(id: string | undefined)` — lets the ask adapter push the real remote id the moment `initialize()` resolves it, without waiting for a URL change. Internal state seeds from the `threadId` prop and re-seeds whenever the prop changes.
- `addOptimistic(event: { artifactId, artifactType, title })` — the `artifact_created` handler. Inserts a `status: "GENERATING"` placeholder at the head, keyed on `_id`, and no-ops if that id is already present. Polling replaces it with the real record.
- `create(type, instructions, scope?)` — calls `initiateArtifact` and prepends the returned record.
- `remove(id)` — optimistic removal, then `deleteArtifact(id)` with errors swallowed.
- `retry(record)` — re-initiates with the record's own `type`/`title`/`instructions`/`sourceDocumentIds`/`subjectId`/`scope`, prepends the fresh record, drops the old one, then deletes the old row. Collapse `sourceDocumentIds` to `documentId` when there is exactly one, as the existing page does.
- `isLoading: boolean` for the initial fetch only, not for poll ticks.

Behaviour:
- On mount and on every `threadId` change, `listArtifacts(threadId ?? "none")`; on failure, set an empty list rather than surfacing an error (matches the old page — a failed artifact fetch must never blank the chat).
- Poll `listArtifacts` every 2500 ms while any record is `PENDING` or `GENERATING`; stop when none are. Swallow transient failures and let the next tick retry. Clear the interval on unmount and on `threadId` change.
- The polling effect must not depend on the whole `artifacts` array the way the old page's does, or every poll response restarts the interval. Depend on a derived boolean (`artifacts.some(a => a.status === "PENDING" || a.status === "GENERATING")`) instead.

`ArtifactType`, `ArtifactRecord`, `initiateArtifact`, `listArtifacts`, `deleteArtifact` all come from the existing `@/services/artifactApi` — no changes needed there.

## Explicitly Out of Scope

- **`ArtifactsPanel.tsx` and `new-AIChatboxPage.tsx` are not to be edited.** Not to de-duplicate, not to import from the new module, not to "tidy". `/aichatbox` must keep working untouched until it is deleted.
- **`AskPage.tsx`, `thread.tsx`, `AskTopbar.tsx`** — all Phase 3. Do not mount the provider, do not add the `artifact_created` branch, do not register a tool UI.
- **The composer document picker and `DocumentPickerList`** — Phase 4.
- **`tool-fallback.tsx` display names** — Phase 5.
- **Anything under `backendd/`.**
- No new `ArtifactsAside` or panel component in this phase. The store and dialogs are the deliverable; the panel that arranges them is Phase 3, where its layout can be checked against a live thread.

## Verification Plan

### Automated Tests

```bash
npx tsc -b
```

```bash
npm run build
```

Both must exit 0. There is no test suite in this repo.

Then the `AGENTS.md` regression greps — each must be unchanged from before the phase:

```bash
grep -rho 'dark:' src --include='*.tsx' | wc -l
```

```bash
grep -rhoE '\b(bg|text|border)-(slate|gray|zinc|red|orange|amber|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)-[0-9]{2,3}' src --include='*.tsx' | wc -l
```

The copied dialog markup contains hardcoded palette classes in the failed/error states (`border-red-200`, `bg-red-50/50`, `text-red-600` in the panel's list rows). Those rows are **not** part of this phase's copy — the two dialogs and the store carry none. If either grep count rises, palette classes were dragged across; replace them with `border-destructive/30`, `bg-destructive/10`, `text-destructive` before finishing.

### Manual Verification

Runtime verification is deferred to Phase 3 — nothing renders these components yet, so there is no UI to click. Two things can still be checked by hand:

1. **`/aichatbox` is untouched.** `git status` must show only additions under `src/components/chat/artifacts/`. Load the page, create a flashcard artifact, confirm it still generates and previews.
2. **Import graph is clean.** `git grep -n "components/chat/artifacts" src` should return only intra-directory imports. Any hit from `pages/` means Phase 3 work leaked in.
