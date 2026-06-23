import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Wallet, Clock, ShieldCheck, MapPin, BadgeCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Toaster } from "@/components/ui/sonner";
import { FieldRunnerForm } from "@/components/landing/ApplicationForms";

export const Route = createFileRoute("/runners")({
  head: () => ({
    meta: [
      { title: "Become a Runner — REI Runner" },
      {
        name: "description",
        content:
          "Earn money completing local real estate field tasks: drive-bys, photos, walkthroughs, lockbox installs, and sign placements. Apply to become a vetted REI Runner.",
      },
      { property: "og:title", content: "Become a Runner — REI Runner" },
      {
        property: "og:description",
        content:
          "Get paid to complete short, scheduled real estate field tasks in your city. Background check required. Set your own availability.",
      },
      { property: "og:url", content: "https://reirunner.com/runners" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/runners" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: "Real Estate Field Runner (Independent Contractor)",
          description: "Complete short, scheduled local real estate field tasks — drive-bys, property photos, walkthrough videos, occupancy checks, lockbox installs, and sign placements — on your own schedule.",
          employmentType: "CONTRACTOR",
          hiringOrganization: { "@type": "Organization", name: "REI Runner", sameAs: "https://reirunner.com" },
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "US" },
          datePosted: new Date().toISOString().split("T")[0],
        }),
      },
    ],
  }),
  component: RunnersPage,
});

const PERKS = [
  { icon: Wallet, title: "Transparent pay", body: "See the payout before you accept. Funds release after the investor approves your work." },
  { icon: Clock, title: "Your schedule", body: "Pick tasks that fit your day. No quotas, no minimum hours." },
  { icon: MapPin, title: "Local-first", body: "We surface tasks in your service area so the drive is short." },
  { icon: ShieldCheck, title: "Safety standards", body: "Every investor is verified. We publish lockbox and access protocols runners must follow." },
];

const STEPS = [
  { n: "01", t: "Apply", b: "Tell us your city, vehicle, and the task types you can handle." },
  { n: "02", t: "Verify", b: "Pass a background check and identity verification (~3–5 business days)." },
  { n: "03", t: "Get matched", b: "Receive task offers in your area. Accept the ones that fit." },
  { n: "04", t: "Complete & get paid", b: "Submit photos/video on site. Get paid to your linked account." },
];

function RunnersPage() {
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
          <div className="text-xs font-semibold tracking-widest text-primary uppercase">For Runners</div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold">Get Paid to Complete Local Real Estate Tasks</h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Short, scheduled field jobs in your city — photos, videos, drive-bys, occupancy checks, lockbox installs. Set your own availability.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card/60 backdrop-blur p-4">
              <p.icon className="size-5 text-primary" />
              <div className="mt-2 font-semibold">{p.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{p.body}</div>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <ol className="space-y-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-3 rounded-xl border border-border bg-card/40 p-4">
                <div className="text-primary font-mono text-sm">{s.n}</div>
                <div>
                  <div className="font-semibold">{s.t}</div>
                  <div className="text-sm text-muted-foreground">{s.b}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm text-center text-foreground">
          <BadgeCheck className="size-4 text-primary inline-block mr-2 -mt-0.5" />
          Background check required. We never share your home address or phone number publicly.
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8 shadow-card">
          <FieldRunnerForm />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Questions? See our <Link to="/trust" className="underline hover:text-foreground">Trust &amp; Safety standards</Link> or <Link to="/pricing" className="underline hover:text-foreground">task pricing</Link>.
        </p>
      </section>
    </div>
  );
}