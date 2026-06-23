import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMapboxToken } from "@/lib/profile-extras.functions";

export type TaskMapProps = {
  propertyLat: number | null;
  propertyLng: number | null;
  radiusFt: number;
  runnerLat?: number | null;
  runnerLng?: number | null;
  trail?: Array<{ latitude: number; longitude: number }>;
  className?: string;
};

// Approximate meters per foot for radius circle.
const FT_TO_M = 0.3048;

/**
 * Builds a polygon approximating a circle with N segments.
 * Earth-flat approximation good for small radii (< 1km).
 */
function circlePolygon(centerLng: number, centerLat: number, radiusMeters: number, segments = 64) {
  const coords: [number, number][] = [];
  const dLat = radiusMeters / 111320;
  const dLng = radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180));
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    coords.push([centerLng + Math.cos(a) * dLng, centerLat + Math.sin(a) * dLat]);
  }
  return coords;
}

export function TaskMap(props: TaskMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const propertyMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const runnerMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const tokenFn = useServerFn(getMapboxToken);
  const { data: tokenData } = useQuery({
    queryKey: ["mapbox-token"],
    queryFn: () => tokenFn(),
    staleTime: 60 * 60 * 1000,
  });
  const token = tokenData?.token ?? "";

  useEffect(() => {
    if (!containerRef.current || !token || mapRef.current) return;
    if (props.propertyLat == null || props.propertyLng == null) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [props.propertyLng, props.propertyLat],
      zoom: 16,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      const polygon = circlePolygon(
        props.propertyLng!,
        props.propertyLat!,
        props.radiusFt * FT_TO_M,
      );
      map.addSource("geofence", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [polygon] },
        },
      });
      map.addLayer({
        id: "geofence-fill",
        type: "fill",
        source: "geofence",
        paint: { "fill-color": "#10b981", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "geofence-line",
        type: "line",
        source: "geofence",
        paint: { "line-color": "#10b981", "line-width": 2 },
      });

      map.addSource("trail", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: { "line-color": "#3b82f6", "line-width": 3, "line-opacity": 0.7 },
      });
    });

    const propEl = document.createElement("div");
    propEl.style.cssText =
      "width:18px;height:18px;border-radius:50%;background:#10b981;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)";
    propertyMarkerRef.current = new mapboxgl.Marker(propEl)
      .setLngLat([props.propertyLng, props.propertyLat])
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      propertyMarkerRef.current = null;
      runnerMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, props.propertyLat, props.propertyLng]);

  // Update runner marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (props.runnerLat == null || props.runnerLng == null) {
      runnerMarkerRef.current?.remove();
      runnerMarkerRef.current = null;
      return;
    }
    if (!runnerMarkerRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 1px 6px rgba(59,130,246,.6);animation:pulse 2s infinite";
      runnerMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([props.runnerLng, props.runnerLat])
        .addTo(map);
    } else {
      runnerMarkerRef.current.setLngLat([props.runnerLng, props.runnerLat]);
    }
  }, [props.runnerLat, props.runnerLng]);

  // Update trail
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.trail) return;
    const source = map.getSource("trail") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: props.trail.map((p) => [p.longitude, p.latitude]),
      },
    });
  }, [props.trail]);

  if (props.propertyLat == null || props.propertyLng == null) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-border bg-muted/30 p-6 text-sm text-muted-foreground ${props.className ?? ""}`}>
        Property location not geocoded yet
      </div>
    );
  }

  return <div ref={containerRef} className={`rounded-lg overflow-hidden ${props.className ?? "h-80"}`} />;
}