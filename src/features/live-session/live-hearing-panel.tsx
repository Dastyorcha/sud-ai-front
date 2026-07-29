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
import { StatusBadge } from "@/shared/custom/status-badge";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { transitionHearing } from "@/shared/lib/mock-api/hearing.service";
import { startJob } from "@/shared/lib/mock-api/job.service";
import { useJob } from "@/shared/hooks/use-job";
import { HubConnectionState } from "@/features/live-session/demo-hub";
import { useDemoHub } from "@/features/live-session/use-demo-hub";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";

/**
 * Demo publish script (integration guide §14) — fed to the real
 * `PublishMockSegment` hub method while recording, replacing the old
 * client-only scripted feed. Every connection on the hearing (including this
 * one) receives it back via `TranscriptSegmentReceived`.
 */
const MOCK_SEGMENT_SCRIPT: Array<{ speakerLabel: string; text: string; confidence: number }> = [
  { speakerLabel: "SPEAKER_01", text: "Sud majlisi ochiq deb e'lon qilinadi.", confidence: 0.94 },
  { speakerLabel: "SPEAKER_01", text: "Ishtirokchilarning shaxsi aniqlanadi.", confidence: 0.91 },
  {
    speakerLabel: "SPEAKER_02",
    text: "Da'vogar vakili — da'vo talablarini qo'llab-quvvatlaymiz.",
    confidence: 0.88,
  },
  {
    speakerLabel: "SPEAKER_03",
    text: "Javobgar vakili — qisman e'tiroz bildiramiz.",
    confidence: 0.86,
  },
  {
    speakerLabel: "SPEAKER_02",
    text: "Hisob-kitob dalolatnomasini talab qilib olishni so'raymiz.",
    confidence: 0.9,
  },
  { speakerLabel: "SPEAKER_01", text: "Iltimosnoma muhokamaga qo'yiladi.", confidence: 0.93 },
];

/** Tone + message key per `HubConnection.state` (connecting/connected/reconnecting/disconnected). */
const HUB_STATE_TONE: Record<HubConnectionState, "neutral" | "info" | "success" | "warning"> = {
  [HubConnectionState.Disconnected]: "neutral",
  [HubConnectionState.Connecting]: "info",
  [HubConnectionState.Connected]: "success",
  [HubConnectionState.Disconnecting]: "warning",
  [HubConnectionState.Reconnecting]: "warning",
};

const HUB_STATE_KEY: Record<HubConnectionState, MessageKey> = {
  [HubConnectionState.Disconnected]: "hearing.hub.disconnected",
  [HubConnectionState.Connecting]: "hearing.hub.connecting",
  [HubConnectionState.Connected]: "hearing.hub.connected",
  [HubConnectionState.Disconnecting]: "hearing.hub.disconnecting",
  [HubConnectionState.Reconnecting]: "hearing.hub.reconnecting",
};

/** Segments below this status count as still-settling ("interim" styling). */
function isInterimSegment(status: string): boolean {
  return status === "INTERIM" || status === "Raw";
}

export interface LiveHearingPanelProps {
  hearing: Hearing;
  onStatusChange: () => void;
}

/**
 * Live hearing screen (spec §16.2, FR-05, UC-02). The live transcript is the
 * real demo SignalR hub (guide §14): while recording, a demo script is
 * published via `PublishMockSegment` over LongPolling and every connection on
 * the hearing (including this one) receives it back through
 * `TranscriptSegmentReceived`. Controls drive the real §17.3 state machine;
 * Stop runs the finalize job (UC-04).
 */
export function LiveHearingPanel({ hearing, onStatusChange }: LiveHearingPanelProps) {
  const { t } = useTranslation();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [stopOpen, setStopOpen] = useState(false);
  const [finalizeJobId, setFinalizeJobId] = useState<string | null>(null);
  const job = useJob(finalizeJobId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recording = hearing.status === "RECORDING";
  const { state: hubState, segments, publish } = useDemoHub(hearing.id);
  const scriptIndexRef = useRef(0);
  const sequenceRef = useRef(1);

  // Clock while recording.
  useEffect(() => {
    if (!recording) return;
    const clock = setInterval(() => setElapsedMs((ms) => ms + 1_000), 1_000);
    return () => clearInterval(clock);
  }, [recording]);

  // Demo publish loop (guide §14): while recording and connected, feed the
  // script through the real hub so it round-trips via `TranscriptSegmentReceived`.
  useEffect(() => {
    if (!recording || hubState !== HubConnectionState.Connected) return;
    const feed = setInterval(() => {
      const line = MOCK_SEGMENT_SCRIPT[scriptIndexRef.current % MOCK_SEGMENT_SCRIPT.length];
      scriptIndexRef.current++;
      if (!line) return;
      const sequenceNo = sequenceRef.current++;
      const startMs = (sequenceNo - 1) * 4_000;
      void publish({
        sequenceNo,
        startMs,
        endMs: startMs + 3_500,
        speakerLabel: line.speakerLabel,
        text: line.text,
        confidence: line.confidence,
      });
    }, 4_000);
    return () => clearInterval(feed);
  }, [recording, hubState, publish]);

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
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
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
  }, [segments]);

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
        <StatusBadge tone={HUB_STATE_TONE[hubState]} label={t(HUB_STATE_KEY[hubState])} />
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
            {segments.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("hearing.waitingStart")}</p>
            )}
            {segments.map((segment) => (
              <div key={segment.id} className="flex items-start gap-3">
                <Timestamp ms={segment.startMs} />
                <SpeakerChip label={segment.speakerLabel ?? t("record.unmappedSpeaker")} />
                <p
                  className={
                    isInterimSegment(segment.status)
                      ? "text-sm text-muted-foreground italic"
                      : "text-sm text-foreground"
                  }
                >
                  {segment.normalizedText || segment.rawText}
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
