import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy Policy | REI Runner" },
      { name: "description", content: "How REI Runner collects, uses, and protects your information." },
      { property: "og:title", content: "Privacy Policy | REI Runner" },
      { property: "og:description", content: "How REI Runner collects, uses, and protects your information." },
      { property: "og:url", content: "https://reirunner.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/privacy" }],
  }),
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
        <h1 className="mt-6 text-4xl md:text-5xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-invert mt-8 space-y-6 text-muted-foreground">
          <p>This Privacy Policy explains how REI Runner collects, uses, and protects information from runners, investors, and visitors to our platform.</p>
          <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
          <p>Name, email, phone, address, location, vehicle and availability information, background-check consent, and any other details you submit through our application or platform forms.</p>
          <h2 className="text-xl font-semibold text-foreground">How We Use Information</h2>
          <p>We use your information to operate the platform, match runners with investors, process payouts, communicate updates, and improve REI Runner over time.</p>
          <h2 className="text-xl font-semibold text-foreground">Sharing</h2>
          <p>We do not sell personal information. We share only what is necessary with verified investors to deliver leads and with service providers who power the platform (e.g. payment processors, hosting providers).</p>
          <h2 className="text-xl font-semibold text-foreground">Your Choices</h2>
          <p>You can request access, correction, or deletion of your information at any time by emailing <a className="text-primary hover:underline" href="mailto:hello@reirunner.com">hello@reirunner.com</a>.</p>
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
          <p>We use industry-standard safeguards to protect your data. No system is 100% secure, but we work to keep your information safe.</p>
        </div>
      </div>
    </div>
  );
}