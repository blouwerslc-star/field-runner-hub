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
  DollarSign,
  TrendingUp,
  Network,
  PlayCircle,
  Mail,
  Sparkles,
  Camera,
  Video,
  ClipboardList,
  Clock,
  Smartphone,
  Activity,
  CheckCircle2,
  Users,
  Zap,
  Lock,
  BadgeCheck,
  FileText,
  HeartHandshake,
  Building2,
  Phone,
  HelpCircle,
  Quote,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "REI Runner | On-Demand Real Estate Field Services" },
      {
        name: "description",
        content:
          "Hire local runners for property photos, walkthrough videos, occupancy checks, drive-bys, and sign placement — on demand, nationwide.",
      },
      { property: "og:title", content: "REI Runner | On-Demand Real Estate Field Services" },
      {
        property: "og:description",
        content:
          "Hire local boots-on-the-ground for photos, videos, walkthroughs, and property checks — or get paid completing tasks in your city.",
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
            "On-demand marketplace connecting real estate investors with local independent contractors for property field services like photos, videos, walkthroughs, and occupancy checks.",
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
  { value: 240, suffix: "+", label: "Runner Applications" },
  { value: 12, suffix: "", label: "Cities Covered" },
  { value: 38, suffix: "", label: "Investors Onboarding" },
  { value: 8, suffix: "", label: "Service Types" },
];

// Example field-task catalog with payouts, turnaround, and deliverables
const EXAMPLE_TASKS = [
  {
    icon: Camera,
    title: "Property Photo Set",
    payout: "$45 – $85",
    eta: "Same-day",
    deliverables: ["20+ exterior & interior photos", "Geotagged + timestamped", "Uploaded via mobile app"],
    tag: "Most popular",
  },
  {
    icon: Video,
    title: "Walkthrough Video",
    payout: "$75 – $150",
    eta: "24 hours",
    deliverables: ["Full interior walkthrough", "Narrated condition notes", "HD vertical or horizontal"],
    tag: "Investor favorite",
  },
  {
    icon: ShieldCheck,
    title: "Occupancy Check",
    payout: "$25 – $50",
    eta: "Same-day",
    deliverables: ["Vacant / occupied / abandoned", "Exterior photos", "Written observations"],
  },
  {
    icon: MapPin,
    title: "Drive-By Report",
    payout: "$20 – $40",
    eta: "Same-day",
    deliverables: ["4–6 exterior photos", "Curbside condition notes", "Neighborhood snapshot"],
  },
  {
    icon: ClipboardList,
    title: "Lockbox Install",
    payout: "$30 – $60",
    eta: "24–48 hours",
    deliverables: ["Lockbox placed at agreed location", "Photo confirmation", "Code delivered securely"],
  },
  {
    icon: Send,
    title: "Yard Sign Placement",
    payout: "$20 – $35",
    eta: "Same-day",
    deliverables: ["Sign installed & photographed", "Geotagged proof", "Optional rider attached"],
  },
];

// Realistic live-feed seed used by the activity ticker
const ACTIVITY_FEED = [
  { icon: CheckCircle2, text: "Walkthrough video completed in Atlanta, GA", time: "2m ago" },
  { icon: Users, text: "New Founding Runner approved in Tampa, FL", time: "6m ago" },
  { icon: Camera, text: "Property photo set delivered in Detroit, MI", time: "11m ago" },
  { icon: ShieldCheck, text: "Occupancy check verified in Indianapolis, IN", time: "18m ago" },
  { icon: MapPin, text: "Drive-by report uploaded in Dallas, TX", time: "24m ago" },
  { icon: DollarSign, text: "Runner payout released in Phoenix, AZ", time: "32m ago" },
  { icon: ClipboardList, text: "Lockbox installed in Cleveland, OH", time: "41m ago" },
  { icon: Users, text: "Investor onboarded in Chicago, IL", time: "55m ago" },
];

const STEPS = [
  { n: "01", icon: ClipboardList, title: "Investor Posts a Task", body: "An investor needs photos, a walkthrough video, an occupancy check, or a drive-by at a specific address." },
  { n: "02", icon: Send, title: "Local Runner Accepts", body: "A vetted runner in that city claims the task and heads to the property." },
  { n: "03", icon: Camera, title: "Runner Completes & Uploads", body: "Photos, video, and notes are uploaded directly through REI Runner — usually same-day." },
  { n: "04", icon: DollarSign, title: "Runner Gets Paid", body: "Payment is released per completed task. No quotas, no long-term commitment." },
];

const BENEFITS = [
  { icon: Wallet, title: "Get paid per task", body: "Clear pricing on every job. Accept the work you want — skip what you don't." },
  { icon: CalendarClock, title: "Work on your schedule", body: "Tasks are independent jobs. No shifts, no quotas, no managers." },
  { icon: ShieldCheck, title: "No license required", body: "Field tasks like photos, videos, and drive-bys don't require a real estate license." },
  { icon: Network, title: "Repeat investor clients", body: "Build a reputation with active investors who post recurring tasks in your city." },
  { icon: Smartphone, title: "Everything in one place", body: "Accept jobs, upload deliverables, and get paid through one mobile-friendly platform." },
  { icon: TrendingUp, title: "Growing nationwide", body: "More investors and more task volume every week, in every major US market." },
];

const SERVICES = [
  { icon: Camera, title: "Property Photos", body: "Exterior and interior photo sets for listings, inspections, and underwriting." },
  { icon: Video, title: "Walkthrough Videos", body: "Full interior walkthrough videos so investors can underwrite remotely." },
  { icon: MapPin, title: "Drive-By Reports", body: "Quick exterior check with photos and condition notes." },
  { icon: ShieldCheck, title: "Occupancy Checks", body: "Verify whether a property is vacant, occupied, or abandoned." },
  { icon: ClipboardList, title: "Sign & Lockbox Placement", body: "Install or retrieve signs, lockboxes, and other property items." },
  { icon: Clock, title: "Custom Field Tasks", body: "Meet a contractor, take a measurement, check on a tenant turn — investors set the scope." },
];

// Trust signals shown across the top of the marketplace
const TRUST_BADGES = [
  { icon: BadgeCheck, label: "ID-Verified Runners", detail: "Every Founding Runner completes identity verification before activation." },
  { icon: Lock, label: "Escrow-Protected Payments", detail: "Investor funds are held until deliverables are uploaded and approved." },
  { icon: ShieldCheck, label: "Background-Checked", detail: "Optional background checks available for higher-trust task tiers." },
  { icon: FileText, label: "Signed IC Agreement", detail: "Every runner signs an independent contractor agreement before working." },
  { icon: Building2, label: "US-Registered Business", detail: "REI Runner is a US-based platform with US-based support." },
];

// Plain-English payment flow for both sides of the marketplace
const PAYMENT_FLOW = [
  { step: "01", icon: Wallet, title: "Investor funds the task", body: "When a task is posted, the payout amount is authorized and held in escrow — not released to anyone yet." },
  { step: "02", icon: Send, title: "Runner accepts & completes", body: "A local runner claims the task, completes it on-site, and uploads deliverables through the app." },
  { step: "03", icon: CheckCircle2, title: "Investor reviews", body: "The investor reviews the photos, video, and notes. Approval typically happens within 24 hours." },
  { step: "04", icon: DollarSign, title: "Runner gets paid", body: "Once approved, the payout is released directly to the runner. No invoices, no chasing, no payroll." },
];

// How runners are vetted — operational transparency
const VETTING_STEPS = [
  { icon: FileText, title: "Application Review", body: "Every applicant is screened by the REI Runner team before they're invited to onboard." },
  { icon: BadgeCheck, title: "Identity Verification", body: "Government-ID verification is required before a runner can accept their first task." },
  { icon: Smartphone, title: "Mobile Onboarding", body: "Runners complete a short training inside the app covering deliverable standards and conduct." },
  { icon: ShieldCheck, title: "Performance Tracking", body: "Ratings, response times, and approval rates are tracked. Underperformers are removed." },
];

const FAQS = [
  { q: "What is REI Runner?", a: "REI Runner is an on-demand marketplace that connects real estate investors with local independent contractors (runners) for property field services — photos, walkthrough videos, drive-by reports, occupancy checks, sign and lockbox placement, and other on-site tasks." },
  { q: "How do runners get paid?", a: "Runners are paid per completed task. Each job has a set price posted up front. Once your deliverables are uploaded and approved, payment is released to your account." },
  { q: "Do I need real estate experience or a license?", a: "No. Runners are independent contractors performing non-licensed field work — taking photos, recording videos, and reporting on what they observe. No real estate license required." },
  { q: "What kinds of tasks can investors post?", a: "Property photos, interior walkthrough videos, drive-by condition reports, occupancy checks, sign and lockbox installs, meeting a contractor on-site, measurements, and other simple on-site tasks." },
  { q: "What cities is REI Runner available in?", a: "We're launching first in Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, and Chicago — then expanding nationwide. Apply now to be a Founding Runner in your city." },
  { q: "How fast are tasks completed?", a: "Most tasks are accepted within hours and completed same-day or next-day, depending on the runner's schedule and the task type." },
  { q: "Is there a mobile app?", a: "Yes. The REI Runner mobile app is in active development for iOS and Android. Founding Runners and early investors get first access." },
  { q: "How do investors use the platform?", a: "Investors post a task with the address, task type, and any special instructions. A local runner accepts it, completes the work, and uploads photos/video/notes — usually within 24 hours." },
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

function LiveActivityTicker() {
  // Duplicate the feed so the marquee loops seamlessly
  const items = [...ACTIVITY_FEED, ...ACTIVITY_FEED];
  return (
    <section aria-label="Live platform activity" className="border-y border-border/60 bg-card/40 backdrop-blur overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-border/60">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full size-2.5 bg-primary" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary">Live</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex gap-10 animate-ticker whitespace-nowrap will-change-transform">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <it.icon className="size-3.5 text-primary shrink-0" />
                <span className="text-foreground/90">{it.text}</span>
                <span className="text-muted-foreground/70">· {it.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LivePlatformStats() {
  // Lightweight "live" pulse values that drift slightly to feel alive
  const [online, setOnline] = useState(47);
  const [tasksToday, setTasksToday] = useState(31);
  const [citiesActive] = useState(12);
  const [approvedRunners, setApprovedRunners] = useState(183);

  useEffect(() => {
    const t = setInterval(() => {
      setOnline((v) => Math.max(38, Math.min(72, v + (Math.random() > 0.5 ? 1 : -1))));
      if (Math.random() > 0.75) setTasksToday((v) => v + 1);
      if (Math.random() > 0.92) setApprovedRunners((v) => v + 1);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const items = [
    { icon: Activity, label: "Runners online now", value: online, live: true },
    { icon: CheckCircle2, label: "Tasks completed today", value: tasksToday, live: true },
    { icon: MapPin, label: "Cities currently active", value: citiesActive, live: false },
    { icon: Users, label: "Founding Runners approved", value: approvedRunners, live: false },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 pt-10 md:pt-14">
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 md:p-7 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary">Live Platform</span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Updated in real time</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.label} className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                <it.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-2xl md:text-3xl font-bold tabular-nums">{it.value.toLocaleString()}</div>
                  {it.live && (
                    <span className="relative flex size-2 mt-1">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-400" />
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">{it.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Index() {
  const navigate = useNavigate();
  const goApply = () => navigate({ to: "/apply" });
  const goSignupRunner = () => navigate({ to: "/signup", search: { role: "runner", redirect: "/dashboard" } });
  const goSignupInvestor = () => navigate({ to: "/signup", search: { role: "investor", redirect: "/dashboard" } });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Toaster richColors closeButton position="top-center" theme="dark" />

      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <a href="#top" aria-label="REI Runner home">
            <BrandLogo />
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <button onClick={() => scrollToId("how")} className="hover:text-foreground transition">How it works</button>
            <button onClick={() => scrollToId("services")} className="hover:text-foreground transition">Services</button>
            <button onClick={() => scrollToId("why")} className="hover:text-foreground transition">Why join</button>
            <button onClick={() => scrollToId("markets")} className="hover:text-foreground transition">Markets</button>
            <button onClick={() => scrollToId("faq")} className="hover:text-foreground transition">FAQ</button>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
            <Button onClick={goApply} size="sm" className="bg-gradient-primary shadow-glow">
              Apply Now
            </Button>
          </div>
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
            Boots on the Ground
            <br />
            <span className="text-gradient">for Real Estate Investors</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "0.2s" }}>
            REI Runner is the on-demand marketplace where investors hire local runners for property photos, walkthrough videos, drive-bys, occupancy checks, and other field tasks — completed in hours, not days.
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

      {/* LIVE ACTIVITY TICKER */}
      <LiveActivityTicker />

      {/* LIVE PLATFORM INDICATORS */}
      <LivePlatformStats />

      {/* TRUST BADGES STRIP */}
      <section aria-label="Platform trust signals" className="mx-auto max-w-7xl px-5 pt-8 md:pt-10">
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-5 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <b.icon className="size-4.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">{b.label}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{b.detail}</div>
                </div>
              </div>
            ))}
          </div>
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

      {/* EXAMPLE FIELD TASKS */}
      <Section id="example-tasks">
        <SectionHeader
          eyebrow="Example Field Tasks"
          title="Real Tasks. Real Payouts. Real Turnarounds."
          subtitle="A snapshot of the work investors post on REI Runner — with typical payouts and delivery windows."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLE_TASKS.map((t) => (
            <div
              key={t.title}
              className="relative rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {t.tag && (
                <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
                  {t.tag}
                </span>
              )}
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <t.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t.title}</h3>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="inline-flex items-center gap-1.5 text-foreground">
                  <DollarSign className="size-4 text-primary" />
                  <span className="font-semibold tabular-nums">{t.payout}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4" />
                  <span>{t.eta}</span>
                </div>
              </div>
              <div className="my-4 h-px bg-border/70" />
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Deliverables</div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {t.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">
          Payouts vary by market and task complexity. Investors set the final price per task.
        </p>
      </Section>

      {/* TWO-PATH CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="text-center mb-10">
          <div className="text-xs font-mono text-primary uppercase tracking-wider mb-3">Get Started</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Pick your side of the marketplace</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Create a free account in under 60 seconds.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <button onClick={goSignupRunner} className="group text-left rounded-2xl border border-border bg-card/60 backdrop-blur p-8 shadow-card hover:border-primary/60 hover:-translate-y-1 transition-all duration-300">
            <div className="text-xs font-mono text-primary mb-2">FOR RUNNERS</div>
            <h3 className="text-2xl font-bold">I'm a Runner</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get paid completing property tasks in your city — photos, videos, drive-bys, occupancy checks.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-primary font-medium">
              Apply as a Runner <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
          <button onClick={goSignupInvestor} className="group text-left rounded-2xl border border-border bg-card/60 backdrop-blur p-8 shadow-card hover:border-primary/60 hover:-translate-y-1 transition-all duration-300">
            <div className="text-xs font-mono text-primary mb-2">FOR INVESTORS</div>
            <h3 className="text-2xl font-bold">I'm an Investor</h3>
            <p className="mt-2 text-sm text-muted-foreground">Post property tasks and get boots-on-the-ground in any major US market — usually same-day.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-primary font-medium">
              Join Investor Early Access <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section id="how">
        <SectionHeader eyebrow="How It Works" title="On-Demand Field Work in 4 Steps" subtitle="Investors post a task. A local runner accepts, completes it, and gets paid." />
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
        <SectionHeader eyebrow="Why Runners Join" title="Flexible Field Work, Per-Task Pay" subtitle="Built for independent contractors who want to earn on their own schedule." />
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

      {/* SERVICES */}
      <Section id="services">
        <SectionHeader eyebrow="What Runners Do" title="Tasks You Can Get Paid For" subtitle="Every task on REI Runner is a simple, non-licensed field job." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <s.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* MARKETS */}
      <Section id="markets">
        <SectionHeader eyebrow="Nationwide Launch" title="Launching in Major Markets" subtitle="Starting in 8 high-volume investor markets and expanding fast. Don't see your city? Apply anyway — we open new markets weekly." />
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
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">The On-Demand Field Services Marketplace for Real Estate</h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg">
              Investing in property you can't physically visit is hard. REI Runner gives investors a vetted network of local runners they can hire on demand — for photos, videos, walkthroughs, drive-bys, and other on-site tasks — without flying out, hiring an agent, or chasing down contractors.
            </p>
            <p className="mt-3 text-muted-foreground text-base md:text-lg">
              For runners, it's a way to earn per-task income with no license, no quotas, and no middlemen. Think Uber meets Fiverr — built specifically for real estate field work.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["On-Demand Marketplace", "Per-Task Pay", "Nationwide Launch", "Early Access Beta"].map((t) => (
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
            <h3 className="mt-2 text-2xl md:text-3xl font-bold">Need boots on the ground in another city?</h3>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
              Hire vetted local runners for photos, walkthrough videos, drive-bys, and occupancy checks — on demand, in any market we serve.
            </p>
          </div>
          <Link
            to="/investors"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-gradient-primary shadow-glow text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Apply as an Investor <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* APPLY CTA */}
      <Section>
        <SectionHeader
          eyebrow="Apply Now"
          title="Become a Founding Runner"
          subtitle="Limited spots during beta launch. Applications reviewed weekly."
        />
        <div className="flex justify-center">
          <Button size="lg" onClick={goApply} className="bg-gradient-primary shadow-glow text-base h-14 px-8">
            Start Your Application <ArrowRight className="size-4 ml-1" />
          </Button>
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
          property management company, or legal service. Runners are independent contractors who perform approved non-licensed field tasks — taking photos and videos, recording observations, and reporting on visible property conditions. Runners do not negotiate contracts, represent buyers or sellers, provide real estate advice, perform inspections, or perform any activity requiring a professional license.
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 mt-4 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo size="md" />
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              The on-demand field services marketplace for real estate investors. Local runners, real tasks, per-job payouts.
            </p>
            <a href="mailto:hello@reirunner.com" className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Mail className="size-4" /> hello@reirunner.com
            </a>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground mb-3">Platform</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => scrollToId("how")} className="hover:text-foreground">How it works</button></li>
              <li><button onClick={() => scrollToId("services")} className="hover:text-foreground">Services</button></li>
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
