import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ArrowLeft, Wallet, Clock, MapPin, BadgeCheck, CheckCircle2 } from "lucide-react";

const URL = "https://reirunner.com/property-preservation-jobs";
const TITLE = "Property Preservation Jobs — Become a Local Field Runner";
const DESC =
  "Earn money completing local property preservation jobs near you — drive-bys, vacancy checks, lockbox installs, photos, and walkthroughs. Apply to become a vetted REI Runner field contractor.";

export const Route = createFileRoute("/property-preservation-jobs")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: "Property Preservation Field Contractor (Independent Contractor)",
          description:
            "Complete short, scheduled local property preservation jobs — drive-bys, vacancy checks, lockbox installs, property photos, and walkthrough videos — on your own schedule. Per-task pay, no quotas.",
          employmentType: "CONTRACTOR",
          hiringOrganization: { "@type": "Organization", name: "REI Runner", sameAs: "https://reirunner.com" },
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "US" },
          datePosted: new Date().toISOString().split("T")[0],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://reirunner.com/" },
            { "@type": "ListItem", position: 2, name: "Property Preservation Jobs", item: URL },
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
              name: "How do I become a property preservation contractor?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Apply to REI Runner, pass ID and background verification, and complete the REI Runner Academy training. Once approved, you'll receive local task offers — drive-bys, vacancy checks, lockbox installs, and walkthroughs — that you can accept on your own schedule.",
              },
            },
            {
              "@type": "Question",
              name: "How much do property preservation contractors make?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Pay is per task and visible before you accept. Typical tasks range from $20 for a drive-by to $150 for a full walkthrough video. There are no quotas — earnings depend on how many tasks you accept and complete.",
              },
            },
            {
              "@type": "Question",
              name: "Are property preservation jobs near me available?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "REI Runner is launching market-by-market across the U.S. Tasks are surfaced based on your service area, so you only see jobs near you. Apply to your city to start receiving offers as we open coverage.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need a real estate license?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. Property preservation field tasks — photos, drive-bys, walkthroughs, lockbox installs — do not require a real estate license.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: PropertyPreservationJobsPage,
});

const PERKS = [
  { icon: Wallet, t: "Per-task pay you see up front", b: "Every task lists the payout before you accept. No quoting, no haggling, no chasing invoices." },
  { icon: Clock, t: "Your schedule", b: "Pick tasks that fit your day. No shifts, no quotas, no minimum hours." },
  { icon: MapPin, t: "Local jobs only", b: "We only surface property preservation jobs near you, in your service area." },
  { icon: BadgeCheck, t: "Vetted network", b: "Background check + REI Runner Academy training — investors trust the deliverables, you get repeat work." },
];

function PropertyPreservationJobsPage() {
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

      <main className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">Property preservation jobs</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
          Property Preservation Jobs Near You — Get Paid Per Task
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Earn money completing short, scheduled property preservation jobs in your city — drive-bys, vacancy checks,
          lockbox installs, photos, and walkthrough videos. Per-task pay, no quotas, no shifts. Apply to become a vetted
          REI Runner property preservation contractor.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold">Why runners pick REI Runner</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {PERKS.map((p) => (
              <div key={p.t} className="rounded-2xl border border-border bg-card/50 p-5">
                <p.icon className="size-5 text-primary" />
                <div className="mt-3 font-semibold">{p.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">How to become a property preservation contractor</h2>
          <ol className="mt-5 space-y-3 text-muted-foreground">
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Apply</strong> — tell us your city, vehicle, and the task types you can handle.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Verify</strong> — pass identity verification and a background check (~3–5 business days).</span></li>
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Complete REI Runner Academy</strong> — short training on deliverable standards so investors trust your work.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Get matched</strong> — accept local property preservation jobs in your area. Submit deliverables, get paid.</span></li>
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">What property preservation work looks like on REI Runner</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Most property preservation jobs on REI Runner are short on-site tasks — confirming a property is vacant,
            installing or photographing a lockbox, taking a 20-photo exterior/interior set, recording a narrated walkthrough
            video, or meeting a contractor on-site. You'll receive task offers based on your service area, accept the ones
            that fit, complete the deliverable on-site through the app, and get paid once the investor approves the work.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/apply" search={{ role: "runner" }} className="rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90">Apply as a runner</Link>
          <Link to="/runners" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">How runners earn</Link>
          <Link to="/coverage" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Coverage map</Link>
        </div>
      </main>
    </div>
  );
}