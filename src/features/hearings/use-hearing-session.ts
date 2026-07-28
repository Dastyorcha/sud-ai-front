/**
 * Session-local carry for the real hearing lifecycle (integration guide §9,
 * §17). There is no `GET /hearings/{id}` or hearing-list endpoint yet, so a
 * hearing's latest known state (`id`, `caseId`, `status`, `version`, …) only
 * exists in whatever `HearingResponse` the last create/start/stop/transcribe
 * call returned. This module persists that response to `sessionStorage`,
 * keyed by hearing id (for `views/hearings/hearing-detail.tsx`, resilient to
 * a same-tab refresh) and indexed per case (for the case-detail hearings
 * list). Deep-linking a hearing from a fresh tab, or one where the session
 * was cleared, has no way to recover its state — the UI must surface a clear
 * "reopen from the case page" path (design note, guide §17 gap).
 */
import { useCallback, useEffect, useState } from "react";
import type { Hearing } from "@/shared/types/models";

const HEARING_KEY_PREFIX = "lexkotib:hearing-session:";
const CASE_INDEX_PREFIX = "lexkotib:case-hearing-sessions:";

function readHearing(hearingId: string): Hearing | undefined {
  try {
    const raw = sessionStorage.getItem(HEARING_KEY_PREFIX + hearingId);
    return raw ? (JSON.parse(raw) as Hearing) : undefined;
  } catch {
    return undefined;
  }
}

function readCaseIndex(caseId: string): Hearing[] {
  try {
    const raw = sessionStorage.getItem(CASE_INDEX_PREFIX + caseId);
    return raw ? (JSON.parse(raw) as Hearing[]) : [];
  } catch {
    return [];
  }
}

/**
 * Persists a hearing's latest state — call this from every lifecycle
 * mutation's `onSuccess` (create/start/stop). Safe to call outside a
 * component (no hook rules).
 */
export function recordHearingSession(hearing: Hearing): void {
  try {
    sessionStorage.setItem(HEARING_KEY_PREFIX + hearing.id, JSON.stringify(hearing));
    const next = [...readCaseIndex(hearing.caseId).filter((h) => h.id !== hearing.id), hearing];
    sessionStorage.setItem(CASE_INDEX_PREFIX + hearing.caseId, JSON.stringify(next));
  } catch {
    // sessionStorage unavailable (private mode, quota, …) — the session carry
    // degrades to "current render only"; the caller's own state still works.
  }
}

export interface UseHearingSessionResult {
  /** The hearing's last known state, or `undefined` if this tab never saw it (guide §17 gap). */
  hearing: Hearing | undefined;
  /** Updates the session with a fresh `HearingResponse` (e.g. after start/stop/transcribe). */
  setHearing: (hearing: Hearing) => void;
}

/** Reads (and lets the caller update) one hearing's session-carried state by id. */
export function useHearingSession(hearingId: string): UseHearingSessionResult {
  const [hearing, setHearingState] = useState<Hearing | undefined>(() => readHearing(hearingId));

  useEffect(() => {
    setHearingState(readHearing(hearingId));
  }, [hearingId]);

  const setHearing = useCallback((next: Hearing) => {
    recordHearingSession(next);
    setHearingState(next);
  }, []);

  return { hearing, setHearing };
}

export interface UseCaseHearingSessionsResult {
  /** Hearings created/updated in this session for the case, in creation order. */
  hearings: Hearing[];
  /** Re-reads the index — call after creating a hearing elsewhere. */
  refresh: () => void;
}

/** Session-scoped hearing list for a case's detail page (no list endpoint exists yet). */
export function useCaseHearingSessions(caseId: string): UseCaseHearingSessionsResult {
  const [hearings, setHearings] = useState<Hearing[]>(() => readCaseIndex(caseId));

  const refresh = useCallback(() => {
    setHearings(readCaseIndex(caseId));
  }, [caseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { hearings, refresh };
}
