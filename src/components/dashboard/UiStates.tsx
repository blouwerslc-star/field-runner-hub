import { Link } from "@tanstack/react-router";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Standard skeleton loader for dashboard pages.
 * Renders stat tiles + a list of card placeholders. */
export function DashboardLoadingSkeleton({
  tiles = 4,
  rows = 3,
  className,
}: {
  tiles?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true" aria-live="polite">
      <div className={cn("grid gap-3", tiles === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {Array.from({ length: tiles }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Empty state card with optional CTA. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  ctaLabel,
  ctaTo,
  onCta,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  message: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCta?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/30 px-6 py-10 text-center",
        className,
      )}
    >
      <Icon className="size-8 mx-auto mb-3 text-muted-foreground" />
      {title && <h3 className="text-base font-semibold mb-1">{title}</h3>}
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
      {ctaLabel && (ctaTo || onCta) && (
        <div className="mt-5">
          {ctaTo ? (
            <Button asChild size="sm">
              <Link to={ctaTo as never}>{ctaLabel}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={onCta}>{ctaLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Friendly error component for route `errorComponent`. */
export function RouteErrorState({
  error,
  reset,
  title = "Something went wrong",
}: {
  error: Error;
  reset?: () => void;
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-10 text-center max-w-md mx-auto my-8">
      <AlertTriangle className="size-8 mx-auto mb-3 text-destructive" aria-hidden />
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground break-words">
        {error?.message ?? "Unexpected error. Please try again."}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {reset && (
          <Button size="sm" variant="outline" onClick={reset}>
            Try again
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}