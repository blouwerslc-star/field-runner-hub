import { createFileRoute, Link } from "@tanstack/react-router";
import { Flag, ArrowLeft } from "lucide-react";
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
          <div className="text-xs font-semibold tracking-widest text-primary uppercase">Apply Now</div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold">Become a Founding Runner</h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Limited spots during beta launch. Applications reviewed weekly.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm text-center text-foreground">
          <Flag className="size-4 text-primary inline-block mr-2 -mt-0.5" />
          Founding Runners get priority access, first pick of leads, and lifetime perks.
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <FieldRunnerForm />
        </div>
      </section>
    </div>
  );
}