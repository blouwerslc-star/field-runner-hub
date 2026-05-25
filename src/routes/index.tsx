import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Camera,
  Video,
  Home,
  KeyRound,
  Signpost,
  Hammer,
  Car,
  Plug,
  DoorOpen,
  Handshake,
  Ruler,
  Trash2,
  MapPin,
  Send,
  CheckCircle2,
  Building2,
  Users,
  Zap,
  ShieldCheck,
  Wallet,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { FieldRunnerForm, ProForm } from "@/components/landing/ApplicationForms";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "REI Runner | Real Estate Field Services Marketplace" },
      {
        name: "description",
        content:
          "REI Runner connects real estate investors, wholesalers, agents, and property managers with local field runners for property photos, walkthrough videos, occupancy checks, and more.",
      },
      { property: "og:title", content: "REI Runner | Real Estate Field Services Marketplace" },
      {
        property: "og:description",
        content:
          "Uber + Fiverr for real estate field services. Boots on the ground for investors, wholesalers, agents, landlords, and property managers.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "REI Runner",
          description:
            "Marketplace connecting real estate professionals with local field runners for non-licensed real estate support services.",
          url: "/",
        }),
      },
    ],
  }),
});

const SERVICES = [
  { icon: Camera, label: "Property Photos" },
  { icon: Video, label: "Walkthrough Videos" },
  { icon: Home, label: "Occupancy Checks" },
  { icon: KeyRound, label: "Lockbox Installation" },
  { icon: Signpost, label: "Yard Sign Placement" },
  { icon: Hammer, label: "Rehab Progress Photos" },
  { icon: Car, label: "Drive-By Inspections" },
  { icon: Plug, label: "Utility Status Checks" },
  { icon: DoorOpen, label: "Open House Support" },
  { icon: Handshake, label: "Contractor Meetup Assistance" },
  { icon: Ruler, label: "Basic Measurements" },
  { icon: Trash2, label: "Trash-Out Coordination" },
];

const FAQS = [
  {
    q: "Do field runners need a real estate license?",
    a: "No. REI Runner is designed only for non-licensed support tasks such as photos, videos, drive-by checks, and property updates.",
  },
  {
    q: "Can field runners negotiate deals or show houses?",
    a: "No. Field runners cannot represent buyers or sellers, negotiate contracts, provide pricing advice, conduct appraisals, or perform licensed real estate activity.",
  },
  {
    q: "Who is REI Runner for?",
    a: "REI Runner is built for wholesalers, investors, realtors, property managers, landlords, lenders, and rehabbers who need local boots on the ground.",
  },
  {
    q: "What markets are launching first?",
    a: "REI Runner is beginning in select high-investor activity markets and expanding based on demand.",
  },
  {
    q: "How do payments work?",
    a: "Approved users will receive onboarding details before accepting or posting tasks during the early launch phase.",
  },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Index() {
  const [tab, setTab] = useState<"runner" | "pro">("runner");

  const goApply = (which: "runner" | "pro") => {
    setTab(which);
    scrollToId("apply");
  };

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
            <button onClick={() => scrollToId("services")} className="hover:text-foreground transition">Services</button>
            <button onClick={() => scrollToId("runners")} className="hover:text-foreground transition">For Runners</button>
            <button onClick={() => scrollToId("pros")} className="hover:text-foreground transition">For Pros</button>
            <button onClick={() => scrollToId("faq")} className="hover:text-foreground transition">FAQ</button>
          </nav>
          <Button onClick={() => goApply("pro")} size="sm" className="bg-gradient-primary shadow-glow">
            Get Early Access
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-hero"
        />
        <img
          src={heroBg}
          alt=""
          aria-hidden
          width={1920}
          height={1280}
          className="absolute inset-0 -z-10 w-full h-full object-cover opacity-30"
        />
        <div aria-hidden className="absolute inset-0 -z-10 grid-bg" />
        <div aria-hidden className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-primary/20 blur-3xl animate-blob -z-10" />
        <div aria-hidden className="absolute -bottom-40 -right-20 w-[32rem] h-[32rem] rounded-full bg-primary-glow/20 blur-3xl animate-blob -z-10" style={{ animationDelay: "3s" }} />

        <div className="mx-auto max-w-7xl px-5 pt-20 pb-28 md:pt-28 md:pb-36 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur text-xs text-muted-foreground animate-fade-up">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Launching soon · Early access open
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Boots on the Ground for
            <br />
            <span className="text-gradient">Real Estate Investors</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "0.2s" }}>
            REI Runner connects investors, wholesalers, agents, landlords, and
            property managers with local field runners who can complete property
            photos, walkthrough videos, occupancy checks, and more.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" onClick={() => goApply("runner")} className="bg-gradient-primary shadow-glow text-base h-12 px-6">
              Apply as a Field Runner <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => goApply("pro")} className="h-12 px-6 text-base border-border/80 bg-card/40 backdrop-blur hover:bg-card">
              Join as a Real Estate Pro
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.4s" }}>
            Launching soon in select markets. Early applicants receive priority access.
          </p>
        </div>
      </section>

      {/* PROBLEM */}
      <Section>
        <SectionHeader
          eyebrow="The Problem"
          title="Real Estate Moves Fast. Finding Local Help Should Too."
        />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Building2, title: "Out-of-State Investors", body: "Need reliable local eyes on properties before making decisions." },
            { icon: Zap, title: "Wholesalers & Flippers", body: "Need fast photos, walkthrough videos, and property updates." },
            { icon: Users, title: "Property Managers & Agents", body: "Need affordable on-demand field support without hiring full-time staff." },
          ].map((c) => (
            <Card key={c.title} icon={c.icon} title={c.title}>{c.body}</Card>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how">
        <SectionHeader eyebrow="How It Works" title="How REI Runner Works" />
        <div className="grid md:grid-cols-3 gap-5 relative">
          {[
            { n: "01", icon: Send, title: "Post a Task", body: "Submit the property address, instructions, deadline, and budget." },
            { n: "02", icon: MapPin, title: "Get Matched", body: "Approved local field runners nearby can accept the task." },
            { n: "03", icon: CheckCircle2, title: "Receive Updates", body: "Photos, videos, and property reports are uploaded directly through the platform." },
          ].map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/40 transition group">
              <div className="text-xs font-mono text-primary mb-3">STEP {s.n}</div>
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4 group-hover:bg-primary/20 transition">
                <s.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
              {i < 2 && (
                <ArrowRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* SERVICES */}
      <Section id="services">
        <SectionHeader eyebrow="Field Services" title="Popular Field Services" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <div key={s.label} className="group rounded-xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/50 hover:-translate-y-1 hover:shadow-glow transition-all duration-300">
              <div className="size-10 rounded-lg bg-primary/10 grid place-items-center mb-3 group-hover:bg-primary/20 transition">
                <s.icon className="size-5 text-primary" />
              </div>
              <div className="text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* FIELD RUNNER */}
      <Section id="runners">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-semibold tracking-widest text-primary uppercase">For Field Runners</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">Get Paid to Complete Simple Real Estate Tasks</h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg">
              If you have a smartphone, reliable transportation, and attention to detail,
              you can apply to become an REI Runner field runner. No real estate license
              required for approved non-licensed support services.
            </p>
            <ul className="mt-6 space-y-3">
              {["Flexible work","Choose your own tasks","Get paid locally","Work on your own schedule","No real estate license required"].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm">
                  <span className="size-5 rounded-full bg-primary/15 grid place-items-center">
                    <CheckCircle2 className="size-3.5 text-primary" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Button size="lg" onClick={() => goApply("runner")} className="mt-8 bg-gradient-primary shadow-glow">
              Apply as a Field Runner <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Wallet, title: "Local pay", body: "Pick tasks near you" },
              { icon: CalendarClock, title: "Your schedule", body: "Day, night, weekends" },
              { icon: ShieldCheck, title: "Vetted tasks", body: "Non-licensed support only" },
              { icon: Zap, title: "Quick onboarding", body: "Apply in minutes" },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 shadow-card">
                <c.icon className="size-5 text-primary mb-3" />
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* REAL ESTATE PRO */}
      <Section id="pros">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "Faster updates", body: "Property reports in hours" },
              { icon: ShieldCheck, title: "Standardized", body: "Consistent task requests" },
              { icon: Users, title: "Reliable help", body: "Not Craigslist" },
              { icon: Building2, title: "Scalable", body: "Across every market" },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 shadow-card">
                <c.icon className="size-5 text-primary mb-3" />
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.body}</div>
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-xs font-semibold tracking-widest text-primary uppercase">For Real Estate Pros</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">Need Reliable Local Help for Your Deals?</h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg">
              REI Runner helps investors, wholesalers, agents, landlords, lenders, and
              property managers quickly find local help for field tasks without relying
              on Craigslist or Facebook groups.
            </p>
            <ul className="mt-6 space-y-3">
              {["Faster property updates","Standardized task requests","Reliable local help","Scalable field support","Better visibility on remote properties"].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm">
                  <span className="size-5 rounded-full bg-primary/15 grid place-items-center">
                    <CheckCircle2 className="size-3.5 text-primary" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Button size="lg" onClick={() => goApply("pro")} className="mt-8 bg-gradient-primary shadow-glow">
              Join as a Real Estate Pro <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </Section>

      {/* APPLY */}
      <Section id="apply">
        <SectionHeader
          eyebrow="Get Started"
          title="Join the REI Runner Network"
          subtitle="Apply as a field runner, or claim early access for your real estate business. Takes under 2 minutes."
        />
        <div className="max-w-3xl mx-auto">
          <ApplicationFormsControlled tab={tab} onTabChange={setTab} />
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
          property management company, or legal service. Field runners only perform approved
          non-licensed support services. They do not negotiate contracts, represent buyers or
          sellers, provide real estate advice, conduct appraisals, or perform any activity
          requiring a professional license.
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-hero -z-10" />
        <div aria-hidden className="absolute inset-0 grid-bg -z-10" />
        <div className="mx-auto max-w-5xl px-5 py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold">
            Join the Future of <span className="text-gradient">Real Estate Field Services</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Be among the first real estate professionals and field runners to join the REI Runner network.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => goApply("runner")} className="bg-gradient-primary shadow-glow h-12 px-6 text-base">
              Apply as a Field Runner
            </Button>
            <Button size="lg" variant="outline" onClick={() => goApply("pro")} className="h-12 px-6 text-base border-border/80 bg-card/40 backdrop-blur hover:bg-card">
              Join as a Real Estate Pro
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 mt-4">
        <div className="mx-auto max-w-7xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-md bg-gradient-primary grid place-items-center">
              <MapPin className="size-3.5 text-primary-foreground" />
            </span>
            REI Runner
          </div>
          <div>© {new Date().getFullYear()} REI Runner. All rights reserved.</div>
        </div>
      </footer>
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

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-card hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
      <div className="size-11 rounded-xl bg-primary/10 grid place-items-center mb-4">
        <Icon className="size-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function ApplicationFormsControlled({
  tab,
  onTabChange,
}: {
  tab: "runner" | "pro";
  onTabChange: (t: "runner" | "pro") => void;
}) {
  // Re-mount when tab switches via state so we can show the chosen form.
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-muted/40 border border-border">
        <button
          onClick={() => onTabChange("runner")}
          className={`h-11 rounded-lg text-sm font-medium transition ${tab === "runner" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
        >
          Field Runner Application
        </button>
        <button
          onClick={() => onTabChange("pro")}
          className={`h-11 rounded-lg text-sm font-medium transition ${tab === "pro" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
        >
          Real Estate Pro Early Access
        </button>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
        {tab === "runner" ? <FieldRunnerForm key="r" /> : <ProForm key="p" />}
      </div>
    </div>
  );
}
