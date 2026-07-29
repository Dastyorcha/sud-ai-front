import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDemoHubConnection,
  hubErrorCode,
  offTranscriptSegmentReceived,
  onTranscriptSegmentReceived,
  publishMockSegment,
  startDemoHubConnection,
  stopDemoHubConnection,
  HubConnectionState,
  type DemoTranscriptSegment,
  type HubConnection,
  type PublishMockSegmentCommand,
} from "@/features/live-session/demo-hub";
import { errorMessageKey } from "@/shared/lib/errors/error-map";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";

export interface UseDemoHubResult {
  /** Mirrors `HubConnection.state` — drives the connection status UI. */
  state: HubConnectionState;
  /** Segments received via `TranscriptSegmentReceived`, in arrival order. */
  segments: DemoTranscriptSegment[];
  /** Invokes `PublishMockSegment`; no-ops (and surfaces nothing) if not connected. */
  publish: (command: PublishMockSegmentCommand) => Promise<void>;
}

/**
 * Owns the demo transcript hub connection for one hearing (integration guide
 * §14). Starts on mount when `hearingId` is present, stops on unmount/hearing
 * change; every hub/transport error is mapped via the shared error map and
 * surfaced as a toast — never `alert`/`confirm`.
 */
export function useDemoHub(hearingId: string | null): UseDemoHubResult {
  const { t } = useTranslation();
  const [state, setState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
  const [segments, setSegments] = useState<DemoTranscriptSegment[]>([]);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!hearingId) {
      setState(HubConnectionState.Disconnected);
      setSegments([]);
      return;
    }

    setSegments([]);
    setState(HubConnectionState.Connecting);

    const connection = buildDemoHubConnection(hearingId);
    connectionRef.current = connection;

    const syncState = () => setState(connection.state);
    const handleSegment = (segment: DemoTranscriptSegment) => {
      setSegments((prev) => [...prev, segment]);
    };

    onTranscriptSegmentReceived(connection, handleSegment);
    connection.onreconnecting(syncState);
    connection.onreconnected(syncState);
    connection.onclose(syncState);

    void startDemoHubConnection(connection)
      .then(syncState)
      .catch((error: unknown) => {
        syncState();
        notify.error(t(errorMessageKey(hubErrorCode(error))));
      });

    return () => {
      offTranscriptSegmentReceived(connection, handleSegment);
      void stopDemoHubConnection(connection);
      connectionRef.current = null;
    };
  }, [hearingId, t]);

  const publish = useCallback(
    async (command: PublishMockSegmentCommand) => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) return;
      try {
        await publishMockSegment(connection, command);
      } catch (error) {
        notify.error(t(errorMessageKey(hubErrorCode(error))));
      }
    },
    [t]
  );

  return { state, segments, publish };
}
