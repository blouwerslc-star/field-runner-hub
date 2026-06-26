import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ArrowLeft, CheckCircle2, XCircle, ShieldCheck, MapPin, DollarSign, Camera, Building2 } from "lucide-react";

const URL = "https://reirunner.com/blog/comparison-wegolook";
const TITLE = "REI Runner vs. WeGoLook: The Best Choice for Real Estate Investors";
const DESC =
  "Comparing WeGoLook and REI Runner for real estate investors: escrowed payments, geotagged deliverables, and a vetted runner network built specifically for property field work.";

export const Route = createFileRoute("/blog/comparison-wegolook")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESC,
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "REI Runner" },
          publisher: {
            "@type": "Organization",
            name: "REI Runner",
            logo: { "@type": "ImageObject", url: "https://reirunner.com/rei-runner-logo.png" },
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://reirunner.com/" },
            { "@type": "ListItem", position: 2, name: "REI Runner vs. WeGoLook", item: URL },
          ],
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
              name: "Is REI Runner a WeGoLook alternative?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. REI Runner is a real-estate-specialized alternative to WeGoLook, built for investors who need geotagged photos, walkthrough videos, vacancy checks, lockbox installs, and contractor meetups — with funds held in escrow until you approve the deliverable.",
              },
            },
            {
              "@type": "Question",
              name: "How is REI Runner different from WeGoLook?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "WeGoLook is a broad-market inspection and gig platform. REI Runner focuses exclusively on real estate investor workflows: vetted local runners trained on REI tasks, geotagged proof-of-work, and escrowed payments that release only after the investor approves the deliverable.",
              },
            },
            {
              "@type": "Question",
              name: "Does REI Runner offer escrowed payments?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Funds are held when you post a task and only released to the runner after you review and approve the geotagged deliverable.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: ComparisonPage,
});

const FEATURE_ROWS: Array<{ label: string; rei: string; wgl: string }> = [
  { label: "Built for", rei: "Real estate investors, wholesalers, funds, brokerages", wgl: "Broad-market inspections & gig errands" },
  { label: "Runner vetting", rei: "ID + background check, REI Runner Academy training", wgl: "General gig-worker onboarding" },
  { label: "Payment protection", rei: "Funds escrowed; released only after you approve", wgl: "Standard platform invoicing" },
  { label: "Proof of work", rei: "Geotagged, timestamped photos & video on every task", wgl: "Photo reports, varies by job type" },
  { label: "Task types", rei: "Drive-bys, walkthroughs, vacancy checks, lockbox installs, contractor meetups, yard signs, buyer showings", wgl: "Inspections, asset verifications, generic look-tasks" },
  { label: "Pricing", rei: "Flat, transparent per-task pricing", wgl: "Quote-based; varies by partner" },
  { label: "Coverage model", rei: "Nationwide network of local REI-trained runners", wgl: "Nationwide gig-worker pool" },
  { label: "Direct messaging with runner", rei: "Yes — in-app thread on every task", wgl: "Limited / through platform support" },
];

const WHY_REI = [
  { icon: ShieldCheck, t: "Escrowed payments", b: "Your funds sit in escrow the moment you post a task and only release after you review the geotagged deliverable. No paying for a job that wasn't done right." },
  { icon: MapPin, t: "Geotagged, timestamped proof", b: "Every photo and video is GPS-stamped at the property, so you know the runner was on-site at the time of the deliverable — not a stock photo, not yesterday's drive-by." },
  { icon: Building2, t: "Real estate context, not generic gig work", b: "Runners are trained on REI workflows through the REI Runner Academy: occupancy signals, lockbox best practices, what a wholesaler actually needs in a walkthrough video." },
  { icon: DollarSign, t: "Flat per-task pricing", b: "Investors price deals tight. We publish flat task pricing up front — no quote cycles, no per-mile surprises." },
  { icon: Camera, t: "Investor-grade deliverables", b: "Walkthrough videos, exterior photo sets, roof checks, vacancy verifications, contractor-meet sign-offs — packaged the way investors review them." },
];

function ComparisonPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">Comparison guide</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
          REI Runner vs. WeGoLook: The Best Choice for Real Estate Investors
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          If you're searching for a WeGoLook alternative for real estate field services, here's the short version: WeGoLook
          is a broad-market inspection and gig platform. REI Runner is purpose-built for real estate investors — escrowed
          payments, geotagged deliverables, and runners trained on investor workflows.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold">The quick verdict</h2>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
              <div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-primary" /><div className="font-semibold">Pick REI Runner if…</div></div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• You're an investor, wholesaler, fund, or brokerage operating in markets you don't live in</li>
                <li>• You want funds held in escrow until you approve the deliverable</li>
                <li>• You need geotagged proof-of-work, not just a photo someone uploaded</li>
                <li>• You want a runner who understands occupancy checks, lockboxes, and walkthrough video</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <div className="flex items-center gap-2"><XCircle className="size-5 text-muted-foreground" /><div className="font-semibold">Pick WeGoLook if…</div></div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• You need broad inspection coverage outside real estate (auto, equipment, generic asset verification)</li>
                <li>• You're an enterprise customer running large insurance / claims workflows</li>
                <li>• Real-estate-specific deliverables and escrowed task payments aren't a priority</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">Feature comparison</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-card/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  <th className="px-4 py-3 font-semibold text-primary">REI Runner</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">WeGoLook</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((r) => (
                  <tr key={r.label} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-medium">{r.label}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.rei}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.wgl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Information about WeGoLook reflects publicly available descriptions of their general-purpose inspection and gig
            platform. Verify current offerings on their site before making a purchase decision.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">Why investors choose REI Runner</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {WHY_REI.map((p) => (
              <div key={p.t} className="rounded-2xl border border-border bg-card/50 p-6">
                <p.icon className="size-5 text-primary" />
                <div className="mt-3 font-semibold text-lg">{p.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">What WeGoLook does well</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            WeGoLook built one of the early national look-task networks and serves a broad customer base — insurance carriers,
            auto buyers, equipment verifications, and generic on-site inspections. If your work spans multiple asset classes
            outside real estate, a general-purpose inspection network can be a fit.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            For real estate investors specifically, though, generic gig coverage tends to miss the context that makes a
            deliverable useful: was the property actually vacant, did the runner check the back of the house, is the lockbox
            on the side door the buyer's agent will actually use. That's the gap REI Runner was built to close.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">The bottom line</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            If you're investing in real estate out of market, you don't need a generic look-task platform — you need a
            specialized network of vetted local runners who understand the work and a payment flow that protects you until
            the job is done right. That's REI Runner.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/investors" className="rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90">Post your first task</Link>
          <Link to="/pricing" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">See pricing</Link>
          <Link to="/faq" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Read the FAQ</Link>
        </div>
      </article>
    </div>
  );
}