import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { StatusBadge, type StatusBadgeProps } from "@/shared/custom/status-badge";
import type { DocumentStatus, HearingStatus, JobStatus, SegmentStatus } from "@/shared/types/enums";

type Tone = NonNullable<StatusBadgeProps["tone"]>;

/**
 * One mapping table per status enum, so a given status can never render with a
 * different colour on two screens (spec §16, FR-11). `seal`/record-critical
 * states map to `destructive`, verified/approved to `success`, in-flight to
 * `info`/`warning`.
 */
const DOCUMENT_TONES: Record<DocumentStatus, Tone> = {
  DRAFT: "neutral",
  AI_GENERATED: "info",
  UNDER_REVIEW: "warning",
  CHANGES_REQUESTED: "destructive",
  APPROVED: "success",
  EXPORTED: "primary",
  ARCHIVED: "neutral",
  // Real API values (guide §12) — additive, see `shared/types/enums.ts`.
  Draft: "neutral",
  UnderReview: "warning",
  ChangesRequested: "destructive",
  Approved: "success",
  Exported: "primary",
};

const SEGMENT_TONES: Record<SegmentStatus, Tone> = {
  INTERIM: "neutral",
  FINAL: "info",
  EDITED: "warning",
  VERIFIED: "success",
  // Real API values (guide §10) — additive, see `shared/types/enums.ts`.
  Raw: "neutral",
  Normalized: "info",
  HumanEdited: "warning",
  Canonical: "success",
};

const HEARING_TONES: Record<HearingStatus, Tone> = {
  CREATED: "neutral",
  DEVICE_CHECK: "info",
  RECORDING: "destructive",
  PAUSED: "warning",
  FINALIZING: "info",
  PROCESSING: "info",
  READY_FOR_REVIEW: "primary",
  APPROVED: "success",
  FAILED: "destructive",
  // Real API values (guide §9/§10) — additive, see `shared/types/enums.ts`.
  Created: "neutral",
  DeviceCheck: "info",
  Recording: "destructive",
  Paused: "warning",
  Finalizing: "info",
  Processing: "info",
  Failed: "destructive",
  ReadyForReview: "primary",
  Approved: "success",
};

const JOB_TONES: Record<JobStatus, Tone> = {
  QUEUED: "neutral",
  RUNNING: "info",
  SUCCEEDED: "success",
  FAILED: "destructive",
};

export type RecordStateBadgeProps =
  | { kind: "document"; status: DocumentStatus; className?: string }
  | { kind: "segment"; status: SegmentStatus; className?: string }
  | { kind: "hearing"; status: HearingStatus; className?: string }
  | { kind: "job"; status: JobStatus; className?: string };

function resolve(props: RecordStateBadgeProps): { tone: Tone; key: MessageKey } {
  switch (props.kind) {
    case "document":
      return { tone: DOCUMENT_TONES[props.status], key: `enums.documentStatus.${props.status}` };
    case "segment":
      return { tone: SEGMENT_TONES[props.status], key: `enums.segmentStatus.${props.status}` };
    case "hearing":
      return { tone: HEARING_TONES[props.status], key: `enums.hearingStatus.${props.status}` };
    case "job":
      return { tone: JOB_TONES[props.status], key: `enums.jobStatus.${props.status}` };
  }
}

/**
 * The single badge for every record status in the product (document, segment,
 * hearing, job). Resolves the localized label via the `enums.*` message tree.
 */
export function RecordStateBadge(props: RecordStateBadgeProps) {
  const { t } = useTranslation();
  const { tone, key } = resolve(props);
  return <StatusBadge tone={tone} label={t(key)} className={props.className} />;
}
