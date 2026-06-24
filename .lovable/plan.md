## REI Runner Explainer Video — 30s, Tech Product aesthetic, AI VO + captions

A code-rendered MP4 built with Remotion. Frame-based motion, ElevenLabs voiceover, on-screen captions, persistent brand background. Final output saved to `/mnt/documents/reirunner-explainer.mp4` and surfaced via `<presentation-artifact>` for download.

### Creative direction

- **Aesthetic**: Tech Product — clean geometric sans, dark UI, crisp snappy motion, subtle grid background, single brand accent. Editorial pacing but punchy.
- **Palette**:
  - bg `#0A0A0B` (near-black)
  - surface `#14141A`
  - text `#FAFAFA`
  - muted `#6B7280`
  - accent `#F97316` (REI Runner orange, matches brand)
  - accent-2 `#22C55E` (proof / success states)
- **Type**: Inter Tight (display, 700/900) + Inter (body, 400/500), both via `@remotion/google-fonts`.
- **Motion system**: spring-in with `{damping: 22, stiffness: 180}` as default; accent hero springs `{damping: 14}`. Scene cuts use `wipe` / `slide` from `@remotion/transitions` (30-frame springs). Persistent grid + drifting accent orb across the full 30s.
- **Composition**: 1920x1080, 30fps, ~900 frames (30s).

### Script (VO + captions, ~30s)

1. **0–4s — Hook**: "Real estate moves fast. You can't be in every city."
2. **4–9s — Problem**: "Photos. Vacancy checks. Lockboxes. Contractor meetups. The deal won't wait."
3. **9–15s — Solution**: "REI Runner is the on-demand network of vetted local runners — anywhere in the U.S."
4. **15–22s — How it works**: "Post a task. A nearby runner claims it. Get geo-tagged proof in hours, not days."
5. **22–28s — Marketplace dual-side**: "Investors get eyes on the ground. Runners get flexible, well-paid local work."
6. **28–30s — Close**: "REI Runner. Boots on the ground, nationwide."

### Scenes

1. **Hook** (0–4s) — Massive kinetic type "REAL ESTATE / MOVES FAST" with character stagger over animated US map dot grid.
2. **Problem** (4–9s) — Four task chips (Photos / Vacancy / Lockbox / Meetup) stagger in around a ticking clock motif.
3. **Solution** (9–15s) — Logo lockup reveal + animated map of US with runner pins lighting up coast-to-coast.
4. **How It Works** (15–22s) — 3 numbered steps (Post → Claim → Proof) sliding horizontally with iconography; geo-tag pin lands with spring.
5. **Two-Sided Marketplace** (22–28s) — Split-screen Investor / Runner panels with mini stat cards.
6. **Close** (28–30s) — Brand wordmark with subtle scale + tagline "Boots on the ground, nationwide."

Persistent layers across all scenes: faint dot grid, drifting orange accent orb, subtle vignette.

### Voiceover & captions

- ElevenLabs TTS via the standard connector. Voice: **Brian (nPczCjzI2devNBz1zQrb)** — matches the founder name and project tone; confident, mid-pitched. Model `eleven_turbo_v2_5`, MP3 44.1k.
- Generate one MP3 per scene (request stitching with previous/next text) → write to `remotion/public/audio/voSceneN.mp3` → mount via `<Audio>` in each scene.
- Captions: hand-authored caption tracks per scene (word-level chunks driven by frame math) rendered bottom-center in Inter 500, with a subtle backdrop bar. No automated transcription needed since copy is authored.

### Technical approach

- Scaffold `remotion/` per the video-creator skill (bun init, install remotion + transitions + google-fonts + compositor binary fix, ffmpeg symlinks).
- File layout:
  ```
  remotion/
    src/
      index.ts
      Root.tsx
      MainVideo.tsx
      scenes/{Hook,Problem,Solution,HowItWorks,Marketplace,Close}.tsx
      components/{PersistentGrid,AccentOrb,Caption,TaskChip,MapDots,StepCard}.tsx
      captions/script.ts
    public/audio/voScene{1..6}.mp3
    scripts/render-remotion.mjs
    scripts/generate-vo.mjs   # calls ElevenLabs, writes MP3s to public/audio
  ```
- ElevenLabs key sourced from the standard connector (`ELEVENLABS_API_KEY`). If not already linked, link it before generating VO. Script reads from env at run time only — no key in source.
- Render via the programmatic script (`chromeMode: "chrome-for-testing"`, `muted: false` since we need audio, concurrency 1, no `backdropFilter`).
- Output: `/mnt/documents/reirunner-explainer.mp4`, then post `<presentation-artifact>` for download.

### Build steps

1. Connect ElevenLabs (if not already) via `standard_connectors--connect`.
2. Scaffold `remotion/` directory, install deps, fix compositor + ffmpeg.
3. Write `scripts/generate-vo.mjs`, run it to produce 6 MP3s under `public/audio/`.
4. Build scene components, persistent layers, MainVideo composition (900 frames @ 30fps, 1920x1080).
5. Spot-check key frames with `bunx remotion still` (frames 30, 150, 360, 600, 800).
6. Render full MP4 to `/mnt/documents/reirunner-explainer.mp4`.
7. Verify file exists, post artifact tag.

### Out of scope

- No interactive UI, CTAs, or web embed component (this is a downloadable MP4).
- No background music track (VO + designed silence). Can add later if requested.
- No multi-language captions.
- Won't modify any app routes or business logic.
