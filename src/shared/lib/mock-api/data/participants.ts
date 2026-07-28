/**
 * Mock participants (spec §14.3) for the fixture cases. `case-1` has the full
 * four-party economic dispute the demo relies on; other cases carry a minimal
 * claimant/defendant pair. Deterministic, server-shaped (`Participant`).
 */
import type { Participant } from "@/shared/types/models";

export const PARTICIPANTS: Participant[] = [
  // ── case-1 — full four-party economic dispute ─────────────────────────────
  {
    id: "p-1-claimant",
    courtCaseId: "case-1",
    displayName: "“Oq Yo‘l Logistika” MChJ",
    organizationName: "“Oq Yo‘l Logistika” MChJ",
    role: "CLAIMANT",
    identifier: { tin: "301234567" },
    language: "uz",
    isActive: true,
    createdAt: "2026-06-04T10:05:00+05:00",
    updatedAt: "2026-06-04T10:05:00+05:00",
  },
  {
    id: "p-1-claimant-rep",
    courtCaseId: "case-1",
    displayName: "Abdullayev Sardor Farhodovich",
    organizationName: "“Oq Yo‘l Logistika” MChJ",
    role: "CLAIMANT_REPRESENTATIVE",
    identifier: { passport: "AA1234567" },
    language: "uz",
    isActive: true,
    createdAt: "2026-06-04T10:06:00+05:00",
    updatedAt: "2026-06-04T10:06:00+05:00",
  },
  {
    id: "p-1-defendant",
    courtCaseId: "case-1",
    displayName: "“Zamin Qurilish” MChJ",
    organizationName: "“Zamin Qurilish” MChJ",
    role: "DEFENDANT",
    identifier: { tin: "307654321" },
    language: "uz",
    isActive: true,
    createdAt: "2026-06-04T10:07:00+05:00",
    updatedAt: "2026-06-04T10:07:00+05:00",
  },
  {
    id: "p-1-defendant-rep",
    courtCaseId: "case-1",
    displayName: "Sobirova Nigora Alisherovna",
    organizationName: "“Zamin Qurilish” MChJ",
    role: "DEFENDANT_REPRESENTATIVE",
    identifier: { passport: "AB7654321" },
    language: "uz",
    isActive: true,
    createdAt: "2026-06-04T10:08:00+05:00",
    updatedAt: "2026-06-04T10:08:00+05:00",
  },

  // ── case-2 — debt recovery ────────────────────────────────────────────────
  {
    id: "p-2-claimant",
    courtCaseId: "case-2",
    displayName: "“Bir Bank” ATB",
    organizationName: "“Bir Bank” ATB",
    role: "CLAIMANT",
    identifier: { tin: "201112223" },
    language: "uz",
    isActive: true,
    createdAt: "2026-06-18T09:35:00+05:00",
    updatedAt: "2026-06-18T09:35:00+05:00",
  },
  {
    id: "p-2-defendant",
    courtCaseId: "case-2",
    displayName: "Toshmatov Jasur Baxromovich",
    organizationName: null,
    role: "DEFENDANT",
    identifier: { passport: "AC1112223" },
    language: "uz",
    isActive: true,
    createdAt: "2026-06-18T09:36:00+05:00",
    updatedAt: "2026-06-18T09:36:00+05:00",
  },

  // ── case-3 — contract dispute ─────────────────────────────────────────────
  {
    id: "p-3-claimant",
    courtCaseId: "case-3",
    displayName: "“Agro Eksport” MChJ",
    organizationName: "“Agro Eksport” MChJ",
    role: "CLAIMANT",
    identifier: { tin: "305556667" },
    language: "uz",
    isActive: true,
    createdAt: "2026-07-02T13:50:00+05:00",
    updatedAt: "2026-07-02T13:50:00+05:00",
  },
  {
    id: "p-3-defendant",
    courtCaseId: "case-3",
    displayName: "“Sharq Savdo” MChJ",
    organizationName: "“Sharq Savdo” MChJ",
    role: "DEFENDANT",
    identifier: { tin: "308889990" },
    language: "uz",
    isActive: true,
    createdAt: "2026-07-02T13:51:00+05:00",
    updatedAt: "2026-07-02T13:51:00+05:00",
  },
];
