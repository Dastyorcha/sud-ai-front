/**
 * Real `GET /audit-logs` calls (integration guide §13, Administrator-only).
 * `before`/`after` are returned as nullable JSON strings, not objects — this
 * service passes them through unparsed; parsing (guarded `try/catch`) is a
 * view-layer concern (see `views/admin/admin.tsx`).
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { AuditLog } from "@/shared/types/models";

/** `GET /audit-logs` filters (guide §13) — every field is optional and server-side. */
export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

export interface ListAuditLogsParams {
  filters?: AuditLogFilters;
  page?: number;
  pageSize?: number;
}

/**
 * `GET /audit-logs` response envelope (guide §13) — uses `total`, not the
 * `totalCount` shape `shared/types/query-types.ts`'s `Paginated<T>` expects.
 * Kept as its own local type rather than forcing `Paginated<T>` to fit.
 */
export interface AuditLogsPage {
  items: AuditLog[];
  page: number;
  pageSize: number;
  total: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

/** Clamps `page` to ≥1 and `pageSize` to 1..200 (default 50) per the guide's server-side rules. */
function clampPaging(page: number, pageSize: number): { page: number; pageSize: number } {
  return {
    page: Math.max(1, page),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize)),
  };
}

/**
 * Paged, newest-first audit log list (guide §13 `GET /audit-logs`,
 * Administrator-only — a non-admin caller gets a `403`, handled by the
 * shared `ApiError`/error-mapper path like any other endpoint).
 */
export async function listAuditLogs({
  filters = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: ListAuditLogsParams = {}): Promise<AuditLogsPage> {
  const clamped = clampPaging(page, pageSize);
  const { data } = await apiClient.get<AuditLogsPage>(`${API_PREFIX}/audit-logs`, {
    params: {
      page: clamped.page,
      pageSize: clamped.pageSize,
      action: filters.action || undefined,
      entityType: filters.entityType || undefined,
      entityId: filters.entityId || undefined,
      actorId: filters.actorId || undefined,
    },
  });
  return data;
}
