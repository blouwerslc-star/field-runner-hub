import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  { q: "What is REI Runner?", a: "REI Runner is a nationwide field acquisition network connecting local people who spot distressed and off-market properties with real estate investors actively looking to buy them." },
  { q: "How do runners make money?", a: "Runners earn when the leads they submit are reviewed and turned into closed deals by investors in the network." },
  { q: "Do I need real estate experience?", a: "No experience required. If you can drive your city and spot vacant or distressed properties, you can be a runner." },
  { q: "What kinds of properties qualify?", a: "Vacant, distressed, fire-damaged, code violations, abandoned, hoarder homes, FSBO signs, and other off-market properties investors can't easily find on the MLS." },
  { q: "Is this available nationwide?", a: "We're launching in Detroit, Atlanta, Dallas, Phoenix, Tampa, Indianapolis, Cleveland, and Chicago — then expanding nationwide." },
  { q: "How often are payouts made?", a: "Payouts are issued as deals close. Approved runners receive onboarding details with payout schedules and methods." },
  { q: "Is there a mobile app coming?", a: "Yes. The REI Runner mobile app is in active development for iOS and Android. Founding Runners get early access." },
  { q: "How do investors use the platform?", a: "Verified investors get a live feed of qualified leads in their target markets, complete with photos, notes, and location data." },
];

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    meta: [
      { title: "FAQ | REI Runner" },
      { name: "description", content: "Answers to the most common questions about REI Runner, runners, payouts, and investors." },
      { property: "og:title", content: "FAQ | REI Runner" },
      { property: "og:description", content: "Common questions about REI Runner and how the network works." },
      { property: "og:url", content: "https://reirunner.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://reirunner.com/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});

function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
        <h1 className="mt-6 text-4xl md:text-5xl font-bold">Frequently Asked Questions</h1>
        <p className="mt-4 text-muted-foreground">Everything you need to know about becoming a runner and how REI Runner works.</p>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
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
    </div>
  );
}