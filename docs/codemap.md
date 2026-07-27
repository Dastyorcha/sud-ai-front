# Codemap

One line per source file: `path · exports · purpose`. The third-tier lookup (after `CLAUDE.md` and the Doc map) — cheap to read whole, jump straight to the right file instead of grepping.

**Maintenance:** when you add, remove, or rename an exported symbol under `src/`, or move a file, edit the affected line(s) here in the same change — do not regenerate the whole file.

> The tree still has a few pre-FSD files (`pages/`, `components/pages/`). `refactor-code` migrates files to FSD + kebab-case incrementally; this map tracks the current on-disk reality until then.

## Entry / app

- `src/main.tsx` · — · React root; mounts `<App>` inside `AppProviders`, inside `BrowserRouter`.
- `src/app/app.tsx` · `App` · React Router route table, all routes mounted under `/:lang` (`LocaleRoot`, `RootRedirect` → preferred locale, invalid-locale 404). Dashboard/users render inside `<AuthGuard><AppShell/></AuthGuard>` (dashboard is the index route). The user detail is NOT a route — it's a drawer the list page opens via a `?user=` query param (see `DETAIL_PARAM`). `/403`, `/404`, `/maintenance` are bare system views; `/tools` + the legacy catch-all stay under `MainLayout`; auth pages (login/register/reset) are bare. All pages lazy-loaded; localhost-only `/tools` shortcut.
- `src/app/providers.tsx` · `AppProviders` · composes `next-themes` `ThemeProvider` (`.dark` on root) + the `sonner` `Toaster`. Locale is provided per `/:lang` match inside the router, not here.

## Pages (→ target `src/views/`)

- `src/pages/tools/toolsPage.tsx` · `ToolsPage` · the `/tools` playground (tokens/primitives/`ThemeToggle`/`NoData` showcase, plus `StatusBadge`/`Money`/`DateText`/`DetailGrid`/data-state blocks/`Can`+`usePermission`).
- `src/pages/notFound.tsx` · `NotFound` · 404 view used for the legacy catch-all and invalid-locale case (localized via `useTranslation()`).
- `src/pages/auth/login/loginPage.tsx` · `LoginPage` · login page shell.
- `src/pages/auth/register/registerPage.tsx` · `RegisterPage` · register page shell.
- `src/pages/auth/resetPassword/resetPasswordPage.tsx` · `ResetPasswordPage` · reset-password page shell.

## Views (`src/views/`)

- `src/views/dashboard/dashboard.tsx` · `Dashboard` (default) · dashboard placeholder — renders `ComingSoon`. Replace with real KPI/summary widgets.
- `src/views/cases/cases.tsx` · `CasesView` (default) · court-case list (spec FR-02/UC-01) — debounced search over `useCases()`, a `Table`, row click opens the case detail page.
- `src/views/cases/case-new.tsx` · `CaseNewView` (default) · case creation form (spec UC-01) — requisites + participants field array (RHF + Zod, ≥1 claimant/defendant), `sessionStorage` draft, creates case + participants then opens detail.
- `src/views/cases/case-detail.tsx` · `CaseDetailView` (default) · compact case detail — requisites (`DetailGrid`) + participants table via `useCase`/`useParticipants`; reads `:caseId`.
- `src/views/hearings/hearing-detail.tsx` · `HearingDetailView` (default) · hearing workspace (spec §16.1 #6–9) — tabs: live / transcript / events / protocol; canonical approval transitions the hearing.
- `src/views/documents/documents.tsx` · `DocumentsView` (default) · generated documents + read-only template catalogue (spec §16.1 #10/#12, D-14).
- `src/views/admin/admin.tsx` · `AdminView` (default) · read-only audit log + provider status (spec §16.1 #13–14, FR-12, NFR-05).
- `src/features/hearings/use-hearings.ts` · `useHearings`, `useHearing` · hearing hooks over `hearing.service`.
- `src/features/live-session/live-hearing-panel.tsx` · `LiveHearingPanel` · live hearing screen (§16.2) — scripted live-feed stand-in for the STT WebSocket, §17.3 controls, finalize job flow.
- `src/features/transcript/transcript-panel.tsx` · `TranscriptPanel` · transcript editor (FR-07/UC-05) — filters, inline edit (raw preserved), verify, bulk speaker mapping (AC-03), canonical-approval gate.
- `src/features/events/events-panel.tsx` · `EventsPanel` · procedural-events review (FR-08/§11) — verify/reject, sources shown, unsourced events flagged as errors.
- `src/features/protocol/protocol-panel.tsx` · `ProtocolPanel` · protocol view (FR-09/UC-06) — sections with origin + source traceability, FR-11 approval actions, export job.
- `src/features/cases/vocabulary-panel.tsx` · `VocabularyPanel` · case vocabulary (§9.7) — auto-derived terms grouped by origin with weights.
- `src/shared/lib/mock-api/data/audit-logs.ts` · `AUDIT_LOGS` · audit-trail fixtures (FR-12).
- `src/views/users/users.tsx` · `UsersView` (default) · the reference CRUD list page — debounced search over `useUsers()`, a `Table`, row click opens the detail drawer via `?user=`.
- `src/views/users/user-detail.tsx` · `UserDetail` (default), `UserDetailProps` · single-user detail `Sheet` drawer — takes `userId` + `onClose`, fetches independently via `use-mock-query` + `getUser`.
- `src/views/errors/forbidden.tsx` · `Forbidden` (default) · 403 view, `NoData` + localized copy.
- `src/views/errors/not-found.tsx` · `NotFound` (default) · 404 view for the explicit `ROUTE_PATHS.NOT_FOUND` route, `NoData` + localized copy.
- `src/views/errors/maintenance.tsx` · `Maintenance` (default) · maintenance view, `NoData` + localized copy.

## Widgets (`src/widgets/`)

- `src/widgets/layout/app-shell/app-shell.tsx` · `AppShell` · product shell: fixed sidebar on desktop, `Sheet` drawer on mobile (owns open state), `AppHeader`, scrollable `<Outlet>`, `AppFooter`.
- `src/widgets/layout/sidebar/sidebar.tsx` · `Sidebar` · dark nav: brand (`APP_NAME` + mark), `NAV_ITEMS` rows with active-state, footer (`allRightsReserved`).
- `src/widgets/layout/sidebar/sidebar-nav-item.tsx` · `SidebarNavItem` · one nav row (`Button asChild` + `Link`, icon, label, optional count badge).
- `src/widgets/layout/auth-guard/auth-guard.tsx` · `AuthGuard` · stub guard: redirects to `ROUTE_PATHS.LOGIN` when `useAuth().isAuthenticated` is false (always true today).
- `src/widgets/app-header/app-header.tsx` · `AppHeader` · court app header (supersedes the old `Topbar`): mobile menu button, gold logo lockup (`APP_NAME`/`APP_FULL_NAME`, links to dashboard), breadcrumb (dashboard → active case number via `matchPath(ROUTE_PATHS.CASE_DETAIL)` + `useCase`), `ThemeToggle`, `LangSwitcher`, user block (avatar initials, name, role) from `useCourtAuth()`.
- `src/widgets/app-footer/app-footer.tsx` · `AppFooter`, `SystemStatus` · status footer under the routed content: status dot (`status-ok`/`-warning`/`-error` tokens), last-updated timestamp, version (`APP_VERSION`), tagline.
- `src/widgets/case-card/case-card.tsx` · `CaseCard`, `CaseCardProps` · dashboard grid card (mockup): case number + `StageBadge`, "X vs Y" parties, subject, `CaseTypeTag`, claim `Money`, updated `DateText`; whole card links to `buildRoute.caseDetail`.

## Widgets (→ target `src/widgets/`, pre-FSD)

- `src/shared/components/layout/main-layout.tsx` · `MainLayout` (default) · header + `<Outlet>` + footer shell for `/tools` + the legacy catch-all.
- `src/shared/components/layout/header/app-header.tsx` · `AppHeader` (default) · top navigation bar for `MainLayout`.
- `src/shared/components/layout/footer/app-footer.tsx` · `AppFooter` (default) · footer for `MainLayout`.
- `src/shared/components/pages/auth/loginForm.tsx` · `LoginForm` · login form (RHF + zod).
- `src/shared/components/pages/auth/registerForm.tsx` · `RegisterForm` · register form.
- `src/shared/components/pages/auth/resetPasswordForm.tsx` · `ResetPasswordForm` · reset-password form.
- `src/shared/components/pages/auth/confirmCode.tsx` · `ConfirmCode` · OTP confirmation step.

## Features (`src/features/`)

- `src/features/auth/use-auth.ts` · `useAuth`, `AuthUser`, `UseAuthResult` · stub current-session hook (mock authenticated admin user); real auth lands when you wire a backend.
- `src/features/auth/use-permission.ts` · `usePermission`, `UsePermissionResult` · `can(action)` role check over `PERMISSIONS` for the current `useAuth()` role.
- `src/features/users/use-users.ts` · `useUsers`, `UseUsersResult` · user directory hook over `user.service.listUsers` — powers the users list page.
- `src/features/cases/use-cases.ts` · `useCases`, `UseCasesParams`, `UseCasesResult` · case-list hook over `court-case.service.listCases` — re-fetches on filter/page change (debounce search at call site).
- `src/features/cases/use-case.ts` · `useCase`, `UseCaseResult` · single-case hook over `court-case.service.getCase`.
- `src/features/participants/use-participants.ts` · `useParticipants`, `UseParticipantsResult` · a case's participants hook over `participant.service.listParticipants`.
- `src/features/participants/participant-form-dialog.tsx` · `ParticipantFormDialog`, `ParticipantFormDialogProps` · add/edit participant dialog (spec §14.3, UC-01 Step 4.5) — create/update via the service, `onSaved` for refetch.

## Shared — custom (`src/shared/custom/`)

- `src/shared/custom/scroll-to-top.tsx` · `ScrollToTop` · resets scroll on route change.
- `src/shared/components/reusable-modal.tsx` · `ReuseableModal` (default) · dialog wrapper.
- `src/shared/custom/lang-switcher.tsx` · `LangSwitcher` · locale dropdown; swaps the `:lang` route segment, preserves path + query, persists to `localStorage`.
- `src/shared/custom/theme-toggle.tsx` · `ThemeToggle` · icon button flipping `next-themes`' resolved theme; localized `aria-label`.
- `src/shared/custom/coming-soon.tsx` · `ComingSoon`, `ComingSoonProps` · centered "coming soon" state for placeholder views (dashboard); optional `titleKey`.
- `src/shared/custom/status-badge.tsx` · `StatusBadge`, `StatusBadgeProps` · generic `cva` tone badge (`neutral|primary|success|warning|destructive|info`) — localized `label` + optional `icon`/`dotClassName`.
- `src/shared/custom/stage-badge.tsx` · `StageBadge`, `StageBadgeProps` · case-stage pill (mockup dashboard) — `StatusBadge` with a `stage-1..6` token dot; the one place mapping `CaseStage` → token.
- `src/shared/custom/case-type-tag.tsx` · `CaseTypeTag`, `CaseTypeTagProps` · neutral outline `Badge` for a case's `CaseType`, label via `enums.caseType.*`.
- `src/shared/custom/record/timestamp.tsx` · `Timestamp` · mono, tabular hearing-relative `HH:MM:SS`/`MM:SS`; clickable variant emits `onSeek(ms)` (spec §16.3).
- `src/shared/custom/record/speaker-chip.tsx` · `SpeakerChip` · speaker attribution chip — unmapped (mono, dashed) / mapped (role) / conflicting (destructive) states (spec §9.6).
- `src/shared/custom/record/confidence-bar.tsx` · `ConfidenceBar` · 3px STT confidence meter, `warning` below 0.75, numeric value via ARIA (spec §16.3).
- `src/shared/custom/record/record-state-badge.tsx` · `RecordStateBadge` · single badge for document/segment/hearing/job status; one tone table per enum, label via `enums.*` (spec §16, FR-11).
- `src/shared/custom/record/critical-field-mark.tsx` · `CriticalFieldMark` · inline dotted-underline mark for critical fields; reviewed=success, unreviewed=destructive (spec §10.3).
- `src/shared/custom/record/record-spine.tsx` · `RecordSpine`, `RecordSpineEvent` · signature vertical timeline rail — event ticks (hollow/filled), playhead, visible-range band; click/tick seeks (spec §16, design §1.3).
- `src/shared/custom/money.tsx` · `Money`, `MoneyProps` · localized money amount (`formatMoney`), `tabular-nums`.
- `src/shared/custom/date-text.tsx` · `DateText`, `DateTextProps` · localized date display (`formatDate`).
- `src/shared/custom/detail-grid.tsx` · `DetailGrid`, `DetailGridProps`, `DetailGridItem` · read-only key/value grid for detail/summary views.
- `src/shared/custom/stat.tsx` · `Stat`, `StatProps` · label-over-value stat cell for detail/summary headers.
- `src/shared/custom/loading-state.tsx` · `LoadingState`, `LoadingStateProps` · skeleton-row loading placeholder for data views.
- `src/shared/custom/empty-state.tsx` · `EmptyState`, `EmptyStateProps` · thin `NoData` wrapper for list/table empty states.
- `src/shared/custom/error-state.tsx` · `ErrorState`, `ErrorStateProps` · localized error message + optional retry `Button`.
- `src/shared/custom/permission-denied.tsx` · `PermissionDenied`, `PermissionDeniedProps` · inline access-denied gate (used with `Can`/`usePermission`).
- `src/shared/custom/can.tsx` · `Can`, `CanProps` · renders children only if `usePermission().can(action)`; optional `fallback`.

## Shared — ui primitives (`src/shared/components/ui/`)

- `button.tsx` · `Button`, `buttonVariants`, `ButtonProps` · cva button; variants incl. `gold` (`bg-gold`/`text-gold-foreground`) for the mockup's primary CTA.
- `card.tsx` · `Card` + parts · surface container.
- `dialog.tsx` · `Dialog` + parts · radix dialog.
- `dropdown-menu.tsx` · `DropdownMenu` + parts · radix dropdown menu.
- `form.tsx` · `Form`, `FormField`, `useFormField`, … · RHF form primitives.
- `input.tsx` · `Input` · text input.
- `input-otp.tsx` · `InputOTP` + parts · OTP input.
- `label.tsx` · `Label` · form label.
- `tabs.tsx` · `Tabs` · animated tabs (framer-motion); optional controlled mode via `activeTab`/`onTabChange` (e.g. URL-driven); desktop strip scrolls horizontally (`overflow-x-auto`) instead of widening its parent.
- `noData.tsx` · `NoData`, `NoDataProps` · empty/error-state block — optional `title`/`description`/`icon` (defaults to localized "no data").
- `sonner.tsx` · `Toaster` · toast host.
- `sheet.tsx` · `Sheet` + parts · radix dialog-based slide-over drawer (mobile sidebar, detail drawers).
- `avatar.tsx` · `Avatar`, `AvatarImage`, `AvatarFallback` · radix avatar (profile menu trigger).
- `separator.tsx` · `Separator` · radix separator (sidebar dividers).
- `skeleton.tsx` · `Skeleton` · loading placeholder block.
- `tooltip.tsx` · `Tooltip` + parts · radix tooltip.
- `badge.tsx` · `Badge`, `badgeVariants` · radix-free shadcn badge; base primitive for `shared/custom/status-badge.tsx`.
- `textarea.tsx` · `Textarea` · standard shadcn textarea (no extra package) — used by the transcript segment editor.
- `table.tsx` · `Table` + parts · radix-free shadcn table primitive (`UsersView`).
- `select.tsx` · `Select` + parts · radix select.
- `popover.tsx` · `Popover` + parts · radix popover.
- `checkbox.tsx` · `Checkbox` · radix checkbox.
- `file-dropzone.tsx` · `FileDropzone`, `FileDropzoneProps` · click + drag-and-drop file picker (the only sanctioned home for a raw `<input type="file">`).
- `progress.tsx` · `Progress`, `ProgressProps` · minimal dependency-free determinate progress bar.

## Shared — lib / constants / types (FSD `src/shared/`)

- `src/shared/types/models.ts` · `Organization`, `User`, `CourtUser`, `CourtCase`, `Participant`, `Hearing`, `AudioTrack`, `TranscriptSegment`, `ProceduralEvent`, `DocumentTemplate`, `GeneratedDocument`, `DocumentVersion`, `AuditLog`, `Job` · domain entity interfaces consumed by the mock API layer; backend-shaped (ISO date strings, ms offsets, enum IDs from `enums.ts`). `Organization`/`User` are the template's examples; the rest are the LexKotib court domain (spec §14). `CourtCase` also carries dashboard-card fields: `stage` (`CaseStage`), `subject`, `claimantName`/`defendantName`, `claimAmount`.
- `src/shared/types/query-types.ts` · `ListParams`, `SortSpec`, `Paginated` · generic server-style list request/response shapes used by every mock service.
- `src/shared/lib/utils.ts` · `cn` · Tailwind class merge (`clsx` + `tailwind-merge`).
- `src/shared/hooks/use-debounce.ts` · `useDebounce` · returns a value delayed until it stops changing (throttles search input, etc.).
- `src/shared/hooks/use-mock-query.ts` · `useMockQuery`, `UseMockQueryResult` · generic Promise-service loader (`useState`/`useEffect`, `{ data, isLoading, error, refetch }`) — used by the user detail drawer.
- `src/shared/hooks/use-job.ts` · `useJob` · polls a background job at 1s until SUCCEEDED/FAILED (spec Jobs) — powers finalize/extract/generate/export progress.
- `src/shared/hooks/use-unsaved-guard.ts` · `useUnsavedGuard`, `UseUnsavedGuardResult` · unsaved-changes guard — `beforeunload` while dirty + a `confirmDiscard(message)` for in-app navigation (no data router, so no `useBlocker`).
- `src/shared/lib/toast.ts` · `notify` · typed `sonner` toast wrappers (success/error/info/warning) for consistent app toasts.
- `src/shared/lib/errors/error-map.ts` · `errorMessageKey`, `ErrorCode` · maps a thrown error/`{ code }` to a localized `errors.codes.*` message key; resolve with `t()` and surface via `notify.error`.
- `src/shared/constants/navbarData.ts` · `NAVBAR_DATA` · nav config for the legacy `MainLayout` header/footer (pre-FSD; superseded by `nav-items.ts` for the app shell).
- `src/shared/constants/app.ts` · `APP_NAME`, `APP_FULL_NAME` · central brand name — `APP_NAME` ("Court AI Assistant") + `APP_FULL_NAME` (native "Sud AI Yordamchisi"), shown together as a fixed bilingual mark in the app header/sidebar/footer.
- `src/shared/constants/route-paths.ts` · `ROUTE_PATHS`, `RoutePathKey`, `buildRoute`, `DETAIL_PARAM`, `withLocale` · single source of truth for route strings; `buildRoute.userDetail` returns a query-param URL (`/users?user=`) for cross-page detail opens; `DETAIL_PARAM` holds the `user` query key; `withLocale(locale, path)` builds a concrete `/:lang`-prefixed URL.
- `src/shared/constants/page-names.ts` · `PAGE_NAMES` · i18n page-title message keys keyed by `ROUTE_PATHS` key — resolve with `t(PAGE_NAMES.KEY)`.
- `src/shared/constants/nav-items.ts` · `NAV_ITEMS`, `NavItem` · sidebar sections; each carries a `labelKey` resolved via `t()`.
- `src/shared/constants/permissions.ts` · `PERMISSION_ACTION`, `PermissionAction`, `PERMISSIONS` · typed role×action matrix (admin/editor/viewer example) consumed by `usePermission`/`Can`.
- `src/shared/types/enums.ts` · `USER_ROLE`, `SORT_DIRECTION`, `COURT_ROLE`, `COURT_TYPE`, `CASE_TYPE`, `CASE_STATUS`, `CASE_STAGE`, `PARTICIPANT_ROLE`, `HEARING_STATUS`, `SEGMENT_STATUS`, `PROCEDURAL_EVENT_TYPE`, `EVENT_REVIEW_STATUS`, `CRITICAL_FIELD_TYPE`, `DOCUMENT_TYPE`, `DOCUMENT_STATUS`, `TEMPLATE_STATUS`, `JOB_STATUS`, `EXPORT_FORMAT` · core enum IDs (LexKotib court domain keeps the spec's exact UPPER_SNAKE values); labels live in i18n messages under `enums.*` (see `docs/i18n.md`). `CASE_STAGE` is the mockup dashboard's procedural stage (intake/preparation/hearing/decision/appeal/execution), distinct from `CASE_STATUS`.
- `src/shared/lib/i18n/locale.ts` · `LOCALES`, `Locale`, `DEFAULT_LOCALE`, `LOCALE_LABELS`, `LOCALE_STORAGE_KEY`, `isLocale` · locale model.
- `src/shared/lib/i18n/format.ts` · `formatMoney`, `formatDate`, `formatNumber` · `Intl`-based, locale-aware formatting.
- `src/shared/lib/i18n/locale-context.tsx` · `LocaleProvider`, `useTranslation`, `LocaleContextValue` · derives locale from the `:lang` route param; provides `t()` + formatters.
- `src/shared/lib/i18n/messages/uz.ts` · `uz`, `Messages` · uz message tree — source of truth for shape/types.
- `src/shared/lib/i18n/messages/en.ts` · `en` · EN messages, typed against `Messages`.
- `src/shared/lib/i18n/messages/ru.ts` · `ru` · RU messages, typed against `Messages`.
- `src/shared/lib/i18n/messages/index.ts` · `MESSAGES`, `MessageKey`, `Messages` · aggregated messages + the typed dot-path key union for `t()`.
- `src/shared/styles/tag-styles.css` · — · non-token global styles.
- `src/index.css` · — · Tailwind v4 entry + design tokens (`:root` / `.dark`, mapped via `@theme inline`).

## Shared — mock API / data layer (`src/shared/lib/mock-api/`)

See `docs/architecture.md` → "Mock API / data layer" for the swap-to-real-API note.

- `src/shared/lib/mock-api/delay.ts` · `delay` · simulated latency helper (timer-based `Promise`) every mock service awaits.
- `src/shared/lib/mock-api/user.service.ts` · `listUsers`, `getUser` · server-shaped user directory service — list + single lookup by id.
- `src/shared/lib/mock-api/court-case.service.ts` · `listCases`, `getCase`, `createCase`, `updateCase`, `archiveCase`, `CaseFilters`, `CaseSortField`, `CreateCaseInput` · server-shaped case service (spec §14.2/FR-02) with search/filter/sort/paging over a session-mutable store; `CaseFilters.stage` filters by `CaseStage`, search also matches subject/parties.
- `src/shared/lib/mock-api/participant.service.ts` · `listParticipants`, `createParticipant`, `updateParticipant`, `deleteParticipant`, `CreateParticipantInput` · server-shaped participant service (spec §14.3) that keeps the owning case's `participantCount` in sync.
- `src/shared/lib/mock-api/hearing.service.ts` · `listHearings`, `getHearing`, `createHearing`, `transitionHearing` · hearing service enforcing the §17.3 session state machine (illegal transitions throw).
- `src/shared/lib/mock-api/transcript.service.ts` · `listSegments`, `editSegmentText`, `verifySegment`, `mapSpeaker` · transcript service (spec §14.6); edits preserve raw ASR text, speaker mapping is one bulk mutation (AC-03).
- `src/shared/lib/mock-api/event.service.ts` · `listEvents`, `updateEvent`, `verifyEvent`, `rejectEvent` · procedural-event service (spec §14.7, FR-08).
- `src/shared/lib/mock-api/document.service.ts` · `listTemplates`, `listDocuments`, `getDocument`, `listVersions`, `transitionDocument`, `saveDocumentVersion` · documents/templates/versions + FR-11 approval workflow (illegal transitions throw).
- `src/shared/lib/mock-api/job.service.ts` · `startJob`, `getJob` · simulated background jobs that progress to SUCCEEDED over wall-clock time.
- `src/shared/lib/mock-api/data/hearings.ts` · `HEARINGS` · hearing fixtures (hearing-1 = case-1's processed 34-min hearing).
- `src/shared/lib/mock-api/data/transcript-segments.ts` · `TRANSCRIPT_SEGMENTS` · 60 deterministic scripted segments for hearing-1 with low-confidence/critical/verified variety.
- `src/shared/lib/mock-api/data/procedural-events.ts` · `PROCEDURAL_EVENTS` · 8 events for hearing-1, all with non-empty `sourceSegmentIds` (§11.3).
- `src/shared/lib/mock-api/data/documents.ts` · `DOCUMENT_TEMPLATES`, `GENERATED_DOCUMENTS`, `DOCUMENT_VERSIONS` · template catalogue (with `inputSchema`), doc-1 protocol draft + its v1 content.
- `src/shared/lib/mock-api/data/organization.ts` · `ORGANIZATION` · the single mock organization/tenant.
- `src/shared/lib/mock-api/data/users.ts` · `USERS` · mock users across the example admin/editor/viewer roles.
- `src/shared/lib/mock-api/data/court-users.ts` · `COURT_USERS` · mock app users, one per court role (spec §4); the accounts auth authenticates and `judgeId` points at.
- `src/shared/lib/mock-api/data/court-cases.ts` · `COURT_CASES` · mock court cases (spec §14.2); `case-1` is the fully-populated economic-court demo fixture, the rest give the list volume/filters.
- `src/shared/lib/mock-api/data/participants.ts` · `PARTICIPANTS` · mock participants (spec §14.3); `case-1` has the four-party dispute, others a claimant/defendant pair.
- `src/shared/lib/mock-api/data/index.ts` · re-exports `ORGANIZATION`, `USERS`, `COURT_USERS`, `COURT_CASES`, `PARTICIPANTS` · single import surface for the services — add new seed exports here as you add entities.
