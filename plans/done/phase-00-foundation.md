# Phase 00 — Foundation

**Duration:** Week 1, days 1–2
**Spec refs:** §20, §21, §30 (Frontend — birinchi hafta), D-01…D-04
**Prerequisites:** none — this is the first phase
**Status:** substantially pre-existing in this repo (Vite + React Router + TS strict + ESLint + Prettier + Husky/commit hooks already configured); no separate build needed. Stack differs from the Next.js steps below — see Phase 04's "Repo adaptation" table for the mapping.

**Goal:** a repository where a wrong type, a wrong import direction, or a missing environment variable fails the build. Everything after this phase depends on that being true.

---

## Step 0.1 — Initialise the project

```bash
pnpm create next-app@latest lexkotib-web \
  --ts --app --tailwind --eslint --src-dir --import-alias "@/*"
cd lexkotib-web
```

Pin the toolchain so CI and every developer machine agree:

- `.nvmrc` → `22`
- `package.json` → `"packageManager": "pnpm@9.x.x"`
- `"engines": { "node": ">=22 <23" }`

Delete the Next.js starter page, starter CSS and the demo assets immediately. Nothing from the template survives into Phase 01.

---

## Step 0.2 — TypeScript strictness

`tsconfig.json` compiler options:

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true, // array access returns T | undefined
  "exactOptionalPropertyTypes": true, // `foo?: string` ≠ `foo: string | undefined`
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "verbatimModuleSyntax": true, // type imports never reach the bundle
  "forceConsistentCasingInFileNames": true,
}
```

`noUncheckedIndexedAccess` matters specifically here: the transcript editor indexes into segment arrays constantly, and an off-by-one during virtualization is a class of bug this setting eliminates at compile time.

**Verify:** `pnpm tsc --noEmit` passes on the empty project.

---

## Step 0.3 — Lint, format, hooks

**ESLint** (flat config, `eslint.config.mjs`):

- `next/core-web-vitals`
- `@typescript-eslint` strict-type-checked (requires `parserOptions.project`)
- `eslint-plugin-import` with `no-restricted-paths` implementing the four boundary rules from `03-repo-structure.md`
- Custom rule or `no-restricted-syntax` forbidding raw hex colour literals outside `src/styles/`

**Prettier** with `prettier-plugin-tailwindcss` for class ordering.

**Husky + lint-staged** on pre-commit:

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json}": ["prettier --write"]
}
```

Plus a pre-push hook running `tsc --noEmit`.

**Commitlint** with conventional commits. Branch naming per §21: `feature/LK-<n>-<slug>`, `fix/LK-<n>-<slug>`, off `develop`.

---

## Step 0.4 — CI pipeline

`.github/workflows/ci.yml`, triggered on PR and on push to `develop` / `main`:

```text
setup (pnpm cache, node 22)
  ├─ typecheck        tsc --noEmit
  ├─ lint             eslint .
  ├─ test:unit        vitest run --coverage
  ├─ build            next build
  └─ test:e2e         playwright test --project=chromium   (depends on build)
```

- Playwright artefacts (trace, video, screenshots) uploaded on failure.
- PR merge blocked on all jobs green — §21 pull request requirements.
- Storybook build added as a job in Phase 01.

---

## Step 0.5 — Environment contract

`.env.example` (committed) and `.env.local` (gitignored):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8787/ws
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_AUDIO_SAMPLE_RATE=24000
NEXT_PUBLIC_AUDIO_CHUNK_MS=250
NEXT_PUBLIC_MAX_BUFFERED_CHUNKS=2400
NEXT_PUBLIC_APP_VERSION=0.1.0
```

`src/lib/env.ts` parses these with Zod **at module load**:

```ts
const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_WS_URL: z.string().url(),
  NEXT_PUBLIC_USE_MOCKS: z.enum(["true", "false"]).transform((v) => v === "true"),
  NEXT_PUBLIC_AUDIO_SAMPLE_RATE: z.coerce.number().int().positive(),
  NEXT_PUBLIC_AUDIO_CHUNK_MS: z.coerce.number().int().positive(),
  NEXT_PUBLIC_MAX_BUFFERED_CHUNKS: z.coerce.number().int().positive(),
});

export const env = EnvSchema.parse({/* explicit property access — Next.js inlines these */});
```

A missing or malformed variable fails the build, not a user's hearing at minute forty.

`MAX_BUFFERED_CHUNKS = 2400` gives 10 minutes of offline capacity at 250ms chunks — the §9.5 reconnect requirement made concrete.

---

## Step 0.6 — Docker

`next.config.ts` sets `output: 'standalone'`. Multi-stage `Dockerfile`:

1. `deps` — pnpm install with lockfile, cached
2. `builder` — `next build`
3. `runner` — `node:22-alpine`, non-root user, copies `.next/standalone` + `.next/static` + `public`

**No Vercel dependency.** §27 Phase 2 requires on-prem/private deployment; the container must run in an isolated court network.

---

## Step 0.7 — Documentation scaffolding

Create `docs/adr/` with `0001-frontend-stack.md` recording D-01 through D-15 and the reasoning. §21 requires ADRs; writing the first one now establishes the habit before decisions get made in chat and lost.

---

## Files produced

```text
.nvmrc
.env.example
eslint.config.mjs
.prettierrc
.husky/{pre-commit,pre-push,commit-msg}
.github/workflows/ci.yml
Dockerfile
next.config.ts
tsconfig.json
src/lib/env.ts
docs/adr/0001-frontend-stack.md
```

---

## Exit criteria

- [ ] `pnpm dev` serves an empty page
- [ ] `pnpm build` succeeds
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test` runs (zero tests is acceptable)
- [ ] CI green on a trivial PR
- [ ] Removing a variable from `.env.local` breaks the build with a readable Zod error
- [ ] `docker build` produces a runnable image
- [ ] ADR 0001 committed

---

## Notes for the implementer

Resist the urge to start UI work in this phase because the setup feels unproductive. The import boundary rule in Step 0.3 is the single highest-leverage line in the entire plan — it is what prevents `features/transcript` from importing `features/documents` in week eight, which is how these codebases die.
