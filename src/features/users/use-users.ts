import { useEffect, useState } from "react";
import { listUsers } from "@/shared/lib/mock-api/user.service";
import type { User } from "@/shared/types/models";

export interface UseUsersResult {
  data: User[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Thin consumer hook over `user.service.listUsers` — powers the users list
 * page and any "responsible user" selects/filters elsewhere. No react-query,
 * plain `useState`/`useEffect` per the mock-api pattern.
 */
export function useUsers(): UseUsersResult {
  const [data, setData] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    listUsers()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Failed to load users"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
