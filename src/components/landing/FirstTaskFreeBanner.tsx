import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Gift, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivePromoCampaign, recordPromoEvent } from "@/lib/promo.functions";

/**
 * Premium promo banner shown above the homepage hero. Fires analytics
 * events for views (once per session, via IntersectionObserver) and clicks.
 */
export function FirstTaskFreeBanner() {
  const fetchCampaign = useServerFn(getActivePromoCampaign);
  const recordEvent = useServerFn(recordPromoEvent);
  const { data } = useQuery({
    queryKey: ["promo-campaign-active"],
    queryFn: () => fetchCampaign(),
    staleTime: 60_000,
  });
  const ref = useRef<HTMLDivElement | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!data?.campaign || viewedRef.current) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const seenKey = "promo_banner_view_first_task_free";
    try {
      if (sessionStorage.getItem(seenKey)) {
        viewedRef.current = true;
        return;
      }
    } catch { /* ignore */ }
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          try { sessionStorage.setItem(seenKey, "1"); } catch { /* ignore */ }
          recordEvent({ data: { eventType: "banner_view", campaignCode: "first_task_free" } })
            .catch(() => undefined);
          obs.disconnect();
        }
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [data?.campaign, recordEvent]);

  if (!data?.campaign) return null;
  const dollars = Math.floor(data.campaign.credit_cents / 100);

  const fireClick = () => {
    recordEvent({ data: { eventType: "banner_click", campaignCode: "first_task_free" } })
      .catch(() => undefined);
  };

  return (
    <section
      ref={ref}
      aria-labelledby="first-task-free-heading"
      className="relative isolate border-b border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-background"
    >
      <div aria-hidden className="absolute inset-0 -z-10 grid-bg opacity-20" />
      <div className="mx-auto max-w-7xl px-4 sm:px-5 py-6 md:py-8">
        <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="hidden md:flex size-14 rounded-2xl bg-primary/15 border border-primary/30 items-center justify-center shrink-0">
            <Gift className="size-7 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-primary">
              <ShieldCheck className="size-3.5" /> Limited-time offer
            </div>
            <h2 id="first-task-free-heading" className="mt-1 text-xl md:text-2xl font-bold tracking-tight">
              We&rsquo;ll Fund Your First Task
            </h2>
            <p className="mt-1 text-sm md:text-base text-muted-foreground">
              New investors receive up to a <span className="font-semibold text-foreground">${dollars} credit</span> toward their first completed REI Runner task. Photos, walkthroughs, occupancy checks, lockboxes &mdash; try it risk-free.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:flex-col md:items-end">
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow" onClick={fireClick}>
              <Link to="/signup" search={{ role: "investor", promo: "first_task_free" } as never}>
                Post Your First Task <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" onClick={fireClick}>
              <a href="#how-it-works">Learn How It Works</a>
            </Button>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
          {data.campaign.legal_disclaimer}
        </p>
      </div>
    </section>
  );
}
