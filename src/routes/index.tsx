import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
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
  Menu,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import heroBg from "@/assets/hero-bg.jpg";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listActivity } from "@/lib/activity.functions";
import { getPublicStats } from "@/lib/public-stats.functions";
import { getCoveragePoints } from "@/lib/public-stats.functions";
import { MarketplaceMap, type MapPoint } from "@/components/maps/MarketplaceMap";

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

// Beta status items — no fabricated metrics. Replace with real DB-backed numbers when available.
const BETA_STATUS = [
  { icon: Users, label: "Founding Runner Applications", value: "Open" },
  { icon: Building2, label: "Investor Applications", value: "Open" },
  { icon: MapPin, label: "Market Coverage", value: "Expanding" },
  { icon: Zap, label: "Marketplace", value: "Early Access" },
];

// Example field-task catalog with payouts, turnaround, and deliverables
const EXAMPLE_TASKS = [
  {
    icon: Camera,
    title: "Property Photo Set",
    payout: "$45 – $85",
    eta: "Varies by market",
    deliverables: ["20+ exterior & interior photos", "Geotagged + timestamped", "Uploaded via mobile app"],
    tag: "Common request",
  },
  {
    icon: Video,
    title: "Walkthrough Video",
    payout: "$75 – $150",
    eta: "Varies by market",
    deliverables: ["Full interior walkthrough", "Narrated condition notes", "HD vertical or horizontal"],
    tag: "Investor request",
  },
  {
    icon: ShieldCheck,
    title: "Occupancy Check",
    payout: "$25 – $50",
    eta: "Varies by market",
    deliverables: ["Vacant / occupied / abandoned", "Exterior photos", "Written observations"],
  },
  {
    icon: MapPin,
    title: "Drive-By Report",
    payout: "$20 – $40",
    eta: "Varies by market",
    deliverables: ["4–6 exterior photos", "Curbside condition notes", "Neighborhood snapshot"],
  },
  {
    icon: ClipboardList,
    title: "Lockbox Install",
    payout: "$30 – $60",
    eta: "Varies by market",
    deliverables: ["Lockbox placed at agreed location", "Photo confirmation", "Code delivered securely"],
  },
  {
    icon: Send,
    title: "Yard Sign Placement",
    payout: "$20 – $35",
    eta: "Varies by market",
    deliverables: ["Sign installed & photographed", "Geotagged proof", "Optional rider attached"],
  },
];

// Real marketplace updates only — no fabricated activity. Pull from live events when available.
const MARKETPLACE_UPDATES = [
  { icon: Users, text: "Beta applications now open for Founding Runners" },
  { icon: Building2, text: "Investor waitlist accepting early-access applications" },
  { icon: MapPin, text: "New cities being onboarded market-by-market" },
  { icon: BadgeCheck, text: "Runner certification program launching" },
  { icon: Sparkles, text: "Platform actively in beta — features rolling out weekly" },
];

const STEPS = [
  { n: "01", icon: ClipboardList, title: "Investor Posts a Task", body: "An investor needs photos, a walkthrough video, an occupancy check, or a drive-by at a specific address." },
  { n: "02", icon: Send, title: "Local Runner Accepts", body: "A vetted runner in that city claims the task and heads to the property." },
  { n: "03", icon: Camera, title: "Runner Completes & Uploads", body: "Photos, video, and notes are uploaded directly through REI Runner. Turnaround varies by market and runner availability." },
  { n: "04", icon: DollarSign, title: "Runner Gets Paid", body: "Payment is released per completed task. No quotas, no long-term commitment." },
];

const BENEFITS = [
  { icon: Wallet, title: "Get paid per task", body: "Clear pricing on every job. Accept the work you want — skip what you don't." },
  { icon: CalendarClock, title: "Work on your schedule", body: "Tasks are independent jobs. No shifts, no quotas, no managers." },
  { icon: ShieldCheck, title: "No license required", body: "Field tasks like photos, videos, and drive-bys don't require a real estate license." },
  { icon: Network, title: "Repeat investor clients", body: "Build a reputation with active investors who post recurring tasks in your city." },
  { icon: Smartphone, title: "Everything in one place", body: "Accept jobs, upload deliverables, and get paid through one mobile-friendly platform." },
  { icon: TrendingUp, title: "Expanding market-by-market", body: "We are onboarding investors and runners in new cities as coverage grows." },
];

const SERVICES = [
  { icon: Camera, title: "Property Photos", body: "Exterior and interior photo sets for listings, inspections, and underwriting." },
  { icon: Video, title: "Walkthrough Videos", body: "Full interior walkthrough videos so investors can underwrite remotely." },
  { icon: MapPin, title: "Drive-By Reports", body: "Quick exterior check with photos and condition notes." },
  { icon: ShieldCheck, title: "Occupancy Checks", body: "Verify whether a property is vacant, occupied, or abandoned." },
  { icon: ClipboardList, title: "Sign & Lockbox Placement", body: "Install or retrieve signs, lockboxes, and other property items." },
  { icon: Clock, title: "Custom Field Tasks", body: "Meet a contractor, take a measurement, check on a tenant turn — investors set the scope." },
];

// Trust signals — only claim what currently exists on the platform.
const TRUST_BADGES = [
  { icon: BadgeCheck, label: "ID Verification Available", detail: "Verification options available for approved runners as part of onboarding." },
  { icon: Lock, label: "Secure Payment Processing", detail: "Secure payment processing is being rolled out as the platform expands." },
  { icon: ShieldCheck, label: "Background Check Option", detail: "Optional background checks available for runners pursuing higher-trust task tiers." },
  { icon: FileText, label: "Signed IC Agreement", detail: "Every runner signs an independent contractor agreement before working." },
  { icon: Building2, label: "US-Registered Business", detail: "REI Runner is a US-based platform with US-based support." },
];

// Payment flow — no escrow claim until escrow is live.
const PAYMENT_FLOW = [
  { step: "01", icon: Wallet, title: "Investor funds the task", body: "When a task is posted, the investor sets the payout amount up front through our payments partner." },
  { step: "02", icon: Send, title: "Runner accepts & completes", body: "A local runner claims the task, completes it on-site, and uploads deliverables through the app." },
  { step: "03", icon: CheckCircle2, title: "Investor reviews", body: "The investor reviews the photos, video, and notes submitted by the runner." },
  { step: "04", icon: DollarSign, title: "Runner gets paid", body: "Once the work is approved, the payout is released to the runner. No invoices, no chasing, no payroll." },
];

// How runners are vetted — only what is in place today.
const VETTING_STEPS = [
  { icon: FileText, title: "Application Review", body: "Every applicant is screened by the REI Runner team before they're invited to onboard." },
  { icon: BadgeCheck, title: "Identity Verification Available", body: "Approved runners can complete ID verification to unlock more tasks." },
  { icon: Smartphone, title: "In-App Onboarding", body: "Runners walk through deliverable standards and conduct expectations inside the app." },
  { icon: ShieldCheck, title: "Performance Tracking", body: "Ratings, response times, and approval rates are tracked. Underperformers are removed." },
];

// What every task includes — operational standards.
const TASK_STANDARDS = [
  { icon: MapPin, title: "Address verification" },
  { icon: ClipboardList, title: "Required deliverables" },
  { icon: Clock, title: "Timestamped uploads" },
  { icon: FileText, title: "Task documentation" },
  { icon: CheckCircle2, title: "Completion tracking" },
];

// What runners may NOT do — legal safety rules.
const RUNNER_RESTRICTIONS = [
  "Enter occupied properties without authorization",
  "Negotiate contracts on behalf of investors",
  "Provide legal advice",
  "Provide real estate advice",
  "Perform licensed inspections or appraisals",
  "Misrepresent themselves as agents, brokers, or inspectors",
];

const FAQS = [
  { q: "What is REI Runner?", a: "REI Runner is an on-demand marketplace that connects real estate investors with local independent contractors (runners) for property field services — photos, walkthrough videos, drive-by reports, occupancy checks, sign and lockbox placement, and other on-site tasks." },
  { q: "How do runners get paid?", a: "Runners are paid per completed task. Each job has a set price posted up front. Once your deliverables are uploaded and approved, payment is released to your account." },
  { q: "Do I need real estate experience or a license?", a: "No. Runners are independent contractors performing non-licensed field work — taking photos, recording videos, and reporting on what they observe. No real estate license required." },
  { q: "What kinds of tasks can investors post?", a: "Property photos, interior walkthrough videos, drive-by condition reports, occupancy checks, sign and lockbox installs, meeting a contractor on-site, measurements, and other simple on-site tasks." },
  { q: "What cities is REI Runner available in?", a: "We are launching market-by-market, starting with Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, and Chicago. Coverage depends on approved runner availability in each market. Apply now to be a Founding Runner in your city." },
  { q: "How fast are tasks completed?", a: "Turnaround times vary by market, task type, and runner availability. We are working to expand local coverage so tasks can be completed quickly in every supported city." },
  { q: "Is there a mobile app?", a: "Yes. The REI Runner mobile app is in active development for iOS and Android. Founding Runners and early investors get first access." },
  { q: "How do investors use the platform?", a: "Investors post a task with the address, task type, and any special instructions. A local runner accepts it, completes the work, and uploads photos, video, and notes through the app." },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function MarketplaceUpdatesTicker() {
  // Pull real platform events; fall back to honest static platform updates. Never invent activity.
  const fetchActivity = useServerFn(listActivity);
  const { data } = useQuery({
    queryKey: ["home-activity-ticker"],
    queryFn: () => fetchActivity({ data: { limit: 12 } }),
    staleTime: 60_000,
    retry: false,
  });
  const liveItems = (data?.events ?? [])
    .filter((e: any) => e?.title)
    .map((e: any) => ({ icon: Sparkles, text: e.title as string }));
  const source = liveItems.length >= 3 ? liveItems : MARKETPLACE_UPDATES;
  const items = [...source, ...source];
  const isLive = liveItems.length >= 3;
  return (
    <section aria-label="Marketplace updates" className="border-y border-border/60 bg-card/40 backdrop-blur overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-border/60">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary">{isLive ? "Live" : "Updates"}</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex gap-10 animate-ticker whitespace-nowrap will-change-transform">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <it.icon className="size-3.5 text-primary shrink-0" />
                <span className="text-foreground/90">{it.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BetaStatusBoard() {
  return _BetaStatusBoardImpl();
}

function PlatformStatsStrip() {
  const fetchStats = useServerFn(getPublicStats);
  const { data } = useQuery({
    queryKey: ["home-public-stats"],
    queryFn: () => fetchStats(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const stats = [
    { label: "Registered investors", value: data?.investors ?? 0 },
    { label: "Approved runners", value: data?.runners ?? 0 },
    { label: "Tasks posted", value: data?.tasks_total ?? 0 },
    { label: "Tasks completed", value: data?.tasks_completed ?? 0 },
    { label: "Active cities", value: data?.cities_active ?? 0 },
    { label: "Avg. rating", value: data?.reviews_count ? `${data.avg_rating} / 5` : "—" },
  ];
  return (
    <section aria-label="Platform stats" className="mx-auto max-w-7xl px-5 pt-8 md:pt-10">
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-primary">Live numbers</div>
          <div className="text-[11px] text-muted-foreground">Updated in real time — no inflated metrics.</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-background/40 p-3">
              <div className="text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function _BetaStatusBoardImpl() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-10 md:pt-14">
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 md:p-7 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary">Beta Status</span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Early-access marketplace</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {BETA_STATUS.map((it) => (
            <div key={it.label} className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                <it.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-xl font-semibold leading-tight">{it.value}</div>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    // Show sticky mobile CTA only after the hero is scrolled past
    const onScroll = () => setShowStickyCta(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeNavThen = (fn: () => void) => () => {
    setMobileNavOpen(false);
    setTimeout(fn, 80);
  };

  const mobileNavLinks: { label: string; id: string }[] = [
    { label: "How it works", id: "how" },
    { label: "How payments work", id: "payments" },
    { label: "How we vet runners", id: "trust" },
    { label: "Services", id: "services" },
    { label: "Why join", id: "why" },
    { label: "Markets", id: "markets" },
    { label: "Our mission", id: "mission" },
    { label: "FAQ", id: "faq" },
  ];

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
            <Link to="/pricing" className="hover:text-foreground transition">Pricing</Link>
            <Link to="/trust" className="hover:text-foreground transition">Trust & Safety</Link>
            <Link to="/story" className="hover:text-foreground transition">Our Story</Link>
            <Link to="/runners" className="hover:text-foreground transition">For Runners</Link>
            <Link to="/investors" className="hover:text-foreground transition">For Investors</Link>
            <Link to="/faq" className="hover:text-foreground transition">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
            <Button onClick={goApply} size="sm" className="bg-gradient-primary shadow-glow">
              Apply Now
            </Button>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="md:hidden inline-flex items-center justify-center size-10 -mr-2 rounded-md text-foreground/80 hover:text-foreground hover:bg-card/60 active:scale-95 transition"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:max-w-sm bg-background/95 backdrop-blur-xl border-l border-border/60 p-0 flex flex-col">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60 text-left">
                  <SheetTitle>
                    <BrandLogo />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                  {mobileNavLinks.map((l) => (
                    <button
                      key={l.id}
                      onClick={closeNavThen(() => scrollToId(l.id))}
                      className="w-full text-left flex items-center justify-between px-3 py-4 rounded-lg text-base text-foreground/90 hover:bg-card/60 active:bg-card transition"
                    >
                      <span>{l.label}</span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </nav>
                <div className="border-t border-border/60 p-5 space-y-3">
                  <SheetClose asChild>
                    <Button onClick={goApply} className="w-full h-12 bg-gradient-primary shadow-glow text-base">
                      Apply Now <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/login"
                      className="block w-full text-center h-12 leading-[3rem] rounded-md border border-border bg-card/60 text-sm font-medium text-foreground/90 hover:bg-card transition"
                    >
                      Sign in
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
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
            REI Runner is the on-demand marketplace where investors hire local runners for property photos, walkthrough videos, drive-bys, occupancy checks, and other field tasks. Turnaround varies by market and runner availability.
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
      <MarketplaceUpdatesTicker />

      {/* BETA STATUS BOARD */}
      <BetaStatusBoard />

      {/* LIVE PLATFORM STATS */}
      <PlatformStatsStrip />

      {/* TRUST BADGES STRIP */}
      <section aria-label="Platform trust signals" className="mx-auto max-w-7xl px-5 pt-8 md:pt-10">
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-5 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <b.icon className="size-4 text-primary" />
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

      {/* SERVICE QUALITY STANDARDS */}
      <Section id="standards">
        <SectionHeader
          eyebrow="Every Task Includes"
          title="Operational Standards on Every Job"
          subtitle="REI Runner tasks follow a consistent structure so investors know exactly what they are getting."
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {TASK_STANDARDS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 text-center">
              <div className="size-10 rounded-xl bg-primary/10 grid place-items-center mx-auto mb-3">
                <s.icon className="size-5 text-primary" />
              </div>
              <div className="text-sm font-medium">{s.title}</div>
            </div>
          ))}
        </div>
      </Section>

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

      {/* HOW PAYMENTS WORK */}
      <Section id="payments">
        <SectionHeader
          eyebrow="How Payments Work"
          title="Simple, Per-Task Payments"
          subtitle="Investors fund tasks up front through our payments partner. Runners are paid once their work is approved."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PAYMENT_FLOW.map((p, i) => (
            <div key={p.step} className="relative rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card">
              <div className="text-xs font-mono text-primary mb-3">STEP {p.step}</div>
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <p.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.body}</p>
              {i < PAYMENT_FLOW.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-3xl mx-auto rounded-xl border border-border bg-muted/30 p-5 text-xs md:text-sm text-muted-foreground leading-relaxed text-center">
          <Lock className="inline size-4 text-primary mr-1.5 -mt-0.5" />
          Payments are processed through a regulated US payments partner. Secure payment processing is being rolled out as the platform expands.
        </div>
      </Section>

      {/* HOW WE VET RUNNERS */}
      <Section id="trust">
        <SectionHeader
          eyebrow="Vetted Network"
          title="How We Vet Every Runner"
          subtitle="REI Runner isn't an open gig board. Every runner is reviewed, verified, and held to a deliverable standard."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VETTING_STEPS.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/40 transition">
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
                <v.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
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
        <SectionHeader eyebrow="Expanding Coverage" title="Launching Market-by-Market" subtitle="Starting in 8 priority investor markets and building local coverage city-by-city. Don't see your city? Apply anyway — new markets open as runner coverage grows." />
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {MARKETS.map((m) => (
            <div key={m} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card/60 backdrop-blur text-sm hover:border-primary/60 hover:shadow-glow transition">
              <MapPin className="size-3.5 text-primary" />
              {m}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Coverage depends on approved runner availability in each market.
        </p>
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
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">On-Demand Field Services For Real Estate Investors</h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg">
              Investing in property you can't physically visit is hard. REI Runner gives investors a vetted network of local runners they can hire on demand — for photos, videos, walkthroughs, drive-bys, and other on-site tasks — without flying out, hiring an agent, or chasing down contractors.
            </p>
            <p className="mt-3 text-muted-foreground text-base md:text-lg">
              For runners, it's a way to earn per-task income with no license, no quotas, and no middlemen. We are positioning REI Runner as a nationwide real estate field operations marketplace — built specifically for the on-site work investors need done.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["On-Demand Marketplace", "Per-Task Pay", "Expanding Coverage", "Early Access Beta"].map((t) => (
                <span key={t} className="text-xs px-3 py-1 rounded-full border border-border bg-background/40">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* FOUNDER / MISSION */}
      <Section id="mission">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <HeartHandshake className="size-3.5" /> Meet the Founder
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Built by an operator who lived the problem.
            </h2>
            <p className="mt-5 text-muted-foreground">
              REI Runner was started by Brian Louwers, a real estate operator who got tired of cold-calling friends-of-friends every time he needed a property checked in another city. The vision is simple: a single, vetted, on-demand network for real estate field work — so investors can operate confidently in any market, and locals can earn real income without a license or a long-term commitment.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              REI Runner is in active beta. We are building this market-by-market, with the people we serve.
            </p>
          </div>
          <div className="lg:col-span-3">
            <div className="relative rounded-3xl border border-border bg-card/60 backdrop-blur p-7 md:p-9 shadow-card">
              <Quote className="absolute -top-3 -left-3 size-8 text-primary bg-background rounded-full p-1.5 border border-border" />
              <p className="text-base md:text-lg leading-relaxed text-foreground/90">
                "I built REI Runner because I lived the problem. Buying a property in another city used to mean calling a friend of a friend to drive by. That doesn't scale — and it shouldn't be how a trillion-dollar industry operates. My job is to make local field work reliable, transparent, and fair to everyone involved."
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="size-14 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
                  <span className="text-primary-foreground font-bold">BL</span>
                </div>
                <div>
                  <div className="font-semibold">Brian Louwers</div>
                  <div className="text-xs text-muted-foreground">Founder · REI Runner · United States</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* RUNNER RESTRICTIONS / SAFETY RULES */}
      <Section id="safety">
        <SectionHeader
          eyebrow="Safety &amp; Scope"
          title="What Runners May Not Do"
          subtitle="Runners are independent contractors performing non-licensed field tasks. The following activities are out of scope."
        />
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8">
          <ul className="space-y-3">
            {RUNNER_RESTRICTIONS.map((r) => (
              <li key={r} className="flex items-start gap-3 text-sm md:text-base text-foreground/90">
                <span className="mt-1 size-4 rounded-full border border-destructive/60 text-destructive grid place-items-center text-[10px] shrink-0">✕</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* CONTACT / SUPPORT */}
      <Section id="contact">
        <SectionHeader
          eyebrow="Support &amp; Contact"
          title="Talk To a Real Person"
          subtitle="We are a small, hands-on team. Reach out — we read everything."
        />
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <a href="mailto:support@reirunner.com" className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/50 transition block">
            <Mail className="size-5 text-primary mb-3" />
            <div className="text-sm font-semibold">Support email</div>
            <div className="text-xs text-muted-foreground mt-1">support@reirunner.com</div>
          </a>
          <Link to="/faq" className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/50 transition block">
            <HelpCircle className="size-5 text-primary mb-3" />
            <div className="text-sm font-semibold">Help center &amp; FAQ</div>
            <div className="text-xs text-muted-foreground mt-1">Answers to the most common questions.</div>
          </Link>
          <a href="mailto:support@reirunner.com?subject=Report%20a%20problem" className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/50 transition block">
            <ShieldCheck className="size-5 text-primary mb-3" />
            <div className="text-sm font-semibold">Report a problem</div>
            <div className="text-xs text-muted-foreground mt-1">Safety, conduct, or platform issues.</div>
          </a>
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
            <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <a href="mailto:support@reirunner.com" className="flex items-center gap-2 hover:text-foreground transition">
                <Mail className="size-4 text-primary" />
                <span>support@reirunner.com</span>
              </a>
              <a href="tel:+18338734786" className="flex items-center gap-2 hover:text-foreground transition">
                <Phone className="size-4 text-primary" /> (833) 873-RUNR
              </a>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" /> Support hours: Mon–Fri, 8am–6pm CT
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" /> US-registered platform · Expanding market-by-market
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground mb-3">Platform</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => scrollToId("how")} className="hover:text-foreground">How it works</button></li>
              <li><button onClick={() => scrollToId("payments")} className="hover:text-foreground">How payments work</button></li>
              <li><button onClick={() => scrollToId("trust")} className="hover:text-foreground">How we vet runners</button></li>
              <li><button onClick={() => scrollToId("services")} className="hover:text-foreground">Services</button></li>
              <li><button onClick={() => scrollToId("why")} className="hover:text-foreground">Why join</button></li>
              <li><button onClick={() => scrollToId("markets")} className="hover:text-foreground">Markets</button></li>
              <li><button onClick={goApply} className="hover:text-foreground">Apply</button></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground mb-3">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/story" className="hover:text-foreground">Our story</Link></li>
              <li><Link to="/trust" className="hover:text-foreground">Trust & Safety</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/investors" className="hover:text-foreground">For investors</Link></li>
              <li><Link to="/runners" className="hover:text-foreground">For runners</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><a href="mailto:support@reirunner.com" className="hover:text-foreground inline-flex items-center gap-1.5"><HelpCircle className="size-3.5" /> Contact support</a></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>© {new Date().getFullYear()} REI Runner, Inc. · Real estate field operations marketplace (beta).</div>
            <div>Built in the USA 🇺🇸</div>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA */}
      <div
        className={`md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-background via-background/95 to-transparent transition-all duration-300 ${
          showStickyCta ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex gap-2">
          <Button
            onClick={goApply}
            className="flex-1 h-12 bg-gradient-primary shadow-glow text-base active:scale-[0.98] transition-transform"
          >
            Apply Now <ArrowRight className="size-4 ml-1" />
          </Button>
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-12 px-4 rounded-md border border-border bg-card/80 backdrop-blur text-sm font-medium text-foreground/90 active:scale-[0.98] transition-transform"
          >
            Sign in
          </Link>
        </div>
      </div>
      <div className="md:hidden h-24" aria-hidden />
    </div>
  );
}

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-5 py-14 md:py-28">
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 md:mb-12 max-w-3xl mx-auto">
      {eyebrow && (
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">{eyebrow}</div>
      )}
      <h2 className="mt-3 text-[1.75rem] leading-tight sm:text-3xl md:text-5xl font-bold">{title}</h2>
      {subtitle && <p className="mt-4 text-muted-foreground text-sm md:text-lg">{subtitle}</p>}
    </div>
  );
}
