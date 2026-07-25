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

/** Server-style paginated response envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
