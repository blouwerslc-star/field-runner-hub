import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  direction: string;
  reviewer: { name: string | null; photo: string | null; slug: string | null };
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex gap-0.5" aria-label={`${rating} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (!reviews.length) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        No reviews yet. Reviews appear after completed tasks.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold">
              {r.reviewer.photo ? (
                <img src={r.reviewer.photo} alt="" className="size-full object-cover" />
              ) : (
                (r.reviewer.name ?? "?").slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                {r.reviewer.slug ? (
                  <Link to="/profile/$slug" params={{ slug: r.reviewer.slug }} className="font-medium hover:underline">
                    {r.reviewer.name ?? "User"}
                  </Link>
                ) : (
                  <span className="font-medium">{r.reviewer.name ?? "User"}</span>
                )}
                <Stars rating={r.rating} />
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{r.comment}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReviewSummary({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Stars rating={Math.round(rating)} />
      <span className="text-sm font-semibold">{rating > 0 ? rating.toFixed(1) : "New"}</span>
      <span className="text-xs text-muted-foreground">({count} review{count === 1 ? "" : "s"})</span>
    </div>
  );
}