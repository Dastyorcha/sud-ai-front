import { useNavigate } from "react-router-dom";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import { login as loginRequest, type LoginInput } from "@/features/auth/auth.service";
import { setTokens, type AuthTokens } from "@/shared/lib/auth/token-store";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/**
 * `POST /auth/login` (guide §7.1) wrapped in `useApiMutation` — on success
 * persists the token pair (`token-store`) and navigates to the dashboard.
 * `INVALID_CREDENTIALS` (and every other `ApiError`) is already toasted by
 * `useApiMutation`'s `onError` via `errorMessageKey()`
 * (`errors.codes.invalid_credentials`) — no extra handling needed here.
 */
export function useLogin(): UseApiMutationResult<AuthTokens, LoginInput> {
  const navigate = useNavigate();
  const { locale } = useTranslation();

  return useApiMutation<AuthTokens, LoginInput>({
    mutationFn: loginRequest,
    invalidateKeys: [queryKeys.auth.me()],
    onSuccess: (tokens) => {
      setTokens(tokens);
      navigate(withLocale(locale, ROUTE_PATHS.DASHBOARD), { replace: true });
    },
  });
}
