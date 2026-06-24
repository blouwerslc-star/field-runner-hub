import type { LandingExample } from "@/components/landing/ServiceExamplePopover";

/** How It Works steps — keyed by step number "01"…"04". */
export const HOW_IT_WORKS_EXAMPLES: Record<string, LandingExample> = {
  "01": {
    eyebrow: "Step 1",
    title: "Investor Posts a Task",
    body: "An out-of-state investor needs exterior + interior photos of a $185k rental in Memphis before making an offer.",
    bullets: [
      "Picks Property Photos template",
      "Drops in address + lockbox code",
      "Sets payout: $75 / due in 48 hrs",
    ],
    footer: "~90 seconds to post",
  },
  "02": {
    eyebrow: "Step 2",
    title: "Local Runner Accepts",
    body: "A vetted runner 12 minutes from the property gets a push notification and claims the task.",
    bullets: [
      "Sees full task scope before accepting",
      "Confirms drive time and access window",
      "Task locks to that runner",
    ],
    footer: "Usually claimed in under an hour",
  },
  "03": {
    eyebrow: "Step 3",
    title: "Runner Completes & Uploads",
    body: "Runner drives out, captures the photo set, and uploads everything from the app on-site.",
    bullets: [
      "Geofence confirms on-site arrival",
      "20+ geotagged photos uploaded",
      "Short condition note submitted",
    ],
    footer: "30–45 min on-site",
  },
  "04": {
    eyebrow: "Step 4",
    title: "Runner Gets Paid",
    body: "Investor reviews the deliverables in their dashboard and approves. Payout is released.",
    bullets: [
      "Approval triggers payout",
      "No invoices, no chasing",
      "Funds land in runner's payout account",
    ],
    footer: "Per-task payment",
  },
};

/** Payment Flow steps — keyed by step "01"…"04". */
export const PAYMENT_FLOW_EXAMPLES: Record<string, LandingExample> = {
  "01": {
    eyebrow: "Funding",
    title: "Investor funds the task",
    body: "Investor sets a $75 payout for a Memphis photo task and funds it through our payments partner before it goes live.",
    bullets: [
      "Funds captured up front",
      "Runners only see funded tasks",
      "No unfunded ghost jobs",
    ],
  },
  "02": {
    eyebrow: "Acceptance",
    title: "Runner accepts & completes",
    body: "A local runner claims the task, drives to the property, and uploads photos directly from the app.",
    bullets: [
      "Live tracking on accepted tasks",
      "Deliverables uploaded in-app",
      "Submitted for investor review",
    ],
  },
  "03": {
    eyebrow: "Review",
    title: "Investor reviews",
    body: "Investor opens the deliverables in their dashboard and approves, requests fixes, or messages the runner.",
    bullets: [
      "Side-by-side photo viewer",
      "Request fix → runner is notified",
      "Approve → triggers payout",
    ],
  },
  "04": {
    eyebrow: "Payout",
    title: "Runner gets paid",
    body: "Once the investor approves, the payout is released to the runner's connected payout account.",
    bullets: [
      "No invoices or net-30",
      "Runner sees status in real time",
      "Tax docs auto-generated yearly",
    ],
  },
};

/** Trust badges — keyed by label. */
export const TRUST_BADGE_EXAMPLES: Record<string, LandingExample> = {
  "ID Verification Available": {
    eyebrow: "Trust",
    title: "ID Verification Available",
    body: "Approved runners can complete a government-ID verification step during onboarding to unlock more tasks.",
    bullets: [
      "Document + selfie match",
      "Verified badge on runner profile",
      "Required for higher-tier tasks",
    ],
  },
  "Secure Payment Processing": {
    eyebrow: "Trust",
    title: "Secure Payment Processing",
    body: "Payments are processed through a regulated US payments partner — never directly between investors and runners.",
    bullets: [
      "PCI-compliant payment partner",
      "Funds captured up front",
      "Disputes handled by platform",
    ],
  },
  "Background Check Option": {
    eyebrow: "Trust",
    title: "Background Check Option",
    body: "Runners pursuing higher-trust task tiers (interior access, occupied properties) can opt into a background check.",
    bullets: [
      "Optional, runner-paid or task-tier gated",
      "Verified through a 3rd-party provider",
      "Badge shown on runner profile",
    ],
  },
  "Signed IC Agreement": {
    eyebrow: "Trust",
    title: "Signed IC Agreement",
    body: "Every runner signs an independent-contractor agreement before accepting their first task.",
    bullets: [
      "Defines scope and conduct",
      "Confirms IC status (not an employee)",
      "On file for every active runner",
    ],
  },
  "US-Registered Business": {
    eyebrow: "Trust",
    title: "US-Registered Business",
    body: "REI Runner is operated by B&K Investment Group LLC, a US-registered company with US-based support.",
    bullets: [
      "US legal entity",
      "US-based support team",
      "Investor + runner agreements under US law",
    ],
  },
};

/** Vetting steps — keyed by title. */
export const VETTING_STEP_EXAMPLES: Record<string, LandingExample> = {
  "Application Review": {
    eyebrow: "Vetting",
    title: "Application Review",
    body: "Every applicant is screened by the REI Runner team — we check location, equipment, availability, and references before inviting them to onboard.",
    bullets: [
      "Phone or smartphone with camera",
      "Reliable transportation",
      "Service area coverage",
    ],
  },
  "Identity Verification Available": {
    eyebrow: "Vetting",
    title: "Identity Verification",
    body: "Approved runners complete a document + selfie ID check to confirm they are who they say they are.",
    bullets: [
      "Government-issued photo ID",
      "Liveness check selfie",
      "Unlocks more task tiers",
    ],
  },
  "In-App Onboarding": {
    eyebrow: "Vetting",
    title: "In-App Onboarding",
    body: "Before their first task, runners walk through deliverable standards, conduct rules, and a short quiz inside the app.",
    bullets: [
      "Deliverable quality examples",
      "On-site conduct rules",
      "Quick comprehension check",
    ],
  },
  "Performance Tracking": {
    eyebrow: "Vetting",
    title: "Performance Tracking",
    body: "Ratings, response times, and approval rates are tracked per runner. Underperformers are warned, then removed.",
    bullets: [
      "Investor ratings after every task",
      "Approval-rate threshold",
      "Repeat issues = removed",
    ],
  },
};