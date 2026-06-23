// Mapbox forward geocoding — server-only. Uses MAPBOX_PUBLIC_TOKEN.
// Returns { lat, lng } or null on failure (never throws).

export type GeocodeResult = { lat: number; lng: number } | null;

export async function geocodeAddress(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): Promise<GeocodeResult> {
  const token = process.env.MAPBOX_PUBLIC_TOKEN;
  if (!token) return null;
  const q = [parts.address, parts.city, parts.state, parts.zip]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  if (!q) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?limit=1&country=us&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as { features?: Array<{ center?: [number, number] }> };
    const c = json.features?.[0]?.center;
    if (!c || c.length !== 2) return null;
    const [lng, lat] = c;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}