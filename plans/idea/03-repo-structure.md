# 03 — Repository Structure and Conventions

## Layout

```text
lexkotib-web/
├── .github/workflows/ci.yml
├── docs/adr/
├── e2e/                                  # Playwright specs + fixtures
├── mock-ws/                              # standalone Node WebSocket replay server
│   ├── server.ts
│   ├── scenarios/
│   └── package.json
├── public/
│   └── worklets/pcm-encoder.js           # AudioWorklet, not bundled
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx                # shell: header + nav + spine slot
│   │       ├── dashboard/page.tsx
│   │       ├── cases/
│   │       │   ├── page.tsx              # 3. Ishlar ro'yxati
│   │       │   ├── new/page.tsx          # 4. Yangi ish
│   │       │   └── [caseId]/
│   │       │       ├── page.tsx          # 5. Ish tafsilotlari
│   │       │       └── documents/page.tsx
│   │       ├── hearings/[hearingId]/
│   │       │   ├── layout.tsx            # injects RecordSpine
│   │       │   ├── setup/page.tsx        # 6. Majlisga tayyorgarlik
│   │       │   ├── live/page.tsx         # 7. Jonli majlis
│   │       │   ├── transcript/page.tsx   # 8. Transcript review
│   │       │   ├── events/page.tsx
│   │       │   └── protocol/page.tsx     # 9. Bayonnoma editor
│   │       ├── documents/
│   │       │   ├── page.tsx              # 10. Hujjatlar ro'yxati
│   │       │   └── [documentId]/page.tsx # 11. Hujjat editor va approval
│   │       └── admin/
│   │           ├── templates/page.tsx    # 12
│   │           ├── audit/page.tsx        # 13
│   │           └── providers/page.tsx    # 14
│   ├── features/
│   │   ├── auth/
│   │   ├── cases/
│   │   ├── participants/
│   │   ├── hearings/
│   │   ├── audio/                        # capture pipeline
│   │   ├── live-session/                 # WS client + Zustand store
│   │   ├── transcript/
│   │   ├── events/
│   │   ├── protocol/
│   │   ├── documents/
│   │   └── audit/
│   ├── components/
│   │   ├── ui/                           # shadcn primitives, restyled
│   │   ├── record/                       # domain primitives (see Phase 01)
│   │   └── layout/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── http.ts
│   │   │   ├── errors.ts
│   │   │   └── endpoints/
│   │   ├── contracts/                    # Zod schemas mirroring §14 / §15
│   │   ├── query/                        # queryClient, queryKeys
│   │   ├── ws/                           # protocol types, socket-manager
│   │   ├── audio/                        # chunk-manager, indexeddb, encoding
│   │   ├── i18n/
│   │   ├── capabilities.ts
│   │   └── env.ts
│   ├── mocks/                            # MSW handlers + fixtures
│   └── styles/
│       ├── tokens.css
│       └── globals.css
├── .env.example
├── Dockerfile
└── package.json
```

---

## Module boundary rules

These are enforced by ESLint (`eslint-plugin-import` `no-restricted-paths`), not by convention.

1. **`features/a` may not import from `features/b`.** Shared logic moves to `lib/`; shared UI moves to `components/`.
2. **`components/` may not import from `features/`.** Components are dumb; features are smart.
3. **`lib/` may not import from `features/` or `components/`.** It is the bottom layer.
4. **`app/` imports from everywhere but contains no logic.** A page file wires a feature's screen component to route params. Nothing else.

A violation is a build failure, not a review comment. This is what keeps a ten-week build from becoming a tangle in week seven.

---

## Feature folder shape

Every feature folder has the same internal structure:

```text
features/transcript/
├── components/          # feature-specific UI
├── hooks/               # useTranscript, useSegmentMutation
├── stores/              # only if the feature needs client state
├── schemas/             # feature-local Zod (form schemas, not API contracts)
├── utils/
├── screens/             # the top-level screen component the route renders
└── __tests__/
```

API contracts live in `lib/contracts/`, never in a feature — several features read the same entities.

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase | `SegmentRow.tsx` |
| Hook file | camelCase, `use` prefix | `useSegmentMutation.ts` |
| Utility file | kebab-case | `chunk-manager.ts` |
| Zod schema | PascalCase + `Schema` | `TranscriptSegmentSchema` |
| Inferred type | PascalCase, no suffix | `type TranscriptSegment` |
| Query key factory | camelCase | `queryKeys.hearings.transcript(id)` |
| Test file | `*.test.ts(x)` beside source | `SegmentRow.test.tsx` |
| E2E spec | kebab-case, numbered by flow | `03-transcript-review.spec.ts` |

**Enums from the specification keep their exact spec casing.** `MOTION_SUBMITTED`, `AI_GENERATED`, `CLAIMANT_REPRESENTATIVE`. Never translate or re-case them in code — only in display.

---

## Import alias

`@/*` maps to `src/*`. No relative imports crossing a folder boundary; within a feature, relative is fine.

---

## Path to the monorepo

When this moves into §20's monorepo:

- `lexkotib-web/` → `apps/web/`
- `src/lib/contracts/` → `packages/schemas/` (imports change from `@/lib/contracts` to `@lexkotib/schemas`)
- `src/components/ui/` + `src/components/record/` → `packages/ui/`
- `mock-ws/` → `services/mock-ws/` or into `services/realtime-gateway/` as a test harness

Because those three directories have no inward dependencies on `features/`, the move is mechanical. This is why boundary rule 3 exists.
