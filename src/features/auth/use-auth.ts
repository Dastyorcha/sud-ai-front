import type { UserRole } from "@/shared/types/enums";

export interface AuthUser {
  /** Matches a seed id in `src/shared/lib/mock-api/data/users.ts` (mock-only). */
  id: string;
  name: string;
  role: UserRole;
  organizationName: string;
}

export interface UseAuthResult {
  user: AuthUser;
  isAuthenticated: boolean;
}

/**
 * Stub current-session hook — always returns a mock authenticated user.
 * Real auth (token/session, login/logout, role fetch) lands in a later plan;
 * this keeps the shell (topbar profile menu, auth guard) buildable now.
 */
export function useAuth(): UseAuthResult {
  return {
    user: {
      id: "user-1",
      name: "Ada Lovelace",
      role: "admin",
      organizationName: "Acme Inc",
    },
    isAuthenticated: true,
  };
}
