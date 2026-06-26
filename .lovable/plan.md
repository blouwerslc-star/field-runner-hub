## Connect Wefunder to the investor section

Add the Wefunder campaign (`https://wefunder.com/rei.runner.4`) as the primary public investment path in the homepage investor section, while keeping the existing interest form for direct/accredited conversations.

### What the user will see

In `src/components/landing/InvestorFundingSection.tsx`:

1. **New primary CTA — "Invest on Wefunder"**
   - Added as the first button in the CTA row (currently: Watch Video, Request Deck, Schedule Call).
   - Opens `https://wefunder.com/rei.runner.4` in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).
   - Styled as the prominent action; existing buttons remain as secondary options.

2. **New Wefunder callout card** (between the CTAs and the Problem/Solution/Opportunity cards):
   - Short headline: "Now raising on Wefunder"
   - One-line subtext explaining Wefunder hosts the regulated offering and handles all investment paperwork and compliance.
   - Secondary "View Campaign" link → same Wefunder URL, new tab.
   - Visually distinct (bordered card, Rocket/ExternalLink icon) so it reads as the official channel.

3. **Disclaimer update**
   - Append one sentence to the existing legal disclaimer clarifying that any actual investment is processed through Wefunder under its Reg CF/Reg D framework, not through this site.
   - The "no payment/checkout on this site" rule stays — all transactions stay on Wefunder.

4. **Form framing tweak**
   - Add a small helper line above the Investor Interest Form: "Prefer to invest directly? Use the Wefunder link above. Use this form for accredited conversations, partnership inquiries, or to request the deck."
   - No field changes, no backend changes.

### Constants

- Add `const WEFUNDER_URL = "https://wefunder.com/rei.runner.4";` at the top of the file alongside `INVESTOR_VIDEO_EMBED_URL` so the URL is easy to update later.

### Out of scope

- No new route, no embedded Wefunder iframe (Wefunder doesn't support reliable embeds and it would hurt page performance / trust signals).
- No backend, schema, server-function, or routing changes.
- No edits to other pages (header, footer, /investors route) in this pass — can be a follow-up if you want the Wefunder link surfaced site-wide.
