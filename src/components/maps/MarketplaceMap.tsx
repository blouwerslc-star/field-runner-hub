import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMapboxToken } from "@/lib/profile-extras.functions";
import { MapPin, Loader2 } from "lucide-react";

export type MapPoint = {
  id: string;
  kind: "runner" | "task";
  title: string;
  subtitle?: string | null;
  href?: string | null;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
  badge?: string | null;
};

const CACHE_KEY = "rr-geocode-cache-v1";

type GeoCache = Record<string, { lat: number; lng: number } | null>;

function loadCache(): GeoCache {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function saveCache(c: GeoCache) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

async function geocode(query: string, token: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=us&limit=1&types=place,region,locality,postcode`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const f = json?.features?.[0];
    if (!f?.center || !Array.isArray(f.center)) return null;
    return { lng: Number(f.center[0]), lat: Number(f.center[1]) };
  } catch {
    return null;
  }
}

export function MarketplaceMap({
  points,
  title,
  height = 360,
  emptyMessage = "No locations to show on the map yet.",
}: {
  points: MapPoint[];
  title?: string;
  height?: number;
  emptyMessage?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const tokenFn = useServerFn(getMapboxToken);
  const { data: tokenData } = useQuery({
    queryKey: ["mapboxToken"],
    queryFn: () => tokenFn(),
    staleTime: 60 * 60 * 1000,
  });

  const [resolved, setResolved] = useState<Array<MapPoint & { lat: number; lng: number }>>([]);
  const [loading, setLoading] = useState(false);

  // Stable signature for points dependency
  const sig = useMemo(
    () => points.map((p) => `${p.id}|${p.lat ?? ""}|${p.lng ?? ""}|${p.city ?? ""}|${p.state ?? ""}`).join("~"),
    [points],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const token = tokenData?.token;
      if (!token) return;
      setLoading(true);
      const cache = loadCache();
      const out: Array<MapPoint & { lat: number; lng: number }> = [];
      const pending: Array<{ p: MapPoint; key: string }> = [];
      for (const p of points) {
        if (p.lat != null && p.lng != null && !Number.isNaN(Number(p.lat)) && !Number.isNaN(Number(p.lng))) {
          out.push({ ...p, lat: Number(p.lat), lng: Number(p.lng) });
          continue;
        }
        const q = [p.city, p.state].filter(Boolean).join(", ");
        if (!q) continue;
        const key = q.toLowerCase();
        if (key in cache) {
          const c = cache[key];
          if (c) out.push({ ...p, lat: c.lat, lng: c.lng });
        } else {
          pending.push({ p, key });
        }
      }
      // Resolve missing in parallel (cap to avoid request storms)
      const chunkSize = 8;
      for (let i = 0; i < pending.length; i += chunkSize) {
        const chunk = pending.slice(i, i + chunkSize);
        const results = await Promise.all(
          chunk.map(async ({ p, key }) => {
            const q = [p.city, p.state].filter(Boolean).join(", ");
            const r = await geocode(q, token);
            cache[key] = r ?? null;
            if (r) return { ...p, lat: r.lat, lng: r.lng };
            return null;
          }),
        );
        for (const r of results) if (r) out.push(r);
      }
      saveCache(cache);
      if (!cancelled) {
        setResolved(out);
        setLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenData?.token, sig]);

  // Init map once
  useEffect(() => {
    if (!tokenData?.token || mapRef.current || !containerRef.current) return;
    mapboxgl.accessToken = tokenData.token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-96.9, 38.5], // US center
      zoom: 3.4,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tokenData?.token]);

  // Render markers when resolved changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Clear old markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    if (resolved.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    for (const p of resolved) {
      const color = p.kind === "runner" ? "#22c55e" : "#3b82f6";
      const popupHtml = `
        <div style="font-family: inherit; max-width: 220px;">
          <div style="font-weight:600; font-size: 13px; margin-bottom:2px;">${escapeHtml(p.title)}</div>
          ${p.subtitle ? `<div style="font-size:11px; color:#9ca3af; margin-bottom:6px;">${escapeHtml(p.subtitle)}</div>` : ""}
          ${p.badge ? `<div style="display:inline-block; font-size:10px; padding:2px 6px; border-radius:9999px; background:${color}22; color:${color}; margin-bottom:6px;">${escapeHtml(p.badge)}</div>` : ""}
          ${p.href ? `<div><a href="${p.href}" style="font-size:12px; color:${color}; text-decoration:underline;">Open ${p.kind === "runner" ? "profile" : "task"} →</a></div>` : ""}
        </div>
      `;
      const marker = new mapboxgl.Marker({ color })
        .setLngLat([p.lng, p.lat])
        .setPopup(new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(popupHtml))
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([p.lng, p.lat]);
    }
    try {
      if (resolved.length === 1) {
        map.flyTo({ center: [resolved[0].lng, resolved[0].lat], zoom: 8, duration: 600 });
      } else {
        map.fitBounds(bounds, { padding: 50, maxZoom: 9, duration: 600 });
      }
    } catch { /* ignore */ }
  }, [resolved]);

  if (!tokenData?.token) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Map unavailable — Mapbox token not configured.
      </div>
    );
  }

  const runnerCount = resolved.filter((p) => p.kind === "runner").length;
  const taskCount = resolved.filter((p) => p.kind === "task").length;

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <MapPin className="size-4 text-primary" /> {title ?? "Live map"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Locating pins…</span>
            ) : resolved.length === 0 ? (
              emptyMessage
            ) : (
              <>
                {runnerCount > 0 && (
                  <span className="mr-3"><span className="inline-block size-2 rounded-full bg-emerald-500 mr-1.5 align-middle" />{runnerCount} runner{runnerCount === 1 ? "" : "s"}</span>
                )}
                {taskCount > 0 && (
                  <span><span className="inline-block size-2 rounded-full bg-blue-500 mr-1.5 align-middle" />{taskCount} task{taskCount === 1 ? "" : "s"}</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
      <div ref={containerRef} style={{ height }} className="w-full bg-muted" />
    </section>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}