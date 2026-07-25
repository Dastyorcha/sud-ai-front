# Phase 11 — Admin Views

**Duration:** Week 9, day 3
**Spec refs:** §4.1, FR-12, §16.1 items 12–14, NFR-05, D-14
**Prerequisites:** Phase 03 (RBAC and capabilities), Phase 02 (API layer)

**Goal:** an auditor can reconstruct who changed what and when, from the UI alone, without database access.

All three screens are **read-only** (D-14). Template approval is a legal process governed by §19, not an MVP UI feature. Building CRUD here would imply an authority the product does not have.

---

## Step 11.1 — Route group and access gate

`src/app/(app)/admin/layout.tsx`

Wrap the whole group in a capability gate rather than a role check, so the permission set can widen later without touching screens:

```tsx
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireCapability
      capability="admin.read"
      fallback={<ForbiddenState message="Bu bo'lim uchun ruxsat yo'q." />}
    >
      <AdminNav />
      {children}
    </RequireCapability>
  );
}
```

`admin.read` is granted to `ADMIN` only. `LEGAL_EXPERT` gains `admin.templates.read` and sees the template catalogue but not the audit log or provider status — the legal expert reviews templates, not user activity.

Sub-navigation: **Shablonlar / Audit jurnali / Tizim holati**.

The record spine is **not** rendered in this route group. These screens are not hearing-scoped.

---

## Step 11.2 — Template catalogue (`/admin/templates`)

**Data:** `GET /api/v1/document-templates` (§15.1), shape per §13.2.

**Layout:** a table, not cards. An administrator comparing versions needs aligned columns.

| Column | Rendering |
|---|---|
| `title` | Sans, primary |
| `template_code` | **Mono** — an identifier that is copied and pasted |
| `document_type` | Badge |
| `version` | Mono |
| `status` | `<RecordStateBadge>` — `ACTIVE` in `--attested`, `DRAFT` in `--muted`, `DEPRECATED` in `--seal` |
| `input_schema_version` / `ruleset_version` | Mono, `--muted` |
| `approved_by` | Resolved to a display name, not a UUID |
| `approved_at` | Date + time, user timezone |

**Grouping:** rows grouped by `template_code`, versions collapsed under the active one. Expanding shows the version history in descending order. An administrator asks "which version is live and what came before it" far more often than "list all rows".

**Detail panel** (side sheet on row click):
- Full metadata.
- The declared `input_schema` rendered as a readable field table — name, type, required, source hint — not raw JSON. Include a "JSON ko'rish" toggle for the raw form.
- The validation rules the ruleset declares, as a plain list.
- A "Ushbu shablon bilan yaratilgan hujjatlar: N" count linking to a filtered document list.

**No edit, no upload, no activate/deactivate controls.** If an administrator asks how to change a template, the empty area of the detail panel states the process: templates are approved by the legal expert and deployed by the backend team (§19).

---

## Step 11.3 — Audit log (`/admin/audit`)

**Data:** `GET /api/v1/audit-logs` with server-side pagination and filtering. Record shape is fixed by FR-12:

```json
{
  "id": "audit_uuid",
  "actor_id": "user_uuid",
  "action": "TRANSCRIPT_SEGMENT_UPDATED",
  "entity_type": "TranscriptSegment",
  "entity_id": "segment_uuid",
  "before": {},
  "after": {},
  "ip_address": "masked-or-secured",
  "created_at": "2026-07-19T10:00:00+05:00"
}
```

### 11.3.1 — Virtualized table

Audit tables grow without bound. Use `@tanstack/react-virtual` from the first commit, the same configuration as the transcript list in Phase 07. Cursor-based pagination with infinite scroll; a jump-to-date control rather than page numbers.

Columns: time (mono) · actor · action · entity type · entity id (mono, truncated with copy button) · IP.

Row density matches the transcript list — this is a scanning surface.

### 11.3.2 — Filters

URL-synced via `nuqs` so a filtered view is shareable in a ticket:

- Actor (searchable select over users)
- Action (multi-select over the known action enum)
- Entity type
- Entity id (exact match — the common investigative path is "show me everything that touched this document")
- Date range, defaulting to the last 7 days

Show the active filter set as removable chips above the table with a total count: **"1 248 ta yozuv"**.

### 11.3.3 — Diff view

Row expansion renders `before` and `after` as a **field-level diff**, not two JSON blobs side by side:

```
raw_text        —  (o'zgarmadi)
human_text      —  "..." → "..."          [changed]
status          —  DRAFT → VERIFIED       [changed]
is_critical_..  —  false → true           [changed]
```

Changed values in `--seal`, unchanged rows collapsed behind "O'zgarmagan maydonlar (7)". Long text values diff at word level using the same diff component built in Phase 09 Step 9.7 — reuse it, do not write a second one.

For `before: {}` (creation events) render "Yaratildi" with the full `after` as a field table.

### 11.3.4 — Entity navigation

Where the entity is reachable in the UI, the entity id links to it: `TranscriptSegment` → transcript screen scrolled to that segment; `GeneratedDocument` → document editor; `CourtCase` → case detail. Deleted or archived entities show the id without a link and a `--muted` "mavjud emas" note.

This is what makes the audit log usable rather than merely present.

### 11.3.5 — CSV export

Export the **currently filtered** result set, not the whole table. Request `GET /api/v1/audit-logs/export` with the same query parameters, poll the job with `useJob`, download via signed URL (NFR-01 — never build a blob client-side from paginated fetches; the client would produce an incomplete file and call it an audit record).

Show the row count in the confirmation dialog before triggering.

---

## Step 11.4 — Provider and system status (`/admin/providers`)

**Data:** `GET /api/v1/system/status`. Read-only observability surface per NFR-05.

Four sections, each a labelled card grid. No charts in MVP — numbers and states, precisely rendered.

**Active configuration**
- Live STT provider and model
- Final STT provider and model
- Diarization provider
- LLM model, prompt registry version, schema version

Every version string in mono. These values appear verbatim in AC-07 reproducibility discussions, so they must be copyable.

**Realtime health**
- Connection state
- Provider latency p50 / p95, compared against the NFR-03 targets — under 2.5s interim and under 6s final render in `--attested`, over in amber, far over in `--seal`
- Reconnect count, last 24h
- Dropped chunk count

**Job queue**
- Queue depth by job type (final transcription, diarization, event extraction, document generation, export)
- Currently running jobs with elapsed time
- Failed jobs, last 24h, with error codes

**Usage**
- Audio seconds processed, last 24h and last 30 days
- LLM token usage
- Error rate by endpoint

Poll at 10s while the tab is visible; pause on `visibilitychange` to avoid pointless load. If the status endpoint itself fails, the page shows an error state — never stale numbers presented as current, which is the exact failure mode that makes monitoring pages dangerous.

---

## Step 11.5 — Empty, loading and error states

Every one of the three screens gets all three states (§16.6), using the shared components from Phase 01:

- **Loading:** skeleton rows matching final row height, so the layout does not jump.
- **Empty:** for audit, "Tanlangan filtrlarga mos yozuv topilmadi" with a clear-filters action. For templates, "Faol shablon yo'q" with the deployment-process note.
- **Error:** message, request id (mono, copyable), retry.

The request id matters here more than anywhere else in the product: an administrator reporting a broken audit page needs to hand the backend team something specific.

---

## Files produced

```text
src/app/(app)/admin/layout.tsx
src/app/(app)/admin/templates/page.tsx
src/app/(app)/admin/audit/page.tsx
src/app/(app)/admin/providers/page.tsx

src/features/admin/
├── components/
│   ├── AdminNav.tsx
│   ├── TemplateTable.tsx
│   ├── TemplateDetailSheet.tsx
│   ├── InputSchemaTable.tsx
│   ├── AuditTable.tsx
│   ├── AuditFilters.tsx
│   ├── AuditDiffRow.tsx
│   ├── EntityLink.tsx
│   ├── SystemStatusGrid.tsx
│   └── LatencyIndicator.tsx
├── hooks/
│   ├── useTemplates.ts
│   ├── useAuditLogs.ts        # infinite query
│   ├── useAuditExport.ts
│   └── useSystemStatus.ts
└── lib/
    └── auditActionLabels.ts   # action enum → Uzbek label
```

`auditActionLabels.ts` is a single map from action code to an Uzbek phrase. Never render a raw `TRANSCRIPT_SEGMENT_UPDATED` to a user; render "Transkript segmenti o'zgartirildi" with the code available on hover.

---

## Testing

**Component (Vitest)**
- `AuditDiffRow` renders creation, update and no-change cases correctly
- `TemplateTable` groups versions and marks exactly one active per code
- `LatencyIndicator` selects the correct colour band at 2.4s, 2.6s, 5.9s, 6.1s
- `auditActionLabels` has a label for every action in the enum — a failing test when the backend adds an action

**E2E (Playwright, extends Phase 12 suite)**
- Administrator opens audit, filters by entity id, expands a row, sees the diff
- Non-admin navigating directly to `/admin/audit` receives the forbidden state, not a crash and not data

---

## Exit criteria

- [ ] All three admin screens render against MSW fixtures
- [ ] `admin.read` gates the route group; `LEGAL_EXPERT` sees templates only
- [ ] Template versions grouped by code with exactly one active version visible
- [ ] `input_schema` rendered as a readable field table, with raw JSON available
- [ ] Audit table virtualized and smooth at 10 000 fixture rows
- [ ] Filters URL-synced and shareable
- [ ] Field-level diff renders for update, creation and unchanged cases
- [ ] Entity ids link to their screens where the entity exists
- [ ] CSV export runs server-side over the filtered set, delivered via signed URL
- [ ] Provider status reflects NFR-05 fields, with latency coloured against NFR-03 targets
- [ ] Status page shows an error state rather than stale numbers when polling fails
- [ ] No create, edit or delete control exists anywhere in `/admin`

---

## Notes for the implementer

This phase is the first cut if the schedule slips — but cut it *whole*, not partially. A half-built audit log is worse than none: it implies completeness it does not have, and an auditor who trusts an incomplete view draws a wrong conclusion. If time runs short, ship the provider status page alone (it is an hour of work and directly supports the demo narrative around §2.4 provider-agnosticism) and defer templates and audit to the week after the tender.
