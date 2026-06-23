import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import founderPhoto from "@/assets/founder-brian.jpg";
import {
  ArrowRight,
  Building2,
  Compass,
  HeartHandshake,
  MapPin,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/story")({
  component: StoryPage,
  head: () => ({
    meta: [
      { title: "Our Story — REI Runner" },
      {
        name: "description",
        content:
          "Why we built REI Runner — a marketplace that gives real estate investors trustworthy boots-on-the-ground and gives runners flexible, well-paid local work.",
      },
      { property: "og:title", content: "Our Story — REI Runner" },
      {
        property: "og:description",
        content:
          "The investor problem, the runner problem, and the marketplace built to solve both.",
      },
      { property: "og:url", content: "https://reirunner.com/story" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/story" }],
  }),
});

const PILLARS = [
  {
    icon: Target,
    title: "Solve a real problem",
    body: "Out-of-state investors lose deals every week because they can't get eyes on a property. We fix that.",
  },
  {
    icon: HeartHandshake,
    title: "Treat runners as partners",
    body: "Runners aren't a faceless workforce. Their work is the product. We design the platform around that.",
  },
  {
    icon: Compass,
    title: "Grow market-by-market",
    body: "We'd rather have deep, reliable coverage in eight cities than a thin map of unfilled requests in fifty.",
  },
];

function StoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/"><BrandLogo /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/trust" className="hover:text-foreground">Trust & Safety</Link>
            <Link to="/story" className="text-foreground">Our Story</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          </nav>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative border-b border-border/60">
        <div aria-hidden className="absolute inset-0 -z-10 bg-hero opacity-60" />
        <div className="mx-auto max-w-4xl px-5 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Our Story
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
            We built REI Runner because <span className="text-gradient">the call kept going to voicemail</span>.
          </h1>
          <p className="mt-5 text-muted-foreground md:text-lg">
            A marketplace for the moment an investor needs eyes on a property — and the moment a local runner wants a job to claim.
          </p>
        </div>
      </section>

      {/* THE PROBLEMS */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card/60 p-7 md:p-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
            <Building2 className="size-3.5" /> For Investors
          </div>
          <h2 className="text-2xl font-bold mb-3">The investor problem</h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Real estate investors buy properties across the country, but they can't physically be in every city. Wholesalers ghost. Agents won't pull lockbox photos. Property managers take days to respond. Hiring a one-off photographer means a Craigslist gamble.
          </p>
          <p className="mt-3 text-muted-foreground text-sm md:text-base leading-relaxed">
            Meanwhile the deal clock is ticking. By the time you confirm condition, the property is gone — or worse, you closed without knowing what you bought.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-7 md:p-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
            <Users className="size-3.5" /> For Runners
          </div>
          <h2 className="text-2xl font-bold mb-3">The runner problem</h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Plenty of people want flexible local work — drivers between rides, real estate hopefuls building experience, retirees, parents on a school schedule. But the existing gig platforms don't pay well for site visits, and finding investor clients on your own is a cold-call grind.
          </p>
          <p className="mt-3 text-muted-foreground text-sm md:text-base leading-relaxed">
            There was no obvious place to plug in, prove yourself, and get paid for the field work investors will gladly pay for.
          </p>
        </div>
      </section>

      {/* THE SOLUTION */}
      <section className="border-y border-border/60 bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
            <MapPin className="size-3.5" /> The Marketplace
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            One place to <span className="text-gradient">match the request to the runner</span>.
          </h2>
          <p className="mt-5 max-w-3xl mx-auto text-muted-foreground md:text-lg">
            REI Runner is a per-task marketplace. Investors post the address, the deliverables, and the budget. A vetted local runner claims the task, completes it, uploads the proof, and gets paid. No retainers. No overhead. No ghosting.
          </p>
        </div>
      </section>

      {/* PILLARS */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What we believe</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card/60 p-6">
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <p.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOUNDER */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
          <div className="rounded-3xl border border-border bg-card/80 backdrop-blur p-7 md:p-10">
            <div className="flex items-center gap-5">
              <img
                src={founderPhoto}
                alt="Brian Louwers, founder of REI Runner"
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
                className="size-16 md:size-20 rounded-full object-cover shadow-glow shrink-0 ring-2 ring-primary/30"
              />
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-primary">Founder</div>
                <div className="text-xl font-bold mt-1">Brian Louwers</div>
                <div className="text-sm text-muted-foreground">Founder · REI Runner · Operator-investor since 2014</div>
              </div>
            </div>
            <blockquote className="mt-7 text-base md:text-lg text-foreground/90 leading-relaxed border-l-2 border-primary pl-5">
              "I've been on both sides of this. The investor who needed photos by noon and the local who would have happily driven across town for $40 — if there had been a way to connect us. REI Runner is that connection, built with the trust and accountability the industry actually needs."
            </blockquote>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
              Brian has spent a decade buying and managing real estate across multiple US markets — wholesales, rehabs, and rental portfolios. The runner network he wished existed every time a deal moved to a new city is the network he's building now.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24 text-center">
        <h2 className="text-2xl md:text-4xl font-bold">Where we're going</h2>
        <p className="mt-5 text-muted-foreground md:text-lg leading-relaxed">
          Our long-term goal is an on-demand field operations layer for real estate — vetted local runners in every priority US market, every common investor task standardized, every job documented end-to-end. We're launching market-by-market across the U.S., building runner coverage where investors need it first.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
            <Link to="/investors">Hire a Runner <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/runners">Become a Runner</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}