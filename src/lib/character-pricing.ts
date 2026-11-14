/** Public cost policy. One application credit is USD $0.01 in every pack.
 * SeeAPI public list checked 2026-11-14: 4.9 credits at 1K/1.5K,
 * 8.5 at 2K; USD estimate $0.0037 per provider credit.
 * Keep integer microdollars so rounding never undercharges the 8× policy.
 */
export const CHARACTER_MARKUP = 8;
export const SEEAPI_CREDIT_MICRO_USD = 3700;
export const APP_CREDIT_MICRO_USD = 10000;
export const CHARACTER_RESOLUTIONS = ['1K', '1.5K', '2K'] as const;
export type CharacterResolution = (typeof CHARACTER_RESOLUTIONS)[number];
export const DEFAULT_CHARACTER_RESOLUTION: CharacterResolution = '2K';
export const SEEAPI_COST_TENTHS = { '1K': 49, '1.5K': 49, '2K': 85 } as const;
export function characterCreditCost(resolution: CharacterResolution) {
  return Math.ceil(
    (SEEAPI_COST_TENTHS[resolution] *
      SEEAPI_CREDIT_MICRO_USD *
      CHARACTER_MARKUP) /
      (10 * APP_CREDIT_MICRO_USD)
  );
}

/** UI guidance only. The server still validates and reserves the actual charge. */
export function generationCreditShortfall(
  balance: number | undefined,
  cost: number | undefined
): number | undefined {
  if (
    balance === undefined ||
    cost === undefined ||
    !Number.isFinite(balance) ||
    !Number.isFinite(cost) ||
    balance < 0 ||
    cost < 0
  )
    return undefined;
  return Math.max(0, cost - balance);
}
