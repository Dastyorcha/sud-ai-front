import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/use-auth";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

interface AuthGuardProps {
  children: ReactNode;
}

/** Protects product routes: redirects to login when unauthenticated. Reads
 * the stub `useAuth` — always passes today; swap in real session logic here
 * once auth lands (a later plan), without touching call sites. */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();
  const { locale } = useTranslation();

  if (!isAuthenticated) {
    return <Navigate to={withLocale(locale, ROUTE_PATHS.LOGIN)} replace />;
  }

  return <>{children}</>;
}
