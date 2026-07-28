import type { SortDirection } from "@/shared/types/enums";

/** One sort instruction: which field, which direction. */
export interface SortSpec<TField extends string = string> {
  field: TField;
  direction: SortDirection;
}

/**
 * Generic server-style list request. `filters` is intentionally loose per
 * consumer (each service defines its own filter shape) — `ListParams<TFilters>`
 * pins it down. Mirrors the shape a real REST list endpoint would accept, so
 * swapping the mock service layer for HTTP calls later doesn't change callers.
 */
export interface ListParams<TFilters = Record<string, unknown>, TField extends string = string> {
  filters?: Partial<TFilters>;
  sort?: SortSpec<TField>;
  page?: number;
  pageSize?: number;
}

/**
 * Server-style paginated response envelope — matches the guide's cases/
 * participants shape (§5): `{ items, page, pageSize, totalCount }`. The audit
 * endpoint (§13) returns `total` instead of `totalCount`; adapt it at the
 * service boundary in integration-09 rather than branching this type.
 */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** `Paginated<T>.totalCount` / `pageSize` → total page count (min 1 page for an empty list's UI). */
export function totalPages(paginated: Pick<Paginated<unknown>, "totalCount" | "pageSize">): number {
  return Math.max(1, Math.ceil(paginated.totalCount / paginated.pageSize));
}
