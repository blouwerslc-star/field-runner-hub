import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ArrowLeft, MapPin, Camera, ShieldCheck, ClipboardList } from "lucide-react";

type Market = {
  slug: string;
  name: string;
  state: string;
  blurb: string;
};

export const MARKETS: Record<string, Market> = {
  detroit: { slug: "detroit", name: "Detroit", state: "MI", blurb: "A core REI Runner market — high investor activity across Wayne, Oakland, and Macomb counties." },
  atlanta: { slug: "atlanta", name: "Atlanta", state: "GA", blurb: "Active investor market across Fulton, DeKalb, Cobb, and Gwinnett counties — high volume on drive-bys and walkthroughs." },
  dallas: { slug: "dallas", name: "Dallas", state: "TX", blurb: "Greater DFW coverage including Tarrant and Collin counties — frequent vacancy checks and contractor meetups." },
  phoenix: { slug: "phoenix", name: "Phoenix", state: "AZ", blurb: "Maricopa County coverage including Mesa, Glendale, Scottsdale, and Chandler — high demand for photo sets and drive-bys." },
  tampa: { slug: "tampa", name: "Tampa", state: "FL", blurb: "Tampa Bay coverage including Hillsborough and Pinellas — heavy on walkthrough video and occupancy checks." },
  indianapolis: { slug: "indianapolis", name: "Indianapolis", state: "IN", blurb: "Marion County and surrounding counties — strong out-of-state investor demand for vacancy and lockbox tasks." },
  cleveland: { slug: "cleveland", name: "Cleveland", state: "OH", blurb: "Cuyahoga County coverage — high volume on photo sets, walkthroughs, and contractor meetups." },
  chicago: { slug: "chicago", name: "Chicago", state: "IL", blurb: "Cook County and the collar counties — recurring out-of-state investor activity on drive-bys and walkthroughs." },
};

const TASK_TYPES = [
  { icon: MapPin, t: "Drive-by reports", b: "Exterior photos and curbside condition notes — usually same-day in active markets." },
  { icon: Camera, t: "Property photo sets & walkthrough video", b: "20+ geotagged photos or full narrated walkthrough video for remote underwriting." },
  { icon: ShieldCheck, t: "Vacancy & occupancy checks", b: "On-site verification with photo proof — vacant, occupied, or abandoned." },
  { icon: ClipboardList, t: "Lockbox installs & contractor meetups", b: "Placed and photographed, code delivered. Boots on-site to meet a contractor or inspector." },
];

export const Route = createFileRoute("/markets/$city")({
  loader: ({ params }) => {
    const market = MARKETS[params.city.toLowerCase()];
    if (!market) throw notFound();
    return market;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [] };
    const url = `https://reirunner.com/markets/${params.city.toLowerCase()}`;
    const title = `Real Estate Field Services in ${loaderData.name}, ${loaderData.state} — REI Runner`;
    const desc = `Vetted local runners delivering property preservation, drive-bys, vacancy checks, walkthroughs, and lockbox installs across ${loaderData.name}, ${loaderData.state}. Escrowed payments, geotagged proof of work.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: `REI Runner — ${loaderData.name}, ${loaderData.state}`,
            url,
            parentOrganization: { "@id": "https://reirunner.com/#organization" },
            areaServed: { "@type": "City", name: loaderData.name, address: { "@type": "PostalAddress", addressRegion: loaderData.state, addressCountry: "US" } },
            description: desc,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://reirunner.com/" },
              { "@type": "ListItem", position: 2, name: "Coverage", item: "https://reirunner.com/coverage" },
              { "@type": "ListItem", position: 3, name: `${loaderData.name}, ${loaderData.state}`, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: MarketCityPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Market not yet listed</h1>
        <p className="mt-2 text-muted-foreground">We're launching market-by-market. Check the live coverage map to see where REI Runner is active.</p>
        <Link to="/coverage" className="mt-6 inline-block rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90">View coverage map</Link>
      </div>
    </div>
  ),
});

function MarketCityPage() {
  const market = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link to="/" aria-label="REI Runner home"><BrandLogo /></Link>
          <Link to="/coverage" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="size-4" /> All markets
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <div className="text-xs font-semibold tracking-widest text-primary uppercase">{market.name}, {market.state}</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
          Real Estate Field Services in {market.name}, {market.state}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          REI Runner pairs real estate investors with vetted local runners across {market.name} for property preservation
          and on-demand field tasks — drive-bys, vacancy checks, walkthrough videos, lockbox installs, and contractor
          meetups. {market.blurb} Funds are escrowed and release only when you approve the geotagged deliverable.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold">Tasks runners deliver in {market.name}</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {TASK_TYPES.map((t) => (
              <div key={t.t} className="rounded-2xl border border-border bg-card/50 p-5">
                <t.icon className="size-5 text-primary" />
                <div className="mt-3 font-semibold">{t.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <h3 className="font-semibold text-lg">Investing in {market.name}?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Post a property task and get a vetted local runner on-site. Funds release when you approve the work.
            </p>
            <Link to="/investors" className="mt-4 inline-block rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90">Post a task</Link>
          </div>
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <h3 className="font-semibold text-lg">Live in {market.name}?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Earn per task completing local property preservation jobs near you. Apply to become an REI Runner field contractor.
            </p>
            <Link to="/apply" search={{ role: "runner" }} className="mt-4 inline-block rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-card">Apply as a runner</Link>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/coverage" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">All markets</Link>
          <Link to="/property-preservation-services" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Property preservation</Link>
          <Link to="/pricing" className="rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-card">Pricing</Link>
        </div>
      </main>
    </div>
  );
}