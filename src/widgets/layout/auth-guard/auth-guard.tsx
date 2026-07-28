import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Navigate } from "react-router-dom";
import { LoadingState } from "@/shared/custom/loading-state";
import { useSession } from "@/features/auth/use-session";
import { hasValidRefreshToken, subscribeTokens } from "@/shared/lib/auth/token-store";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
// Side-effect import: registers the single-flight refresh handler with
// `api-client` before any protected route can fire a request (integration-03).
import "@/shared/lib/auth/refresh-manager";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Protects product routes (guide §2): no refresh token → redirect to
 * `LOGIN`. Session present but `/auth/me` still loading → a loading state
 * (never renders children with a stale/undefined user). `/auth/me` failed
 * (the api-client interceptor already tried a silent refresh once) →
 * redirect to `LOGIN`.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { locale } = useTranslation();
  const hasSession = useSyncExternalStore(
    subscribeTokens,
    hasValidRefreshToken,
    hasValidRefreshToken
  );
  const { user, query } = useSession();

  if (!hasSession) {
    return <Navigate to={withLocale(locale, ROUTE_PATHS.LOGIN)} replace />;
  }

  if (query.isLoading) {
    return <LoadingState rows={6} className="p-6" />;
  }

  if (query.isError || !user) {
    return <Navigate to={withLocale(locale, ROUTE_PATHS.LOGIN)} replace />;
  }

  return <>{children}</>;
}
