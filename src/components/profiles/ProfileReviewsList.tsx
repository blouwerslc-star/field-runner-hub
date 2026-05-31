import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@tanstack/react-router";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  direction: string;
  reviewer: { name: string | null; photo: string | null; slug: string | null };
};

export function ProfileReviewsList({ reviews }: { reviews: Review[] }) {
  const [sort, setSort] = useState<"newest" | "highest" | "helpful">("newest");
  const sorted = useMemo(() => {
    const r = [...reviews];
    if (sort === "highest") r.sort((a, b) => b.rating - a.rating || (b.created_at > a.created_at ? 1 : -1));
    else if (sort === "helpful") r.sort((a, b) => (b.comment?.length ?? 0) - (a.comment?.length ?? 0));
    else r.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return r;
  }, [reviews, sort]);

  if (!reviews.length) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        No reviews yet. Reviews appear after completed tasks.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="highest">Highest rated</SelectItem>
            <SelectItem value="helpful">Most helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ul className="space-y-3">
        {sorted.map((r) => (
          <li key={r.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-muted overflow-hidden grid place-items-center text-xs font-semibold text-muted-foreground">
                {r.reviewer.photo ? <img src={r.reviewer.photo} alt="" className="size-full object-cover" /> : (r.reviewer.name?.[0] ?? "?")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {r.reviewer.slug ? (
                    <Link to="/profile/$slug" params={{ slug: r.reviewer.slug }} className="font-medium hover:underline truncate">
                      {r.reviewer.name ?? "Client"}
                    </Link>
                  ) : (
                    <span className="font-medium truncate">{r.reviewer.name ?? "Client"}</span>
                  )}
                  <span className="text-[10px] uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-1.5 py-0.5">Verified client</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-yellow-400" : "opacity-30"}`} />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            {r.comment && <p className="mt-3 text-sm whitespace-pre-wrap">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}