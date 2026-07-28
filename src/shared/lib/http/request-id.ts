/**
 * `X-Request-ID` correlation: a fresh id is generated per outgoing request
 * (`api-client.ts` request interceptor); the response interceptor captures
 * whatever id comes back (usually echoed, sometimes server-assigned) here so
 * it can be attached to logs/bug reports without threading it everywhere.
 */

function randomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without `crypto.randomUUID`.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Generates a fresh id for an outgoing request's `X-Request-ID` header. */
export function createRequestId(): string {
  return randomUuid();
}

let lastRequestId: string | undefined;

/** Records the most recent response's `X-Request-ID`, if present. */
export function setLastRequestId(id: string | undefined): void {
  if (id) lastRequestId = id;
}

/** The last captured response `X-Request-ID`, for logging/support correlation. */
export function getLastRequestId(): string | undefined {
  return lastRequestId;
}
