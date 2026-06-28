import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyPromoCredit } from "@/lib/promo.functions";

/**
 * Promo credit badge + CTA card shown at the top of the investor dashboard.
 * Hidden when the campaign is disabled or the user has no available credit.
 */
export function PromoCreditCard() {
  const fetchCredit = useServerFn(getMyPromoCredit);
  const { data } = useQuery({
    queryKey: ["my-promo-credit"],
    queryFn: () => fetchCredit(),
    staleTime: 30_000,
  });

  const credit = data?.credit;
  const campaign = data?.campaign;
  if (!credit || !campaign?.enabled) return null;
  if (credit.status !== "available" && credit.status !== "reserved") return null;
  if (credit.remaining_cents <= 0) return null;

  const remainingDollars = (credit.remaining_cents / 100).toFixed(2);
  const totalDollars = Math.floor(credit.credit_cents / 100);
  const partial = credit.remaining_cents < credit.credit_cents;

  return (
    <div className="mb-4 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card/60 to-card/30 backdrop-blur p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <div className="size-11 rounded-xl bg-primary/20 border border-primary/30 grid place-items-center shrink-0">
          <Gift className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base md:text-lg font-bold tracking-tight">
              🎉 ${totalDollars} First Task Credit Available
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/40 rounded px-1.5 py-0.5">
              {credit.status === "reserved" ? "Applied" : "Ready"}
            </span>
          </div>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {partial
              ? <>Remaining balance: <span className="font-semibold text-foreground">${remainingDollars}</span> &middot; applies automatically at checkout.</>
              : <>Posted as a credit at checkout on your first completed task. Maximum value ${totalDollars}.</>}
          </p>
        </div>
        <div>
          <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
            <Link to="/dashboard/investor" hash="post-task">
              Post Your First Task <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
      {campaign.legal_disclaimer && (
        <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
          {campaign.legal_disclaimer}
        </p>
      )}
    </div>
  );
}
