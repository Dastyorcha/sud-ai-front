/** Mock users across the example roles, all in the single mock organization. */
import type { User } from "@/shared/types/models";
import { ORGANIZATION } from "@/shared/lib/mock-api/data/organization";

export const USERS: User[] = [
  {
    id: "user-1",
    organizationId: ORGANIZATION.id,
    role: "admin",
    fullName: "Ada Lovelace",
    phone: "+1 555 010 1000",
    email: "ada.lovelace@example.com",
    isActive: true,
    lastLoginAt: "2026-07-18T08:12:00",
  },
  {
    id: "user-2",
    organizationId: ORGANIZATION.id,
    role: "editor",
    fullName: "Alan Turing",
    phone: "+1 555 010 1001",
    email: "alan.turing@example.com",
    isActive: true,
    lastLoginAt: "2026-07-17T17:40:00",
  },
  {
    id: "user-3",
    organizationId: ORGANIZATION.id,
    role: "editor",
    fullName: "Grace Hopper",
    phone: "+1 555 010 1002",
    email: "grace.hopper@example.com",
    isActive: true,
    lastLoginAt: "2026-07-16T11:05:00",
  },
  {
    id: "user-4",
    organizationId: ORGANIZATION.id,
    role: "viewer",
    fullName: "Katherine Johnson",
    phone: "+1 555 010 1003",
    email: "katherine.johnson@example.com",
    isActive: true,
    lastLoginAt: "2026-07-15T14:20:00",
  },
  {
    id: "user-5",
    organizationId: ORGANIZATION.id,
    role: "viewer",
    fullName: "Margaret Hamilton",
    phone: "+1 555 010 1004",
    email: "margaret.hamilton@example.com",
    isActive: false,
    lastLoginAt: "2026-06-10T09:00:00",
  },
];
