# Mockup 05 — Protocol tab: audio + transcript workspace

- **Status:** idea
- **Size:** large
- **Author model:** Fable 5 (planner)

## Goal

The "Sud majlisi bayonnomasi" tab per mockup: action row (upload audio, live record with timer, status badge, duration), an audio player bar (play, waveform with progress, current/total time, speed select 0.5x–2x), and a two-panel workspace — speakers panel (colored dots, name, role) beside a searchable, speaker-filterable, editable transcript — ending with a "Rasmiy bayonnoma yaratish" generate bar.

## Scope & non-goals

- **In scope:** recomposing phase-05 (audio capture), phase-06 (live hearing), phase-07 (transcript editor) UI into this exact layout; waveform as static bars + progress overlay; mock playback clock.
- **Out of scope:** real ASR/streaming (existing mocks stay), protocol document generation logic (phase-09 — the button routes/hands off to it).

## Affected files

| Path (FSD layer)                     | New? | Intent                                        |
| ------------------------------------ | ---- | --------------------------------------------- |
| `src/widgets/protocol-workspace/`    | yes  | tab module: actions + player + panels (lazy)  |
| `src/widgets/audio-player-bar/`      | yes  | waveform bar player (reuse phase-05 hooks)    |
| `src/widgets/speakers-panel/`        | ?    | speaker list with color dots (reuse phase-07 pieces) |
| `src/features/transcript/`           | no   | search + speaker-filter selectors             |
| existing transcript editor files     | no   | restyle rows: time, speaker tag, editable text |

## Steps

1. [ ] Actions row: upload/record buttons wired to phase-05 capture, status badge, timer — `feat: protocol actions row`
2. [ ] Audio player bar: play toggle, mock progress clock, waveform bars + progress fill, speed select — `feat: audio player bar with waveform`
3. [ ] Speakers panel with speaker-color tokens; transcript restyled to mockup rows — `feat: speakers panel and transcript restyle`
4. [ ] Transcript search + speaker filter — `feat: transcript search and speaker filter`
5. [ ] Generate bar (FPK 273 note + gold CTA → phase-09 protocol editor) — `feat: protocol generate bar`
6. [ ] i18n + codemap sync — `docs: sync codemap`

## Risks / ripple / escalation

- Reworks phase-06/07 widget layouts — keep hooks/services untouched; escalate if editor state contracts must change.
- `contenteditable` in mockup → keep existing controlled editor approach instead.
- New dependency: none (no wavesurfer — static bars suffice for demo; ask user if real waveform is wanted).

## Verification

- Record flow shows timer; play advances progress + highlights; search/filter narrow rows; edits persist in state; light + dark.
