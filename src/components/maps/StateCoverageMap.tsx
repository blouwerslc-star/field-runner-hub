import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMapboxToken } from "@/lib/profile-extras.functions";
import { getStateCoverage } from "@/lib/public-stats.functions";
import { MapPin, Loader2, Users } from "lucide-react";

// Public US states GeoJSON. Properties: name (full state name).
const US_STATES_GEOJSON =
  "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

// Full name → USPS abbreviation
const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY", "Puerto Rico": "PR",
};

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

export function StateCoverageMap({
  onStateClick,
  selectedState,
  height = 460,
}: {
  onStateClick?: (stateAbbr: string) => void;
  selectedState?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const tokenFn = useServerFn(getMapboxToken);
  const coverageFn = useServerFn(getStateCoverage);

  const { data: tokenData } = useQuery({
    queryKey: ["mapboxToken"],
    queryFn: () => tokenFn(),
    staleTime: 60 * 60 * 1000,
  });
  const { data: coverageData } = useQuery({
    queryKey: ["state-coverage"],
    queryFn: () => coverageFn(),
    refetchInterval: 60_000,
  });

  const byAbbr = useMemo(() => {
    const m = new Map<string, StateRow>();
    for (const s of coverageData?.states ?? []) {
      m.set(s.state.toUpperCase(), s as StateRow);
    }
    return m;
  }, [coverageData]);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const s of coverageData?.states ?? []) if (s.count > m) m = s.count;
    return m || 1;
  }, [coverageData]);

  const totalRunners = useMemo(
    () => (coverageData?.states ?? []).reduce((s, x) => s + x.count, 0),
    [coverageData],
  );
  const statesCovered = (coverageData?.states ?? []).length;

  // Init map once
  useEffect(() => {
    if (!tokenData?.token || mapRef.current || !containerRef.current) return;
    mapboxgl.accessToken = tokenData.token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-96, 38],
      zoom: 3.2,
      attributionControl: false,
      interactive: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tokenData?.token]);

  // Load states layer + bind data + interactions
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tokenData?.token) return;
    if (!coverageData) return;

    let cancelled = false;

    async function setup() {
      if (!map || cancelled) return;
      const apply = async () => {
        if (cancelled) return;
        if (!map.getSource("us-states")) {
          let geo: any;
          try {
            const res = await fetch(US_STATES_GEOJSON);
            geo = await res.json();
          } catch {
            return;
          }
          // Attach feature-state-ready ids and coverage data into properties.
          geo.features.forEach((f: any, i: number) => {
            f.id = i;
            const abbr = STATE_ABBR[f.properties?.name] ?? null;
            const row = abbr ? byAbbr.get(abbr) : null;
            f.properties.abbr = abbr;
            f.properties.runners = row?.count ?? 0;
          });
          map.addSource("us-states", { type: "geojson", data: geo, promoteId: undefined });

          map.addLayer({
            id: "state-fill",
            type: "fill",
            source: "us-states",
            paint: {
              "fill-color": [
                "case",
                [">", ["coalesce", ["get", "runners"], 0], 0],
                "hsl(160, 70%, 45%)",
                "hsla(220, 15%, 30%, 0.25)",
              ],
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false], 0.85,
                ["boolean", ["feature-state", "selected"], false], 0.9,
                [">", ["coalesce", ["get", "runners"], 0], 0],
                [
                  "interpolate", ["linear"], ["coalesce", ["get", "runners"], 0],
                  0, 0.25, Math.max(1, maxCount), 0.75,
                ],
                0.18,
              ],
            },
          });
          map.addLayer({
            id: "state-line",
            type: "line",
            source: "us-states",
            paint: {
              "line-color": [
                "case",
                [">", ["coalesce", ["get", "runners"], 0], 0],
                "hsl(160, 80%, 60%)",
                "hsla(220, 15%, 60%, 0.4)",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "selected"], false], 2.5,
                0.6,
              ],
            },
          });
          map.addLayer({
            id: "state-label",
            type: "symbol",
            source: "us-states",
            filter: [">", ["coalesce", ["get", "runners"], 0], 0],
            layout: {
              "text-field": ["concat", ["get", "abbr"], "  ", ["to-string", ["get", "runners"]]],
              "text-size": 11,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-allow-overlap": false,
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "hsla(220, 30%, 10%, 0.85)",
              "text-halo-width": 1.2,
            },
          });

          let hoveredId: number | null = null;

          map.on("mousemove", "state-fill", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            map.getCanvas().style.cursor =
              (f.properties?.runners ?? 0) > 0 ? "pointer" : "default";
            if (hoveredId !== null && hoveredId !== f.id) {
              map.setFeatureState({ source: "us-states", id: hoveredId }, { hover: false });
            }
            hoveredId = (f.id as number) ?? null;
            if (hoveredId !== null) {
              map.setFeatureState({ source: "us-states", id: hoveredId }, { hover: true });
            }

            const abbr = f.properties?.abbr as string | null;
            const runners = (f.properties?.runners as number) ?? 0;
            if (!abbr) return;
            const row = byAbbr.get(abbr);
            if (!row || runners === 0) {
              popupRef.current?.remove();
              return;
            }
            const html = renderPreviewHtml(row, f.properties?.name as string);
            if (!popupRef.current) {
              popupRef.current = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 8,
                maxWidth: "260px",
              });
            }
            popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map);
          });

          map.on("mouseleave", "state-fill", () => {
            map.getCanvas().style.cursor = "";
            if (hoveredId !== null) {
              map.setFeatureState({ source: "us-states", id: hoveredId }, { hover: false });
              hoveredId = null;
            }
            popupRef.current?.remove();
          });

          map.on("click", "state-fill", (e) => {
            const f = e.features?.[0];
            const abbr = f?.properties?.abbr as string | null;
            const runners = (f?.properties?.runners as number) ?? 0;
            if (!abbr || runners === 0) return;
            onStateClick?.(abbr);
          });
        } else {
          // Update existing source data when coverage refreshes.
          const src = map.getSource("us-states") as mapboxgl.GeoJSONSource | undefined;
          if (src) {
            try {
              const res = await fetch(US_STATES_GEOJSON);
              const geo = await res.json();
              geo.features.forEach((f: any, i: number) => {
                f.id = i;
                const abbr = STATE_ABBR[f.properties?.name] ?? null;
                const row = abbr ? byAbbr.get(abbr) : null;
                f.properties.abbr = abbr;
                f.properties.runners = row?.count ?? 0;
              });
              src.setData(geo);
            } catch {
              /* ignore */
            }
          }
        }
      };

      if (map.isStyleLoaded()) await apply();
      else map.once("load", () => { void apply(); });
    }

    void setup();
    return () => { cancelled = true; };
  }, [tokenData?.token, coverageData, byAbbr, maxCount, onStateClick]);

  // Update selected feature-state when selectedState changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource("us-states")) return;
    const src: any = (map.getSource("us-states") as any)?._data;
    if (!src?.features) return;
    for (const f of src.features as any[]) {
      const isSel = !!selectedState && f.properties?.abbr === selectedState.toUpperCase();
      map.setFeatureState({ source: "us-states", id: f.id }, { selected: isSel });
    }
  }, [selectedState, coverageData]);

  if (!tokenData?.token) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Map unavailable — Mapbox token not configured.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> Runner coverage by state
          </h2>
          <p className="text-xs text-muted-foreground">
            {coverageData ? (
              <>
                <Users className="inline size-3 mr-1 -mt-0.5" />
                {totalRunners} runner{totalRunners === 1 ? "" : "s"} across{" "}
                {statesCovered} state{statesCovered === 1 ? "" : "s"}. Hover for a
                preview, click a state to filter the list below.
              </>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Loading coverage…
              </span>
            )}
          </p>
        </div>
      </div>
      <div ref={containerRef} style={{ height }} className="w-full bg-muted" />
    </section>
  );
}

function escapeHtml(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderPreviewHtml(row: StateRow, stateName: string): string {
  const items = row.preview.slice(0, 3).map((p) => {
    const badges: string[] = [];
    if (p.top) badges.push("Top");
    if (p.verified) badges.push("Verified");
    const meta = [p.city, p.rating ? `★ ${p.rating}` : null, ...badges]
      .filter(Boolean)
      .map((s) => escapeHtml(String(s)))
      .join(" · ");
    const avatar = p.photo
      ? `<img src="${escapeHtml(p.photo)}" alt="" style="width:28px;height:28px;border-radius:9999px;object-fit:cover;border:1px solid hsla(220,15%,40%,0.5);" />`
      : `<div style="width:28px;height:28px;border-radius:9999px;background:hsl(220,15%,25%);display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#cbd5e1;">${escapeHtml((p.name || "?").charAt(0))}</div>`;
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
        ${avatar}
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:600;color:#f8fafc;">${escapeHtml(p.name)}</div>
          ${meta ? `<div style="font-size:10px;color:#94a3b8;">${meta}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
  const more = row.count - Math.min(row.preview.length, 3);
  return `
    <div style="font-family: inherit;">
      <div style="font-weight:700;font-size:13px;color:#f8fafc;">${escapeHtml(stateName)} (${escapeHtml(row.state)})</div>
      <div style="font-size:11px;color:#10b981;margin-top:2px;">${row.count} runner${row.count === 1 ? "" : "s"} registered</div>
      ${items}
      ${more > 0 ? `<div style="font-size:10px;color:#94a3b8;margin-top:6px;">+ ${more} more — click to view all</div>` : `<div style="font-size:10px;color:#94a3b8;margin-top:6px;">Click to view all</div>`}
    </div>
  `;
}