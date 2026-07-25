import { cn } from "@/shared/lib/utils";

/** `HH:MM:SS`, or `MM:SS` for hearings under an hour. */
function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export interface TimestampProps {
  /** Offset from the hearing start, in milliseconds. */
  ms: number;
  /** When set, renders as a button that seeks the audio to this offset. */
  onSeek?: (ms: number) => void;
  className?: string;
}

/**
 * A hearing-relative timestamp (spec §16.3). Monospaced + tabular so digit
 * substitution is visible when the clerk verifies it. Clickable variant emits
 * `onSeek` for the record spine / audio player.
 */
export function Timestamp({ ms, onSeek, className }: TimestampProps) {
  const label = format(ms);
  const base = "font-mono text-xs tabular-nums text-muted-foreground";

  if (!onSeek) return <span className={cn(base, className)}>{label}</span>;

  return (
    <button
      type="button"
      onClick={() => onSeek(ms)}
      className={cn(
        base,
        "rounded-sm underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      {label}
    </button>
  );
}
