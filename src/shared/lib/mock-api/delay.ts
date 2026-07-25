/**
 * Simulated network latency for the mock service layer — every mock service
 * call awaits this so loading states are exercised the same way a real HTTP
 * call would. A timer-based `Promise`, never `Date.now()`/`Math.random()`.
 */
export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
