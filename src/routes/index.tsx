import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, ArrowRight, Mail } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REI Runner | We're making improvements — back soon" },
      {
        name: "description",
        content:
          "REI Runner is going through some big updates. We're polishing the marketplace before our next launch — please check back soon.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "REI Runner | We're making improvements" },
      {
        property: "og:description",
        content:
          "We're rolling out major updates to REI Runner. Check back shortly — or apply now to be a Founding Runner.",
      },
    ],
  }),
  component: HoldingPage,
});

function HoldingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="absolute inset-0 -z-10 bg-hero opacity-90" />
      <div aria-hidden className="absolute inset-0 -z-10 grid-bg opacity-40" />
      <div
        aria-hidden
        className="absolute -top-40 -left-40 -z-10 h-[36rem] w-[36rem] rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-40 -z-10 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <img
          src="/rei-runner-logo.png"
          alt="REI Runner"
          className="mb-8 h-16 w-16 object-contain"
        />

        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Wrench className="size-3.5 text-primary" />
          Major updates in progress
        </span>

        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          We're making <span className="text-primary">REI Runner</span> better.
        </h1>

        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          We're rolling out some big improvements to the marketplace, runner
          tools, and investor dashboard. The site will be back online shortly —
          thanks for your patience while we put the finishing touches on what's
          next.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/apply"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-primary px-5 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            Apply to be a Founding Runner
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="mailto:support@reirunner.com"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-background/60 px-5 text-sm font-medium text-foreground backdrop-blur transition hover:bg-accent hover:text-accent-foreground"
          >
            <Mail className="size-4" />
            support@reirunner.com
          </a>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}