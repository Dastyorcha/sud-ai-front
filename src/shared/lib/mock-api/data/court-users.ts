/**
 * Mock application users, one per court role (spec §4). These are the accounts
 * the auth layer authenticates and the `judgeId` a case points at. Server-shaped
 * (`CourtUser`), deterministic — swap for `GET /auth/me` + a users endpoint later.
 */
import type { CourtUser } from "@/shared/types/models";

export const COURT_USERS: CourtUser[] = [
  {
    id: "cu-judge-1",
    role: "JUDGE",
    fullName: "Karimov Otabek Rustamovich",
    email: "judge@lexkotib.uz",
    isActive: true,
    lastLoginAt: "2026-07-24T09:05:00+05:00",
  },
  {
    id: "cu-clerk-1",
    role: "CLERK",
    fullName: "Yusupova Dilnoza Baxtiyorovna",
    email: "clerk@lexkotib.uz",
    isActive: true,
    lastLoginAt: "2026-07-25T08:40:00+05:00",
  },
  {
    id: "cu-admin-1",
    role: "ADMIN",
    fullName: "Tashkentov Aziz Karimovich",
    email: "admin@lexkotib.uz",
    isActive: true,
    lastLoginAt: "2026-07-25T07:55:00+05:00",
  },
  {
    id: "cu-expert-1",
    role: "LEGAL_EXPERT",
    fullName: "Rahimova Malika Anvarovna",
    email: "expert@lexkotib.uz",
    isActive: true,
    lastLoginAt: "2026-07-23T14:20:00+05:00",
  },
  {
    id: "cu-demo-1",
    role: "DEMO_OPERATOR",
    fullName: "Demo Operator",
    email: "demo@lexkotib.uz",
    isActive: true,
    lastLoginAt: "2026-07-25T10:00:00+05:00",
  },
];
