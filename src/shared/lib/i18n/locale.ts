/**
 * Locale model for the panel's custom, lightweight i18n layer (no library).
 * The locale lives as the first URL path segment (`/:lang/*`) — see
 * `src/app/app.tsx` and `docs/i18n.md`.
 */

/** Supported locales, uz first (product default). */
export const LOCALES = ["uz", "en", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";

/** Native-name labels for the locale switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O‘zbekcha",
  en: "English",
  ru: "Русский",
};

/** localStorage key for the user's last-picked locale (UI preference only). */
export const LOCALE_STORAGE_KEY = "app:locale";

/** Narrows an arbitrary route param / string to a supported `Locale`. */
export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
