---
name: ui-designer
description: Use on ANY user-facing change in this Vite + React admin panel — views, widgets, shadcn primitives, design tokens, the /tools playground, or copy. Triggers on paths under src/shared/components/ui/, src/widgets/, src/views/, src/components/, src/index.css, and on layout / styling / color / theme / dark-mode / animation / responsive / a11y / forms / typography / copy tasks. Every change MUST be responsive AND theme-aware (light + dark). This is an admin panel: NO SEO. Every user-facing string routes through the custom i18n `t()` (docs/i18n.md) — no hardcoded copy in new work. Follows FSD + kebab-case (docs/architecture.md) — read it before applying.
---

# UI Designer

Strict ruleset for every visual change in this **Vite + React 19 + React Router v7 + Tailwind v4 + shadcn/ui** admin panel. `docs/architecture.md` (FSD + naming) is the source of truth; if this skill and that doc disagree, the doc wins — fix the wrong one in the same change.

## The two non-negotiables

Every change ships both, together, or it isn't done.

### 1. Responsive (mobile-first)

- Base styles for mobile, layer up `sm: md: lg: xl:`. Never desktop-first.
- Verify at **320 / 768 / 1024 / 1440px**; nothing overflows or clips at 320.
- Touch targets ≥ **44×44px**. Use the scale (`gap-4`, `px-6`, `max-w-*`) — avoid arbitrary `w-[437px]` (reach for `clamp()` only when no step fits).
- Data tables and dense admin layouts: horizontal scroll containers, not squashed columns.

### 2. Theme-aware (light + dark)

- Dark = `.dark` on root, managed by `next-themes`. **Semantic tokens only** — no hex/rgb/oklch, no `dark:` literals in app code (the `dark:` variants inside `shared/components/ui/*` primitives are the exception).
- Prefer flipping pairs: `bg-background`/`text-foreground`, `bg-card`, `bg-muted`/`text-muted-foreground`, `border-border`. A one-off dark need → add/adjust a token in `src/index.css`.
- Verify at `/tools` in both themes before finishing.

## Decide autonomously vs. ASK

**Decide:** colors (from tokens), spacing, layout, column counts, heading scale, icon picks (lucide), card/button variants, copy phrasing (within the voice below), section ordering, simple `motion`/CSS transitions (fade/slide/scale, 150/250/400ms, with `prefers-reduced-motion` fallback).

**ASK:** any new dependency (incl. a shadcn primitive that pulls a package); removing/renaming a public token or primitive; a new route or view; scope changes. When in doubt on a contained change, act and explain; on a change touching shared surface, ask.

## Tokens — `src/index.css` only

Tailwind v4 is CSS-first (`:root`, `.dark`, `@theme`); tokens live in `src/index.css`. Use the shadcn semantic set: `bg-{background,card,popover,primary,secondary,muted,accent,destructive}`, `text-{foreground,muted-foreground,card-foreground,…}`, `border-border`, `border-input`, `ring-ring`, `bg-chart-{1..5}`. Radius via `rounded-*`. Fonts via `font-sans`/`font-mono`. No brand token yet → add it in `:root` + `.dark` + `@theme`, then use the utility. **Never** hardcode a color literal.

## Tailwind & class rules

- Tailwind v4 only. No CSS modules, no `<style>`, no inline `style` for color/spacing/layout. Non-token global CSS lives in `src/shared/styles/`.
- Conditional classes via `cn()` (`@/lib/utils`, target `@/shared/lib/utils`). Variant sets via `cva` — match `components/ui/button.tsx`.
- Comments sparingly — only for non-obvious logic.

## Reuse before creating (NON-NEGOTIABLE)

**Always compose from existing components. Never hand-roll a raw HTML tag when a component exists for it.** Reach for a raw element only when genuinely nothing fits — and then it becomes a candidate for a new shared primitive, not an inline one-off.

- **Never write a raw `<button>` in app code** (`views`/`widgets`/`features`/`shared/custom`) — use `Button` (`<Button asChild>` to render an `<a>`/other tag). Raw `<button>` lives **only** inside `shared/components/ui/*` primitives.
- The same rule applies to every interactive/structural element that has a primitive: form controls → `Input`/`Label`/`Form`/`InputOTP` (never bare `<input>`/`<label>`/`<form>`); dialogs → `Dialog`/`ReusableModal` (never a hand-rolled overlay `<div>`); tabs → `Tabs`; toasts → `sonner` (Toaster already mounted); a bordered/padded content block → `Card` (+ `CardHeader`/`CardContent`); an empty state → `NoData`; a loading state → `Spinner`. Icons: `lucide-react` only.
- Installed primitives (`src/components/ui/`): `button`, `card`, `dialog`, `form`, `input`, `input-otp`, `label`, `tabs`, `sonner`, plus `noData`. **Before hand-rolling anything, check this list and `shared/custom/` first.**
- A styled `<div>` that re-implements a primitive is a smell — convert it. Override look via `className`/variant, don't re-derive the markup.
- Missing a primitive the design needs → `npx shadcn@latest add <name>` (ASK first if it pulls a new package). Do not hand-roll it.

`refactor-code` enforces the same rule: it greps every raw `<button>` (and re-implemented primitive) in app code and converts it.

## Animation

Use `motion` (installed) + CSS/Tailwind transitions. Animate `transform`/`opacity` only. Durations 150ms (micro) / 250ms (UI) / 400ms (page). Always honour `prefers-reduced-motion`. ASK before adding orchestrated sequences or a new animation library.

## Performance & code splitting (admin panel — MUST)

- **Code-split every route.** New pages/views are added to the router with `React.lazy(() => import(...))` + `Suspense` — never a static top-level import in `app.tsx`. This is the established pattern; keep it for every route you add.
- **Lazy-load heavy, below-the-fold, or conditional UI** — modals/dialogs, drawers, charts, rich editors, big tables: `React.lazy` them so they don't ship in the initial bundle. A dialog that's closed on load should not be in the entry chunk.
- Split large widgets and vendor-heavy features into their own chunks; prefer many small lazy chunks over one large eager one.
- Images: plain `<img>` with explicit `width`/`height` + `loading="lazy"` (no `next/image` here — this is Vite). Prevent layout shift.
- Memoise expensive table/list renders; virtualise long lists.
- Keep re-renders local: colocate state in the widget that owns it.

## States, forms, a11y, typography

- **States:** default, hover, `focus-visible:ring-ring`, active, disabled. Data views define **loading + empty + error** (use `Spinner`/`NoData`).
- **Forms:** shadcn primitives + `react-hook-form` + `zod`. `<Label>` above input, linked via `htmlFor`. Validate on blur. Errors say how to fix. Required fields marked (`aria-required`).
- **A11y:** keep Radix `aria-*`/`asChild`; contrast ≥ 4.5:1 text / 3:1 UI in both themes; decorative icons `aria-hidden`, icon buttons get `aria-label`; one `<h1>`/page, ordered headings.
- **Typography:** Tailwind scale only; `leading-tight` headings / `leading-relaxed` body; `max-w-prose`, `text-balance`, `text-pretty`, `tabular-nums` for numeric/table data.

## Copy — product-first

Plain, warm, concrete, confident. Sentence case; verb-led buttons ("Save changes"). Specifics over adjectives. Avoid AI-slop: `delve`, `seamless`, `robust`, `leverage`, `cutting-edge`, `unlock`, `elevate`, `revolutionary`, `streamline`, `harness`. No exclamation marks in declarative copy. Empty states say what to do next; errors say how to fix.

## Naming (per `docs/architecture.md`)

Files/folders **kebab-case**; components/types **PascalCase**; functions/vars **camelCase**; hooks `useX`; constants **UPPER_SNAKE_CASE**. One component per file.

## No SEO — but i18n is required

This is an admin panel. **Never** add meta tags, OG, JSON-LD, sitemap, hreflang, or canonical anywhere. If SEO is ever requested, it's a scope change → ASK.

The panel ships a lightweight custom i18n layer (`src/shared/lib/i18n/`, uz/en/ru, no library — full spec `docs/i18n.md`). Every new user-facing string goes through `useTranslation().t("namespace.key")` — **never hardcode copy** in a view/widget. Add the key to `messages/uz.ts` first, then mirror it in `en.ts` and `ru.ts` (a missing key is a type error). Routes are locale-prefixed (`/:lang/*`); build in-app links with `withLocale(locale, ROUTE_PATHS.X)`, never a bare path.

## Style-change sync rule

A change to reusable design surface (`src/index.css`, `src/shared/components/ui/**`, shared `cva`/variant logic, `src/shared/custom/**`) MUST, in the same change: update the `/tools` playground, `CLAUDE.md` (if project guidance shifts), `docs/architecture.md` (structure/naming/tokens), and this file (if a rule changes). State explicitly when nothing is affected.

## Reference patterns

- cva variants → `src/components/ui/button.tsx`
- Overlays → `src/components/ui/dialog.tsx`, `src/components/reuseable/reuseableModal.tsx`
- Form atoms → `src/components/ui/{input,label,form}.tsx`
- Empty state → `src/components/ui/noData.tsx`
- Token source → `src/index.css` (`@theme`, `:root`, `.dark`)
- Playground → `src/pages/tools/toolsPage.tsx` (target `src/views/tools/`)
