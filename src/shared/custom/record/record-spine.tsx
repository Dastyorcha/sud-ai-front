import { useMemo, type MouseEvent } from "react";
import type { ProceduralEventType } from "@/shared/types/enums";
import { cn } from "@/shared/lib/utils";

export interface RecordSpineEvent {
  id: string;
  /** Offset from the hearing start, in milliseconds. */
  atMs: number;
  type: ProceduralEventType;
  /** Verified events render filled; unverified render hollow. */
  verified: boolean;
}

export interface RecordSpineProps {
  /** Full hearing duration the rail represents, in milliseconds. */
  durationMs: number;
  events?: RecordSpineEvent[];
  /** Current audio position, in milliseconds. */
  playheadMs?: number;
  /** Transcript range currently visible on screen, shaded as a band. */
  visibleRange?: { startMs: number; endMs: number };
  onSeek: (ms: number) => void;
  className?: string;
}

/** Position (0..100%) of an offset within the hearing. */
function pct(ms: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.min(100, Math.max(0, (ms / durationMs) * 100));
}

/**
 * The signature element (spec §16, `02-design-system.md` §1.3): a fixed-width
 * vertical rail rendering the hearing's whole duration. Event ticks (hollow =
 * unverified, filled = verified), a playhead line, and a shaded visible-range
 * band. Clicking the rail or a tick seeks the audio. Shared unchanged across
 * the live, transcript, events, protocol and document screens.
 */
export function RecordSpine({
  durationMs,
  events = [],
  playheadMs,
  visibleRange,
  onSeek,
  className,
}: RecordSpineProps) {
  const sorted = useMemo(() => [...events].sort((a, b) => a.atMs - b.atMs), [events]);

  function seekFromPosition(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.height <= 0 ? 0 : (event.clientY - rect.top) / rect.height;
    onSeek(Math.round(Math.min(1, Math.max(0, ratio)) * durationMs));
  }

  return (
    <div
      onClick={seekFromPosition}
      className={cn(
        "relative h-full w-14 shrink-0 cursor-pointer border-r border-border bg-muted/30",
        className
      )}
    >
      {/* central track line */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />

      {/* visible-range band */}
      {visibleRange && (
        <div
          className="pointer-events-none absolute inset-x-0 bg-foreground/[0.06]"
          style={{
            top: `${pct(visibleRange.startMs, durationMs)}%`,
            height: `${pct(visibleRange.endMs - visibleRange.startMs, durationMs)}%`,
          }}
        />
      )}

      {/* event ticks */}
      {sorted.map((ev) => (
        <button
          key={ev.id}
          type="button"
          title={ev.type}
          aria-label={ev.type}
          onClick={(e) => {
            e.stopPropagation();
            onSeek(ev.atMs);
          }}
          className={cn(
            "absolute left-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            ev.verified ? "bg-foreground" : "border border-muted-foreground bg-background"
          )}
          style={{ top: `${pct(ev.atMs, durationMs)}%` }}
        />
      ))}

      {/* playhead */}
      {playheadMs != null && (
        <div
          className="pointer-events-none absolute inset-x-0 h-px bg-destructive"
          style={{ top: `${pct(playheadMs, durationMs)}%` }}
        />
      )}
    </div>
  );
}
