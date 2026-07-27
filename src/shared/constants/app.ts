/**
 * Central brand identity — the single source of truth for the product name.
 *
 * Reference `APP_NAME` everywhere the brand is shown (UI, i18n messages, docs
 * examples). Never hardcode the brand string in components or message files;
 * change it here once and it propagates everywhere.
 */
export const APP_NAME = "Court AI Assistant";

/** Native-language display name, shown alongside `APP_NAME` in the app
 *  header/logo lockup (spec mockup: "Court AI Assistant / Sud AI
 *  Yordamchisi") — a fixed bilingual brand mark, not locale-switched. */
export const APP_FULL_NAME = "Sud AI Yordamchisi";

/** Displayed in `AppFooter` — bump manually until a real release pipeline
 *  wires this to `package.json`/CI. */
export const APP_VERSION = "0.1.0";
