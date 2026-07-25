import { DEFAULT_LOCALE, type Locale } from "./locale";

/** All money/date formatting in the panel is anchored to Tashkent per TZ. */
const TASHKENT_TIME_ZONE = "Asia/Tashkent";

const INTL_TAG: Record<Locale, string> = {
  uz: "uz-UZ",
  en: "en-US",
  ru: "ru-RU",
};

const CURRENCY_WORD: Record<Locale, string> = {
  uz: "so'm",
  en: "so'm",
  ru: "сум",
};

/**
 * Groups an integer's digits with a plain space every 3 digits, independent
 * of locale — `Intl`'s grouping separator varies (NBSP, comma, …) and the
 * product spec wants a consistent plain-space group for money.
 */
function groupThousands(value: number): string {
  const rounded = Math.round(value);
  const negative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return negative ? `-${grouped}` : grouped;
}

/** Formats an integer UZS amount, e.g. `1 250 000 so'm` / `1 250 000 сум`. */
export function formatMoney(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return `${groupThousands(value)} ${CURRENCY_WORD[locale]}`;
}

/** Locale-aware date formatting, always rendered in the Tashkent time zone. */
export function formatDate(
  value: Date | number | string,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(INTL_TAG[locale], {
    timeZone: TASHKENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  }).format(date);
}

/** Locale-aware generic number formatting (grouping, decimals, …). */
export function formatNumber(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(INTL_TAG[locale], options).format(value);
}
