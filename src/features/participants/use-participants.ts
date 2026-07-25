import { useEffect, useState } from "react";
import { listParticipants } from "@/shared/lib/mock-api/participant.service";
import type { Participant } from "@/shared/types/models";

export interface UseParticipantsResult {
  data: Participant[] | null;
  isLoading: boolean;
  error: Error | null;
}

/** Consumer hook over `participant.service.listParticipants` — a case's parties. */
export function useParticipants(caseId: string): UseParticipantsResult {
  const [data, setData] = useState<Participant[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listParticipants(caseId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error("Failed to load participants"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return { data, isLoading, error };
}
