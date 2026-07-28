/**
 * Real `/cases` calls (integration guide §8) — replaces
 * `shared/lib/mock-api/court-case.service.ts` for the live hooks
 * (`use-cases`/`use-case`/`use-create-case`). The mock service stays in place
 * for `views/cases/case-new.tsx` until integration-11.
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { CourtCase } from "@/shared/types/models";
import type { CaseStatus, CaseType, CourtType } from "@/shared/types/enums";
import type { Paginated } from "@/shared/types/query-types";

/** `CourtCaseResponse` (guide §8) — the exact live shape; mapped 1:1 onto `CourtCase`. */
interface CourtCaseResponse {
  id: string;
  caseNumber: string;
  courtName: string;
  courtType: string;
  caseType: string;
  judgeId: string | null;
  status: CaseStatus;
  description: string | null;
  isDemo: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

function toCourtCase(response: CourtCaseResponse): CourtCase {
  return {
    id: response.id,
    caseNumber: response.caseNumber,
    courtName: response.courtName,
    courtType: response.courtType as CourtType,
    caseType: response.caseType as CaseType,
    judgeId: response.judgeId,
    status: response.status,
    description: response.description,
    isDemo: response.isDemo,
    createdBy: response.createdBy,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    archivedAt: response.archivedAt,
  };
}

/** `GET /cases` filters (guide §8) — only these three are server-supported. */
export interface CaseListFilters {
  caseNumber?: string;
  courtName?: string;
  status?: CaseStatus;
}

export interface ListCasesParams {
  filters?: CaseListFilters;
  page?: number;
  pageSize?: number;
}

/** Paged case list (guide §8 `GET /cases`). */
export async function listCases({
  filters = {},
  page = 1,
  pageSize = 20,
}: ListCasesParams = {}): Promise<Paginated<CourtCase>> {
  const { data } = await apiClient.get<Paginated<CourtCaseResponse>>(`${API_PREFIX}/cases`, {
    params: {
      page,
      pageSize,
      caseNumber: filters.caseNumber || undefined,
      courtName: filters.courtName || undefined,
      status: filters.status,
    },
  });
  return {
    items: data.items.map(toCourtCase),
    page: data.page,
    pageSize: data.pageSize,
    totalCount: data.totalCount,
  };
}

/** A single case by id (guide §8 `GET /cases/{id}`). */
export async function getCase(id: string): Promise<CourtCase> {
  const { data } = await apiClient.get<CourtCaseResponse>(`${API_PREFIX}/cases/${id}`);
  return toCourtCase(data);
}

/** Input for `POST /cases` (guide §8) — Administrator/Secretary only. */
export interface CreateCaseInput {
  caseNumber: string;
  courtName: string;
  courtType: string;
  caseType: string;
  /** Active Judge UUID — required (guide §17: no judge-list endpoint, so the wizard collects it as free text). */
  judgeId: string;
  description?: string;
  isDemo?: boolean;
}

/** Creates a case (guide §8 `POST /cases`, `201`). */
export async function createCase(input: CreateCaseInput): Promise<CourtCase> {
  const { data } = await apiClient.post<CourtCaseResponse>(`${API_PREFIX}/cases`, input);
  return toCourtCase(data);
}

/** Partial-update fields accepted by `PATCH /cases/{id}` (guide §8). Status changes must go through `archiveCase`. */
export interface UpdateCaseInput {
  caseNumber?: string;
  courtName?: string;
  courtType?: string;
  caseType?: string;
  judgeId?: string;
  description?: string;
}

/** Patches a case (guide §8 `PATCH /cases/{id}`). */
export async function updateCase(id: string, patch: UpdateCaseInput): Promise<CourtCase> {
  const { data } = await apiClient.patch<CourtCaseResponse>(`${API_PREFIX}/cases/${id}`, patch);
  return toCourtCase(data);
}

/**
 * Archives a case (guide §8 `POST /cases/{id}/archive`) — no body, idempotent
 * `204`. Callers should refetch the case detail/list after this resolves.
 */
export async function archiveCase(id: string): Promise<void> {
  await apiClient.post(`${API_PREFIX}/cases/${id}/archive`);
}
