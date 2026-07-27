# Mockup 01 — App chrome & court theme

- **Status:** idea
- **Size:** medium
- **Author model:** Fable 5 (planner)

## Goal

Give the app the mockup's court identity: header with ⚖️ logo + "Court AI Assistant / Sud AI Yordamchisi", breadcrumb (dashboard → active case), user block (avatar initials, name, role), a status footer, and the gold-accent design tokens the rest of the mockup plans depend on.

## Scope & non-goals

- **In scope:** header widget, footer widget, breadcrumb wired to router state, design tokens (gold accent `btn-gold`, stage-badge palette, speaker colors, status colors), Inter + Noto Serif font stack.
- **Out of scope:** page content (later plans), auth/user data changes (reuse phase-03 RBAC user).

## Affected files

| Path (FSD layer)                | New? | Intent                                                          |
| ------------------------------- | ---- | --------------------------------------------------------------- |
| `src/index.css`                 | no   | gold/stage/speaker/status tokens, fonts                         |
| `src/widgets/app-header/`       | ?    | logo, breadcrumb, user info (create or restyle existing header) |
| `src/widgets/app-footer/`       | yes  | version, system status dot, tagline                             |
| `src/app/` layout               | no   | mount header/footer around routed views                         |
| `src/shared/lib/i18n/` messages | no   | header/footer strings uz/en/ru                                  |

## Steps

1. [x] Add tokens to `src/index.css` (gold accent, 6 stage colors, 4 speaker colors, status green/amber/red) with dark-mode variants — `feat: court theme tokens`
2. [x] Header widget: logo block, breadcrumb (home / active case number), user avatar+name+role from auth state — `feat: court app header with breadcrumb`
3. [x] Footer widget: version, status dot, last-update, tagline — `feat: app status footer`
4. [x] i18n messages + codemap sync — `docs: sync codemap`

## Risks / ripple / escalation

- Touches `src/index.css` shared tokens — keep existing token names, only add.
- New dependency: none (fonts self-hosted or system fallback; ask user before adding a font package).

## Verification

- `npx tsc -b`, `npm run lint` clean.
- `/tools` + all existing pages render with header/footer in light + dark, all three locales.
