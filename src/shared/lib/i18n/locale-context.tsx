import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { formatDate, formatMoney, formatNumber } from "./format";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locale";
import { MESSAGES, type MessageKey } from "./messages";

type TranslateVars = Record<string, string | number>;

function readMessage(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc !== null && typeof acc === "object" && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

/** Looks up `key` in `locale`'s messages, falls back to `uz`, then the raw key. */
function translate(locale: Locale, key: MessageKey, vars?: TranslateVars): string {
  const localized = readMessage(MESSAGES[locale], key);
  if (typeof localized === "string") return interpolate(localized, vars);

  if (locale !== DEFAULT_LOCALE) {
    const fallback = readMessage(MESSAGES[DEFAULT_LOCALE], key);
    if (typeof fallback === "string") return interpolate(fallback, vars);
  }

  return key;
}

export interface LocaleContextValue {
  locale: Locale;
  /** Dot-path message lookup with `{var}` interpolation; typed key union. */
  t: (key: MessageKey, vars?: TranslateVars) => string;
  formatMoney: (value: number) => string;
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Derives the active locale from the `:lang` route param (falls back to
 * `DEFAULT_LOCALE` for an invalid/missing segment) and provides `t()` +
 * locale-aware formatters to the subtree. Mounted once per `/:lang` route
 * — see `src/app/app.tsx`.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const { lang } = useParams<{ lang?: string }>();
  const locale: Locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
      formatMoney: (value) => formatMoney(value, locale),
      formatDate: (value, options) => formatDate(value, locale, options),
      formatNumber: (value, options) => formatNumber(value, locale, options),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** `{ locale, t, formatMoney, formatDate, formatNumber }` — must be used within `LocaleProvider`. */
// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LocaleProvider");
  }
  return ctx;
}
