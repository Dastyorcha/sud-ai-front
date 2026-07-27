/**
 * Tiny module-singleton pub/sub letting other features append text into an
 * open `DocumentEditor` section without a prop-drilled callback or a React
 * context provider (the editor and its callers can be mounted in unrelated
 * lazy chunks). mockup-07's judge copilot ("Hujjatga qo'shish") is the first
 * external caller — it targets the "reasoning" (III) section.
 */
type AppendListener = (sectionId: string, text: string) => void;

const listeners = new Set<AppendListener>();

/** Subscribes to append events; returns an unsubscribe function. */
export function onAppendToSection(listener: AppendListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Appends `text` into the currently open editor's `sectionId`, if one is listening. */
export function appendToSection(sectionId: string, text: string): void {
  listeners.forEach((listener) => listener(sectionId, text));
}
