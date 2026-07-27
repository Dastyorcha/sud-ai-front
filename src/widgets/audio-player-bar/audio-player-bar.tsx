import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { cn } from "@/shared/lib/utils";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

const BAR_COUNT = 56;
const TICK_MS = 250;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Deterministic pseudo-random bar heights (%) — no audio-analysis dependency. */
function barHeights(count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    const frac = x - Math.floor(x);
    return 24 + Math.round(frac * 76);
  });
}

export interface AudioPlayerBarProps {
  durationMs: number;
  /** Fires whenever the mock playback clock advances (for transcript highlight). */
  onTimeChange?: (ms: number) => void;
  className?: string;
}

/**
 * Waveform player bar (mockup-05 #2): play/pause toggle, a mock `setInterval`
 * playback clock, static deterministic waveform bars with a progress-fill
 * overlay (pure CSS — no wavesurfer/audio-analysis dependency), current/total
 * time and a 0.5x–2x speed select.
 */
export function AudioPlayerBar({ durationMs, onTimeChange, className }: AudioPlayerBarProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const heights = useMemo(() => barHeights(BAR_COUNT), []);

  useEffect(() => {
    if (!playing || durationMs <= 0) return;
    const id = setInterval(() => {
      setCurrentMs((ms) => {
        const next = ms + TICK_MS * speed;
        if (next >= durationMs) {
          setPlaying(false);
          return durationMs;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [playing, speed, durationMs]);

  useEffect(() => {
    onTimeChange?.(currentMs);
  }, [currentMs, onTimeChange]);

  const progress = durationMs > 0 ? currentMs / durationMs : 0;

  return (
    <div
      className={cn("flex flex-col gap-3 rounded-lg border border-border bg-card p-4", className)}
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="gold"
          size="icon"
          aria-label={playing ? t("protocolWorkspace.pause") : t("protocolWorkspace.play")}
          disabled={durationMs <= 0}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>

        <div className="flex h-16 flex-1 items-end gap-0.5 overflow-hidden">
          {heights.map((h, i) => {
            const played = i / BAR_COUNT <= progress;
            return (
              <div
                key={i}
                aria-hidden="true"
                className={cn(
                  "w-1 flex-1 rounded-full transition-colors",
                  played ? "bg-gold" : "bg-muted-foreground/25"
                )}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <span className="flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
          <Timestamp ms={currentMs} />
          <span>/</span>
          <Timestamp ms={durationMs} />
        </span>

        <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
          <SelectTrigger className="w-20" aria-label={t("protocolWorkspace.speed")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}x
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
