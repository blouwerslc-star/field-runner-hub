import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MapPin,
  Send,
  ShieldCheck,
  Wallet,
  CalendarClock,
  ArrowRight,
  Search,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Network,
  PlayCircle,
  Mail,
  Flag,
  Sparkles,
} from "lucide-react";
import { FieldRunnerForm } from "@/components/landing/ApplicationForms";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "REI Runner | Get Paid Finding Real Estate Opportunities" },
      {
        name: "description",
        content:
          "Join the nationwide REI Runner network. Local field agents connect investors with distressed and off-market properties — and get paid when leads close.",
      },
      { property: "og:title", content: "REI Runner | Get Paid Finding Real Estate Opportunities" },
      {
        property: "og:description",
        content:
          "Become a Founding Runner. Earn money helping investors find distressed and off-market properties in your city.",
      },
      { property: "og:url", content: "https://reirunner.com/" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "REI Runner",
          description:
            "Nationwide field acquisition network connecting local runners with real estate investors looking for distressed and off-market properties.",
          url: "https://reirunner.com/",
        }),
      },
    ],
  }),
});

const MARKETS = [
  "Detroit", "Atlanta", "Dallas", "Phoenix",
  "Tampa", "Indianapolis", "Cleveland", "Chicago",
];

const STATS = [
  { value: 240, suffix: "+", label: "Applications Submitted" },
  { value: 12, suffix: "", label: "Cities Covered" },
  { value: 38, suffix: "", label: "Active Investors" },
  { value: 410, suffix: "+", label: "Leads Reviewed" },
];

const STEPS = [
  { n: "01", icon: Search, title: "Find Opportunities", body: "Spot distressed, vacant, or off-market properties in your neighborhood." },
  { n: "02", icon: Send, title: "Submit Leads", body: "Share addresses, photos, and notes through REI Runner." },
  { n: "03", icon: ShieldCheck, title: "Investors Review", body: "Verified investors actively review your leads for off-market deals." },
  { n: "04", icon: DollarSign, title: "Get Paid", body: "Earn when your submitted leads turn into closed deals." },
];

const BENEFITS = [
  { icon: Wallet, title: "Flexible side income", body: "Work nights, weekends, or whenever you want." },
  { icon: GraduationCap, title: "Learn real estate", body: "Real experience finding off-market opportunities." },
  { icon: Network, title: "Build investor relationships", body: "Connect directly with active local investors." },
  { icon: ShieldCheck, title: "No license required", body: "Anyone can become a runner — no real estate license needed." },
  { icon: CalendarClock, title: "Your own schedule", body: "Set your own pace. No quotas, no managers." },
  { icon: TrendingUp, title: "Nationwide opportunities", body: "We're expanding to every major US market." },
];

const FAQS = [
  { q: "What is REI Runner?", a: "REI Runner is a nationwide field acquisition network connecting local people who spot distressed and off-market properties with real estate investors actively looking to buy them." },
  { q: "How do runners make money?", a: "Runners earn when the leads they submit are reviewed and turned into closed deals by investors in the network. You're paid for finding opportunities." },
  { q: "Do I need real estate experience?", a: "No experience required. If you can drive your city and spot vacant, neglected, or for-sale-by-owner properties, you can be a runner." },
  { q: "What kinds of properties qualify?", a: "Vacant, distressed, fire-damaged, code violations, abandoned, hoarder homes, FSBO signs, and other off-market properties investors can't easily find on the MLS." },
  { q: "Is this available nationwide?", a: "We're launching first in Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, and Chicago — then expanding nationwide. Apply now to be a Founding Runner in your city." },
  { q: "How often are payouts made?", a: "Payouts are issued as deals close. Approved runners receive full onboarding details with payout schedules and methods (Direct Deposit, PayPal, Venmo, Zelle)." },
  { q: "Is there a mobile app coming?", a: "Yes. The REI Runner mobile app is in active development for iOS and Android. Founding Runners get early access." },
  { q: "How do investors use the platform?", a: "Verified investors get a live feed of qualified leads in their target markets, complete with photos, notes, and location data — so they can move on the right deals fast." },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useCountUp(target: number, duration = 1600) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.floor(eased * target));
            if (t < 1) requestAnimationFrame(step);
            else setVal(target);
          };
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);
  return { ref, val };
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, val } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-5xl font-bold text-gradient tabular-nums">
        {val.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-xs md:text-sm text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Index() {
  const goApply = () => scrollToId("apply");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Toaster richColors closeButton position="top-center" theme="dark" />

      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="size-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <MapPin className="size-4 text-primary-foreground" />
            </span>
            REI <span className="text-primary">Runner</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <button onClick={() => scrollToId("how")} className="hover:text-foreground transition">How it works</button>
            <button onClick={() => scrollToId("why")} className="hover:text-foreground transition">Why join</button>
            <button onClick={() => scrollToId("markets")} className="hover:text-foreground transition">Markets</button>
            <button onClick={() => scrollToId("faq")} className="hover:text-foreground transition">FAQ</button>
          </nav>
          <Button onClick={goApply} size="sm" className="bg-gradient-primary shadow-glow">
            Apply Now
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-hero" />
        <img
          src={heroBg}
          alt=""
          aria-hidden
          width={1920}
          height={1280}
          className="absolute inset-0 -z-10 w-full h-full object-cover opacity-25"
        />
        <div aria-hidden className="absolute inset-0 -z-10 grid-bg" />
        <div aria-hidden className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-primary/20 blur-3xl animate-blob -z-10" />
        <div aria-hidden className="absolute -bottom-40 -right-20 w-[32rem] h-[32rem] rounded-full bg-primary-glow/20 blur-3xl animate-blob -z-10" style={{ animationDelay: "3s" }} />

        {/* animated property pins */}
        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
          {[
            { top: "18%", left: "12%", d: "0s" },
            { top: "32%", left: "78%", d: "0.6s" },
            { top: "62%", left: "22%", d: "1.2s" },
            { top: "72%", left: "70%", d: "1.8s" },
            { top: "44%", left: "48%", d: "0.3s" },
          ].map((p, i) => (
            <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
              <span className="relative block size-3">
                <span className="absolute inset-0 rounded-full bg-primary animate-pulse-ring" style={{ animationDelay: p.d }} />
                <span className="absolute inset-0 rounded-full bg-primary shadow-glow animate-pin" style={{ animationDelay: p.d }} />
              </span>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-7xl px-5 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur text-xs text-muted-foreground animate-fade-up">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Founding Runner Beta · Now accepting applications
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Get Paid Finding
            <br />
            <span className="text-gradient">Real Estate Opportunities</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Join the nationwide REI Runner network connecting local field agents with real estate investors actively looking for distressed properties and off-market deals.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" onClick={goApply} className="bg-gradient-primary shadow-glow text-base h-14 px-8">
              Apply Now <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollToId("how")} className="h-14 px-8 text-base bg-background/40 backdrop-blur">
              See How It Works
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.4s" }}>
            Applications reviewed weekly · Founding Runner spots limited during beta launch
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/60 bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section id="how">
        <SectionHeader eyebrow="How It Works" title="From Sidewalk to Payday in 4 Steps" subtitle="A simple loop: find, submit, get reviewed, and earn when deals close." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="text-xs font-mono text-primary mb-3">STEP {s.n}</div>
              <div className="size-12 rounded-xl bg-primary/10 grid place-items-center mb-4 group-hover:bg-primary/20 transition">
                <s.icon className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* WHY JOIN */}
      <Section id="why">
        <SectionHeader eyebrow="Why People Join" title="Built for Hustlers, Side-Hustlers, and Future Investors" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <b.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* MARKETS */}
      <Section id="markets">
        <SectionHeader eyebrow="Nationwide Launch" title="Launching in Major Markets" subtitle="We're starting in 8 high-opportunity cities and expanding fast. Don't see your city? Apply anyway — we open new markets weekly." />
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {MARKETS.map((m) => (
            <div key={m} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card/60 backdrop-blur text-sm hover:border-primary/60 hover:shadow-glow transition">
              <MapPin className="size-3.5 text-primary" />
              {m}
            </div>
          ))}
        </div>
      </Section>

      {/* VIDEO */}
      <Section>
        <SectionHeader eyebrow="Watch" title="What Is REI Runner?" subtitle="A 60-second look at how we're building the modern real estate field network." />
        <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden shadow-card aspect-video grid place-items-center relative group">
          <div aria-hidden className="absolute inset-0 bg-hero opacity-60" />
          <div aria-hidden className="absolute inset-0 grid-bg opacity-50" />
          <button onClick={goApply} className="relative z-10 flex flex-col items-center gap-3 text-foreground">
            <span className="size-20 rounded-full bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-110 transition-transform">
              <PlayCircle className="size-10 text-primary-foreground" />
            </span>
            <span className="text-sm text-muted-foreground">Founder explainer video — coming soon</span>
          </button>
        </div>
      </Section>

      {/* ABOUT */}
      <Section>
        <div className="relative rounded-3xl border border-border bg-card/60 backdrop-blur p-8 md:p-14 overflow-hidden shadow-card">
          <div aria-hidden className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="text-xs font-semibold tracking-widest text-primary uppercase flex items-center gap-2">
              <Sparkles className="size-3.5" /> About REI Runner
            </div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">A Nationwide Field Acquisition Network for Real Estate Investors</h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg">
              We're building the modern infrastructure for off-market real estate. Local runners surface the properties that never hit Zillow. Investors get a live, verified feed of opportunities in their target cities. Everyone gets paid when deals close.
            </p>
            <p className="mt-3 text-muted-foreground text-base md:text-lg">
              No license required. No middlemen. No outdated lead lists. Just boots-on-the-ground intelligence built for hustlers and the investors who need them.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Founding Members", "Early Access Beta", "Nationwide Launch", "Built for Hustlers"].map((t) => (
                <span key={t} className="text-xs px-3 py-1 rounded-full border border-border bg-background/40">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* INVESTOR STRIP */}
      <section className="border-y border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold tracking-widest text-primary uppercase">For Investors</div>
            <h3 className="mt-2 text-2xl md:text-3xl font-bold">Are you an investor looking for deal flow?</h3>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
              Get a live feed of verified off-market leads from runners in your target markets.
            </p>
          </div>
          <a
            href="mailto:investors@reirunner.com?subject=Investor%20Waitlist"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-gradient-primary shadow-glow text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Join Investor Waitlist <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* APPLY */}
      <Section id="apply">
        <SectionHeader
          eyebrow="Apply Now"
          title="Become a Founding Runner"
          subtitle="Limited spots during beta launch. Applications reviewed weekly."
        />
        <div className="max-w-3xl mx-auto">
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm text-center text-foreground">
            <Flag className="size-4 text-primary inline-block mr-2 -mt-0.5" />
            Founding Runners get priority access, first pick of leads, and lifetime perks.
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
            <FieldRunnerForm />
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <SectionHeader eyebrow="FAQ" title="Frequently Asked Questions" />
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
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
      </Section>

      {/* DISCLAIMER */}
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="rounded-xl border border-border bg-muted/30 p-5 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Disclaimer:</strong> REI Runner is not a real estate brokerage, inspection company, appraisal company,
          property management company, or legal service. Runners only perform approved non-licensed activity — spotting, photographing, and submitting publicly observable property information. They do not negotiate contracts, represent buyers or sellers, provide real estate advice, or perform any activity requiring a professional license.
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 mt-4 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-semibold">
              <span className="size-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                <MapPin className="size-4 text-primary-foreground" />
              </span>
              REI <span className="text-primary">Runner</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              Building a nationwide field acquisition network for real estate investors. Local hustlers, real opportunities, real payouts.
            </p>
            <a href="mailto:hello@reirunner.com" className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Mail className="size-4" /> hello@reirunner.com
            </a>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground mb-3">Platform</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => scrollToId("how")} className="hover:text-foreground">How it works</button></li>
              <li><button onClick={() => scrollToId("why")} className="hover:text-foreground">Why join</button></li>
              <li><button onClick={() => scrollToId("markets")} className="hover:text-foreground">Markets</button></li>
              <li><button onClick={goApply} className="hover:text-foreground">Apply</button></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground mb-3">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>© {new Date().getFullYear()} REI Runner. All rights reserved.</div>
            <div>Built in the USA 🇺🇸</div>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-50">
        <Button onClick={goApply} className="w-full h-12 bg-gradient-primary shadow-glow text-base">
          Apply Now <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>
      <div className="md:hidden h-20" aria-hidden />
    </div>
  );
}

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-5 py-20 md:py-28">
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12 max-w-3xl mx-auto">
      {eyebrow && (
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">{eyebrow}</div>
      )}
      <h2 className="mt-3 text-3xl md:text-5xl font-bold">{title}</h2>
      {subtitle && <p className="mt-4 text-muted-foreground text-base md:text-lg">{subtitle}</p>}
    </div>
  );
}
