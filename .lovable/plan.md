## Wire the investor pitch video

Update `src/components/landing/InvestorFundingSection.tsx`:

- Set `INVESTOR_VIDEO_EMBED_URL = "https://www.youtube.com/embed/BiLrthGn_UE"` so the existing iframe renders the video in place of the "coming soon" placeholder.
- Keep the 16:9 `aspect-video` container (YouTube Shorts will letterbox inside it, which is the standard behavior for embedded shorts and keeps the section layout intact on mobile and desktop).
- No other changes — CTAs, form, disclaimer, and styling stay as-is.

No backend, schema, or routing changes.