/**
 * State fee ("davlat boji") calculator for the new-case wizard's claim step.
 *
 * TODO: this is a single flat-rate placeholder, not the real progressive
 * tariff table from the Tax Code (which varies by claimant type, case kind
 * and claim brackets). Replace once the legal expert freezes the tariff
 * schedule — flagged in `plans/doing/mockup-03-new-case-wizard.md`.
 */
export const STATE_FEE_RATE = 0.03;
export const STATE_FEE_MINIMUM = 500_000; // UZS

/** Rough state-fee estimate: `rate` of the claim amount, floored at a minimum. */
export function calculateStateFee(claimAmount: number): number {
  if (!Number.isFinite(claimAmount) || claimAmount <= 0) return STATE_FEE_MINIMUM;
  return Math.max(Math.round(claimAmount * STATE_FEE_RATE), STATE_FEE_MINIMUM);
}
