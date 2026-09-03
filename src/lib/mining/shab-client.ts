/**
 * Native TypeScript Client for the Swiss Official Gazette of Commerce (SHAB / FOSC / FUSC)
 * API: shab.ch/api/v1
 */

import { XMLParser } from "fast-xml-parser";

export interface ShabLeadCandidate {
  publicationId: string;
  publicationDate: Date;
  canton: string;
  uid: string;
  companyName: string;
  legalForm: string;
  subRubric: "HR01" | "HR02" | "HR03";
  changeType: "seat" | "domicile" | "seat+domicile" | "incorporation" | "deletion" | "other";
  newSeat?: string;
  newAddress?: string;
  oldAddress?: string;
  purpose?: string;
  sourceUrl: string;
}

const BASE_URL = "https://shab.ch/api/v1";
const USER_AGENT = "MondarMarketingMining/1.0 (+ops@mondar.ch)";

const xmlParser = new XMLParser({
  removeNSPrefix: true, // Crucial: strips namespace prefixes like HR02: and HR01:
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false, // Keep raw strings to avoid numeric casting of IDs
});

// Regex patterns for seat / address mutations (DE / FR / IT)
const MOVE_PATTERNS = [
  // German
  { type: "seat", rx: /Sitz\s+neu\s*:\s*(?<seat>[^.;\n]+)/i },
  { type: "addr", rx: /Domizil\s+neu\s*:\s*(?<addr>[^.;\n]+(?:\.\s*\d{4}[^.;\n]*)?)/i },
  { type: "addr", rx: /Adresse\s+neu\s*:\s*(?<addr>[^;\n]+)/i },
  // French
  { type: "seat", rx: /Nouveau\s+si[eè]ge\s*:\s*(?<seat>[^.;\n]+)/i },
  { type: "addr", rx: /Nouvelle\s+adresse\s*:\s*(?<addr>[^;\n]+)/i },
  // Italian
  { type: "seat", rx: /Nuova\s+sede\s*:\s*(?<seat>[^.;\n]+)/i },
  { type: "addr", rx: /Nuovo\s+domicilio\s*:\s*(?<addr>[^;\n]+)/i },
];

// Patterns for new incorporations (HR01)
const INCORP_DOMIZIL_PATTERNS = [
  /Domizil\s*:\s*(?<addr>[^.;\n]+(?:\.\s*\d{4}[^.;\n]*)?)/i,
  /Adresse\s*:\s*(?<addr>[^;\n]+)/i,
  /Nouvelle\s+adresse\s*:\s*(?<addr>[^;\n]+)/i,
  /Si[eè]ge\s*:\s*(?<seat>[^.;\n]+)/i,
  /Sitz\s*:\s*(?<seat>[^.;\n]+)/i,
];

const OLD_VALUE_RE = /\((?:bisher|jusqu'ici|finora)\s*:\s*([^)]+)\)/i;
const UID_RE = /CHE-\d{3}\.\d{3}\.\d{3}/;
const TAG_RE = /<[^>]+>/g;

function stripHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(TAG_RE, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function formatAddress(addr: any): string {
  if (!addr || typeof addr !== "object") return "";
  const parts = [
    addr.addressLine1,
    [addr.street, addr.houseNumber].filter(Boolean).join(" "),
    [addr.swissZipCode, addr.town].filter(Boolean).join(" "),
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Fetch publication IDs matching query filters
 */
export async function searchShabPublications(params: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  cantons?: string[]; // e.g. ["ZH", "BE", "ZG"]
  subRubrics?: string[]; // e.g. ["HR01", "HR02"]
  page?: number;
  size?: number;
}): Promise<{ ids: string[]; totalPages: number; totalElements: number }> {
  const {
    startDate,
    endDate,
    cantons = ["ZH"],
    subRubrics = ["HR02", "HR01"],
    page = 0,
    size = 100,
  } = params;

  // Query each requested sub-rubric to ensure diverse distribution of movers & incorporations
  const allIds: string[] = [];
  let totalPages = 1;
  let totalElements = 0;

  const targetSubRubrics = subRubrics.length > 0 ? subRubrics : ["HR02", "HR01"];
  const perRubricSize = Math.max(10, Math.ceil(size / targetSubRubrics.length));

  for (const sr of targetSubRubrics) {
    try {
      const url = new URL(`${BASE_URL}/publications`);
      url.searchParams.set("allowRubricSelection", "true");
      url.searchParams.set("includeContent", "false");
      url.searchParams.set("pageRequest.page", String(page));
      url.searchParams.set("pageRequest.size", String(perRubricSize));
      url.searchParams.set("publicationDate.start", startDate);
      url.searchParams.set("publicationDate.end", endDate);
      url.searchParams.set("publicationStates", "PUBLISHED");
      url.searchParams.set("rubrics", "HR");
      url.searchParams.set("subRubrics", sr);
      if (cantons.length > 0) {
        url.searchParams.set("cantons", cantons.join(","));
      }

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const json = await res.json();
        const items = json.content || json.publications || [];
        for (const it of items) {
          const id = it.meta?.id || it.id;
          if (id && !allIds.includes(id)) {
            allIds.push(id);
          }
        }
        totalElements += json.totalElements || json.page?.totalElements || items.length;
        totalPages = Math.max(totalPages, json.totalPages || json.page?.totalPages || 1);
      }
    } catch (e) {
      console.warn(`[searchShabPublications] Error querying ${sr}:`, e);
    }
  }

  return { ids: allIds, totalPages, totalElements: totalElements || allIds.length };
}

/**
 * Fetch and parse a single publication's raw XML
 */
export async function fetchAndParseShabPublication(pubId: string): Promise<ShabLeadCandidate | null> {
  const url = `${BASE_URL}/publications/${pubId}/xml`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch SHAB XML for ${pubId}: HTTP ${res.status}`);
  }

  const xmlText = await res.text();
  return parseShabXml(pubId, xmlText);
}

/**
 * Pure parser for publication XML (handles both official SHAB XML with namespaces and custom feeds)
 */
export function parseShabXml(pubId: string, xmlText: string): ShabLeadCandidate | null {
  try {
    const parsed = xmlParser.parse(xmlText);
    const root = parsed.publication || parsed;
    const meta = root.meta || {};
    const content = root.content || {};

    const rawDate = meta.publicationDate || "";
    const publicationDate = rawDate ? new Date(rawDate.substring(0, 10)) : new Date();

    let canton = "ZH";
    if (Array.isArray(meta.cantons)) {
      canton = (meta.cantons[0] || "ZH").toString().trim();
    } else if (meta.cantons) {
      canton = String(meta.cantons).split(",")[0].trim() || "ZH";
    }

    const subRubricRaw = (meta.subRubric || "").toString().trim();
    const subRubric: "HR01" | "HR02" | "HR03" =
      subRubricRaw === "HR01" ? "HR01" : subRubricRaw === "HR03" ? "HR03" : "HR02";

    // Support both official SHAB schemas (commonsNew / commonsActual) and simplified generic tags
    const newCompany = content.commonsNew?.company || content.commonsActual?.company || content.company || {};
    const actualCompany = content.commonsActual?.company || {};

    const companyName = (newCompany.name || actualCompany.name || "").toString().trim();
    let uid = (newCompany.uid || actualCompany.uid || "").toString().trim();
    const legalForm = (newCompany.legalForm || actualCompany.legalForm || "").toString().trim();
    const purpose = (
      content.commonsNew?.purpose ||
      content.commonsActual?.purpose ||
      content.purpose ||
      ""
    ).toString().trim();

    const rawPubText = (content.publicationText || "").toString();
    const pubBody = stripHtml(rawPubText);

    // Fallback UID extraction from body if not in company tag
    if (!uid) {
      const match = UID_RE.exec(pubBody);
      if (match) uid = match[0];
    }

    let newSeat = (newCompany.seat || "").toString().trim();
    let newAddress = formatAddress(newCompany.address);
    let oldAddress = formatAddress(actualCompany.address);

    let changeType: "seat" | "domicile" | "seat+domicile" | "incorporation" | "deletion" | "other" = "other";

    if (subRubric === "HR02") {
      // Look for transaction change flags in official XML
      const changes = content.transaction?.update?.changements || {};
      const seatChanged = changes.seatChanged === true || changes.seatChanged === "true";
      const addressChanged = changes.addressChanged === true || changes.addressChanged === "true";

      // Also check regex in publication text (DE / FR / IT)
      let rxSeat = "";
      let rxAddr = "";
      for (const pattern of MOVE_PATTERNS) {
        const match = pattern.rx.exec(pubBody);
        if (!match || !match.groups) continue;
        if (pattern.type === "seat" && !rxSeat && match.groups.seat) {
          rxSeat = match.groups.seat.trim();
        }
        if (pattern.type === "addr" && !rxAddr && match.groups.addr) {
          rxAddr = match.groups.addr.trim().replace(/\.$/, "");
        }
      }

      const oldMatch = OLD_VALUE_RE.exec(pubBody);
      if (oldMatch && oldMatch[1] && !oldAddress) {
        oldAddress = oldMatch[1].trim();
      }

      if (rxSeat && !newSeat) newSeat = rxSeat;
      if (rxAddr && !newAddress) newAddress = rxAddr;

      const hasMoverSignal =
        seatChanged ||
        addressChanged ||
        Boolean(rxSeat || rxAddr) ||
        (Boolean(oldAddress) && Boolean(newAddress) && oldAddress !== newAddress);

      if (!hasMoverSignal) {
        // Skip non-relocation mutations (e.g. board member or capital alterations only)
        return null;
      }

      if (
        (seatChanged && addressChanged) ||
        (Boolean(rxSeat) && Boolean(rxAddr)) ||
        (Boolean(rxSeat) && Boolean(newAddress)) ||
        (Boolean(seatChanged) && Boolean(newAddress))
      ) {
        changeType = "seat+domicile";
      } else if (addressChanged || rxAddr) {
        changeType = "domicile";
      } else if (seatChanged || rxSeat) {
        changeType = "seat";
      } else {
        changeType = "seat+domicile";
      }
    } else if (subRubric === "HR01") {
      // New Incorporation
      changeType = "incorporation";
      if (!newAddress) {
        for (const pattern of INCORP_DOMIZIL_PATTERNS) {
          const match = pattern.exec(pubBody);
          if (match && match.groups?.addr && !newAddress) {
            newAddress = match.groups.addr.trim().replace(/\.$/, "");
          }
          if (match && match.groups?.seat && !newSeat) {
            newSeat = match.groups.seat.trim();
          }
        }
      }
    } else if (subRubric === "HR03") {
      changeType = "deletion";
    }

    if (!companyName) {
      return null;
    }

    return {
      publicationId: pubId,
      publicationDate,
      canton,
      uid,
      companyName,
      legalForm,
      subRubric,
      changeType,
      newSeat: newSeat || undefined,
      newAddress: newAddress || undefined,
      oldAddress: oldAddress && oldAddress !== newAddress ? oldAddress : undefined,
      purpose: purpose || undefined,
      sourceUrl: `https://shab.ch/#!/search/publications/detail/${pubId}`,
    };
  } catch (err) {
    console.error(`[SHAB XML Parser Error] pubId: ${pubId}`, err);
    return null;
  }
}
