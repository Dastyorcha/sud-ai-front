/**
 * Central brand identity — the single source of truth for the product name.
 *
 * Reference `APP_NAME` everywhere the brand is shown (UI, i18n messages, docs
 * examples). Never hardcode the brand string in components or message files;
 * change it here once and it propagates everywhere.
 */
export const APP_NAME = "LexKotib AI";

/** Product descriptor shown alongside `APP_NAME` in the app header/logo lockup. */
export const APP_FULL_NAME = "Auditable Judicial Documentation Platform";

/** Displayed in `AppFooter` — bump manually until a real release pipeline
 *  wires this to `package.json`/CI. */
export const APP_VERSION = "0.1.0";
