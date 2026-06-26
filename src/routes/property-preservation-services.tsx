import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ArrowLeft, ShieldCheck, MapPin, Camera, DollarSign, ClipboardList, Building2, CheckCircle2 } from "lucide-react";

const URL = "https://reirunner.com/property-preservation-services";
const TITLE = "Property Preservation Services — On-Demand Field Network";
const DESC =
  "Nationwide property preservation services for investors, funds, and asset managers — vacancy checks, lockbox installs, drive-bys, walkthroughs, and contractor meetups with escrowed payments and geotagged proof of work.";

export const Route = createFileRoute("/property-preservation-services")({
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
          name: "Property Preservation Services",
          serviceType: "Property preservation and real estate field services",
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
            { "@type": "ListItem", position: 2, name: "Property Preservation Services", item: URL },
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
              name: "What is property preservation?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Property preservation is the practice of inspecting, securing, and maintaining real estate assets — typically vacant, REO, or out-of-market properties — through tasks like vacancy verification, lockbox installs, exterior drive-bys, and on-site contractor meetups. REI Runner delivers these tasks on-demand through a vetted network of local runners.",
              },
            },
            {
              "@type": "Question",
              name: "What does a property preservation company do?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A property preservation company sends a vetted local contractor to a property to perform a defined task — verify occupancy, install or change a lockbox, photograph the exterior and interior, meet a contractor on-site, or place yard signage — and returns a documented deliverable. REI Runner handles this through an on-demand marketplace with escrowed payments.",
              },
            },
            {
              "@type": "Question",
              name: "How much do property preservation services cost?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "REI Runner uses flat per-task pricing. Typical tasks range from $20 for a drive-by to $150 for a full narrated walkthrough video. You set the payout when you post the task — there is no platform fee added on top of your task price.",
              },
            },
            {
              "@type": "Question",
              name: "Is REI Runner an alternative to traditional property preservation vendors?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Traditional property preservation vendors typically operate on contracted bank/REO workflows with delayed invoicing. REI Runner is the on-demand version — investors, wholesalers, and funds post a single task, get a vetted local runner, and only release funds after approving the geotagged deliverable.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: PropertyPreservationServicesPage,
});

const INCLUDED = [
  { icon: ShieldCheck, t: "Vacancy & occupancy verification", b: "Confirm whether a property is vacant, occupied, or abandoned — with on-site geotagged photos and a written status report." },
  { icon: MapPin, t: "Exterior drive-bys & condition reports", b: "Quick on-site check with exterior photos and curbside condition notes for underwriting, asset management, or insurance review." },
  { icon: Camera, t: "Walkthroughs & photo sets", b: "Full interior walkthrough video plus 20+ geotagged photos for remote underwriting and listing-prep." },
  { icon: ClipboardList, t: "Lockbox installs & access management", b: "Lockbox placed, photographed, and code delivered to your dashboard. Re-codes and removals on request." },
  { icon: Building2, t: "Contractor & vendor meetups", b: "A vetted runner meets a contractor, inspector, or appraiser on-site so you don't have to fly out." },
  { icon: DollarSign, t: "Yard signs & marketing placement", b: "Install or remove signage, lockboxes, or other property items with photo proof." },
];

const WHY = [
  { t: "On-demand instead of contracted", b: "Post a single task instead of negotiating a multi-property vendor contract. Get a runner in minutes." },
  { t: "Escrowed payments", b: "Funds are held the moment you post a task and only release after you approve the deliverable." },
  { t: "Geotagged proof of work", b: "Every photo and video is GPS-stamped and timestamped at the property." },
  { t: "Nationwide coverage", b: "Vetted local runners launching market-by-market across the U.S." },
];

function PropertyPreservationServicesPage() {
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
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">Property preservation services</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
          On-Demand Property Preservation Services — Nationwide
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          REI Runner is the on-demand property preservation services network for real estate investors, wholesalers, funds,
          and asset managers. Post a property task — vacancy check, lockbox install, drive-by, walkthrough, or contractor
          meetup — and a vetted local runner delivers geotagged proof of work. Funds release only when you approve.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold">What property preservation covers</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {INCLUDED.map((s) => (
              <div key={s.t} className="rounded-2xl border border-border bg-card/50 p-5">
                <s.icon className="size-5 text-primary" />
                <div className="mt-3 font-semibold">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">Why investors choose REI Runner over traditional property preservation companies</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {WHY.map((w) => (
              <div key={w.t} className="rounded-2xl border border-border bg-card/50 p-5">
                <CheckCircle2 className="size-5 text-primary" />
                <div className="mt-3 font-semibold">{w.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{w.b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">What is property preservation?</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Property preservation is the practice of inspecting, securing, and maintaining real estate assets — typically
            vacant, REO, distressed, or out-of-market properties — through recurring on-site tasks. Traditional property
            preservation companies run on contracted bank and REO workflows with delayed invoicing. REI Runner is the
            on-demand version: a vetted local runner shows up, completes one task, uploads the geotagged deliverable, and
            funds release when you approve.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/investors" className="rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90">Post a property task</Link>
          <Link to="/pricing" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">See pricing</Link>
          <Link to="/coverage" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Coverage map</Link>
        </div>
      </main>
    </div>
  );
}