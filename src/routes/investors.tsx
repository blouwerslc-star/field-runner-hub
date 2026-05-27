import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ArrowLeft } from "lucide-react";
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

function InvestorsPage() {
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
          <div className="text-xs font-semibold tracking-widest text-primary uppercase">For Investors</div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold">Hire Local Runners On Demand</h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Tell us about your market and the field tasks you need. We'll match you with vetted runners as REI Runner launches in your area.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm text-center text-foreground">
          <Building2 className="size-4 text-primary inline-block mr-2 -mt-0.5" />
          Founding investors get priority match, lower beta pricing, and first pick of runners.
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <ProForm />
        </div>
      </section>
    </div>
  );
}