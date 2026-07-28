import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { logout as logoutRequest } from "@/features/auth/auth.service";
import { clearTokens, getRefreshToken } from "@/shared/lib/auth/token-store";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface UseLogoutResult {
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

/**
 * Logout action (guide §7.3): posts the current refresh token — a `204` is
 * success even if the backend can't find it — but the local session and
 * React Query cache are always cleared regardless of the request's outcome,
 * then navigates to `LOGIN`.
 */
export function useLogout(): UseLogoutResult {
  const navigate = useNavigate();
  const { locale } = useTranslation();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch {
      // Ignored — the local session is cleared below regardless (guide §7.3).
    } finally {
      clearTokens();
      queryClient.clear();
      setIsLoggingOut(false);
      navigate(withLocale(locale, ROUTE_PATHS.LOGIN), { replace: true });
    }
  }, [locale, navigate, queryClient]);

  return { logout, isLoggingOut };
}
