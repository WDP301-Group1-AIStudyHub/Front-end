# AGENTS.md

Instructions for AI coding agents working in this repository.

Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix primitives). Frontend for AI Study Hub — students upload academic documents, then generate study material and chat over them.

**Read `PRODUCT.md` before making any visual change.** It defines the brand personality, the design principles, and — most importantly — an anti-references list of things this product deliberately avoids. It is short. Do not duplicate its contents into your reasoning; read it.

---

## Non-negotiables

These exist because the codebase was refactored out of the opposite state. Violating them silently undoes that work.

**Styling lives in components, not in CSS.** `src/index.css` is intentionally minimal — imports, `@theme inline`, `:root` tokens, a small `@layer base`, and one quarantined block for assistant-ui. It used to be 1,800 lines across three files. Do not grow it. If something needs styling, it belongs in a component's CVA or as utility classes at the call site.

**No `!important`.** The only remaining instances are in the `aui-*` block, which is scheduled for removal. Never add more. If you feel you need one, you are fighting a component's variants instead of editing them.

**No new CSS classes for things components already do.** This codebase previously had `.moonlit-card`, `.botanical-bento`, `.status-badge`, `.admin-icon-badge` and ~190 usages of similar class-as-component patterns. They were all replaced. Use `Card`, `Badge`, `Empty`, `Item`, etc.

**Light mode only.** There is no theme toggle — `ThemeProvider` was deliberately deleted. Do not add `dark:` variants; they cannot fire. A `.dark` block may exist in `index.css`, but it is inert.

**Design tokens only.** No Tailwind palette classes (`bg-emerald-500`, `text-slate-600`) and no arbitrary hex (`bg-[#f7f8f7]`) for anything themeable. Use `bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-success`, and so on.

The exception is **data-encoded colour** — file-type badges (PDF red, DOCX blue, XLSX green, PPTX orange) encode information, not theme. Those stay literal and are centralised in `src/components/shared/IconTile.tsx`. Do not "fix" them.

Two tokens cannot carry small text: `--warning` and `--info` sit around 3:1 against white. Use them as fills, borders, icons or large text. For text, use a light tint background with a darker same-hue foreground.

---

## The orphan rule

**This has broken the app twice. Read it before deleting any CSS.**

Never delete a CSS class without proving zero references — and **a literal grep is not proof**. Class names are sometimes returned from helper functions:

```ts
// A grep for "file-pdf-badge" in .tsx files finds nothing.
// The class is very much alive.
export function getFileBadgeClass(fileName?: string): string {
  if (ext === "pdf") return "file-pdf-badge";
  ...
}
```

When this exact case was missed, every file-type badge silently turned grey — no error, no failed build.

Before deleting a class, check **both directions** and include `.ts` files:

```bash
CLASS=admin-icon-badge
grep -c "$CLASS" src/index.css
grep -rn --include='*.tsx' --include='*.ts' "$CLASS" src
```

Note the flag order — `--include` must come before the pattern, and do not use `--`, which terminates option parsing and makes grep read `--include` as a filename.

`css:0 tsx:>0` means you have broken something. `css:>0 tsx:0` is dead CSS and safe to remove. Search the bare string too, not just `className="..."` occurrences.

---

## shadcn CLI

All of these are destructive and none are obvious.

| Rule                                               | Why                                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Never `-d`**                                     | It resolves to `--template=next --preset=base-nova` — wrong framework, and it swaps the primitive library to Base UI |
| **Always `--base radix`**                          | `@assistant-ui/react` is built on Radix. Base UI breaks the chat surface                                             |
| **Always `--no-reinstall`** when re-running `init` | Otherwise every hand-edited component CVA is regenerated and lost                                                    |
| **Never `--overwrite`**                            | Components in `src/components/ui/` carry local modifications                                                         |
| **Diff after every run**                           | `git diff src/index.css components.json` — the CLI writes outside `src/components/ui/`                               |

Adding a new component is safe: `npx shadcn@latest add <name>`.

---

## Components

31 shadcn components live in `src/components/ui/`. Check there before building anything.

**Do not write raw `<button>`, `<select>`, or `<input type="checkbox">.** Use `Button`, `Select`, `Checkbox`. Raw form controls have no consistent focus indicator, and native `<select>` cannot be styled consistently across browsers.

**Known exception — do not "fix" these.** About a dozen full-width row targets (document rows, quiz options, artifact list items) are intentionally raw `<button>`. `Button`'s base CVA carries `justify-center` and `whitespace-nowrap`, which breaks `text-left` layout and text truncation in a list row. They each carry an explicit focus ring instead:

```
outline-none focus-visible:ring-3 focus-visible:ring-ring/50
```

If you add a new row-shaped click target, follow that pattern. If you add a normal action button, use `Button`.

**`AlertDialog`, not `Dialog`, for destructive confirmation.** And never `window.confirm()`.

**Layout primitives** are in `src/components/layout/` — `PageShell` and `PageHeader`. Page components should not declare their own height, overflow, max-width or page padding; the shell owns those.

---

## Conventions

**Imports:** `@` is aliased to `src/`. Use `@/components/...`, `@/services/...`, `@/lib/utils`. Same-directory siblings may use `./name`. Do not introduce `../` traversal across top-level directories — there is exactly one component root and one alias convention, and it took a 250-file migration to get there.

**Where things go:**

| Path                                                   | Contents                                              |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `src/components/ui/`                                   | shadcn primitives — edit CVAs here, not at call sites |
| `src/components/layout/`                               | page shell, header, topbar                            |
| `src/components/shared/`                               | cross-feature components                              |
| `src/components/{auth,chat,documents,upload}/`         | feature components                                    |
| `src/pages/`                                           | route components (lazy-loaded in `App.tsx`)           |
| `src/services/`                                        | API clients                                           |
| `src/hooks/`, `src/store/`, `src/types/`, `src/utils/` | as named                                              |

**Icons:** `lucide-react`. Inside a `Button`, use `data-icon="inline-start"` / `"inline-end"` rather than manual margins — the CVA handles spacing. Do not set an explicit size; the base CVA sizes icons.

**assistant-ui:** the chat surface (`src/components/assistant-ui/`) wraps a third-party library. Its `aui-*` CSS is quarantined deliberately. See `.agents/skills/assistant-ui/` before changing it.

---

## Verification

Run both before reporting work complete:

```bash
npx tsc -b        # must exit 0
npm run build     # must exit 0
```

`tsc -b` is the primary signal — `noUnusedLocals` and `noUnusedParameters` are on, so dead imports fail the build. There is no test suite.

**`npm run lint` does not currently pass** — it reports ~28 pre-existing errors, mostly `no-explicit-any` and unused variables. Do not treat it as a gate and do not attempt a repo-wide lint cleanup unless that is the task. Just do not add new violations in files you touch.

**Regression greps.** The compiler cannot catch these, and each one represents a rule above:

```bash
# CSS must not regrow — no !important outside the aui- block
grep -c '!important' src/index.css

# No raw form controls
grep -rho '<select\|type="checkbox"' src --include='*.tsx' | wc -l

# No dark-mode variants
grep -rho 'dark:' src --include='*.tsx' | wc -l

# No hardcoded colour
grep -rhoE '\b(bg|text|border)-(slate|gray|zinc|red|orange|amber|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)-[0-9]{2,3}' src --include='*.tsx' | wc -l
grep -rhoE '(bg|text|border)-\[#[0-9a-fA-F]{3,8}\]' src --include='*.tsx' | wc -l
```

These should trend toward zero. If a change increases one, that change is going the wrong way.

**Visual changes need a browser.** `npm run dev` serves on port 5173. A green build proves nothing about layout, focus states, or whether a CSS deletion orphaned a class.

---

## Working style

- Prefer editing a component's CVA over adding classes at call sites. One change, applied everywhere.
- When a rule above blocks you, say so rather than working around it. The workarounds are what the refactor removed.
- Report honestly: if `tsc` fails, quote it. If you skipped part of the task, say which part.
- `README.md` is unmodified Vite boilerplate and describes nothing about this project. Ignore it.
