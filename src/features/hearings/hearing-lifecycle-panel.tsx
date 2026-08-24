import { useEffect, useRef, useState } from "react";
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
 * →stop→`Finalizing`, then uploads the browser's actual MediaRecorder output
 * and queues final STT. Manual WAV/MP3/WebM upload remains as a recovery path.
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
  const [hasAudio, setHasAudio] = useState(Boolean(hearing.hasAudio));
  const [jobId, setJobId] = useState<string | null>(hearing.transcriptionJobId ?? null);
  const [transcribing, setTranscribing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef(0);
  const completedJobRef = useRef<string | null>(null);
  const startMutation = useStartHearing();
  const stopMutation = useStopHearing();
  const { job, isSucceeded, isFailed } = useJobPolling(jobId);

  const recording = hearing.status === "Recording";
  const canStart = hearing.status === "Created" || hearing.status === "DeviceCheck";
  const canUpload = hearing.status === "Finalizing" || hearing.status === "Failed";
  const canTranscribe = canUpload && hasAudio && !jobId;

  useEffect(() => {
    if (hearing.hasAudio) setHasAudio(true);
    if (hearing.transcriptionJobId) setJobId(hearing.transcriptionJobId);
  }, [hearing.hasAudio, hearing.transcriptionJobId]);

  useEffect(() => {
    if (!isSucceeded || !jobId || completedJobRef.current === jobId) return;
    completedJobRef.current = jobId;
    onTranscribed?.();
  }, [isSucceeded, jobId, onTranscribed]);

  useEffect(() => {
    if (!recording) return;
    const clock = setInterval(() => setElapsedMs((ms) => ms + 1_000), 1_000);
    return () => clearInterval(clock);
  }, [recording]);

  useEffect(() => {
    return () => {
      releaseMicrophone();
    };
  }, []);

  function releaseMicrophone() {
    cancelAnimationFrame(animationFrameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setLevel(0);
  }

  async function prepareRecorder(): Promise<MediaRecorder> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("Bu brauzer mikrofon orqali audio yozishni qo‘llamaydi.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    streamRef.current = stream;

    const mimeType = ["audio/webm;codecs=opus", "audio/webm"].find((candidate) =>
      MediaRecorder.isTypeSupported(candidate)
    );
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    });

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);
    const tick = () => {
      analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (const value of buffer) sum += value * value;
      setLevel(Math.min(100, Math.sqrt(sum / buffer.length) * 400));
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    animationFrameRef.current = requestAnimationFrame(tick);
    return recorder;
  }

  function finishRecording(): Promise<File | null> {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);

    return new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          const contentType = recorder.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: contentType });
          recorderRef.current = null;
          chunksRef.current = [];
          releaseMicrophone();
          resolve(
            blob.size > 0
              ? new File([blob], `lexkotib-hearing-${hearing.id}.webm`, { type: contentType })
              : null
          );
        },
        { once: true }
      );
      recorder.stop();
    });
  }

  async function start() {
    try {
      const recorder = await prepareRecorder();
      const updated = await startMutation.mutateAsync(hearing.id);
      recorder.start(1_000);
      onHearingChanged(updated);
    } catch (error) {
      releaseMicrophone();
      if (error instanceof DOMException || error instanceof Error) {
        notify.error(error.message || "Mikrofonga ruxsat berilmadi.");
      }
    }
  }

  async function confirmStop() {
    setStopOpen(false);
    try {
      const recordedFile = await finishRecording();
      const updated = await stopMutation.mutateAsync(hearing.id);
      onHearingChanged(updated);
      if (recordedFile) {
        const validationError = validateAudioFile(recordedFile);
        if (validationError) throw new Error(t(errorMessageKey(validationError)));
        setUploading(true);
        await uploadAudio(hearing.id, recordedFile);
        setUploadedFileName(recordedFile.name);
        setHasAudio(true);
        notify.success(t("hearing.uploaded"));

        setTranscribing(true);
        const accepted = await transcribeHearing(hearing.id);
        setJobId(accepted.jobId);
        notify.success(t("hearing.transcriptionQueued"));
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t("hearing.transcriptionFailed"));
    } finally {
      setUploading(false);
      setTranscribing(false);
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

      {(canUpload || hearing.status === "Processing") && !isSucceeded && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <h3 className="text-sm font-medium text-foreground">{t("hearing.uploadAudioTitle")}</h3>
            {canUpload && (
              <FileDropzone
                onFiles={handleFiles}
                accept=".wav,.mp3,.m4a,.webm"
                multiple={false}
                disabled={uploading}
                label={uploading ? t("hearing.uploading") : t("hearing.chooseFile")}
                hint={t("hearing.uploadAudioDesc")}
              />
            )}
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
