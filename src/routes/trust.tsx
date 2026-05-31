import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  ShieldCheck,
  BadgeCheck,
  FileText,
  Lock,
  Camera,
  AlertTriangle,
  HeartHandshake,
  Scale,
  Eye,
  KeyRound,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/trust")({
  component: TrustPage,
  head: () => ({
    meta: [
      { title: "Trust & Safety — REI Runner" },
      {
        name: "description",
        content:
          "How REI Runner screens runners, protects investor properties, handles disputes, and keeps every task safe and accountable.",
      },
      { property: "og:title", content: "Trust & Safety — REI Runner" },
      {
        property: "og:description",
        content:
          "Runner screening, property access standards, incident reporting, dispute resolution, and the policies that protect every job.",
      },
      { property: "og:url", content: "https://reirunner.com/trust" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/trust" }],
  }),
});

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Vetted Runners",
    body: "Every runner is reviewed by the REI Runner team before onboarding. Identity verification and optional background checks unlock higher-trust task tiers.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    body: "Investors fund tasks up front through our regulated US payments partner. Runners are paid only after deliverables are approved.",
  },
  {
    icon: Eye,
    title: "Documented Tasks",
    body: "Every task captures timestamped photos, notes, and a clear deliverable trail — so both sides have a record of what happened on-site.",
  },
  {
    icon: HeartHandshake,
    title: "Real Human Support",
    body: "A US-based team monitors disputes, safety reports, and incident escalations. We respond — we don't auto-resolve through a bot.",
  },
];

const SCREENING = [
  { title: "Application Review", body: "Every applicant is screened before being invited to onboard. We review experience, transportation, market coverage, and conduct red flags." },
  { title: "Identity Verification", body: "Approved runners can complete government-ID verification to unlock more tasks and earn a verified badge on their profile." },
  { title: "Background Check Option", body: "Optional third-party background checks are available for runners pursuing higher-trust tiers (lockbox installs, occupied property access, etc.)." },
  { title: "Independent Contractor Agreement", body: "Every runner signs a written IC agreement before working — covering scope of work, conduct, data handling, and indemnification." },
  { title: "Performance Tracking", body: "Ratings, approval rates, response times, and dispute history are tracked. Runners who fall below quality thresholds are removed from the marketplace." },
];

const ACCESS_RULES = [
  "Runners may only access properties when explicitly authorized by the posting investor.",
  "Runners must never enter an occupied property without confirmed tenant permission.",
  "Lockbox codes are delivered task-by-task and expire after the task is completed.",
  "Runners must follow posted instructions, local laws, and any property-specific rules.",
  "All on-site photos and notes are tied to the runner's account and uploaded through the platform — never sent over personal channels.",
];

const RESTRICTIONS = [
  "Enter occupied properties without authorization",
  "Negotiate contracts on behalf of investors",
  "Provide legal, real estate, or financial advice",
  "Perform licensed inspections or appraisals",
  "Misrepresent themselves as agents, brokers, or inspectors",
  "Share lockbox codes, addresses, or investor details outside the platform",
];

const COMMUNITY = [
  "Treat investors, runners, and support staff with respect at all times.",
  "Show up when you accept a task. Communicate early if plans change.",
  "Document the work honestly — no staged or misleading photos.",
  "Protect private information. Never share addresses, codes, or owner details outside REI Runner.",
  "Report any safety concern or rule violation through the in-app report flow.",
];

const INCIDENT_STEPS = [
  { n: "01", title: "Report it in-app", body: "Use the Report a Problem flow on the task or profile. For emergencies, always call 911 first." },
  { n: "02", title: "We investigate", body: "Our support team reviews submissions, attachments, message history, and platform records within 1 business day." },
  { n: "03", title: "We act", body: "Outcomes range from a coaching warning to refunds, payout holds, profile suspension, or permanent removal from the marketplace." },
  { n: "04", title: "You're updated", body: "Both parties receive a written outcome and next steps. Serious incidents are escalated to law enforcement when appropriate." },
];

function TrustPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/trust" className="text-foreground">Trust & Safety</Link>
            <Link to="/story" className="hover:text-foreground">Our Story</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          </nav>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative border-b border-border/60">
        <div aria-hidden className="absolute inset-0 -z-10 bg-hero opacity-60" />
        <div className="mx-auto max-w-5xl px-5 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Trust & Safety Center
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
            Built on accountability, <span className="text-gradient">not anonymity</span>.
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground md:text-lg">
            REI Runner is a marketplace, not an open gig board. Here's how we screen runners, protect your properties, and handle every situation that comes up on a task.
          </p>
        </div>
      </section>

      {/* PILLARS */}
      <Section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <p.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <SectionHeading icon={BadgeCheck} eyebrow="Runner Screening" title="How we vet every runner" />
      <Section>
        <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {SCREENING.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card/60 p-6">
              <div className="text-xs font-mono text-primary mb-2">STEP {String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <SectionHeading icon={KeyRound} eyebrow="Property Access" title="Property access & lockbox standards" />
      <Section>
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card/60 p-6 md:p-8">
          <ul className="space-y-3">
            {ACCESS_RULES.map((r) => (
              <li key={r} className="flex gap-3 text-sm md:text-base">
                <ShieldCheck className="size-5 text-primary mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <SectionHeading icon={HeartHandshake} eyebrow="Community Guidelines" title="What we expect from everyone on the platform" />
      <Section>
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card/60 p-6 md:p-8">
          <ul className="space-y-3">
            {COMMUNITY.map((r) => (
              <li key={r} className="flex gap-3 text-sm md:text-base">
                <BadgeCheck className="size-5 text-primary mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <SectionHeading icon={AlertTriangle} eyebrow="Out of Scope" title="What runners may not do" />
      <Section>
        <div className="max-w-3xl mx-auto rounded-2xl border border-destructive/30 bg-destructive/5 p-6 md:p-8">
          <ul className="space-y-3">
            {RESTRICTIONS.map((r) => (
              <li key={r} className="flex gap-3 text-sm md:text-base">
                <span className="mt-1 size-4 rounded-full border border-destructive/60 text-destructive grid place-items-center text-[10px] shrink-0">✕</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <SectionHeading icon={Scale} eyebrow="Incident & Dispute Resolution" title="If something goes wrong on a task" />
      <Section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {INCIDENT_STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card/60 p-6">
              <div className="text-xs font-mono text-primary mb-3">STEP {s.n}</div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          For emergencies or threats to safety, always call 911 first. Then report the incident through REI Runner so we can preserve records and follow up.
        </p>
      </Section>

      <SectionHeading icon={FileText} eyebrow="Contractor Status" title="Independent contractor disclosure" />
      <Section>
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-muted/20 p-6 md:p-8 text-sm md:text-base text-muted-foreground leading-relaxed">
          Runners on REI Runner are independent contractors — not employees of REI Runner. Runners control their own schedule, accept tasks at their discretion, and use their own vehicle and equipment. Each runner signs a written IC agreement before performing any task on the platform.
          <br /><br />
          REI Runner is not a real estate brokerage, inspection company, appraisal company, property management company, or legal service. Runners perform non-licensed field tasks only.
        </div>
      </Section>

      <SectionHeading icon={Camera} eyebrow="Privacy" title="How we handle your data" />
      <Section>
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card/60 p-6 md:p-8 text-sm md:text-base text-muted-foreground leading-relaxed space-y-3">
          <p>
            Investor property addresses are shared only with the runner assigned to a specific task — never broadcast to the network. Lockbox codes are delivered just-in-time and expire on completion.
          </p>
          <p>
            Runner identity, background-check details, and payout information are never shown to investors. Only public profile fields (name, city/state, services, reviews) are surfaced on profiles.
          </p>
          <p>
            Read our full <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </Section>

      {/* CONTACT */}
      <section className="border-t border-border/60 bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Report a safety concern</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            If you've experienced or witnessed something on REI Runner that violates our policies, please report it. We read every message.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:safety@reirunner.com" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-gradient-primary shadow-glow text-sm font-medium text-primary-foreground">
              <Mail className="size-4" /> safety@reirunner.com
            </a>
            <a href="tel:+18338734786" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md border border-border bg-card/60 text-sm font-medium hover:bg-card transition">
              <Phone className="size-4 text-primary" /> (833) 873-RUNR
            </a>
          </div>
          <div className="mt-8 text-xs text-muted-foreground">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowRight className="size-3 rotate-180" /> Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-7xl px-5 py-10 md:py-14">{children}</section>;
}
function SectionHeading({ icon: Icon, eyebrow, title }: { icon: any; eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-6 md:pt-10 text-center">
      <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
        <Icon className="size-3.5" /> {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl md:text-4xl font-bold">{title}</h2>
    </div>
  );
}