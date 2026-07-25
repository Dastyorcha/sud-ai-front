# Phase 06 — Live Hearing Screen

**Duration:** Week 4 day 4 — Week 5
**Spec refs:** FR-03, FR-05, §9.4, §9.5, §16.2, UC-02, AC-01, AC-02, NFR-03
**Prerequisites:** Phase 05 (audio pipeline proven), Phase 04 (hearing setup)

**Goal:** AC-01 and AC-02 satisfied — 30 minutes of uninterrupted live transcript, and a forced disconnection fully recovered with zero lost audio.

---

## Step 6.1 — WebSocket protocol types (`src/lib/ws/protocol.ts`)

Discriminated unions matching §9.4 exactly, in both directions.

```ts
export type ClientMessage =
  | { type: 'audio.session.start'; hearing_id: string; codec: 'pcm_s16le';
      sample_rate: 24000; channels: 1; resume?: boolean }
  | { type: 'audio.chunk'; sequence: number; timestamp_ms: number; payload_base64: string }
  | { type: 'audio.session.stop' };

export type ServerMessage =
  | { type: 'transcript.interim'; segment_key: string; text: string;
      start_ms: number; end_ms: number }
  | { type: 'transcript.final'; segment_id: string; speaker_label: string | null;
      text: string; start_ms: number; end_ms: number; confidence: number }
  | { type: 'session.warning'; code: string; message: string }
  | { type: 'ack'; last_ack_sequence: number };
```

Every inbound message is Zod-parsed. **An unrecognised `type` is logged and ignored, never thrown** — a backend adding a message type must not crash a live hearing in progress.

`ack` is not in §9.4's listed examples but §9.5 requires `last_ack_sequence`. Handle it both as a standalone message and as a field on other messages (see the Phase 02 deferred-decisions table).

---

## Step 6.2 — Socket manager (`src/lib/ws/socket-manager.ts`)

An explicit state machine. Not a hook, not a component — a plain class instantiated once per hearing.

```text
IDLE ──→ CONNECTING ──→ OPEN ──→ STREAMING ──→ STOPPING ──→ CLOSED
              ↑            │         │  ↕
              └── RECONNECTING ←─────┘  PAUSED
```

### Reconnection

- Exponential backoff: 0.5s, 1s, 2s, 4s, 8s, capped at 10s
- **Unlimited attempts while a hearing is active.** A hearing does not stop because the network did.
- On reconnect: send `audio.session.start` with `resume: true`, await `last_ack_sequence`, then replay via `chunkManager.replayFrom(lastAck + 1)` in strict order
- Server deduplicates by `hearing_id + sequence` (§9.5), so replaying an already-received chunk is safe

### Heartbeat

Ping every 15s. No pong within 10s → treat as dead, force reconnect. TCP will not tell you about a silently dropped connection in time; a courtroom wifi dropout can look "connected" for minutes.

### Placement

**The socket never lives inside a React component.** Components subscribe to the store. A component remount must not tear down a live connection, and React strict-mode double-mounting in development must not open two sockets.

---

## Step 6.3 — Live session store (Zustand)

Four slices in one store:

```ts
interface LiveSessionState {
  connection: {
    state: SocketState;
    latencyMs: number | null;
    reconnectCount: number;
    droppedChunks: number;
    lastAckSequence: number;
  };
  session: {
    hearingId: string | null;
    status: HearingStatus;
    startedAt: number | null;
    elapsedMs: number;
    provider: { name: string; model: string } | null;
  };
  transcript: {
    finals: TranscriptSegment[];        // append-only array
    interims: Map<string, InterimSegment>;  // keyed by segment_key
  };
  warnings: SessionWarning[];
}
```

### The interim/final handoff — the detail that makes or breaks this screen

Interims live in a **Map keyed by `segment_key`**, not in the array.

When `transcript.final` arrives, delete the matching interim and append the final **in a single store update**. Two separate updates produce a frame where both exist or neither does — this is the duplicate-flash that makes naive live transcript UIs feel broken.

Interim updates arrive every ~300ms. Selectors must be granular: the finals list must not re-render when only an interim changes. Use `useShallow` and split selectors per concern.

---

## Step 6.4 — Screen layout

Implements the §16.2 wireframe precisely.

```text
┌────────────────────────────────────────────────────────────────┐
│ № 4-2101-2604/13 │ Sudya X │ 00:14:22 │ ● Yozilmoqda │ STT: ✓  │
├──────┬──────────────────┬──────────────────────────────────────┤
│      │ Ishtirokchilar   │ Jonli transkript                     │
│ s    │                  │                                      │
│ p    │ ● Sudya          │ [00:01:10] Sudya                     │
│ i    │ ● Kotib          │ Sud majlisi ochiq deb eʼlon qilinadi │
│ n    │ ● Daʼvogar vakili│                                      │
│ e    │ ○ Javobgar vakili│ [00:01:18] SPEAKER_02                │
│      │                  │ hurmatli sud, biz…      ← interim    │
├──────┴──────────────────┴──────────────────────────────────────┤
│ ▮▮▮▯ │ Pauza │ Toʻxtatish │ Ulanish: ✓ │ Yoʻqolgan: 0         │
└────────────────────────────────────────────────────────────────┘
```

- Header shows live elapsed time, recording indicator in `--seal`, connection state
- Participant rail marks present (●) and absent (○) from the roll call
- Footer carries the level meter, controls, connection state and dropped-chunk count

Every number in the footer is diagnostic. During a demo, a judge asking "is it actually working?" should be answerable by pointing at it.

---

## Step 6.5 — Live transcript rendering

- **Interim:** `--muted`, italic, no timestamp badge, no speaker chip
- **Final:** full `--ink`, Mono timestamp, `<SpeakerChip>`, 120ms settle transition (the first of the two permitted animations)
- **Scroll lock (FR-05):** auto-scroll to newest by default; scrolling up disengages it and shows a pill — *"Eng soʻnggisiga oʻtish (12 ta yangi)"*. Scrolling back to the bottom re-engages it.
- **Virtualization** above 200 segments via `@tanstack/react-virtual`. A three-hour hearing produces thousands of segments; unvirtualized rendering degrades well before that.

### Latency indicator (NFR-03)

Computed as `now − end_ms` of the most recent final segment, coloured against the specification's targets:

| Latency | Colour | Meaning |
|---|---|---|
| < 2.5s | `--attested` | Meets interim p95 target |
| 2.5–6s | `--caution` | Meets final p95 target |
| > 6s | `--seal` | Below target |

This makes NFR-03 continuously visible rather than something measured once in a report.

---

## Step 6.6 — Controls

| Control | Endpoint | Behaviour |
|---|---|---|
| Boshlash | `POST /hearings/{id}/start` | Opens socket, starts capture. Non-optimistic. |
| Pauza | `POST /hearings/{id}/pause` | Capture stops, socket stays open |
| Davom ettirish | `POST /hearings/{id}/resume` | Capture resumes, sequence continues |
| Toʻxtatish | `POST /hearings/{id}/stop` | Confirmation → flush buffer → close |

**Stop requires confirmation** and shows a progress dialog while the buffer flushes. A `beforeunload` handler fires if the tab is closed with unsent chunks pending.

All hearing state transitions are non-optimistic per the Phase 02 policy — the hearing's recorded state is a fact about a legal proceeding.

---

## Step 6.7 — Resilience UX (AC-02)

Four distinct states, each with its own treatment:

1. **Offline banner** — *"Ulanish yoʻq. Audio saqlanmoqda: 42 soniya."* Buffered-seconds counter updates live so the clerk knows nothing is being lost.
2. **Reconnecting toast** — attempt number and next retry countdown
3. **Recovery summary** — *"Ulanish tiklandi. 42 soniyalik audio qayta yuborildi."* Non-dismissable for 5 seconds; this is the message that builds trust.
4. **Discontinuity marker** — a hairline rule with a gap label rendered inline in the transcript where the backend reports a gap

The demo will include a deliberate disconnection. This UX *is* the AC-02 demonstration.

---

## Step 6.8 — `mock-ws` replay server

A standalone Node server (`mock-ws/`) using `ws`. It is both the development driver and the reference implementation of the §9.4 contract.

Behaviour:
- Replays the master fixture hearing with realistic timing — interim deltas every ~300ms, finals every 3–8s, confidence jitter, occasional speaker-label changes
- Acknowledges chunks and emits `ack` with `last_ack_sequence`
- Validates inbound messages against the contract and **logs violations loudly** — this catches frontend protocol bugs before the real backend does

CLI fault injection:

```bash
node mock-ws/server.ts \
  --drop-after=120        # kill the connection at 120s
  --latency=2500          # add 2.5s to final emission
  --warn=HIGH_LATENCY     # emit session.warning
  --jitter=0.3            # randomise timing
  --refuse-resume         # reject the resume handshake
```

Each flag maps to a real failure mode from §26's risk register. Phase 12's E2E suite drives them.

---

## Files produced

```text
src/lib/ws/protocol.ts
src/lib/ws/socket-manager.ts
src/features/live-session/stores/live-session-store.ts
src/features/live-session/hooks/{useLiveSession,useLiveTranscript,useConnectionState}.ts
src/features/live-session/screens/LiveHearingScreen.tsx
src/features/live-session/components/{LiveTranscript,InterimSegment,ParticipantRail,
                                      RecordingControls,ConnectionIndicator,
                                      LatencyIndicator,OfflineBanner,DiscontinuityMarker}.tsx
src/app/(app)/hearings/[hearingId]/live/page.tsx
src/app/(app)/hearings/[hearingId]/layout.tsx     # injects RecordSpine
mock-ws/{server.ts,scenarios/*.ts,package.json}
```

---

## Exit criteria

- [ ] **AC-01:** 30 minutes of continuous live transcript against `mock-ws`, no gaps, no duplicates
- [ ] **AC-02:** forced disconnect at minute 12 fully recovered, all buffered audio replayed, recovery summary shown
- [ ] Interim → final transition produces no visible duplicate or flash
- [ ] Scroll lock disengages on manual scroll and the jump pill shows an accurate new-segment count
- [ ] Latency indicator reflects the NFR-03 thresholds correctly
- [ ] 2 000 segments render at 60fps
- [ ] Closing the tab with pending chunks triggers the browser warning
- [ ] `mock-ws` logs a protocol violation when the client sends a malformed message
- [ ] All five `mock-ws` fault flags produce correct UI behaviour
- [ ] Socket survives a component remount and React strict-mode double-mount

---

## Notes for the implementer

The single most common way this screen goes wrong is putting the WebSocket inside a `useEffect`. In development, React strict mode mounts twice, so you open two sockets and receive every segment twice; developers then "fix" this with a deduplication filter, which masks the real bug and later drops legitimate repeated text.

Instantiate the socket manager outside React, subscribe from the store, and the entire class of problem disappears.

Second: measure the render cost early. An interim update arriving every 300ms that re-renders a 400-row list will not be noticeable at minute one and will be unusable at minute forty.
