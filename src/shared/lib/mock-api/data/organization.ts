/** The single organization/tenant used across the mock dataset. */
import type { Organization } from "@/shared/types/models";

export const ORGANIZATION: Organization = {
  id: "org-acme",
  name: "Acme Inc",
  address: "123 Market Street, Springfield",
  createdAt: "2023-01-10",
};
