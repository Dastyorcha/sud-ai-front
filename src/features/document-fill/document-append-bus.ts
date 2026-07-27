/**
 * Tiny module-singleton pub/sub letting other features append text into an
 * open `DocumentEditor` section without a prop-drilled callback or a React
 * context provider (the editor and its callers can be mounted in unrelated
 * lazy chunks). mockup-07's judge copilot ("Hujjatga qo'shish") is the first
 * external caller — it targets the "reasoning" (III) section.
 *
 * The Documents tab (and its `DocumentEditor`) is lazy/unmounted whenever
 * another tab is active, so a copilot append can easily fire with no
 * listener subscribed. To avoid silently losing that text, unclaimed
 * appends are queued in `pending` and flushed into the next subscriber —
 * i.e. the next time a `DocumentEditor` mounts.
 */
type AppendListener = (sectionId: string, text: string) => void;

interface PendingAppend {
  sectionId: string;
  text: string;
}

const listeners = new Set<AppendListener>();
const pending: PendingAppend[] = [];

/** Subscribes to append events; flushes any queued appends first, then returns an unsubscribe function. */
export function onAppendToSection(listener: AppendListener): () => void {
  listeners.add(listener);
  if (pending.length > 0) {
    const queued = pending.splice(0, pending.length);
    queued.forEach(({ sectionId, text }) => listener(sectionId, text));
  }
  return () => listeners.delete(listener);
}

/**
 * Appends `text` into the currently open editor's `sectionId`. If no editor
 * is mounted to receive it, the append is queued and delivered to the next
 * one that subscribes.
 */
export function appendToSection(sectionId: string, text: string): void {
  if (listeners.size === 0) {
    pending.push({ sectionId, text });
    return;
  }
  listeners.forEach((listener) => listener(sectionId, text));
}
