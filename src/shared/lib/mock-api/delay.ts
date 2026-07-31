/**
 * Simulated network latency for the mock service layer — every mock service
 * call awaits this so loading states are exercised the same way a real HTTP
 * call would. A timer-based `Promise`, never `Date.now()`/`Math.random()`.
 *
 * `shared/lib/mock-api/` is **not** fully deleted by integration-11: every
 * remaining file here (verified by grep, integration-11 step 2) still has a
 * live, deliberate consumer — there's no live endpoint to migrate it to (see
 * `docs/api-integration.md`'s gap register for the per-file reasons:
 * hearing list/GET, case-level document list, judge/user list). Only the
 * fixtures/services with zero remaining consumers were deleted
 * (`event.service.ts`, `data/procedural-events.ts`, `data/audit-logs.ts`).
 */
export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
