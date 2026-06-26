import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Camera,
  MapPinned,
  ShieldCheck,
  Zap,
  Receipt,
  Users,
  Video,
  MapPin,
  ClipboardList,
  DollarSign,
  Lock,
  BadgeCheck,
  Scale,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Toaster } from "@/components/ui/sonner";
import { ProForm } from "@/components/landing/ApplicationForms";

export const Route = createFileRoute("/investors")({
  head: () => ({
    meta: [
      { title: "Hire Local Runners for Property Field Services — REI Runner" },
      {
        name: "description",
        content:
          "Hire vetted local runners for property preservation & inspection tasks — photos, video, drive-bys, vacancy checks, lockbox installs. Funds release only when you approve.",
      },
      { property: "og:title", content: "Hire Local Runners for Property Field Services — REI Runner" },
      {
        property: "og:description",
        content:
          "Nationwide boots-on-the-ground for real estate investors. Vetted runners, escrowed payouts, no platform fee on top of your task price.",
      },
      { property: "og:url", content: "https://reirunner.com/investors" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/investors" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "REI Runner — Real Estate Field Services for Investors",
          serviceType: "Real estate field services",
          provider: { "@id": "https://reirunner.com/#organization" },
          areaServed: "US",
          description:
            "On-demand network of local runners performing property photos, walkthrough videos, drive-bys, occupancy checks, lockbox placement, and other field tasks for real estate investors.",
          url: "https://reirunner.com/investors",
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: "20",
            highPrice: "300",
            offerCount: "6",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How are runners vetted?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Every runner completes an application review, signs an independent contractor agreement, and has ID verification available. Higher-tier tasks may require an additional background check.",
              },
            },
            {
              "@type": "Question",
              name: "How is my money protected?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "You fund the task up front through our payments processor. The payout is held until you review and approve the deliverables. If the work isn't right, our support team helps resolve it before funds release.",
              },
            },
            {
              "@type": "Question",
              name: "What does it cost?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "You set the task price. There is no platform fee added on top — the 20% platform fee comes out of the total, so 80% goes to the runner and 20% to REI Runner. What you post is what you pay.",
              },
            },
            {
              "@type": "Question",
              name: "Where does REI Runner work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "REI Runner is launching nationwide market-by-market. Priority cities include Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, and Chicago, with new markets onboarding every week.",
              },
            },
            {
              "@type": "Question",
              name: "What if the work isn't acceptable?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Open a dispute from the task. Funds stay held until it's resolved. Our team works with the runner to redo the deliverable or refund you.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: InvestorsPage,
});

const BENEFITS = [
  { icon: Zap, title: "On-demand coverage", body: "Post a task, get matched with a local runner in markets where you don't have boots on the ground." },
  { icon: ShieldCheck, title: "Vetted runners only", body: "Every runner passes ID verification and a background check before they can claim work." },
  { icon: Camera, title: "Proof of work", body: "Geo-tagged photos, video, and notes submitted on site. Review before you release funds." },
  { icon: Receipt, title: "Flat, transparent pricing", body: "You set the payout. No surprise surcharges, no hourly meter, no platform markup baked in." },
];

const STEPS = [
  { n: "01", t: "Post the task", b: "Address, what you need, the payout, and when it's due." },
  { n: "02", t: "Get matched", b: "We surface vetted local runners. Accept the one you want." },
  { n: "03", t: "Review the work", b: "Photos, video, and notes land in your dashboard. Approve to release payment." },
];

const SAMPLE_TASKS = [
  { icon: Camera, title: "Property Photo Set", price: "$45 – $85", note: "20+ geotagged exterior & interior photos" },
  { icon: Video, title: "Walkthrough Video", price: "$75 – $150", note: "Narrated full interior walkthrough" },
  { icon: ShieldCheck, title: "Occupancy Check", price: "$25 – $50", note: "Vacant / occupied / abandoned + photos" },
  { icon: MapPin, title: "Drive-By Report", price: "$20 – $40", note: "Exterior photos + curbside condition notes" },
  { icon: ClipboardList, title: "Lockbox Install", price: "$30 – $60", note: "Placed, photographed, code delivered" },
  { icon: Building2, title: "Meet a Contractor", price: "Custom", note: "Boots on site so you don't have to fly out" },
];

const TRUST_BARS = [
  { icon: Lock, label: "Funds held in escrow until you approve" },
  { icon: BadgeCheck, label: "ID-verified runners with signed IC agreements" },
  { icon: MapPinned, label: "Nationwide coverage, launching market-by-market" },
  { icon: Scale, label: "No platform fee added on top of your task price" },
];

const INVESTOR_FAQS = [
  { q: "How are runners vetted?", a: "Every runner completes an application review, signs an independent contractor agreement, and has ID verification available. Higher-tier tasks may require a background check before claim." },
  { q: "How is my money protected?", a: "You fund the task up front through our payments processor. The payout is held until you review and approve the deliverables. If the work isn't right, our support team helps resolve it before funds release." },
  { q: "What does it cost me?", a: "You set the task price. There is no platform fee added on top — the 20% platform fee comes out of the total payout, so 80% goes to the runner and 20% to REI Runner. What you post is what you pay." },
  { q: "How fast will a task be picked up?", a: "Turnaround depends on the market, the task, and runner availability. Drive-bys and photo sets in active markets often move same-day; new markets take longer while we onboard local runners." },
  { q: "What if the work isn't acceptable?", a: "Open a dispute from the task. Funds stay held until it's resolved. We work with the runner to redo the deliverable or issue a refund." },
];

function InvestorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />

      <PublicHeader
        maxWidth="max-w-6xl"
        links={[
          { to: "/tasks", label: "Browse marketplace" },
          { to: "/runners", label: "For runners" },
          { to: "/", label: "Home" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="text-xs font-semibold tracking-widest text-primary uppercase">For Investors</div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Hire Local Runners for Property Preservation & Inspection Tasks</h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Nationwide boots-on-the-ground for real estate investors. Post a property task in any U.S. market — vacancy checks, drive-bys, walkthroughs, lockbox installs — a vetted local runner uploads the deliverables, and you only release funds once you've approved the work.
          </p>
        </div>

        {/* TRUST BAR */}
        <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRUST_BARS.map((t) => (
            <div key={t.label} className="rounded-xl border border-border bg-card/40 backdrop-blur p-3 flex items-start gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <t.icon className="size-4 text-primary" />
              </div>
              <div className="text-[12px] leading-snug text-foreground/90">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card/50 p-5">
              <b.icon className="size-5 text-primary" />
              <div className="mt-3 font-semibold">{b.title}</div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>

        <div className="mb-14">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">How it works</h2>
          <ol className="mt-8 grid md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl border border-border bg-card/40 p-5">
                <div className="text-primary font-mono text-sm">{s.n}</div>
                <div className="mt-2 font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* SAMPLE TASKS */}
        <div className="mb-14">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What investors typically post</h2>
            <p className="mt-2 text-sm text-muted-foreground">Typical price ranges. You always set the final payout on your task.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_TASKS.map((t) => (
              <div key={t.title} className="rounded-2xl border border-border bg-card/50 p-5">
                <div className="flex items-center justify-between">
                  <t.icon className="size-5 text-primary" />
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                    <DollarSign className="size-3.5 text-primary" />
                    <span className="tabular-nums">{t.price}</span>
                  </span>
                </div>
                <div className="mt-3 font-semibold">{t.title}</div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* OBJECTION FAQ */}
        <div className="mb-14">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Common investor questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {INVESTOR_FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`q-${i}`}
                className="rounded-xl border border-border bg-card/60 backdrop-blur px-5"
              >
                <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm text-center text-foreground">
            <Building2 className="size-4 text-primary inline-block mr-2 -mt-0.5" />
            Founding investors get priority match, lower beta pricing, and first pick of runners.
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
            <ProForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground inline-flex items-center justify-center w-full gap-2">
            <Users className="size-3.5" />
            Already have an account? <Link to="/login" className="text-foreground hover:text-primary underline-offset-4 hover:underline">Sign in</Link>
            <span>·</span>
            <Link to="/tasks" className="inline-flex items-center gap-1 text-foreground hover:text-primary underline-offset-4 hover:underline"><MapPinned className="size-3.5" /> See the live marketplace</Link>
          </p>
        </div>
      </main>
    </div>
  );
}