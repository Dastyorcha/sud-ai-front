import type { Locale } from "../locale";
import { en } from "./en";
import { ru } from "./ru";
import { uz, type Messages } from "./uz";

export type { Messages };

/** All locale message trees, keyed by `Locale`. */
export const MESSAGES: Record<Locale, Messages> = { uz, en, ru };

/**
 * Every dot-path to a leaf (string) key in `Messages`, e.g.
 * `"enums.roles.admin"` or `"pages.dashboard"` — gives `t()` a typed key
 * union so a typo or a moved key is a compile error.
 */
export type MessageKey<T = Messages, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: MessageKey<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
    }[keyof T & string];
