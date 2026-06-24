import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Users } from "lucide-react";
import { getStateCoverage } from "@/lib/public-stats.functions";

type StateRow = {
  state: string;
  count: number;
  preview: Array<{
    name: string;
    city: string | null;
    photo: string | null;
    rating: number | null;
    top: boolean;
    verified: boolean;
    slug: string | null;
  }>;
};

const STATE_TILES = [
  { abbr: "AK", name: "Alaska", row: 1, col: 1 },
  { abbr: "ME", name: "Maine", row: 1, col: 12 },
  { abbr: "VT", name: "Vermont", row: 2, col: 11 },
  { abbr: "NH", name: "New Hampshire", row: 2, col: 12 },
  { abbr: "WA", name: "Washington", row: 3, col: 2 },
  { abbr: "ID", name: "Idaho", row: 3, col: 3 },
  { abbr: "MT", name: "Montana", row: 3, col: 4 },
  { abbr: "ND", name: "North Dakota", row: 3, col: 5 },
  { abbr: "MN", name: "Minnesota", row: 3, col: 6 },
  { abbr: "IL", name: "Illinois", row: 3, col: 7 },
  { abbr: "WI", name: "Wisconsin", row: 3, col: 8 },
  { abbr: "MI", name: "Michigan", row: 3, col: 9 },
  { abbr: "NY", name: "New York", row: 3, col: 10 },
  { abbr: "MA", name: "Massachusetts", row: 3, col: 11 },
  { abbr: "RI", name: "Rhode Island", row: 3, col: 12 },
  { abbr: "OR", name: "Oregon", row: 4, col: 2 },
  { abbr: "NV", name: "Nevada", row: 4, col: 3 },
  { abbr: "WY", name: "Wyoming", row: 4, col: 4 },
  { abbr: "SD", name: "South Dakota", row: 4, col: 5 },
  { abbr: "IA", name: "Iowa", row: 4, col: 6 },
  { abbr: "IN", name: "Indiana", row: 4, col: 7 },
  { abbr: "OH", name: "Ohio", row: 4, col: 8 },
  { abbr: "PA", name: "Pennsylvania", row: 4, col: 9 },
  { abbr: "NJ", name: "New Jersey", row: 4, col: 10 },
  { abbr: "CT", name: "Connecticut", row: 4, col: 11 },
  { abbr: "CA", name: "California", row: 5, col: 2 },
  { abbr: "UT", name: "Utah", row: 5, col: 3 },
  { abbr: "CO", name: "Colorado", row: 5, col: 4 },
  { abbr: "NE", name: "Nebraska", row: 5, col: 5 },
  { abbr: "MO", name: "Missouri", row: 5, col: 6 },
  { abbr: "KY", name: "Kentucky", row: 5, col: 7 },
  { abbr: "WV", name: "West Virginia", row: 5, col: 8 },
  { abbr: "VA", name: "Virginia", row: 5, col: 9 },
  { abbr: "MD", name: "Maryland", row: 5, col: 10 },
  { abbr: "DE", name: "Delaware", row: 5, col: 11 },
  { abbr: "AZ", name: "Arizona", row: 6, col: 3 },
  { abbr: "NM", name: "New Mexico", row: 6, col: 4 },
  { abbr: "KS", name: "Kansas", row: 6, col: 5 },
  { abbr: "AR", name: "Arkansas", row: 6, col: 6 },
  { abbr: "TN", name: "Tennessee", row: 6, col: 7 },
  { abbr: "NC", name: "North Carolina", row: 6, col: 8 },
  { abbr: "SC", name: "South Carolina", row: 6, col: 9 },
  { abbr: "DC", name: "District of Columbia", row: 6, col: 10 },
  { abbr: "OK", name: "Oklahoma", row: 7, col: 5 },
  { abbr: "LA", name: "Louisiana", row: 7, col: 6 },
  { abbr: "MS", name: "Mississippi", row: 7, col: 7 },
  { abbr: "AL", name: "Alabama", row: 7, col: 8 },
  { abbr: "GA", name: "Georgia", row: 7, col: 9 },
  { abbr: "HI", name: "Hawaii", row: 8, col: 1 },
  { abbr: "TX", name: "Texas", row: 8, col: 5 },
  { abbr: "FL", name: "Florida", row: 8, col: 10 },
] as const;

export function StateCoverageMap({
  onStateClick,
  selectedState,
  height = 460,
}: {
  onStateClick?: (stateAbbr: string) => void;
  selectedState?: string;
  height?: number;
}) {
  const coverageFn = useServerFn(getStateCoverage);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const { data: coverageData, isLoading } = useQuery({
    queryKey: ["state-coverage"],
    queryFn: () => coverageFn(),
    refetchInterval: 60_000,
  });

  const byAbbr = useMemo(() => {
    const map = new Map<string, StateRow>();
    for (const state of coverageData?.states ?? []) {
      map.set(state.state.toUpperCase(), state as StateRow);
    }
    return map;
  }, [coverageData]);

  const maxCount = useMemo(
    () => Math.max(1, ...(coverageData?.states ?? []).map((state) => state.count)),
    [coverageData],
  );
  const totalRunners = useMemo(
    () => (coverageData?.states ?? []).reduce((sum, state) => sum + state.count, 0),
    [coverageData],
  );
  const statesCovered = coverageData?.states.length ?? 0;
  const activePreview = hoveredState ? byAbbr.get(hoveredState) ?? null : null;
  const activeName = STATE_TILES.find((state) => state.abbr === hoveredState)?.name ?? hoveredState ?? "";

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> Runner coverage by state
          </h2>
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Loading coverage…
              </span>
            ) : (
              <>
                <Users className="inline size-3 mr-1 -mt-0.5" />
                {totalRunners} runner{totalRunners === 1 ? "" : "s"} across {statesCovered} state
                {statesCovered === 1 ? "" : "s"}. Hover for a preview, click a state to filter the list below.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="relative grid lg:grid-cols-[1fr_280px] gap-4 p-4" style={{ minHeight: height }}>
        <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/35 p-4">
          <div
            className="grid gap-1.5 min-w-[720px]"
            style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gridTemplateRows: "repeat(8, 52px)" }}
            aria-label="United States runner coverage by state"
          >
            {STATE_TILES.map((state) => {
              const row = byAbbr.get(state.abbr);
              const count = row?.count ?? 0;
              const selected = selectedState?.toUpperCase() === state.abbr;
              const coverageLevel = count > 0 ? Math.max(0.35, count / maxCount) : 0;
              return (
                <button
                  key={state.abbr}
                  type="button"
                  disabled={count === 0}
                  onClick={() => count > 0 && onStateClick?.(state.abbr)}
                  onMouseEnter={() => setHoveredState(state.abbr)}
                  onFocus={() => setHoveredState(state.abbr)}
                  onMouseLeave={() => setHoveredState(null)}
                  onBlur={() => setHoveredState(null)}
                  className={[
                    "group relative rounded-lg border text-left px-2 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    count > 0
                      ? "border-primary/50 bg-primary/15 text-foreground hover:border-primary hover:bg-primary/25 cursor-pointer"
                      : "border-border/45 bg-muted/25 text-muted-foreground/60 cursor-default",
                    selected ? "ring-2 ring-primary border-primary" : "",
                  ].join(" ")}
                  style={{
                    gridRow: state.row,
                    gridColumn: state.col,
                    opacity: count > 0 ? 0.62 + coverageLevel * 0.38 : 1,
                  }}
                  aria-label={`${state.name}: ${count} runner${count === 1 ? "" : "s"}`}
                >
                  <span className="block text-xs font-semibold leading-none">{state.abbr}</span>
                  <span className="mt-1 block text-lg font-bold leading-none tabular-nums">{count || ""}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-xl border border-border/50 bg-background/35 p-4 min-h-[220px]">
          {activePreview ? (
            <div>
              <div className="text-sm font-semibold">{activeName}</div>
              <div className="text-xs text-primary mt-1">
                {activePreview.count} runner{activePreview.count === 1 ? "" : "s"} registered
              </div>
              <div className="mt-4 space-y-3">
                {activePreview.preview.slice(0, 3).map((runner) => (
                  <div key={`${activePreview.state}-${runner.name}-${runner.city ?? ""}`} className="flex items-center gap-3">
                    {runner.photo ? (
                      <img
                        src={runner.photo}
                        alt=""
                        className="size-9 rounded-full object-cover border border-border/70"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-9 rounded-full bg-muted text-muted-foreground grid place-items-center text-xs font-semibold">
                        {(runner.name || "R").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{runner.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[runner.city, runner.rating ? `★ ${runner.rating}` : null, runner.verified ? "Verified" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {activePreview.count > 3 && (
                <div className="mt-4 text-xs text-muted-foreground">+ {activePreview.count - 3} more — click the state to view all</div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[190px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <MapPin className="size-8 text-primary/70 mb-3" />
              <div>Hover a covered state to preview runners.</div>
              <div className="mt-1 text-xs">States with coverage show a runner count.</div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}