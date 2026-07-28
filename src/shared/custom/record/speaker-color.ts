/** The 4 speaker-color tokens (`src/index.css`), cycled by label. */
const SPEAKER_DOT_CLASSES = ["bg-speaker-1", "bg-speaker-2", "bg-speaker-3", "bg-speaker-4"];

/**
 * Stable color-dot class for a diarization speaker label (spec §16.2/§16.3) —
 * a simple string hash so the same label always maps to the same token,
 * shared between the speakers panel and the transcript rows.
 */
export function speakerColorClass(label: string): string {
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return SPEAKER_DOT_CLASSES[hash % SPEAKER_DOT_CLASSES.length] as string;
}
