/**
 * Domain entity interfaces. These are the shapes the mock service layer
 * (`src/shared/lib/mock-api/`) returns today and a real backend would return
 * tomorrow — kept backend-shaped (ISO date strings, stable enum values) so
 * swapping the mock layer for HTTP later is a drop-in.
 */
import type { UserRole } from "@/shared/types/enums";

/** The tenant every other entity belongs to. */
export interface Organization {
  id: string;
  name: string;
  address: string;
  createdAt: string;
}

/** A user within an organization — the example CRUD entity for this template. */
export interface User {
  id: string;
  organizationId: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
}
