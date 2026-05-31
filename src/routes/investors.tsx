import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ArrowLeft, Camera, MapPinned, ShieldCheck, Zap, Receipt, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { ProForm } from "@/components/landing/ApplicationForms";

export const Route = createFileRoute("/investors")({
  head: () => ({
    meta: [
      { title: "Investor Application — REI Runner" },
      {
        name: "description",
        content:
          "Apply for early access to REI Runner as an investor. Hire vetted local runners for photos, videos, drive-bys, and occupancy checks on demand.",
      },
      { property: "og:title", content: "Investor Application — REI Runner" },
      {
        property: "og:description",
        content:
          "Get early access to the REI Runner network of local field runners for real estate investors.",
      },
      { property: "og:url", content: "https://reirunner.com/investors" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/investors" }],
  }),
  component: InvestorsPage,
});

const BENEFITS = [
  { icon: Zap, title: "On-demand coverage", body: "Post a task, get matched with a local runner in markets where you don't have boots on the ground." },
  { icon: ShieldCheck, title: "Vetted runners only", body: "Every runner passes ID verification and a background check before they can claim work." },
  { icon: Camera, title: "Proof of work", body: "Geo-tagged photos, video, and notes submitted on site. Review before you release funds." },
  { icon: Receipt, title: "Flat, transparent pricing", body: "You set the payout. No surprise surcharges, no hourly meter, no platform markup baked in." },
];

const STEPS = [
  { n: "01", t: "Post the task", b: "Address, what you need, the payout, and when it's due." },
  { n: "02", t: "Get matched", b: "We surface vetted local runners. Accept the one you want." },
  { n: "03", t: "Review the work", b: "Photos, video, and notes land in your dashboard. Approve to release payment." },
];

function InvestorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />

      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/tasks" className="text-muted-foreground hover:text-foreground transition">Browse marketplace</Link>
            <Link to="/runners" className="text-muted-foreground hover:text-foreground transition">For runners</Link>
            <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="text-xs font-semibold tracking-widest text-primary uppercase">For Investors</div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Hire local runners on demand</h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Eyes and hands on every property — without flying out, hiring an assistant, or burning the day driving.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card/50 p-5">
              <b.icon className="size-5 text-primary" />
              <div className="mt-3 font-semibold">{b.title}</div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>

        <div className="mb-14">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">How it works</h2>
          <ol className="mt-8 grid md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl border border-border bg-card/40 p-5">
                <div className="text-primary font-mono text-sm">{s.n}</div>
                <div className="mt-2 font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm text-center text-foreground">
            <Building2 className="size-4 text-primary inline-block mr-2 -mt-0.5" />
            Founding investors get priority match, lower beta pricing, and first pick of runners.
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
            <ProForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground inline-flex items-center justify-center w-full gap-2">
            <Users className="size-3.5" />
            Already have an account? <Link to="/login" className="text-foreground hover:text-primary underline-offset-4 hover:underline">Sign in</Link>
            <span>·</span>
            <Link to="/tasks" className="inline-flex items-center gap-1 text-foreground hover:text-primary underline-offset-4 hover:underline"><MapPinned className="size-3.5" /> See the live marketplace</Link>
          </p>
        </div>
      </section>
    </div>
  );
}