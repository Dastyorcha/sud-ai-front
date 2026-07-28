import { useEffect, useState } from "react";
import { Mic, RotateCw, Square, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { FileDropzone } from "@/shared/components/ui/file-dropzone";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { useStartHearing, useStopHearing } from "@/features/hearings/use-hearings";
import {
  transcribeHearing,
  uploadAudio,
  validateAudioFile,
} from "@/features/hearings/hearing.service";
import { useJobPolling } from "@/shared/lib/query/use-job-polling";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";
import { errorMessageKey } from "@/shared/lib/errors/error-map";

export interface HearingLifecyclePanelProps {
  hearing: Hearing;
  /** Called with the fresh `Hearing` after start/stop (session-carry update). */
  onHearingChanged: (hearing: Hearing) => void;
  /** Called once transcription succeeds — load the transcript tab. */
  onTranscribed?: () => void;
}

/**
 * Real hearing lifecycle (integration guide §9): `Created`→start→`Recording`
 * →stop→`Finalizing`, then upload the audio recording. The mic level meter is
 * a real `getUserMedia`+`AnalyserNode` reading (kept from the original
 * mock-driven panel) — a visual aid only, it isn't what gets uploaded, since
 * there's no capture-to-file pipeline yet. The uploaded file is picked
 * manually and client-validated (extension/MIME/size) before
 * `POST /hearings/{id}/audio`.
 */
export function HearingLifecyclePanel({
  hearing,
  onHearingChanged,
  onTranscribed,
}: HearingLifecyclePanelProps) {
  const { t } = useTranslation();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [stopOpen, setStopOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const startMutation = useStartHearing();
  const stopMutation = useStopHearing();
  const { job, isSucceeded, isFailed } = useJobPolling(jobId);

  const recording = hearing.status === "Recording";
  const canStart = hearing.status === "Created" || hearing.status === "DeviceCheck";
  const canUpload = hearing.status === "Finalizing" || hearing.status === "Failed";
  const canTranscribe = canUpload && hasAudio && !jobId;

  useEffect(() => {
    if (isSucceeded) onTranscribed?.();
  }, [isSucceeded, onTranscribed]);

  useEffect(() => {
    if (!recording) return;
    const clock = setInterval(() => setElapsedMs((ms) => ms + 1_000), 1_000);
    return () => clearInterval(clock);
  }, [recording]);

  // Real microphone level meter (FR-04) — echo cancellation / noise
  // suppression / AGC off (courtroom audio, plan D-07). Falls back to a
  // simulated level if access is denied.
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

  async function start() {
    try {
      const updated = await startMutation.mutateAsync(hearing.id);
      onHearingChanged(updated);
    } catch {
      // Errors (incl. 409 INVALID_HEARING_TRANSITION) already toasted by useApiMutation.
    }
  }

  async function confirmStop() {
    setStopOpen(false);
    try {
      const updated = await stopMutation.mutateAsync(hearing.id);
      onHearingChanged(updated);
    } catch {
      // Errors already toasted by useApiMutation.
    }
  }

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    const validationError = validateAudioFile(file);
    if (validationError) {
      notify.error(t(errorMessageKey(validationError)));
      return;
    }
    setUploading(true);
    try {
      await uploadAudio(hearing.id, file);
      setUploadedFileName(file.name);
      setHasAudio(true);
      notify.success(t("hearing.uploaded"));
    } catch (error) {
      notify.error(t(errorMessageKey(error)));
    } finally {
      setUploading(false);
    }
  }

  async function queueTranscription() {
    setTranscribing(true);
    try {
      const accepted = await transcribeHearing(hearing.id);
      setJobId(accepted.jobId);
      notify.success(t("hearing.transcriptionQueued"));
    } catch (error) {
      notify.error(t(errorMessageKey(error)));
    } finally {
      setTranscribing(false);
    }
  }

  function retryTranscription() {
    setJobId(null);
    void queueTranscription();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <RecordStateBadge kind="hearing" status={hearing.status} />
        {recording && (
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            <Timestamp ms={elapsedMs} />
          </span>
        )}
        {canStart && (
          <Button onClick={start} disabled={startMutation.isPending}>
            <Mic className="size-4" />
            {t("hearing.start")}
          </Button>
        )}
        {recording && (
          <Button
            variant="destructive"
            onClick={() => setStopOpen(true)}
            disabled={stopMutation.isPending}
          >
            <Square className="size-4" />
            {t("hearing.stop")}
          </Button>
        )}
      </div>

      {recording && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("hearing.inputLevel")}</span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-success" style={{ width: `${level}%` }} />
          </div>
        </div>
      )}

      {canUpload && !isSucceeded && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <h3 className="text-sm font-medium text-foreground">{t("hearing.uploadAudioTitle")}</h3>
            <FileDropzone
              onFiles={handleFiles}
              accept=".wav,.mp3,.webm"
              multiple={false}
              disabled={uploading}
              label={uploading ? t("hearing.uploading") : t("hearing.chooseFile")}
              hint={t("hearing.uploadAudioDesc")}
            />
            {uploadedFileName && (
              <p className="text-sm text-success">
                {t("hearing.uploaded")}: {uploadedFileName}
              </p>
            )}

            {canTranscribe && (
              <Button onClick={queueTranscription} disabled={transcribing} className="self-start">
                <Wand2 className="size-4" />
                {t("hearing.queueTranscription")}
              </Button>
            )}

            {jobId && !isFailed && !isSucceeded && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{t("hearing.transcribing")}</p>
                <Progress value={job?.status === "Processing" ? 60 : 15} />
              </div>
            )}

            {isFailed && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-destructive">
                  {t("hearing.transcriptionFailed")}
                  {job?.errorMessageSafe ? `: ${job.errorMessageSafe}` : ""}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retryTranscription}
                  className="self-start"
                >
                  <RotateCw className="size-4" />
                  {t("hearing.retryTranscription")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
