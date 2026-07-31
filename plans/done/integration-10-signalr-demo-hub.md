# Integration 10 — SignalR demo transcript hub

- **Status:** done
- **Size:** medium
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §14 (SignalR demo transcript hub), §17 (WS gap)

## Goal

Replace the scripted live-transcript feed with the real demo SignalR hub —
subscribe to `TranscriptSegmentReceived` and publish mock segments via
`PublishMockSegment`, over the LongPolling transport the backend currently
requires.

## Scope & non-goals

- **In scope:** `@microsoft/signalr` connection lifecycle, JWT via
  `accessTokenFactory`, LongPolling transport, receive + publish, error mapping,
  wiring into the existing live-session panel.
- **Out of scope:** real production audio streaming (no endpoint — §17); this hub
  is explicitly demo-only.

## Affected files

| Path (FSD layer)                                   | New? | Intent                                         |
| -------------------------------------------------- | ---- | ---------------------------------------------- |
| `src/features/live-session/demo-hub.ts`            | yes  | build/start/stop the SignalR connection        |
| `src/features/live-session/use-demo-hub.ts`        | yes  | connection state + received segments + publish |
| `src/features/live-session/live-hearing-panel.tsx` | no   | swap scripted feed for hub stream              |
| `src/shared/config/env.ts`                         | no   | expose hub path `/hubs/demo-transcript`        |
| `docs/codemap.md`, `docs/architecture.md`          | no   | document the realtime feature + dependency     |

## Design notes

- **Connection** (guide §14): URL
  `/hubs/demo-transcript?hearingId=<uuid>` (same-origin; dev proxy has `ws:true`
  and forwards `/hubs`). Build with `HubConnectionBuilder`,
  `accessTokenFactory: () => tokenStore.accessToken`,
  **`transport: HttpTransportType.LongPolling`** (mandatory — backend JWT handler
  doesn't read the WS `access_token` query param yet, §14/§17),
  `.withAutomaticReconnect()`.
- **Receive:** `connection.on("TranscriptSegmentReceived", segment => …)` →
  append to panel state. Segment shape: `{ id, hearingId, sequenceNo, startMs,
endMs, speakerLabel, rawText, normalizedText, confidence, status, createdAt }`.
- **Publish (demo control):** `connection.invoke("PublishMockSegment", command)`
  where command `{ sequenceNo, startMs, endMs, speakerLabel, text, confidence }`.
  All connections on the hearing receive the echo. Preconditions: hearing access,
  transcript unlocked, hearing has an audio track.
- **Lifecycle:** start on panel mount (when a `hearingId` is present), stop on
  unmount; reflect `connection.state` in the UI (connecting/connected/reconnecting/
  disconnected). Guard against dialogs — errors go to state/toast, not `alert`.
- **Errors** (guide §14): `HEARING_ID_REQUIRED`, `HEARING_NOT_FOUND`,
  `CASE_ACCESS_DENIED`, `DUPLICATE_TRANSCRIPT_SEQUENCE`, `AUDIO_TRACK_REQUIRED`,
  `TRANSCRIPT_LOCKED`, plus segment timing/confidence validation — map to localized
  messages via the shared error map (add hub codes).
- **Token expiry:** `accessTokenFactory` reads the live token from the store each
  request, so refresh (integration-03) keeps LongPolling authorized.

## Steps

1. [x] Install `@microsoft/signalr`; expose hub path in `env.ts` — `feat: add signalr dependency and hub path`
2. [x] Add `demo-hub.ts` (build/start/stop, LongPolling, accessTokenFactory) — `feat: signalr demo hub connection`
3. [x] Add `use-demo-hub.ts` (state + received segments + publish) — `feat: demo hub hook`
4. [x] Swap `live-hearing-panel` scripted feed for the hub stream + connection status — `feat: live panel over signalr`
5. [x] Add hub error codes to the error map (uz/en/ru) — `feat: signalr hub error copy`
6. [x] docs: sync `docs/codemap.md` + `docs/architecture.md` — `docs: document signalr demo hub`

## Risks / ripple / escalation

- New dependency: `@microsoft/signalr` (needs user approval).
- Must use LongPolling until the backend adds WS query-token support (§17) — do
  not switch to WebSockets.
- Isolated feature; the scripted feed can stay as a fallback behind a flag if the
  hub is unreachable in the demo.
- Rollback: revert the panel to the scripted feed; drop the dependency.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual: open a hearing with an audio track + unlocked transcript → connection
  reaches `Connected`; publish a mock segment → it appears in the panel;
  disconnect/reconnect handled; publishing on a locked transcript → localized
  `TRANSCRIPT_LOCKED`.
