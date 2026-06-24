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

/**
 * Look up a US ZIP code and return its city + state (USPS abbreviation).
 * Uses Mapbox forward geocoding. Returns null on failure.
 */
export async function lookupZip(
  zip: string,
): Promise<{ city: string | null; state: string | null } | null> {
  const token = process.env.MAPBOX_PUBLIC_TOKEN;
  if (!token) return null;
  const cleaned = zip.trim();
  if (!/^\d{3,5}$/.test(cleaned)) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleaned)}.json` +
    `?country=us&types=postcode&limit=1&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      features?: Array<{
        context?: Array<{ id?: string; text?: string; short_code?: string }>;
      }>;
    };
    const ctx = json.features?.[0]?.context ?? [];
    let city: string | null = null;
    let state: string | null = null;
    for (const c of ctx) {
      if (c.id?.startsWith("place")) city = c.text ?? null;
      else if (c.id?.startsWith("region")) {
        const sc = c.short_code?.split("-")[1];
        state = (sc || c.text || "").toUpperCase() || null;
      }
    }
    if (!city && !state) return null;
    return { city, state };
  } catch {
    return null;
  }
}