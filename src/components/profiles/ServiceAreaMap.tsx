import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMapboxToken } from "@/lib/profile-extras.functions";
import { MapPin } from "lucide-react";

type Props = {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
  radiusMiles?: number;
};

function parseRadius(r?: string | number | null): number {
  if (typeof r === "number") return r;
  if (!r) return 25;
  const m = String(r).match(/\d+/);
  return m ? Math.min(500, Math.max(1, parseInt(m[0], 10))) : 25;
}

export function ServiceAreaMap({ lat, lng, city, state, radiusMiles = 25 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tokenFn = useServerFn(getMapboxToken);
  const { data: tokenData } = useQuery({ queryKey: ["mapboxToken"], queryFn: () => tokenFn(), staleTime: 60 * 60 * 1000 });
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);

  // Geocode city/state on the client when explicit coords aren't provided
  // (we no longer ship runners' exact home coordinates to public visitors).
  useEffect(() => {
    if (lat != null && lng != null) return;
    if (!tokenData?.token) return;
    const q = [city, state].filter(Boolean).join(", ");
    if (!q) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${tokenData.token}&country=us&limit=1&types=place,region,locality,postcode`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const f = json?.features?.[0];
        if (!f?.center || !Array.isArray(f.center)) return;
        if (!cancelled) setGeo({ lng: Number(f.center[0]), lat: Number(f.center[1]) });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [lat, lng, city, state, tokenData?.token]);

  const effLat = lat ?? geo?.lat ?? null;
  const effLng = lng ?? geo?.lng ?? null;

  useEffect(() => {
    if (!tokenData?.token) return;
    if (effLat == null || effLng == null) return;
    if (mapRef.current) return;
    if (!containerRef.current) return;
    mapboxgl.accessToken = tokenData.token;
    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [Number(effLng), Number(effLat)],
        zoom: 8.5,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        const radiusMeters = Math.max(1, radiusMiles) * 1609.34;
        // Approximate degree per meter at this latitude for a circle polygon
        const points = 64;
        const coords: [number, number][] = [];
        const latRad = (Number(effLat) * Math.PI) / 180;
        const dLat = radiusMeters / 111320;
        const dLng = radiusMeters / (111320 * Math.cos(latRad));
        for (let i = 0; i <= points; i++) {
          const t = (i / points) * Math.PI * 2;
          coords.push([Number(effLng) + Math.cos(t) * dLng, Number(effLat) + Math.sin(t) * dLat]);
        }
        map.addSource("radius", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } },
        });
        map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "#3b82f6", "fill-opacity": 0.18 } });
        map.addLayer({ id: "radius-line", type: "line", source: "radius", paint: { "line-color": "#3b82f6", "line-width": 2 } });
        new mapboxgl.Marker({ color: "#3b82f6" }).setLngLat([Number(effLng), Number(effLat)]).addTo(map);
        // Fit to circle
        map.fitBounds(
          [
            [Number(effLng) - dLng, Number(effLat) - dLat],
            [Number(effLng) + dLng, Number(effLat) + dLat],
          ],
          { padding: 30, duration: 0 },
        );
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Map failed to load");
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tokenData?.token, effLat, effLng, radiusMiles]);

  if (effLat == null || effLng == null) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        <MapPin className="size-6 mx-auto mb-2 opacity-60" />
        Service area map unavailable — no city set yet.
        {city || state ? <div className="mt-1 text-xs">{[city, state].filter(Boolean).join(", ")}</div> : null}
      </div>
    );
  }
  if (!tokenData?.token) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }
  if (error) {
    return <div className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">{error}</div>;
  }
  return <div ref={containerRef} className="h-80 w-full rounded-xl overflow-hidden border border-border/60" />;
}

export { parseRadius };