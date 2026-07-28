/**
 * Central TanStack Query key factory (guide §5/§9/§12/§13). One place per
 * resource so every feature hook's `queryKey` and `invalidateQueries` /
 * `invalidateKeys` (see `use-api-mutation.ts`) agree on the same tuple shape.
 * Keep params in the key loose (`unknown`) — each feature hook owns its own
 * filter/sort/paging type; this factory only fixes the key *shape*.
 */
export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  cases: {
    all: () => ["cases"] as const,
    list: (params?: unknown) => ["cases", "list", params] as const,
    detail: (caseId: string) => ["cases", "detail", caseId] as const,
  },
  participants: {
    list: (caseId: string) => ["cases", caseId, "participants"] as const,
  },
  hearings: {
    list: (caseId: string) => ["cases", caseId, "hearings"] as const,
    detail: (hearingId: string) => ["hearings", "detail", hearingId] as const,
  },
  transcript: {
    segments: (hearingId: string) => ["hearings", hearingId, "segments"] as const,
  },
  events: {
    list: (hearingId: string) => ["hearings", hearingId, "events"] as const,
  },
  documents: {
    templates: () => ["documents", "templates"] as const,
    list: (caseId: string) => ["cases", caseId, "documents"] as const,
    detail: (documentId: string) => ["documents", "detail", documentId] as const,
    versions: (documentId: string) => ["documents", documentId, "versions"] as const,
  },
  audit: {
    list: (params?: unknown) => ["audit", "list", params] as const,
  },
  jobs: {
    detail: (jobId: string) => ["jobs", "detail", jobId] as const,
  },
  users: {
    list: (params?: unknown) => ["users", "list", params] as const,
    detail: (userId: string) => ["users", "detail", userId] as const,
  },
} as const;
