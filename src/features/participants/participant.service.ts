/**
 * Real participant calls (integration guide §8) — replaces
 * `shared/lib/mock-api/participant.service.ts` for the live hooks. No
 * `GET /participants/{id}` exists (guide §17) — always read from the list
 * cache (`use-participants`'s query key), never fetch a participant alone.
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { Participant } from "@/shared/types/models";
import type { ParticipantRole } from "@/shared/types/enums";
import type { Paginated } from "@/shared/types/query-types";

/** `ParticipantResponse` (guide §8) — the exact live shape. */
interface ParticipantResponse {
  id: string;
  courtCaseId: string;
  displayName: string;
  organizationName: string | null;
  role: string;
  identifier: Record<string, unknown> | null;
  language: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toParticipant(response: ParticipantResponse): Participant {
  return {
    id: response.id,
    courtCaseId: response.courtCaseId,
    displayName: response.displayName,
    organizationName: response.organizationName,
    role: response.role as ParticipantRole,
    identifier: response.identifier ?? {},
    language: response.language,
    isActive: response.isActive,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

export interface ListParticipantsParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

/** All (or active-only) participants of a case, sorted by `displayName` (guide §8). */
export async function listParticipants(
  caseId: string,
  { page = 1, pageSize = 100, isActive }: ListParticipantsParams = {}
): Promise<Participant[]> {
  const { data } = await apiClient.get<Paginated<ParticipantResponse>>(
    `${API_PREFIX}/cases/${caseId}/participants`,
    { params: { page, pageSize, isActive } }
  );
  return data.items.map(toParticipant);
}

/** Input for `POST /cases/{id}/participants` (guide §8). */
export interface CreateParticipantInput {
  caseId: string;
  displayName: string;
  organizationName?: string | null;
  role: ParticipantRole;
  identifier?: Record<string, unknown>;
  language?: string;
}

/** Adds a participant (guide §8 `POST /cases/{id}/participants`). */
export async function createParticipant(input: CreateParticipantInput): Promise<Participant> {
  const { data } = await apiClient.post<ParticipantResponse>(
    `${API_PREFIX}/cases/${input.caseId}/participants`,
    {
      displayName: input.displayName,
      organizationName: input.organizationName ?? undefined,
      role: input.role,
      identifier: input.identifier,
      language: input.language,
    }
  );
  return toParticipant(data);
}

/** Partial-update fields accepted by `PATCH /participants/{id}` (guide §8). */
export interface UpdateParticipantInput {
  displayName?: string;
  organizationName?: string | null;
  role?: ParticipantRole;
  identifier?: Record<string, unknown>;
  language?: string;
}

/** Patches a participant (guide §8 `PATCH /participants/{id}`). */
export async function updateParticipant(
  id: string,
  patch: UpdateParticipantInput
): Promise<Participant> {
  const { data } = await apiClient.patch<ParticipantResponse>(
    `${API_PREFIX}/participants/${id}`,
    patch
  );
  return toParticipant(data);
}

/**
 * Deactivates a participant (guide §8 `DELETE /participants/{id}`) — a soft
 * delete (`isActive=false`, `204`), not a hard removal.
 */
export async function deactivateParticipant(id: string): Promise<void> {
  await apiClient.delete(`${API_PREFIX}/participants/${id}`);
}
