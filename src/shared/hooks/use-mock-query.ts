import { useCallback, useEffect, useState } from "react";

export interface UseMockQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Small generic loader over a Promise-returning mock service call — the same
 * `useState`/`useEffect` shape as `use-cases-query`, factored out so each lazy
 * case-detail tab can fetch its own slice without repeating the boilerplate.
 * Pass a `queryFn` that is stable for the given `deps` (it is re-run whenever
 * `deps` change).
 */
export function useMockQuery<T>(
  queryFn: () => Promise<T>,
  deps: ReadonlyArray<unknown>
): UseMockQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    queryFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Query failed"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps + refetchToken are the intentional trigger
  }, [...deps, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), []);

  return { data, isLoading, error, refetch };
}
