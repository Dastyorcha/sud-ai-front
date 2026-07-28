/**
 * Mock `CourtCase` service (spec §14.2, FR-02, UC-01) — server-shaped so it's a
 * drop-in swap for the `/api/v1/cases` endpoints later. Keeps a mutable
 * in-memory copy of the seed so create/update/archive persist within a session,
 * exactly as a backend would. List supports search, filters, sort and paging
 * (spec §15.1 `GET /cases`).
 */
import { delay } from "@/shared/lib/mock-api/delay";
import { COURT_CASES } from "@/shared/lib/mock-api/data";
import type { CourtCase } from "@/shared/types/models";
import type { CaseStage, CaseStatus, CaseType, CourtType } from "@/shared/types/enums";
import type { ListParams, Paginated } from "@/shared/types/query-types";

/** Filters accepted by the case list (spec §15.1 `GET /cases`). */
export interface CaseFilters {
  /** Free-text match against case number, court name and parties. */
  search: string;
  status: CaseStatus;
  caseType: CaseType;
  courtType: CourtType;
  stage: CaseStage;
}

/** Sortable case-list columns. */
export type CaseSortField = "caseNumber" | "courtName" | "status" | "updatedAt" | "createdAt";

/** Input for creating a case (spec §15.1 `POST /cases`). Server assigns the rest. */
export interface CreateCaseInput {
  caseNumber: string;
  courtName: string;
  courtType: CourtType;
  caseType: CaseType;
  judgeId: string | null;
  subject?: string;
  claimantName?: string | null;
  defendantName?: string | null;
  claimAmount?: number | null;
  metadata?: Record<string, unknown>;
}

/** Session-mutable store, seeded from the fixture. */
let cases: CourtCase[] = COURT_CASES.map((c) => ({ ...c }));

const DEFAULT_PAGE_SIZE = 10;

function matches(c: CourtCase, filters: Partial<CaseFilters>): boolean {
  if (filters.status && c.status !== filters.status) return false;
  if (filters.caseType && c.caseType !== filters.caseType) return false;
  if (filters.courtType && c.courtType !== filters.courtType) return false;
  if (filters.stage && c.stage !== filters.stage) return false;
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    const haystack = [c.caseNumber, c.courtName, c.subject, c.claimantName, c.defendantName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (q && !haystack.includes(q)) return false;
  }
  return true;
}

function compare(a: CourtCase, b: CourtCase, field: CaseSortField): number {
  return String(a[field]).localeCompare(String(b[field]), undefined, { numeric: true });
}

/** Paginated, filtered, sorted case list. Swap to `GET /api/v1/cases` later. */
export async function listCases(
  params: ListParams<CaseFilters, CaseSortField> = {}
): Promise<Paginated<CourtCase>> {
  await delay();
  const { filters = {}, sort, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  let rows = cases.filter((c) => matches(c, filters));

  if (sort) {
    rows = [...rows].sort((a, b) => {
      const cmp = compare(a, b, sort.field);
      return sort.direction === "asc" ? cmp : -cmp;
    });
  } else {
    // Default: most recently updated first.
    rows = [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const totalCount = rows.length;
  const start = (page - 1) * pageSize;
  return { items: rows.slice(start, start + pageSize), totalCount, page, pageSize };
}

/** A single case by id. Swap to `GET /api/v1/cases/:id` later. */
export async function getCase(id: string): Promise<CourtCase | null> {
  await delay();
  return cases.find((c) => c.id === id) ?? null;
}

/** Creates a case (spec `POST /cases`). Created by the current clerk in real life. */
export async function createCase(
  input: CreateCaseInput,
  createdBy = "cu-clerk-1"
): Promise<CourtCase> {
  await delay();
  const now = new Date().toISOString();
  const created: CourtCase = {
    id: crypto.randomUUID(),
    caseNumber: input.caseNumber,
    courtName: input.courtName,
    courtType: input.courtType,
    caseType: input.caseType,
    judgeId: input.judgeId,
    status: "ACTIVE",
    description: input.subject ?? null,
    isDemo: false,
    stage: "INTAKE",
    subject: input.subject ?? "",
    claimantName: input.claimantName ?? null,
    defendantName: input.defendantName ?? null,
    claimAmount: input.claimAmount ?? null,
    metadata: input.metadata ?? {},
    participantCount: 0,
    createdBy,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
  cases = [created, ...cases];
  return created;
}

/** Patches a case (spec `PATCH /cases/:id`). Throws if not found. */
export async function updateCase(
  id: string,
  patch: Partial<Omit<CourtCase, "id" | "createdAt" | "createdBy">>
): Promise<CourtCase> {
  await delay();
  const current = cases.find((c) => c.id === id);
  if (!current) throw new Error(`Case ${id} not found`);
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  cases = cases.map((c) => (c.id === id ? updated : c));
  return updated;
}

/** Archives a case (spec `POST /cases/:id/archive`). Throws if not found. */
export async function archiveCase(id: string): Promise<CourtCase> {
  const now = new Date().toISOString();
  return updateCase(id, { status: "ARCHIVED", archivedAt: now });
}
