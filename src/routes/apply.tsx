import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag, ArrowLeft, Sparkles, Clock, ShieldCheck, Zap } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { FieldRunnerForm } from "@/components/landing/ApplicationForms";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply to Become a Founding Runner — REI Runner" },
      {
        name: "description",
        content:
          "Apply to become a Founding Runner with REI Runner. Per-task pay, flexible schedule, no real estate license required.",
      },
      { property: "og:title", content: "Apply to Become a Founding Runner — REI Runner" },
      {
        property: "og:description",
        content:
          "Apply to join the REI Runner network of local independent field runners for real estate investors.",
      },
      { property: "og:url", content: "https://reirunner.com/apply" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/apply" }],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />

      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home">
            <BrandLogo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
            <Sparkles className="size-3.5" /> Founding Runner Program
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
            Become a Founding Runner
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Join the nationwide field operations network for real estate investors.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-sm text-amber-300">
            <Clock className="size-4" />
            <span className="font-semibold">Limited beta spots</span>
            <span className="text-amber-300/70">— applications reviewed weekly</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Zap, title: "First pick of leads", desc: "Priority routing in your market" },
            { icon: Flag, title: "Founding badge", desc: "Permanent profile recognition" },
            { icon: ShieldCheck, title: "Lifetime perks", desc: "Lower fees, early features" },
          ].map((p) => (
            <div key={p.title} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p.icon className="size-5 text-primary mb-2" />
              <div className="text-sm font-semibold text-foreground">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <FieldRunnerForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Takes about 3 minutes · Your info is encrypted and never sold
        </p>
      </section>
    </div>
  );
}