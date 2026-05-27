## REI Runner Marketplace — Phased Buildout Plan

You sent a 12-phase brief. That's a multi-month build (auth, dashboards, Stripe Connect escrow, admin tools, notifications, blog, ratings, etc.). I will **not** try to ship all of it in one turn — that would produce a broken, unreviewable mess. Instead I'll break it into milestones we ship and validate one at a time.

Right now the live site is the marketing landing + two application forms (Runner / Investor) writing to Supabase + Google Sheets. That's working and running paid Facebook traffic. The next responsible step is to add the **account layer** underneath it, not to jump straight to Stripe Connect.

---

### What I propose to build first (Milestone 1 — Accounts & Two-Sided Entry)

This is the foundation everything else in your brief depends on. Roughly 1 build session.

1. **Auth** — email/password + Google sign-in via Lovable Cloud. Adds `/login` and `/signup`.
2. **Profiles + roles** — `profiles` table, `user_roles` table (`runner` | `investor` | `admin`), trigger to auto-create profile on signup. Role chosen on signup ("I'm a Runner" / "I'm an Investor").
3. **Homepage two-path CTA** — keep existing landing, but make the primary choice "I'm a Runner" vs "I'm an Investor" route into the signup flow (which then routes into onboarding, which is your existing application forms but tied to the logged-in user).
4. **Account shell** — `/dashboard` route that redirects to `/dashboard/runner` or `/dashboard/investor` based on role. Both initially show a "You're on the founding waitlist — here's your status" placeholder. This lets us start collecting real accounts without faking a working marketplace.
5. **Existing application forms** — wired to the logged-in user so submissions populate `profiles` instead of being anonymous rows.

### Milestone 2 — Tasks (manual marketplace)
- `tasks` table (address, type, instructions, due date, payout, status)
- Investor dashboard: post a task, view own tasks
- Runner dashboard: browse open tasks in their city, accept, upload deliverables (Supabase Storage)
- Investor approves submission → task marked complete
- No money movement yet — payout is tracked as a number only

### Milestone 3 — Admin
- `/admin` route gated by `admin` role
- Approve runners, view all users/tasks, manually assign runners, basic metrics

### Milestone 4 — Payments (Stripe Connect escrow)
- Stripe Connect Express onboarding for runners
- Investor pays on task post → funds held → released on approval, 20% platform fee
- This is its own large milestone; I'll re-plan it when we get here

### Milestone 5 — Notifications
- Transactional email via Lovable Email (Resend under the hood) for: task posted, accepted, submitted, approved, paid
- SMS via Twilio later

### Milestone 6+ — Trust/safety, ratings, blog, content
- Ratings, reviews, ID verification, ToS/ICA/Investor Terms pages, blog

---

### Things I will NOT do from your brief, and why

- **"Use Next.js / Vercel"** — this project is already on TanStack Start + Lovable Cloud (Supabase). Migrating frameworks would throw away your live site, your Facebook ad landing page, your Google Sheets pipe, and your SEO work. The current stack supports everything in the brief.
- **Google Maps API, Twilio, Stripe Connect upfront** — these need your accounts/keys and real money flowing. We add them when the milestone calls for them, not as scaffolding.
- **Mobile apps (Phase 9)** — out of scope for web build. The Supabase backend is already mobile-ready when you want it.
- **Blog / content system (Phase 8)** — defer until accounts + tasks work. Easy to add later.

---

### Technical notes (skip if not technical)

- DB additions for Milestone 1: `profiles` (user_id FK to auth.users, full_name, phone, city, state, type), `user_roles` (user_id, role enum), `has_role()` security-definer function, RLS scoped to `auth.uid()` on profiles, RLS using `has_role()` on user_roles. Existing `field_runner_applications` and `real_estate_pro_applications` tables stay as-is and get an optional `user_id` column.
- Auth: Lovable Cloud email/password + Google. `configure_social_auth` with `["google"]` in the same turn. `attachSupabaseAuth` already wired in `src/start.ts`.
- New routes: `/login`, `/signup`, `/dashboard`, `/_authenticated/dashboard/runner`, `/_authenticated/dashboard/investor`. Logout from header when signed in.
- Existing `/apply` and `/investors` pages keep working for cold ad traffic that doesn't want an account yet. Form submission optionally links to the user if they happen to be logged in.

---

### What I need from you to start Milestone 1

Just a yes. Once approved I'll ship auth + roles + the two-path entry + dashboard shell in the next turn. Everything after that we plan milestone-by-milestone so you can review and course-correct.