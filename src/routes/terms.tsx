import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/SiteHeader";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({
    meta: [
      { title: "Terms of Service | REI Runner" },
      { name: "description", content: "REI Runner Terms of Service — the rules and conditions for runners, investors, and visitors using our platform." },
      { property: "og:title", content: "Terms of Service | REI Runner" },
      { property: "og:description", content: "REI Runner Terms of Service — the rules and conditions for runners, investors, and visitors using our platform." },
      { property: "og:url", content: "https://reirunner.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/terms" }],
  }),
});

function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader currentPath="/terms" />
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
        <h1 className="mt-6 text-4xl md:text-5xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-invert mt-8 space-y-6 text-muted-foreground">
          <p>
            Welcome to REI Runner. By accessing or using our platform, website, or services, you agree to these Terms of Service. If you do not agree, do not use REI Runner.
          </p>
          <h2 className="text-xl font-semibold text-foreground">1. What REI Runner Is</h2>
          <p>
            REI Runner is a U.S. marketplace that connects local field runners with real estate investors looking for distressed and off-market properties. We are launching market-by-market and are not a real estate brokerage, inspection company, appraisal company, property management company, or legal service.
          </p>
          <h2 className="text-xl font-semibold text-foreground">2. Eligibility</h2>
          <p>
            You must be at least 18 years old and legally able to enter into a contract to use REI Runner. Runners may be required to consent to a basic background check before activation.
          </p>
          <h2 className="text-xl font-semibold text-foreground">3. Runner Conduct</h2>
          <p>
            Runners agree to only perform non-licensed activity — observing publicly visible properties, taking photos from public spaces, and submitting accurate lead information. Runners shall not trespass, negotiate contracts, represent buyers or sellers, conduct inspections, or perform any activity requiring a real estate or professional license.
          </p>
          <h2 className="text-xl font-semibold text-foreground">4. Payouts</h2>
          <p>
            Payouts are issued to approved runners according to current platform terms communicated during onboarding. REI Runner reserves the right to update payout terms.
          </p>
          <h2 className="text-xl font-semibold text-foreground">5. Termination</h2>
          <p>
            We may suspend or terminate access at our discretion, including for violations of these terms, fraudulent activity, or unsafe conduct.
          </p>
          <h2 className="text-xl font-semibold text-foreground">6. Contact</h2>
          <p>
            Questions? Email <a className="text-primary hover:underline" href="mailto:hello@reirunner.com">hello@reirunner.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
