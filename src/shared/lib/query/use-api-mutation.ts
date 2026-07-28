import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { ApiError } from "@/shared/lib/http/api-error";
import { errorMessageKey } from "@/shared/lib/errors/error-map";
import { notify } from "@/shared/lib/toast";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface UseApiMutationOptions<TData, TVariables> extends Omit<
  UseMutationOptions<TData, ApiError, TVariables>,
  "mutationFn"
> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query keys to invalidate after a successful mutation, and after a 409
   * `CONCURRENCY_CONFLICT` (so the cache picks up the newer server state the
   * caller just collided with). Pass the resource's list/detail keys from
   * `query-keys.ts`. */
  invalidateKeys?: QueryKey[];
}

export type UseApiMutationResult<TData, TVariables> = UseMutationResult<
  TData,
  ApiError,
  TVariables
> & {
  /** ASP.NET `ValidationProblemDetails.errors` from the last failure, for
   * inline form binding — `undefined` unless the error was a 400 validation
   * error. */
  fieldErrors: Record<string, string[]> | undefined;
};

function isConcurrencyConflict(error: ApiError): boolean {
  return error.code.toUpperCase() === "CONCURRENCY_CONFLICT";
}

/**
 * `useMutation` wrapper carrying this app's error convention (guide §16.4):
 * - **Success** — invalidates `invalidateKeys` so dependent queries refetch.
 * - **`409 CONCURRENCY_CONFLICT`** — invalidates `invalidateKeys` (the
 *   resource changed under the caller) and toasts the localized "edited by
 *   someone else, refetch" message. Never auto-retried (guide §16.4;
 *   `QueryClient`'s mutation default is already `retry: false`).
 * - **Any other `ApiError`** — toasts `errorMessageKey(error)`; no
 *   invalidation, no retry. `fieldErrors` is populated for a 400 validation
 *   error so the caller can bind messages to form fields.
 *
 * Callers still get `onSuccess`/`onError` from `options` — they run after
 * this wrapper's toast/invalidate side effects.
 */
export function useApiMutation<TData, TVariables = void>(
  options: UseApiMutationOptions<TData, TVariables>
): UseApiMutationResult<TData, TVariables> {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { invalidateKeys = [], onSuccess, onError, ...rest } = options;

  const invalidate = () => {
    invalidateKeys.forEach((queryKey) => {
      void queryClient.invalidateQueries({ queryKey });
    });
  };

  const mutation = useMutation<TData, ApiError, TVariables>({
    ...rest,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      if (isConcurrencyConflict(error)) {
        invalidate();
      }
      notify.error(t(errorMessageKey(error)));
      onError?.(error, variables, onMutateResult, context);
    },
  });

  return {
    ...mutation,
    fieldErrors: mutation.error?.fieldErrors,
  };
}
