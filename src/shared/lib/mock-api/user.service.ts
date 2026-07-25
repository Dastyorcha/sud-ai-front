/**
 * Mock `User` directory service — server-shaped so it's a drop-in swap for
 * `GET /api/users` later.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import { USERS } from "@/shared/lib/mock-api/data";
import type { User } from "@/shared/types/models";

/** All users in the current organization. Swap to `GET /api/users` later. */
export async function listUsers(): Promise<User[]> {
  await delay();
  return USERS;
}

/** A single user by id. Swap to `GET /api/users/:id` later. */
export async function getUser(id: string): Promise<User | null> {
  await delay();
  return USERS.find((u) => u.id === id) ?? null;
}
