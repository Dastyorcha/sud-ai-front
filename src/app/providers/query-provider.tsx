import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/shared/lib/http/api-error";

/**
 * Retries only transport failures the client can plausibly recover from —
 * network/timeout (`ApiError.status === 0`) or a 5xx — never a 4xx (a bad
 * request/auth/validation error won't succeed on retry). Capped at 2 retries.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) return error.status === 0 || error.status >= 500;
  return false;
}

/**
 * The single `QueryClient` for the app. `staleTime` ~30s avoids refetch
 * storms on tab focus (`refetchOnWindowFocus: false`); mutations never
 * auto-retry — `useApiMutation` (`src/shared/lib/query/use-api-mutation.ts`)
 * owns error handling, including the 409 concurrency path (guide §16.4).
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared client, imported by non-component modules too
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Dev-only, code-split — never bundled into a production build.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )
  : null;

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Mounts the TanStack Query client above the router (see `AppProviders` in
 * `src/app/providers.tsx`) so every feature hook shares one cache. Devtools
 * render only in dev, lazily.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
