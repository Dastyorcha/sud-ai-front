# Phase 05 — Audio Capture Pipeline

**Duration:** Week 4, days 1–3
**Spec refs:** FR-04, §9.3, §9.4, §9.5, NFR-02, D-07
**Prerequisites:** Phase 02 (env, contracts)

**Goal:** a proven, standalone audio pipeline producing exactly the format §9.4 demands, resilient to device changes and network loss.

> **This is the highest technical risk in the frontend.** It is built and proven in isolation on a dedicated spike page *before* any UI depends on it. Do not build this inside the live hearing screen.

---

## Step 5.1 — Permission and device management

### Permission-first flow

Explain **before** triggering the browser prompt:

```text
┌────────────────────────────────────────────┐
│  Mikrofonga ruxsat kerak                   │
│                                            │
│  Sud majlisi audiosini yozib olish uchun   │
│  brauzerdan mikrofonga ruxsat soʻraladi.   │
│  Audio faqat shu majlis uchun ishlatiladi. │
│                                            │
│              [ Ruxsat berish ]             │
└────────────────────────────────────────────┘
```

A permission prompt that appears without context gets denied, and a denied microphone permission in Chrome is genuinely awkward to reverse.

### Three states, handled explicitly

| State | UI |
|---|---|
| `prompt` | The explanation panel above |
| `granted` | Device selector + level meter |
| `denied` | Chrome-specific recovery steps with the padlock-icon path, plus the audio-upload fallback (Step 5.6) |

### Device change detection

Listen to `navigator.mediaDevices.devicechange`. If the **active** device disappears mid-hearing:

1. Pause capture immediately
2. Show a blocking dialog — recording state is preserved, nothing is lost
3. Offer device reselection
4. Resume with sequence continuity intact

**Recording never silently continues on a different microphone.** A courtroom where someone unplugs a USB mic and the system quietly switches to the laptop's built-in array produces an unusable record and nobody notices until the final transcript. §16.6 requires "audio device oʻzgarishini qayta aniqlash" for exactly this reason.

---

## Step 5.2 — Capture graph

```text
getUserMedia({
  audio: {
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  }
})
  → MediaStreamAudioSourceNode
  ├→ AnalyserNode          (level meter only — never in the data path)
  └→ AudioWorkletNode      (pcm-encoder)
       → postMessage(Int16Array)
```

### Why the three processing flags are off

`echoCancellation`, `noiseSuppression` and `autoGainControl` are tuned for one-person voice calls. In a courtroom they actively cause harm:

- **AGC** normalises volume differences between speakers, which is exactly the signal diarization uses to separate them
- **Noise suppression** aggressively gates quiet speech — a witness speaking softly gets clipped
- **Echo cancellation** assumes a single near-field speaker and attenuates overlapping voices

§9.6 Variant B depends on post-processing diarization quality. Turning these on would degrade it measurably.

The analyser is on a parallel branch, never in the path to the worklet — the level meter must never be able to affect the recorded data.

---

## Step 5.3 — PCM encoder worklet (`public/worklets/pcm-encoder.js`)

Not bundled. Loaded via `audioContext.audioWorklet.addModule('/worklets/pcm-encoder.js')`.

Responsibilities:

1. Receive Float32 frames at the context sample rate (typically 48 000 Hz)
2. Low-pass filter, then decimate to 24 000 Hz
3. Convert to Int16 little-endian with clamping
4. Accumulate to exactly `AUDIO_CHUNK_MS` worth of samples
5. `postMessage` the buffer

At 250ms and 24 kHz: **6 000 samples = 12 000 bytes per chunk.**

### Hard constraint: zero allocation inside `process()`

`process()` runs every 128 samples on the audio rendering thread — roughly 375 times per second at 48 kHz. Allocating there causes GC pauses that manifest as dropped audio. Pre-allocate all buffers in the constructor and use ring-buffer indices.

Resampling quality matters: naive decimation without a low-pass introduces aliasing that degrades WER. A simple FIR low-pass at the 12 kHz Nyquist limit is sufficient and cheap.

---

## Step 5.4 — Chunk manager (`src/features/audio/chunk-manager.ts`)

Sits between the worklet and the WebSocket. Owns sequencing and durability.

```ts
interface AudioChunk {
  sequence: number;        // monotonic from 0, never reset within a hearing
  timestampMs: number;     // ms since session start
  payloadBase64: string;   // §9.4 format
  byteLength: number;
}
```

Responsibilities:

- Assign `sequence` and `timestamp_ms`
- Base64-encode for the `audio.chunk` message
- Maintain an in-memory ring buffer of **unacknowledged** chunks, capped at `MAX_BUFFERED_CHUNKS`
- Spill overflow to **IndexedDB** (store `lexkotib-audio`, key `${hearingId}:${sequence}`) per §9.5
- On `ack` with `last_ack_sequence`, release everything at or below it
- Expose `pendingCount`, `droppedCount`, `bytesBuffered`, `oldestPendingMs` for the UI

At 12 000 bytes per chunk, `MAX_BUFFERED_CHUNKS = 2400` is ~28 MB in memory for 10 minutes of offline capacity. Beyond that, IndexedDB. A hearing must survive a network outage without losing audio — NFR-02 states original audio loss is a "juda yuqori" impact risk (§26).

### Replay on reconnect

The manager exposes `replayFrom(sequence)` returning an async iterator that reads memory first, then IndexedDB, in strict sequence order. Phase 06 consumes this.

---

## Step 5.5 — Level meter and mute detection

- RMS computed from the analyser at 20fps via `requestAnimationFrame`
- Rendered as a segmented bar, not a smooth gradient — segments make "is it moving?" answerable at a glance from across a room
- **Silence detection:** RMS below threshold for 15 continuous seconds raises a non-blocking warning — *"Mikrofon ovozi eshitilmayapti. Qurilma oʻchirilgan boʻlishi mumkin."*

FR-04 requires "mute holatini aniqlash". A muted microphone at minute two, discovered at minute fifty, is a lost hearing.

---

## Step 5.6 — Audio file upload path

**This is a required demo fallback (§25 "live mikrofon ishlamasa audio fayl yuklash"), not a convenience feature.**

- Drag-and-drop plus file picker
- Accepts WAV, MP3, M4A; validates duration and size client-side
- Decodes with `AudioContext.decodeAudioData` to display duration and a waveform preview before upload
- Chunked upload with progress and resume
- Feeds the same finalize flow as a live hearing

Build it in this phase, not later. On demo day, if the courtroom microphone fails, this path is the entire product.

---

## Step 5.7 — Standalone spike page (`/dev/audio`)

Development builds only. This is where the pipeline is proven.

Contents:
- Device picker with live switching
- Level meter
- Live chunk counter, sequence number, bytes buffered
- IndexedDB spill indicator
- Local playback: decode the last 30 seconds back from stored PCM and play it — this proves the encoding is correct, not merely that bytes are flowing
- A downloadable WAV of the last 60 seconds for offline inspection

**Keep this page permanently.** When a Chrome update changes AudioWorklet behaviour in month four, this page is how you find out in ten minutes instead of two days.

---

## Files produced

```text
public/worklets/pcm-encoder.js
src/features/audio/chunk-manager.ts
src/features/audio/audio-capture.ts          # graph setup and lifecycle
src/features/audio/indexeddb-buffer.ts
src/features/audio/hooks/{useAudioDevices,useAudioCapture,useLevelMeter}.ts
src/features/audio/components/{DeviceSelector,LevelMeter,PermissionGate,AudioUpload}.tsx
src/app/(app)/dev/audio/page.tsx             # dev only
```

---

## Exit criteria

- [ ] 30 continuous minutes of capture with no memory growth (heap snapshot at 0, 15, 30 min)
- [ ] Zero dropped chunks over 30 minutes
- [ ] Sequence continuity preserved across a manual device switch
- [ ] Output verified as PCM s16le / 24 000 Hz / mono — downloaded WAV opens correctly in Audacity with the right sample rate
- [ ] Decoded playback of buffered PCM sounds correct, not pitch-shifted or aliased
- [ ] Denied permission shows recovery instructions and offers the upload path
- [ ] Device unplug pauses capture and prompts, rather than silently switching
- [ ] Silence for 15s raises the mute warning
- [ ] IndexedDB spill activates past the buffer cap and replays in correct order
- [ ] Audio file upload completes with progress and produces a playable preview

---

## Notes for the implementer

Two failure modes account for most of the pain in this phase.

**Pitch-shifted playback** means your resampling is wrong — usually decimating from 48 kHz to 24 kHz by taking every other sample without accounting for the actual context rate, which is not guaranteed to be 48 kHz. Read `audioContext.sampleRate` and compute the ratio; never hardcode it.

**Gradual memory growth** means the ring buffer is not actually releasing acknowledged chunks, usually because base64 strings are retained by a closure somewhere. Test with a 30-minute run and heap snapshots, not a 2-minute run where the leak is invisible.
