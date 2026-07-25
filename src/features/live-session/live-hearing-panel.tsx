import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Progress } from "@/shared/components/ui/progress";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { transitionHearing } from "@/shared/lib/mock-api/hearing.service";
import { startJob } from "@/shared/lib/mock-api/job.service";
import { useJob } from "@/shared/hooks/use-job";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";

/** Scripted live feed replayed while recording (frontend-only stand-in for the §9.4 WebSocket). */
const LIVE_SCRIPT: Array<{ speaker: string; text: string }> = [
  { speaker: "SPEAKER_01", text: "Sud majlisi ochiq deb e'lon qilinadi." },
  { speaker: "SPEAKER_01", text: "Ishtirokchilarning shaxsi aniqlanadi." },
  { speaker: "SPEAKER_02", text: "Da'vogar vakili — da'vo talablarini qo'llab-quvvatlaymiz." },
  { speaker: "SPEAKER_03", text: "Javobgar vakili — qisman e'tiroz bildiramiz." },
  { speaker: "SPEAKER_02", text: "Hisob-kitob dalolatnomasini talab qilib olishni so'raymiz." },
  { speaker: "SPEAKER_01", text: "Iltimosnoma muhokamaga qo'yiladi." },
];

interface LiveLine {
  id: number;
  speaker: string;
  text: string;
  atMs: number;
  interim: boolean;
}

export interface LiveHearingPanelProps {
  hearing: Hearing;
  onStatusChange: () => void;
}

/**
 * Live hearing screen (spec §16.2, FR-05, UC-02). Frontend-only build: the
 * live transcript is a scripted replay standing in for the realtime STT
 * WebSocket; controls drive the real §17.3 state machine. Interim lines
 * settle into final after a beat, and Stop runs the finalize job (UC-04).
 */
export function LiveHearingPanel({ hearing, onStatusChange }: LiveHearingPanelProps) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<LiveLine[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [stopOpen, setStopOpen] = useState(false);
  const [finalizeJobId, setFinalizeJobId] = useState<string | null>(null);
  const job = useJob(finalizeJobId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recording = hearing.status === "RECORDING";

  // Simulated live feed + clock + level meter while recording.
  useEffect(() => {
    if (!recording) return;
    let i = 0;
    const feed = setInterval(() => {
      const line = LIVE_SCRIPT[i % LIVE_SCRIPT.length];
      if (line) {
        const id = i;
        setLines((prev) => [
          ...prev.map((l) => ({ ...l, interim: false })),
          { id, speaker: line.speaker, text: line.text, atMs: (i + 1) * 4_000, interim: true },
        ]);
      }
      i++;
    }, 4_000);
    const clock = setInterval(() => setElapsedMs((ms) => ms + 1_000), 1_000);
    return () => {
      clearInterval(feed);
      clearInterval(clock);
    };
  }, [recording]);

  // Real microphone level meter (FR-04): getUserMedia → AnalyserNode RMS.
  // Echo cancellation / noise suppression / AGC off — they damage courtroom
  // audio (plan D-07). Falls back to a simulated level if access is denied.
  useEffect(() => {
    if (!recording) {
      setLevel(0);
      return;
    }
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let fallback: ReturnType<typeof setInterval> | undefined;

    navigator.mediaDevices
      .getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      .then((s) => {
        stream = s;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        const tick = () => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += v * v;
          setLevel(Math.min(100, Math.sqrt(sum / buf.length) * 400));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch(() => {
        fallback = setInterval(() => setLevel(30 + ((Date.now() / 300) % 50)), 300);
      });

    return () => {
      cancelAnimationFrame(raf);
      if (fallback) clearInterval(fallback);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, [recording]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  // Finalize job finished → hearing becomes reviewable.
  useEffect(() => {
    if (job?.status === "SUCCEEDED") {
      void transitionHearing(hearing.id, "READY_FOR_REVIEW").then(() => {
        setFinalizeJobId(null);
        onStatusChange();
      });
    }
  }, [job?.status, hearing.id, onStatusChange]);

  async function transition(to: Parameters<typeof transitionHearing>[1]) {
    try {
      await transitionHearing(hearing.id, to);
      onStatusChange();
    } catch {
      notify.error(t("errors.genericTitle"));
    }
  }

  async function confirmStop() {
    setStopOpen(false);
    await transition("FINALIZING");
    await transitionHearing(hearing.id, "PROCESSING");
    onStatusChange();
    const started = await startJob("final_transcription", 5_000);
    setFinalizeJobId(started.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <RecordStateBadge kind="hearing" status={hearing.status} />
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          <Timestamp ms={elapsedMs} />
        </span>
        {hearing.status === "CREATED" && (
          <Button onClick={() => transition("RECORDING")}>
            <Mic className="size-4" />
            {t("hearing.start")}
          </Button>
        )}
        {recording && (
          <>
            <Button variant="outline" onClick={() => transition("PAUSED")}>
              <Pause className="size-4" />
              {t("hearing.pause")}
            </Button>
            <Button variant="destructive" onClick={() => setStopOpen(true)}>
              <Square className="size-4" />
              {t("hearing.stop")}
            </Button>
          </>
        )}
        {hearing.status === "PAUSED" && (
          <>
            <Button onClick={() => transition("RECORDING")}>
              <Play className="size-4" />
              {t("hearing.resume")}
            </Button>
            <Button variant="destructive" onClick={() => setStopOpen(true)}>
              <Square className="size-4" />
              {t("hearing.stop")}
            </Button>
          </>
        )}
      </div>

      {(hearing.status === "PROCESSING" || hearing.status === "FINALIZING") && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <p className="text-sm text-muted-foreground">{t("hearing.processingJob")}</p>
            <Progress value={job?.progress ?? 5} />
          </CardContent>
        </Card>
      )}

      {recording && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("hearing.inputLevel")}</span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-success" style={{ width: `${level}%` }} />
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {t("hearing.liveTranscript")}
          </h3>
          <div ref={scrollRef} className="flex max-h-96 flex-col gap-3 overflow-y-auto">
            {lines.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("hearing.waitingStart")}</p>
            )}
            {lines.map((line) => (
              <div key={line.id} className="flex items-start gap-3">
                <Timestamp ms={line.atMs} />
                <SpeakerChip label={line.speaker} />
                <p
                  className={
                    line.interim ? "text-sm text-muted-foreground italic" : "text-sm text-foreground"
                  }
                >
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={stopOpen} onOpenChange={setStopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hearing.stopConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("hearing.stopConfirmDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStopOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmStop}>
              {t("hearing.stop")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
