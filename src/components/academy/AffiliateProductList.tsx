import { ExternalLink, ShoppingBag } from "lucide-react";

export type AffiliateProduct = {
  id: string;
  title: string;
  description?: string | null;
  vendor?: string | null;
  image_url?: string | null;
  affiliate_url: string;
  price_display?: string | null;
  audience?: "runner" | "investor" | "both" | null;
};

const AUDIENCE_LABEL: Record<string, string> = {
  runner: "For runners",
  investor: "For investors",
  both: "Runners & investors",
};

export function AffiliateProductList({
  products,
  heading = "Recommended gear",
  subheading = "Affiliate links — supports REI Runner at no extra cost.",
}: {
  products: AffiliateProduct[];
  heading?: string;
  subheading?: string;
}) {
  if (!products || products.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <ShoppingBag className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{heading}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{subheading}</p>
      <ul className="grid sm:grid-cols-2 gap-3">
        {products.map((p) => (
          <li key={p.id}>
            <a
              href={p.affiliate_url}
              target="_blank"
              rel="noopener sponsored noreferrer"
              className="group flex gap-3 p-3 rounded-xl border border-border bg-background/50 hover:border-primary/50 transition-colors"
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt=""
                  className="size-16 rounded-lg object-cover shrink-0 bg-muted"
                  loading="lazy"
                />
              ) : (
                <div className="size-16 rounded-lg bg-muted grid place-items-center shrink-0">
                  <ShoppingBag className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {p.vendor ?? "Recommended"}
                  {p.audience && AUDIENCE_LABEL[p.audience] && (
                    <span className="text-primary/80">· {AUDIENCE_LABEL[p.audience]}</span>
                  )}
                </div>
                <div className="text-sm font-semibold leading-tight mt-0.5 group-hover:text-primary transition-colors">
                  {p.title}
                </div>
                {p.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
                )}
                <div className="text-xs text-primary mt-1.5 inline-flex items-center gap-1">
                  {p.price_display ? <span className="font-mono">{p.price_display}</span> : "View product"}
                  <ExternalLink className="size-3" />
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}