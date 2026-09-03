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

  const url = new URL(`${BASE_URL}/publications`);
  url.searchParams.set("allowRubricSelection", "true");
  url.searchParams.set("includeContent", "false");
  url.searchParams.set("pageRequest.page", String(page));
  url.searchParams.set("pageRequest.size", String(size));
  url.searchParams.set("publicationDate.start", startDate);
  url.searchParams.set("publicationDate.end", endDate);
  url.searchParams.set("publicationStates", "PUBLISHED");
  url.searchParams.set("rubrics", "HR");
  url.searchParams.set("subRubrics", subRubrics.join(","));
  if (cantons.length > 0) {
    url.searchParams.set("cantons", cantons.join(","));
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`SHAB publications search failed with status ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  const items = json.content || json.publications || [];
  const ids: string[] = items.map((it: any) => it.meta?.id || it.id).filter(Boolean);
  const totalPages = json.totalPages || json.page?.totalPages || 1;
  const totalElements = json.totalElements || json.page?.totalElements || ids.length;

  return { ids, totalPages, totalElements };
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
 * Pure parser for publication XML (can be unit tested directly)
 */
export function parseShabXml(pubId: string, xmlText: string): ShabLeadCandidate | null {
  try {
    const parsed = xmlParser.parse(xmlText);
    const root = parsed.publication || parsed;
    const meta = root.meta || {};
    const content = root.content || {};

    const rawDate = meta.publicationDate || "";
    const publicationDate = rawDate ? new Date(rawDate.substring(0, 10)) : new Date();
    const canton = (meta.cantons || "").toString().trim() || "ZH";
    const subRubricRaw = (meta.subRubric || "").toString().trim();
    const subRubric: "HR01" | "HR02" | "HR03" =
      subRubricRaw === "HR01" ? "HR01" : subRubricRaw === "HR03" ? "HR03" : "HR02";

    const company = content.company || {};
    const companyName = (company.name || "").toString().trim();
    let uid = (company.uid || "").toString().trim();
    const legalForm = (company.legalForm || "").toString().trim();
    const purpose = (content.purpose || "").toString().trim();

    const rawPubText = (content.publicationText || "").toString();
    const pubBody = stripHtml(rawPubText);

    // Fallback UID extraction from body if not in company tag
    if (!uid) {
      const match = UID_RE.exec(pubBody);
      if (match) uid = match[0];
    }

    let newSeat = "";
    let newAddress = "";
    let oldAddress = "";
    let changeType: "seat" | "domicile" | "seat+domicile" | "incorporation" | "deletion" | "other" = "other";

    if (subRubric === "HR02") {
      // Mutation: Look for seat and domicile changes
      for (const pattern of MOVE_PATTERNS) {
        const match = pattern.rx.exec(pubBody);
        if (!match || !match.groups) continue;

        if (pattern.type === "seat" && !newSeat && match.groups.seat) {
          newSeat = match.groups.seat.trim();
        }
        if (pattern.type === "addr" && !newAddress && match.groups.addr) {
          newAddress = match.groups.addr.trim().replace(/\.$/, "");
        }
      }

      const oldMatch = OLD_VALUE_RE.exec(pubBody);
      if (oldMatch && oldMatch[1]) {
        oldAddress = oldMatch[1].trim();
      }

      if (newSeat && newAddress) {
        changeType = "seat+domicile";
      } else if (newAddress) {
        changeType = "domicile";
      } else if (newSeat) {
        changeType = "seat";
      } else {
        // If neither seat nor address changed (e.g. board member change), we skip this publication
        return null;
      }
    } else if (subRubric === "HR01") {
      // New Incorporation
      changeType = "incorporation";
      for (const pattern of INCORP_DOMIZIL_PATTERNS) {
        const match = pattern.exec(pubBody);
        if (match && match.groups?.addr && !newAddress) {
          newAddress = match.groups.addr.trim().replace(/\.$/, "");
        }
        if (match && match.groups?.seat && !newSeat) {
          newSeat = match.groups.seat.trim();
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
      oldAddress: oldAddress || undefined,
      purpose: purpose || undefined,
      sourceUrl: `https://shab.ch/#!/search/publications/detail/${pubId}`,
    };
  } catch (err) {
    console.error(`[SHAB XML Parser Error] pubId: ${pubId}`, err);
    return null;
  }
}
