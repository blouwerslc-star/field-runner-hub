## Embed explainer video at top of landing page

Replace the popup modal with an inline autoplaying hero video embedded directly into the landing page — first thing visitors see, no modal to dismiss.

### Steps

1. **Remove popup modal wiring in `src/routes/index.tsx`**
   - Delete the `showIntro` state, the `useEffect` that reads `sessionStorage`, and the `<ExplainerVideoModal />` render.
   - Delete the import of `ExplainerVideoModal`.
   - Delete the file `src/components/landing/ExplainerVideoModal.tsx` (no longer used).

2. **Add inline video hero section at the very top of `<main>` (above the existing hero)**
   - New full-width section directly under the sticky `<header>` nav, before the current hero block.
   - Contains a centered `<video>` element:
     - `src` = the uploaded CDN asset (`reirunner-explainer.mp4.asset.json`)
     - `autoPlay muted playsInline loop preload="auto" controls`
     - Responsive: `max-w-5xl mx-auto`, `aspect-video`, rounded corners, subtle border + glow matching existing card styling.
   - Small "Tap for sound" unmute button overlaid bottom-right (browsers block unmuted autoplay).
   - Section keeps the dark grid/orb background treatment used elsewhere so it blends as part of the page, not a popup.

3. **Replace the lower "Watch — What Is REI Runner?" placeholder tile (lines ~872–885)**
   - Since the video now lives at the top, remove that lower placeholder section entirely to avoid duplication. (Or, alternative: keep it but make it scroll back to the top video. Default = remove.)

### Notes / scope
- Muted autoplay only (browser policy). Captions are burned into the MP4 so the message lands silently.
- No modal, no skip button, no sessionStorage — purely inline content.
- Only `src/routes/index.tsx` is edited; `ExplainerVideoModal.tsx` is deleted. No other routes, no SEO/metadata changes.
