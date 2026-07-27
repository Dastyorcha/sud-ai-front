# Mockup 03 — New case wizard

- **Status:** idea
- **Size:** medium
- **Author model:** Fable 5 (planner)

## Goal

"Yangi ish ochish" as a 5-step modal wizard: 1) case kind (Fuqarolik / Iqtisodiy / Maxsus) + category, 2) parties (da'vogar, javobgar, optional vakil), 3) claim (text, amount, basis, boj calculator), 4) documents upload zone + required-docs checklist, 5) summary + confirm.

## Scope & non-goals

- **In scope:** wizard modal (lazy-loaded), step indicator, per-step zod validation, boj (state fee) calculator stub, create via existing case service, new card appears on dashboard.
- **Out of scope:** real file upload backend (in-memory list), real boj tariff table (single simple formula, marked TODO).

## Affected files

| Path (FSD layer)                     | New? | Intent                                    |
| ------------------------------------ | ---- | ----------------------------------------- |
| `src/widgets/new-case-wizard/`       | yes  | modal, steps, footer nav (lazy)           |
| `src/features/case-create/`          | yes  | form schema (zod), boj calc, submit hook  |
| `src/views/dashboard/`               | no   | wire button → open wizard                 |
| `src/shared/components/ui/`          | ?    | add missing shadcn primitives (stepper via composition; ask before new packages) |

## Steps

1. [ ] Wizard shell: `ReusableModal`/Dialog, step indicators, prev/next/finish footer, step counter — `feat: new case wizard shell`
2. [ ] Steps 1–2: kind cards, category select, parties form (react-hook-form + zod) — `feat: wizard case type and parties steps`
3. [ ] Step 3: claim fields + boj calculator — `feat: wizard claim step with fee calculator`
4. [ ] Steps 4–5: upload dropzone + required-docs list, summary + confirm → create case, toast, navigate — `feat: wizard documents and confirm steps`
5. [ ] i18n + codemap sync — `docs: sync codemap`

## Risks / ripple / escalation

- Touches `src/features/` (shared logic) — new folder, no existing behavior changed.
- Boj formula is a legal-domain guess — flag as TODO for user confirmation.
- New dependency: none expected; **ask** if a dropzone package seems needed (prefer hand-wired input[type=file] inside a ui primitive).

## Verification

- Full happy path: open → 5 steps → finish → case on dashboard.
- Validation blocks next on empty required fields; back preserves values.
