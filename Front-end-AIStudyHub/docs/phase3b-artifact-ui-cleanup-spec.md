# Phase 3b — Fix the artifact UI follow-ups from the Phase 3 review

Phase 3 landed the artifact wiring in `/ask` and it typechecks and builds. Five issues came out of the review, none of which block the phase but all of which sit in two files and are cheapest to fix in one pass.

The first is a functional hole: the manual "create artifact" path is unreachable on a chat that has no artifacts yet, and the new **Artifacts** tab in the topbar has nothing to toggle in that state. The remaining four are convention and dead-code cleanups.

Frontend only. No backend changes, no new features.

## User Review Required

> [!IMPORTANT]
> Item 1 changes where rail open/closed state lives: `isRailHidden` / `setRailHidden` move **out** of `artifactsStore` and into the rail component, with the store keeping only a toggle signal. Those two fields were added during Phase 3, so this rewrites work that is only hours old. The reason is below — the store cannot decide whether the rail should be open because it cannot see sources.

> [!WARNING]
> The rail is shared with the sources panel. Every change here must leave the existing sources behaviour untouched: rail still appears on its own when an answer returns sources, chevron still slides it away, `SourcesOverlay` on mobile still works.

## Open Questions

> [!IMPORTANT]
> Should the **Artifacts** tab stay a tab? It behaves like a toggle button, not a tab — `handleTabChange` early-returns so the tab never becomes selected, which is the right behaviour but makes it look inert next to `Answer`. A `PanelRightIcon` toggle button beside the existing mobile one would be more honest. Assumed below: keep it as a tab, since that was the Phase 3 decision; say so if you would rather move it.

> [!IMPORTANT]
> On an empty chat, should the rail open with *only* the artifacts panel visible, or should the sources panel also render an empty state? Assumed: artifacts only. `SourcesPanel` already returns null with no sources and that stays.

## Proposed Changes

### Rail open/closed state

The bug: `ArtifactsPanel` returns `null` when it has no records, but the five create buttons and `CreateArtifactDialog` live inside it — so the only way to reach the manual create path is to already have an artifact. `ChatRightRail` independently returns `null` when there are no sources *and* no artifacts, so on a fresh chat the tab toggles something that was never rendered.

Why the state has to move: the decision "should the rail be visible" depends on whether there is *any* content — sources or artifacts. `artifactsStore` only knows about artifacts. Keeping the boolean there forces either a duplicate sources lookup in the store or a prop drill through `Thread` to `AskTopbar`. Putting the open/closed state in `ChatRightRail` — which already reads both `useThreadSources()` and `useArtifacts()` — and reducing the store's role to "the user asked to toggle" removes the problem instead of routing around it.

---

#### [MODIFY] [artifactsStore.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/artifactsStore.tsx)

- Remove `isRailHidden` and `setRailHidden` from `ArtifactsContextType`, the provider state, and the memoized value.
- Keep `toggleRail`, but reimplement it as a signal rather than a boolean owner: a `railToggleCount: number` in the context, and `toggleRail()` increments it. Consumers react to the change, not to a value.
- Update the `useMemo` dependency array to match (it drops two entries and gains `railToggleCount`).
- Change nothing else. The placeholder-merge logic, `applyFetched`, and the polling effect stay exactly as they are.

#### [MODIFY] [SourcesAside.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/sources/SourcesAside.tsx)

- `ChatRightRail` owns `isHidden` as local state again (as it did before Phase 3), reading `railToggleCount` from `useArtifacts()`.
- Add a `useRef` of the last-seen count plus an effect: when the count changes, set `isHidden` to the negation of whether the rail is *currently visible*. Because this component computes `hasContent` itself, "currently visible" is knowable here and nowhere else:

  ```tsx
  const hasContent = hasSources || hasArtifacts || isGeneratingAny;
  const isVisible = (hasContent || isPinned) && !isHidden;
  ```

- Add `isPinned` local state, set `true` the first time `railToggleCount` changes. This is what lets the tab open the rail on an empty chat: the early return becomes

  ```tsx
  if (!hasContent && !isPinned) return null;
  ```

- The chevron button keeps toggling `isHidden` directly, unchanged.
- Delete the `export const SourcesAside = ChatRightRail` alias on the last line — nothing imports it (`AskPage` imports `ChatRightRail`, `AskTopbar` imports only `SourcesOverlay`). Per the AGENTS.md orphan rule, grep both `.ts` and `.tsx` before deleting to confirm.

#### [MODIFY] [AskTopbar.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/layout/AskTopbar.tsx)

No behavioural change — it already calls `toggleRail()` and early-returns from `handleTabChange`. Only touch it if the `toggleRail` signature change requires it (it should not).

### Artifacts panel

---

#### [MODIFY] [ArtifactsPanel.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/ArtifactsPanel.tsx)

**Empty state (item 1).**
- Delete the `if (artifacts.length === 0 && !isGeneratingAny) return null;` early return. The rail above now decides whether the panel is on screen; the panel always renders when mounted.
- Keep the create-button row unconditional. Below it, when `artifacts.length === 0`, render a short empty state instead of the list — one line of muted text along the lines of "No artifacts yet. Pick a type above, or ask the assistant to make one." Use the `Empty` primitive from `src/components/ui/empty.tsx` if it fits the width; a muted `<p>` is acceptable if it does not.
- Hide the count badge when the list is empty rather than showing `0`.

**Raw icon buttons (item 2).**
- The retry and delete controls at roughly lines 122, 130 and 171 are raw `<button>` with no focus ring. The AGENTS.md exception covers full-width *row* click targets only; these are icon actions. Replace all three with `<Button variant="ghost" size="icon-xs">` (both sizes exist in the button CVA) carrying an `aria-label` — `title` alone is not an accessible name. The legacy `src/components/chat/ArtifactsPanel.tsx` uses exactly this pattern; copy it, not the styling around it.
- The delete control's `opacity-0 group-hover:opacity-100` must not hide it from keyboard users. Add `focus-visible:opacity-100`.

**Focus-ring consistency (item 3).**
- The row target at ~line 152 uses `focus-visible:ring-1 focus-visible:ring-ring`; the collapsible header at ~line 62 uses `ring-2 ring-ring`. The documented pattern — used correctly by `ArtifactToolCard` — is `outline-none focus-visible:ring-3 focus-visible:ring-ring/50`. Apply it to both.

**Nested scrolling (while in the file).**
- The list carries `max-h-80 overflow-y-auto` inside the rail's own `overflow-y-auto`. Drop the inner cap and let the rail scroll as one surface, unless removing it visibly breaks the layout with ~15 artifacts, in which case leave it and say so.

### Inline card

---

#### [MODIFY] [ArtifactToolCard.tsx](file:///D:/Study/2026_Summer/WDP301/prj/Front-end/Front-end-AIStudyHub/src/components/chat/artifacts/ArtifactToolCard.tsx)

**Dead branch (item 4).**
- The final `else` (roughly lines 92–105, "Artifact requested") is unreachable: `status` is derived as `record?.status ?? "GENERATING"`, so a missing record already renders the generating branch, and `COMPLETED`/`FAILED` both imply a record exists. Delete it and drop the now-redundant `&& record` guards on the completed and failed branches by narrowing on `record` once, up front.
- Do not change the three surviving states' markup or the destructive tokens — those were reviewed and are correct.

## Explicitly Out of Scope

- **The composer document picker and payload scope fields** — Phase 4. Artifacts still inherit `library_all`.
- **`tool-fallback.tsx` tool display names** — Phase 5.
- **The placeholder-merge and memo logic in `artifactsStore`** — just restored; do not refactor it while removing the rail booleans.
- **`src/components/chat/ArtifactsPanel.tsx` and `new-AIChatboxPage.tsx`** — the legacy page stays untouched.
- **`SourcesPanel.tsx` internals and `SourcesOverlay`** — the rail wrapper changes, the panel does not.
- **`thread.tsx`** — the `groupBy` and `toolsByName` work is done and reviewed. No edits.
- **Anything under `backendd/`.**

## Verification Plan

### Automated

```bash
npx tsc -b
```

```bash
npm run build
```

Both exit 0. Then the token and orphan checks:

```bash
grep -rhoE '\b(bg|text|border)-(slate|gray|zinc|red|orange|amber|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)-[0-9]{2,3}' src/components/chat/artifacts | wc -l
```

Must stay `0`. Repo-wide `dark:` (24), palette (151) and `!important` (24) counts must not rise. Before deleting the `SourcesAside` alias:

```bash
grep -rn --include='*.tsx' --include='*.ts' "SourcesAside" src
```

Only the definition file may match.

### Manual

`npm run dev`, backend running.

1. **Empty chat, manual create.** Brand-new thread, no messages. Click the **Artifacts** tab: the rail opens showing the panel with its five create buttons and the empty-state line. Create a flashcard artifact — it generates and appears in the list. This is the path that does not exist today.
2. **Tab toggles both ways.** Click the tab again — the rail closes. Click once more — it reopens.
3. **Sources unaffected.** Ask a normal question on a thread with no artifacts. The rail still appears by itself when sources return, and the chevron still slides it away.
4. **Both panels.** On a thread with both, artifacts sit above sources and each collapses independently.
5. **Keyboard.** Tab through the artifact list: the row target, the retry button and the delete button all take focus with a visible ring, and the delete button becomes visible when focused rather than only on hover.
6. **Generating state.** The inline card and the list row both still show a spinner during generation and flip to completed without a reload — proving the dead-branch removal did not disturb the live states.
