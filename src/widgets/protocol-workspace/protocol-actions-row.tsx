import { useEffect, useState } from "react";
import { Mic, Pause, Play, Square, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { FileDropzone } from "@/shared/components/ui/file-dropzone";
import { Progress } from "@/shared/components/ui/progress";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { transitionHearing } from "@/shared/lib/mock-api/hearing.service";
import { startJob } from "@/shared/lib/mock-api/job.service";
import { useJob } from "@/shared/hooks/use-job";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";

export interface ProtocolActionsRowProps {
  hearing: Hearing;
  onChanged: () => void;
}

/**
 * Protocol tab toolbar (mockup-05 #1): upload audio, live record button
 * wired to the same phase-05 mic-capture pattern and §17.3 state machine as
 * `LiveHearingPanel`, a running timer, status badge and duration. Kept
 * intentionally lighter than the full Hearing Detail live tab (no scripted
 * feed) — this is the compact toolbar the mockup shows above the player.
 */
export function ProtocolActionsRow({ hearing, onChanged }: ProtocolActionsRowProps) {
  const { t } = useTranslation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [finalizeJobId, setFinalizeJobId] = useState<string | null>(null);
  const job = useJob(finalizeJobId);
  const recording = hearing.status === "RECORDING";

  useEffect(() => {
    if (!recording) return;
    const clock = setInterval(() => setElapsedMs((ms) => ms + 1_000), 1_000);
    return () => clearInterval(clock);
  }, [recording]);

  // Real mic level meter (FR-04), same approach as `LiveHearingPanel` — falls
  // back to a simulated level if access is denied.
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
      stream?.getTracks().forEach((tr) => tr.stop());
      void ctx?.close();
    };
  }, [recording]);

  useEffect(() => {
    if (job?.status === "SUCCEEDED") {
      void transitionHearing(hearing.id, "READY_FOR_REVIEW").then(() => {
        setFinalizeJobId(null);
        onChanged();
      });
    }
  }, [job?.status, hearing.id, onChanged]);

  async function transition(to: Parameters<typeof transitionHearing>[1]) {
    try {
      await transitionHearing(hearing.id, to);
      onChanged();
    } catch {
      notify.error(t("errors.genericTitle"));
    }
  }

  async function stopAndFinalize() {
    setElapsedMs(0);
    await transition("FINALIZING");
    await transitionHearing(hearing.id, "PROCESSING");
    onChanged();
    const started = await startJob("final_transcription", 5_000);
    setFinalizeJobId(started.id);
  }

  function handleUpload(files: File[]) {
    const file = files[0];
    setUploadOpen(false);
    if (file) notify.success(t("protocolWorkspace.uploadReceived", { name: file.name }));
  }

  const durationMs = hearing.audioDurationMs || elapsedMs;
  const busy = hearing.status === "FINALIZING" || hearing.status === "PROCESSING";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="size-4" />
          {t("protocolWorkspace.uploadAudio")}
        </Button>

        {(hearing.status === "CREATED" || hearing.status === "DEVICE_CHECK") && (
          <Button size="sm" onClick={() => transition("RECORDING")}>
            <Mic className="size-4" />
            {t("protocolWorkspace.startRecording")}
          </Button>
        )}
        {recording && (
          <>
            <Button variant="outline" size="sm" onClick={() => transition("PAUSED")}>
              <Pause className="size-4" />
              {t("protocolWorkspace.pauseRecording")}
            </Button>
            <Button variant="destructive" size="sm" onClick={stopAndFinalize}>
              <Square className="size-4" />
              {t("protocolWorkspace.stopRecording")}
            </Button>
          </>
        )}
        {hearing.status === "PAUSED" && (
          <>
            <Button size="sm" onClick={() => transition("RECORDING")}>
              <Play className="size-4" />
              {t("hearing.resume")}
            </Button>
            <Button variant="destructive" size="sm" onClick={stopAndFinalize}>
              <Square className="size-4" />
              {t("protocolWorkspace.stopRecording")}
            </Button>
          </>
        )}

        <RecordStateBadge kind="hearing" status={hearing.status} />

        <span className="ml-auto flex items-center gap-2 font-mono text-sm tabular-nums text-muted-foreground">
          <span className="text-xs text-muted-foreground">{t("protocolWorkspace.duration")}</span>
          <Timestamp ms={durationMs} />
        </span>
      </div>

      {recording && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("hearing.inputLevel")}</span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-success" style={{ width: `${level}%` }} />
          </div>
        </div>
      )}

      {busy && <Progress value={job?.progress ?? 5} />}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("protocolWorkspace.uploadAudio")}</DialogTitle>
            <DialogDescription>{t("protocolWorkspace.uploadHint")}</DialogDescription>
          </DialogHeader>
          <FileDropzone
            label={t("protocolWorkspace.uploadAudio")}
            hint={t("protocolWorkspace.uploadHint")}
            accept="audio/*"
            multiple={false}
            onFiles={handleUpload}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
