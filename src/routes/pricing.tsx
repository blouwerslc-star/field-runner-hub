import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Video,
  MapPin,
  ShieldCheck,
  ClipboardList,
  Briefcase,
  ArrowRight,
  DollarSign,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — REI Runner Field Services" },
      {
        name: "description",
        content:
          "Starting prices for drive-bys, occupancy checks, property photos, walkthrough videos, lockbox installs, and investor assistant services on REI Runner.",
      },
      { property: "og:title", content: "Pricing — REI Runner" },
      {
        property: "og:description",
        content:
          "Transparent starting prices for every REI Runner field service. Final pricing varies by market, complexity, and turnaround.",
      },
      { property: "og:url", content: "https://reirunner.com/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/pricing" }],
  }),
});

const SERVICES = [
  {
    icon: MapPin,
    title: "Drive-By Inspection",
    starting: 25,
    eta: "Same-day in covered markets",
    includes: ["4–6 exterior photos", "Curbside condition notes", "Neighborhood snapshot"],
  },
  {
    icon: ShieldCheck,
    title: "Occupancy Verification",
    starting: 35,
    eta: "Usually within 48 hours",
    includes: ["Vacant / occupied / abandoned status", "Exterior photos", "Written observations"],
  },
  {
    icon: Camera,
    title: "Property Photos",
    starting: 49,
    eta: "Varies by market",
    includes: ["20+ exterior & interior photos", "Geotagged + timestamped", "Uploaded via app"],
  },
  {
    icon: Video,
    title: "Video Walkthrough",
    starting: 59,
    eta: "Varies by market",
    includes: ["Full interior walkthrough", "Narrated condition notes", "HD vertical or horizontal"],
  },
  {
    icon: ClipboardList,
    title: "Lockbox Installation",
    starting: 75,
    eta: "Usually within 24–72 hours",
    includes: ["Lockbox placed at agreed location", "Photo confirmation", "Code delivered securely"],
  },
  {
    icon: Briefcase,
    title: "Investor Assistant Services",
    starting: null,
    eta: "Custom scope",
    includes: ["Meet a contractor on-site", "Pick up / drop off keys", "Recurring task bundles"],
  },
];

const FAQS = [
  {
    q: "Why does pricing vary by market?",
    a: "Drive distance, local market demand, runner availability, and task complexity all affect the final payout. Investors set the final price when they post a task — the figures above reflect typical starting points across active markets.",
  },
  {
    q: "Are there any platform fees on top of the task price?",
    a: "Investors pay the posted task price plus a small platform fee at checkout. Runners receive the agreed payout when their work is approved. The exact breakdown is shown before you confirm a task.",
  },
  {
    q: "Can I post recurring or bulk tasks at a custom rate?",
    a: "Yes. For recurring portfolios, multi-property orders, or investor assistant bundles, contact us at support@reirunner.com to set up a custom rate sheet.",
  },
  {
    q: "What happens if the runner can't complete the task?",
    a: "If a runner doesn't deliver or the work falls short of the posted requirements, the task is reassigned or refunded. Payment is only released to the runner once you approve the deliverables.",
  },
  {
    q: "Do runners set their own rates?",
    a: "Runners can publish per-service starting rates on their profile (e.g. for repeat-investor work). For posted tasks, investors set the price and runners choose whether to accept.",
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/"><BrandLogo /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/pricing" className="text-foreground">Pricing</Link>
            <Link to="/trust" className="hover:text-foreground">Trust & Safety</Link>
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
            <DollarSign className="size-3.5 text-primary" /> Transparent Marketplace Pricing
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
            Know what you'll pay <span className="text-gradient">before you post</span>.
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground md:text-lg">
            Starting prices for every REI Runner service. Final pricing varies by market, complexity, and turnaround.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-5 py-14 md:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card flex flex-col">
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <s.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <div className="mt-3">
                {s.starting !== null ? (
                  <>
                    <span className="text-xs text-muted-foreground">Starting at</span>
                    <div className="text-3xl font-bold tabular-nums">
                      ${s.starting}
                      <span className="text-sm text-muted-foreground font-normal"> / task</span>
                    </div>
                  </>
                ) : (
                  <div className="text-2xl font-bold">Custom Pricing</div>
                )}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {s.eta}
              </div>
              <div className="my-4 h-px bg-border/70" />
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {s.includes.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Starting prices reflect typical task minimums in active markets. Investors set the final price when posting a task. A small platform fee is added at checkout.
        </p>
      </section>

      {/* CTA */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-5xl px-5 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Need a custom rate sheet?</h2>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Investors with recurring portfolios or bulk task volume get custom pricing. Talk to our team to set one up.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="mailto:support@reirunner.com" className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-gradient-primary shadow-glow text-sm font-medium text-primary-foreground">
              Contact Sales <ArrowRight className="size-4" />
            </a>
            <Link to="/signup" search={{ role: "investor", redirect: "/dashboard" }} className="inline-flex items-center h-12 px-6 rounded-md border border-border bg-card text-sm font-medium hover:bg-card/80 transition">
              Post a Task
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Pricing FAQ</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="rounded-xl border border-border bg-card/60 px-5">
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
            <Link to="/signup" search={{ role: "investor", redirect: "/dashboard" }}>
              Get Started <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}