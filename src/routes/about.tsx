import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ArrowLeft, Target, Compass, ShieldCheck, MapPin, HeartHandshake, Zap, Building2, Users, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About REI Runner — The Uber for Real Estate Field Services" },
      {
        name: "description",
        content:
          "REI Runner is the nationwide marketplace connecting real estate investors with vetted local runners for property photos, vacancy verification, lockbox installs, and contractor meetups. Operated by B&K Investment Group LLC.",
      },
      { property: "og:title", content: "About REI Runner — The Uber for Real Estate Field Services" },
      {
        property: "og:description",
        content:
          "Mission, vision, and the team building the on-demand network for real estate field services across the U.S.",
      },
      { property: "og:url", content: "https://reirunner.com/about" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About REI Runner",
          url: "https://reirunner.com/about",
          mainEntity: {
            "@type": "Organization",
            name: "REI Runner",
            legalName: "B&K Investment Group LLC",
            url: "https://reirunner.com/",
            telephone: "+1-517-774-9896",
            email: "support@reirunner.com",
            areaServed: "US",
            description:
              "Nationwide marketplace connecting real estate investors with vetted local runners for on-demand property field services.",
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
            { "@type": "ListItem", position: 2, name: "About", item: "https://reirunner.com/about" },
          ],
        }),
      },
    ],
  }),
  component: AboutPage,
});

const PILLARS = [
  { icon: Target, t: "Mission", b: "Give every real estate investor on-demand eyes and hands in any U.S. market — without flying out, hiring an assistant, or losing the deal to drive time." },
  { icon: Compass, t: "Vision", b: "Become the default field-services layer for real estate: one vetted national network that any investor, fund, or brokerage can call on in minutes." },
  { icon: ShieldCheck, t: "Trust & accountability", b: "ID-verified runners, background checks, GPS-timestamped deliverables, ratings, and a public report history. Proof of work on every assignment." },
  { icon: MapPin, t: "Nationwide coverage", b: "Launching market-by-market across the U.S., with priority coverage in Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, and Chicago." },
];

const INVESTOR_BENEFITS = [
  "Post a task in minutes — photos, video walkthroughs, vacancy checks, lockbox installs, contractor meetups",
  "Get matched with vetted local runners, not random gig workers",
  "Review geo-tagged deliverables before you release payment",
  "Flat, transparent pricing — no surprise surcharges",
];

const RUNNER_BENEFITS = [
  "Earn per task with payouts you see before you accept",
  "Pick assignments that fit your schedule and service area",
  "Build a public profile with ratings, badges, and academy certifications",
  "Get matched first when you complete the REI Runner Academy",
];

function AboutPage() {
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

      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">About REI Runner</div>
        <h1 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight">The Uber for Real Estate Field Services</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          REI Runner is the nationwide, on-demand marketplace that pairs real estate investors with vetted local
          runners for property photos, walkthrough videos, vacancy verification, lockbox installs, yard signs,
          contractor meetups, and buyer showings. We built it because the deal doesn't wait for a flight, and
          you shouldn't have to drive two hours to confirm a roof.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          {PILLARS.map((p) => (
            <div key={p.t} className="rounded-2xl border border-border bg-card/50 p-6">
              <p.icon className="size-5 text-primary" />
              <div className="mt-3 font-semibold text-lg">{p.t}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.b}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-2xl md:text-3xl font-bold">Why REI Runner exists</h2>
        <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Real estate investing is local — but capital is national. Most investors operate in markets where they
            don't live, and the field work (drive-bys, photos, lockbox swaps, meeting a contractor on site) is the
            single biggest bottleneck between a lead and a closed deal.
          </p>
          <p>
            Hiring a full-time assistant in every market doesn't scale. Random gig workers don't have the real
            estate context. Wholesalers won't run errands. REI Runner solves it by standing up a vetted, trained
            runner network in every U.S. market, with the proof-of-work, pricing, and accountability investors
            need to actually trust the deliverables.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <Building2 className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold text-lg">For investors</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {INVESTOR_BENEFITS.map((b) => (
                <li key={b} className="flex gap-2"><Zap className="size-4 text-primary mt-0.5 shrink-0" /><span>{b}</span></li>
              ))}
            </ul>
            <Link to="/investors" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Become an investor →</Link>
          </div>
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <Users className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold text-lg">For runners</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {RUNNER_BENEFITS.map((b) => (
                <li key={b} className="flex gap-2"><HeartHandshake className="size-4 text-primary mt-0.5 shrink-0" /><span>{b}</span></li>
              ))}
            </ul>
            <Link to="/runners" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Become a runner →</Link>
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card/60 p-6">
          <h2 className="text-xl font-bold">Operating entity</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            REI Runner is operated by <strong className="text-foreground">B&amp;K Investment Group LLC</strong>, a
            U.S.-registered company building the infrastructure layer for on-demand real estate field services.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a href="tel:+15177749896" className="inline-flex items-center gap-1.5 hover:text-foreground text-muted-foreground"><Phone className="size-4 text-primary" /> (517) 774-9896</a>
            <a href="mailto:support@reirunner.com" className="inline-flex items-center gap-1.5 hover:text-foreground text-muted-foreground"><Mail className="size-4 text-primary" /> support@reirunner.com</a>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/investors" className="rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90">Hire a runner</Link>
          <Link to="/runners" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Become a runner</Link>
          <Link to="/faq" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Read the FAQ</Link>
        </div>
      </section>
    </div>
  );
}