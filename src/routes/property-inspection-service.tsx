import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ArrowLeft, Camera, Video, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react";

const URL = "https://reirunner.com/property-inspection-service";
const TITLE = "Property Inspection Service — Drive-Bys, Walkthroughs, Vacancy Checks";
const DESC =
  "On-demand property inspection service for real estate investors: drive-by inspections, walkthrough video, vacancy verification, and occupancy checks delivered by vetted local runners with geotagged proof.";

export const Route = createFileRoute("/property-inspection-service")({
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
          "@type": "Service",
          name: "Property Inspection Service",
          serviceType: "Real estate property inspection",
          provider: { "@id": "https://reirunner.com/#organization" },
          areaServed: "US",
          url: URL,
          description: DESC,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://reirunner.com/" },
            { "@type": "ListItem", position: 2, name: "Property Inspection Service", item: URL },
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
              name: "What is a property inspection service?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A property inspection service sends a vetted person to a property to verify its condition and deliver documented proof — typically photos, video, and a written report. REI Runner offers on-demand property inspections including drive-bys, walkthrough videos, and vacancy verification.",
              },
            },
            {
              "@type": "Question",
              name: "How is this different from a home inspector?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A licensed home inspector is required for pre-purchase structural and systems inspections. REI Runner's property inspection service is for investor workflows — verifying occupancy, documenting condition for underwriting, meeting contractors, and routine property checks — not licensed pre-purchase inspections.",
              },
            },
            {
              "@type": "Question",
              name: "How fast can a property inspection be completed?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "In active markets, drive-bys and photo sets are often completed same-day. Turnaround depends on the market, the task type, and local runner availability.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: PropertyInspectionServicePage,
});

const SERVICES = [
  { icon: MapPin, t: "Drive-by inspection", price: "$20 – $40", b: "Exterior photos plus a curbside condition note. Fastest way to verify a property without flying out." },
  { icon: Camera, t: "Property photo set", price: "$45 – $85", b: "20+ geotagged exterior and interior photos for underwriting, listing prep, or asset review." },
  { icon: Video, t: "Walkthrough video", price: "$75 – $150", b: "Full narrated interior walkthrough so you can underwrite or evaluate a deal remotely." },
  { icon: ShieldCheck, t: "Occupancy / vacancy check", price: "$25 – $50", b: "Verify whether the property is vacant, occupied, or abandoned — with on-site photo proof." },
];

function PropertyInspectionServicePage() {
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
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">Property inspection service</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
          On-Demand Property Inspection Service for Real Estate Investors
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Drive-by inspections, walkthrough videos, vacancy verification, and occupancy checks delivered by vetted local
          runners. Geotagged proof on every task. Escrowed payments release only when you approve the deliverable.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold">Property inspections we deliver</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {SERVICES.map((s) => (
              <div key={s.t} className="rounded-2xl border border-border bg-card/50 p-5">
                <div className="flex items-center justify-between">
                  <s.icon className="size-5 text-primary" />
                  <span className="text-sm font-semibold tabular-nums">{s.price}</span>
                </div>
                <div className="mt-3 font-semibold">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Typical price ranges. You set the final task price when you post — there is no platform fee added on top.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">Why investors use REI Runner for property inspections</h2>
          <ul className="mt-5 space-y-3 text-muted-foreground">
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Geotagged, timestamped proof of work</strong> — every photo and video is GPS-stamped at the property.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Escrowed payments</strong> — funds release only after you review and approve the deliverable.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Investor-trained runners</strong> — vetted local runners trained on REI workflows through the REI Runner Academy.</span></li>
            <li className="flex gap-3"><CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Nationwide coverage</strong> — launching market-by-market across the U.S.</span></li>
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/investors" className="rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90">Post a property inspection</Link>
          <Link to="/pricing" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">See pricing</Link>
          <Link to="/property-preservation-services" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Property preservation</Link>
        </div>
      </main>
    </div>
  );
}