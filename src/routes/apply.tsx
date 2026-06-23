import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flag, ArrowLeft, Sparkles, Clock, ShieldCheck, Zap, Briefcase, Footprints, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { FieldRunnerForm, ProForm } from "@/components/landing/ApplicationForms";

export const Route = createFileRoute("/apply")({
  validateSearch: (s: Record<string, unknown>) => ({
    role:
      s.role === "runner" || s.role === "investor"
        ? (s.role as "runner" | "investor")
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Apply — REI Runner" },
      {
        name: "description",
        content:
          "Apply to REI Runner as a Field Runner or as an Investor. Your application creates your account.",
      },
      { property: "og:title", content: "Apply — REI Runner" },
      {
        property: "og:description",
        content:
          "Choose Runner or Investor and apply. Your application creates your REI Runner account.",
      },
      { property: "og:url", content: "https://reirunner.com/apply" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/apply" }],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();

  if (!role) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Toaster richColors closeButton position="top-center" theme="dark" />
        <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
            <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </div>
        </header>
        <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
              <Sparkles className="size-3.5" /> Get started
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">How do you want to join?</h1>
            <p className="mt-4 text-muted-foreground text-base md:text-lg">
              Pick a path. Your application will also create your REI Runner account.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate({ to: "/apply", search: { role: "runner" } })}
              className="group text-left rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-7 shadow-card hover:border-primary/60 transition"
            >
              <div className="size-10 rounded-xl bg-primary/15 text-primary grid place-items-center mb-4">
                <Footprints className="size-5" />
              </div>
              <h2 className="text-xl font-semibold">Become a Runner</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Get paid completing property photos, walkthroughs, occupancy checks, and other field tasks.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Apply as a Runner <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => navigate({ to: "/apply", search: { role: "investor" } })}
              className="group text-left rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-7 shadow-card hover:border-primary/60 transition"
            >
              <div className="size-10 rounded-xl bg-primary/15 text-primary grid place-items-center mb-4">
                <Briefcase className="size-5" />
              </div>
              <h2 className="text-xl font-semibold">Join as an Investor</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Post property tasks and hire vetted local runners in our active U.S. markets.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Apply as an Investor <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" search={{ redirect: "/dashboard" }} className="text-primary hover:underline">Sign in</Link>
          </p>
        </section>
      </div>
    );
  }

  const isRunner = role === "runner";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-center" theme="dark" />

      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home">
            <BrandLogo />
          </Link>
          <button
            type="button"
            onClick={() => navigate({ to: "/apply", search: {} })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-4" /> Change path
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
            <Sparkles className="size-3.5" /> {isRunner ? "Founding Runner Program" : "Investor Early Access"}
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
            {isRunner ? "Become a Founding Runner" : "Apply as an Investor"}
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            {isRunner
              ? "Join the field operations network for real estate investors — launching market-by-market across the U.S."
              : "Post property tasks and hire vetted local runners in our active U.S. markets."}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-sm text-amber-300">
            <Clock className="size-4" />
            <span className="font-semibold">Limited beta spots</span>
            <span className="text-amber-300/70">— applications reviewed weekly</span>
          </div>
        </div>

        {isRunner && (
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
        )}

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          {isRunner ? <FieldRunnerForm /> : <ProForm />}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Submitting this application creates your REI Runner account.
        </p>
      </section>
    </div>
  );
}