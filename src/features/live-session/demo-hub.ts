import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { DEMO_TRANSCRIPT_HUB_PATH, env } from "@/shared/config/env";
import type { SegmentStatus } from "@/shared/types/enums";

/**
 * SignalR demo transcript hub (integration guide §14) — connection lifecycle
 * only; `use-demo-hub.ts` owns React state. LongPolling is mandatory: the
 * backend's JWT handler doesn't read the WS `access_token` query param yet
 * (§17), so `.withUrl` is pinned to `HttpTransportType.LongPolling`.
 */

const RECEIVE_EVENT = "TranscriptSegmentReceived";
const PUBLISH_METHOD = "PublishMockSegment";

/** Segment pushed by the hub — a narrower shape than the REST `TranscriptSegment`. */
export interface DemoTranscriptSegment {
  id: string;
  hearingId: string;
  sequenceNo: number;
  startMs: number;
  endMs: number;
  speakerLabel: string | null;
  rawText: string;
  normalizedText: string;
  confidence: number | null;
  status: SegmentStatus;
  createdAt: string;
}

/** `PublishMockSegment` command — the demo control that echoes to every
 * connection on the hearing. */
export interface PublishMockSegmentCommand {
  sequenceNo: number;
  startMs: number;
  endMs: number;
  speakerLabel: string;
  text: string;
  confidence: number;
}

export { HubConnectionState };
export type { HubConnection };

/** Builds (but doesn't start) a connection scoped to one hearing. Reads the
 * live access token on every negotiate/poll so a token refresh mid-session
 * keeps LongPolling authorized. */
export function buildDemoHubConnection(hearingId: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(
      `${env.hubOrigin}${DEMO_TRANSCRIPT_HUB_PATH}?hearingId=${encodeURIComponent(hearingId)}`,
      {
        transport: HttpTransportType.LongPolling,
      }
    )
    .withAutomaticReconnect()
    .build();
}

export function startDemoHubConnection(connection: HubConnection): Promise<void> {
  return connection.start();
}

export function stopDemoHubConnection(connection: HubConnection): Promise<void> {
  return connection.stop();
}

export function onTranscriptSegmentReceived(
  connection: HubConnection,
  handler: (segment: DemoTranscriptSegment) => void
): void {
  connection.on(RECEIVE_EVENT, handler);
}

export function offTranscriptSegmentReceived(
  connection: HubConnection,
  handler: (segment: DemoTranscriptSegment) => void
): void {
  connection.off(RECEIVE_EVENT, handler);
}

export function publishMockSegment(
  connection: HubConnection,
  command: PublishMockSegmentCommand
): Promise<void> {
  return connection.invoke(PUBLISH_METHOD, command);
}

/** `UPPER_SNAKE` code pattern the demo hub's `HubException` messages use. */
const HUB_ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Best-effort extraction of a stable error code from a thrown SignalR
 * `HubException`/transport error — the client only ever sees `Error.message`,
 * sometimes prefixed with a generic ".NET exception" description. Falls back
 * to `undefined` (→ `unknown` in the error map) for anything unrecognized.
 */
export function hubErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const trimmed = error.message.replace(/^.*Exception:\s*/i, "").trim();
  try {
    const parsed = JSON.parse(trimmed) as { code?: string };
    if (typeof parsed.code === "string") return parsed.code;
  } catch {
    // Not JSON — fall through to the raw-code check below.
  }
  return HUB_ERROR_CODE_PATTERN.test(trimmed) ? trimmed : undefined;
}
