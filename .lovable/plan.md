# Admin Ops Cockpit — Phased Plan

This is a very large request (12 priorities, dozens of pages). Shipping it all in one batch would be unsafe — too many simultaneous changes to admin queues, broadcasts, RLS-sensitive surfaces, and routing. I'll split into phases and confirm scope before starting.

## Phase 1 — Foundation (recommended first ship)
The pieces that unblock everything else and fix the "blank dashboard" complaint.

1. **Role-based dashboard routing (P1)**
   - `/dashboard` already routes by role, but admins fall through to runner — fix to send admins to `/admin`.
   - `BrandLogo` link + mobile Home nav → role-aware destination (new `useRoleHome()` hook).
2. **Admin nav entry (P2)**
   - Add an "Admin" dropdown/section in `DashboardShell` (desktop + mobile sheet + bottom nav) visible only when `has_role(admin)`. Quick links to all 8 admin pages.
3. **Upgraded `/admin` dashboard (P3)**
   - New server fn `getAdminOverview` returning KPI counts + queue previews (pending approvals, verifications, BG checks, disputes, unassigned tasks, failed emails 24h).
   - KPI grid, queue panels with "Review" deep-links, quick-action buttons, last-refreshed timestamp + manual refresh.
4. **Useful empty states (P4)** on `/admin/verifications`, `/admin/runner-approvals`, `/admin/background-checks` — counts by status, last-checked time, next-action links.
5. **Hide desktop Back button noise (P11)** on list/dashboard pages.

## Phase 2 — Marketplace Health + Analytics depth (P5, P6)
Expand `/admin/marketplace-health` with funnel / supply / demand / risk sections, and `/admin/analytics` with the requested funnels and trend charts + date range filters.

## Phase 3 — Queue page upgrades (P7)
Search, status tabs w/ counts, sort, richer applicant context, confirmation modals on approve/reject/pass/fail.

## Phase 4 — Broadcasts safety (P8)
Email masking + reveal, dedupe, bounced/suppressed/unsubscribed filtering, test-send, recipient preview, bulk-send confirmation, audit log.

## Phase 5 — Email Monitor + Messages polish (P9, P10)

## Phase 6 — Admin permissions + audit logs (P12)
New `admin_audit_log` table, granular permission helpers (`has_admin_permission`), audit writes on PII reveal, broadcast send, decisions, payouts, role changes.

---

## Technical notes

- All new server fns go in `src/lib/admin.functions.ts` (or new `ops.functions.ts` additions) using `requireSupabaseAuth` + `has_role('admin')` check, never `supabaseAdmin` from client-reachable code.
- Audit log table (Phase 6) needs a migration with GRANTs + RLS (admin-read only, service_role write).
- No existing routes removed; no data migrations destructive.
- Honest zero-states everywhere — no fabricated metrics.

---

## Question

This is roughly 2–4 days of work end-to-end. **Which phase should I ship first?**

My recommendation: **Phase 1 only this turn** — it fixes the most visible problems (blank admin dashboard, missing admin nav, weak `/admin` page, noisy empty states) without touching broadcasts/RLS/audit surfaces where mistakes are costly. Then we iterate.

Reply with: "Phase 1", "Phases 1+2", "all of it", or specify which priorities matter most.
