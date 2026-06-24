## Tighten pacing — remove silence gaps between scenes

The current `reirunner-explainer.mp4` has noticeable dead air between scenes because each scene's duration was padded around the raw VO MP3, which includes leading/trailing silence plus a fixed buffer. We'll measure and trim that silence, then re-render.

### Steps

1. **Detect actual speech bounds per VO clip**
   - For each `remotion/public/audio/voScene{1..6}.mp3`, run `ffmpeg -af silencedetect=noise=-35dB:d=0.15` to find `silence_start` / `silence_end` near the head and tail.
   - Compute trimmed start/end offsets per clip (effective speech window).

2. **Re-encode trimmed VO files**
   - Write `voScene{N}.trimmed.mp3` for each scene with leading/trailing silence stripped via ffmpeg `atrim` + `asetpts` (or `-ss`/`-to`). Keep originals as reference.

3. **Recompute scene durations in `remotion/src/captions/script.ts`**
   - For each scene set `durationInFrames = ceil((trimmedAudioSeconds + 0.25s tail pad) * 30)`.
   - The 0.25s tail pad gives the last word room to land before the next scene's VO starts — much tighter than the current ~1s+ gaps.
   - Update total composition `durationInFrames` in `MainVideo.tsx`/`Root.tsx` accordingly.

4. **Point scene audio to trimmed files**
   - Update the audio `src` in each scene (or in `script.ts` if centralized) to reference the new `*.trimmed.mp3`.
   - Re-sync caption timing arrays inside each scene to the new trimmed timeline (shift cue start frames by the removed leading silence).

5. **Re-render**
   - `cd remotion && node scripts/render-remotion.mjs` → outputs to `/mnt/documents/reirunner-explainer.mp4` (overwrite).
   - Spot-check with `ffprobe` for new total duration (~26–28s expected, down from 34.7s).

6. **No frontend changes**
   - The inline `<video>` on the landing page references the CDN asset by `asset_id`. Since the asset is immutable, we'll re-upload the new MP4 with `lovable-assets create` and overwrite `src/assets/reirunner-explainer.mp4.asset.json` with the new pointer. The landing page picks it up automatically.
   - Delete the old CDN asset via `assets--delete_asset` only after confirming the new one renders on the page.

### Notes / scope
- Trimming silence only — script, voice, visuals, captions wording all unchanged.
- Silence threshold `-35dB` / 150ms is conservative; if it clips speech we'll loosen to `-40dB` / 100ms.
- Tail pad is 0.25s per scene (was effectively 1s+); transition cross-fade frames stay as-is so cuts remain smooth.
