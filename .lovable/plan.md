# First Task Free Promotional Campaign

A $50 (configurable) credit for new investors, auto-applied at task funding, with eligibility guards, an admin console, and analytics.

## 1. Database (single migration)

**`promo_campaigns`** — admin-configurable campaigns (so the amount changes without code).
- `id`, `code` (unique, default `first_task_free`), `name`, `enabled` (bool), `credit_cents` (int, default 5000), `expires_at` (nullable), `legal_disclaimer` (text), `created_at`, `updated_at`.
- Seed one row: `first_task_free`, enabled, 5000.

**`promo_credits`** — per-investor ledger (one row per redemption attempt).
- `id`, `campaign_id`, `user_id` (unique with campaign_id), `email`, `email_norm` (lowercased+trimmed, unique with campaign_id), `payment_fingerprint` (Stripe PaymentMethod fingerprint, nullable, unique with campaign_id when set), `signup_ip` (nullable), `status` (`available` | `reserved` | `redeemed` | `void`), `credit_cents` (snapshot of campaign amount at issuance), `remaining_cents`, `task_id` (nullable), `payment_id` (nullable), `issued_at`, `redeemed_at`.
- Issued automatically by a trigger on `profiles` insert when the user has the `investor` role and campaign is enabled — wrapped so it never blocks signup on conflict.

**`promo_events`** — analytics event log.
- `id`, `event_type` (`banner_view` | `banner_click` | `signup` | `first_task_created` | `credit_redeemed` | `repeat_task`), `user_id` (nullable), `campaign_id`, `metadata` jsonb, `created_at`.
- Indexed on `(campaign_id, event_type, created_at)`.

All three tables: standard `GRANT`s, RLS on, policies:
- `promo_campaigns`: anon + authenticated SELECT (public read of enabled campaigns only); admin full.
- `promo_credits`: user SELECT own row; admin full.
- `promo_events`: anon + authenticated INSERT (rate-limited via existing `check_rate_limit`); admin SELECT.

## 2. Server functions (`src/lib/promo.functions.ts`)

- `getActivePromoCampaign()` — public, returns enabled `first_task_free` campaign or null.
- `getMyPromoCredit()` — authenticated, returns the caller's credit row + remaining.
- `recordPromoEvent({ eventType, metadata })` — public, rate-limited (`promo_event:<ip>` 60/min).
- `getPromoAnalytics()` — admin, aggregates events: views, clicks, signups, first tasks, redemptions, total cost, downstream revenue, repeat-task rate.
- `exportPromoAnalyticsCsv()` — admin, returns CSV string.
- `updatePromoCampaign({ enabled, creditCents, expiresAt, legalDisclaimer })` — admin only.

## 3. Eligibility + duplicate-redemption guard

Centralized in `evaluatePromoEligibility(userId)` (server helper):
1. Active campaign exists and not expired.
2. User has `investor` role.
3. User has a `promo_credits` row with `status='available'` and `remaining_cents > 0`.
4. No prior completed task by this user (`tasks` count where `status in ('approved','paid','completed')`).
5. Email_norm not already redeemed by another `user_id` (cross-account email dedupe).
6. On checkout: Stripe PaymentMethod fingerprint not already used by another redemption.

If any check fails, the credit silently does not apply (no error to user unless they explicitly tried to redeem).

## 4. Checkout integration (`src/lib/payments.functions.ts`)

Modify `createTaskFundingCheckout`:
- Before creating the Stripe Checkout Session, call `evaluatePromoEligibility`.
- If eligible, compute `appliedCents = min(remaining_cents, taskCostCents)`.
- Apply as a Stripe Coupon (one-time `amount_off` in cents) attached to the session, OR as `discounts: [{ coupon }]` created on the fly.
- Mark credit `status='reserved'`, store `task_id` and intended applied amount.
- On webhook `checkout.session.completed`: capture PaymentMethod fingerprint into `promo_credits.payment_fingerprint`. If fingerprint collides with another redemption, void this credit and refund the discount differential (edge case, log to admin).
- On task `approved`/`paid` (already triggers existing flows): mark credit `status='redeemed'`, decrement `remaining_cents`, insert `credit_redeemed` event.

Return DTO adds `{ promoApplied: { cents, remaining } | null }` so the UI can show the breakdown.

## 5. UI

**Homepage banner** (`src/components/landing/FirstTaskFreeBanner.tsx`)
- Premium promotional banner above the fold (gradient using existing primary tokens, ShieldCheck/Gift icon).
- Headline "We'll Fund Your First Task", subheadline with dynamic `$X` from campaign.
- Primary CTA "Post Your First Task" → `/signup?role=investor&promo=first_task_free`.
- Secondary CTA "Learn How It Works" → `/#how-it-works`.
- Legal disclaimer line.
- Fires `banner_view` on mount (IntersectionObserver, once per session) and `banner_click` on CTA.

**Investor dashboard promo card** (`src/components/dashboard/investor/PromoCreditCard.tsx`)
- Badge: "🎉 $X First Task Credit Available" when `status='available'`.
- Shows remaining balance if partially used.
- Hidden when redeemed/void or campaign disabled.
- "Post Your First Task" → existing post-task wizard.
- Mounted at the top of the investor dashboard.

**Checkout** (`src/components/payments/TaskFundingCheckout.tsx`)
- Above the Stripe embed, render a breakdown when promo applies:
  ```
  Task cost          $XX.XX
  Promo credit       -$XX.XX
  Amount due         $XX.XX
  ```

**Admin page** (`src/routes/_authenticated/admin.promotions.tsx`)
- Toggle enable/disable.
- Number input for credit amount (validated 0–500 USD).
- Optional expiration date picker.
- Editable legal disclaimer textarea.
- Analytics summary cards (views, clicks, signups, first tasks, redemptions, cost, revenue, repeat rate).
- "Export CSV" button.
- Linked from existing admin settings nav.

## 6. Analytics wiring

- Banner view/click: from `FirstTaskFreeBanner`.
- Signup: existing signup flow calls `recordPromoEvent('signup', { source })` when `promo=first_task_free` query param present.
- First task created: hooked in `createTask` server fn when investor has no prior tasks.
- Credit redeemed: from payments flow above.
- Repeat task: hooked in `createTask` when investor previously redeemed and this is task #2+.
- Revenue generated: derived in `getPromoAnalytics` by summing `payments.amount_cents` for redeemers' tasks beyond the first.

## 7. Legal

Disclaimer string lives on the campaign row (editable by admin). Default:
> "Offer valid for new investor accounts only. Maximum promotional value of $50. REI Runner reserves the right to modify or discontinue this promotion at any time."

Rendered under the banner, on the dashboard card, and in the checkout breakdown.

## Files

**New**
- `supabase/migrations/<ts>_promo_campaign.sql`
- `src/lib/promo.functions.ts`
- `src/lib/promo.server.ts` (eligibility + Stripe coupon helper)
- `src/components/landing/FirstTaskFreeBanner.tsx`
- `src/components/dashboard/investor/PromoCreditCard.tsx`
- `src/routes/_authenticated/admin.promotions.tsx`

**Edited**
- `src/routes/index.tsx` — mount banner.
- `src/routes/_authenticated/dashboard.investor.tsx` (or current investor dashboard route) — mount promo card.
- `src/lib/payments.functions.ts` — apply promo in checkout, finalize on success.
- `src/routes/api/public/payments/webhook.ts` — capture payment fingerprint, finalize redemption.
- `src/lib/tasks.functions.ts` — fire `first_task_created` / `repeat_task` events.
- `src/routes/signup.tsx` — record `signup` event when `promo` query present.
- Admin nav (settings sidebar) — link to `/admin/promotions`.

## Out of scope
- Multi-campaign stacking (campaign explicitly cannot combine with other discounts).
- Per-market or per-task-type variants (campaign is global; structure allows adding later via `promo_campaigns.rules` jsonb if needed).