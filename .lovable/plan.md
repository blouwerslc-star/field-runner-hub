## Add autoplay explainer video to landing page

Place the 35s `reirunner-explainer.mp4` as a full-bleed intro modal that appears immediately on first visit to `/`, autoplays muted with captions, and can be dismissed.

### Steps

1. **Upload video to CDN**
   - Run `lovable-assets create --file /mnt/documents/reirunner-explainer.mp4` → write `src/assets/reirunner-explainer.mp4.asset.json`.

2. **New component** `src/components/landing/ExplainerVideoModal.tsx`
   - Fixed-position full-screen overlay (z-50, black backdrop).
   - Centered `<video>` (max 90vw / 90vh, 16:9), `autoPlay muted playsInline preload="auto"`, controls visible.
   - Top-right Close (X) button + "Skip intro" text button; Esc key also closes.
   - Auto-dismiss when the video ends (`onEnded`).
   - "Unmute" toggle button overlaid bottom-right (muted autoplay is required by browsers; user can opt in to sound).
   - Uses `sessionStorage` key `reirunner_explainer_seen` so it only shows once per session (not every navigation back to home).

3. **Wire into `src/routes/index.tsx`**
   - Add `const [showIntro, setShowIntro] = useState(false)`.
   - In a `useEffect`, check `sessionStorage`; if unseen, set `showIntro` true and mark seen.
   - Render `{showIntro && <ExplainerVideoModal onClose={() => setShowIntro(false)} />}` at the top of the returned JSX.

4. **Secondary entry point (keep video accessible after dismissal)**
   - Replace the existing hero "Watch demo" / `PlayCircle` button (already present in hero section) so clicking it re-opens the same modal via `setShowIntro(true)`.

### Notes / scope
- Muted autoplay only — no audio on first frame (browser policy). Captions are already burned into the rendered MP4, so the message lands without sound.
- No changes to the video itself, other routes, or SEO metadata.
- Session-scoped (not localStorage) so returning visitors in a new session see it again — matches "first thing that pops up" intent without being annoying within one session.
