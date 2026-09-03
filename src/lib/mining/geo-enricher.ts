/**
 * Swisstopo Geocoding & Address Standardization
 * Uses the free public Federal Topography search API (api3.geo.admin.ch)
 */

export interface GeoLocation {
  standardizedAddress: string;
  latitude: number | null;
  longitude: number | null;
  canton?: string;
  municipality?: string;
}

export async function geocodeSwissAddress(addressText: string): Promise<GeoLocation | null> {
  if (!addressText || addressText.trim().length < 3) return null;

  try {
    const cleaned = addressText
      .replace(/\(.*?\)/g, "") // remove parenthetical comments like (bisher: ...)
      .replace(/c\/o\s+[^,]+/i, "")
      .trim();

    const url = new URL("https://api3.geo.admin.ch/services/api/SearchServer");
    url.searchParams.set("type", "locations");
    url.searchParams.set("searchText", cleaned);
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "MondarMining/1.0" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    const attrs = result.attrs || {};
    const lat = attrs.lat || (attrs.y ? parseFloat(attrs.y) : null);
    const lon = attrs.lon || (attrs.x ? parseFloat(attrs.x) : null);

    return {
      standardizedAddress: attrs.label ? attrs.label.replace(/<[^>]+>/g, "") : addressText,
      latitude: lat,
      longitude: lon,
      canton: attrs.canton,
      municipality: attrs.commune,
    };
  } catch (error) {
    // Non-blocking fallback
    return null;
  }
}
