/**
 * Lead Classification & Priority Scoring for Swiss Commercial Entities.
 *
 * Scores leads based on intent signals for commercial cleaning,
 * office relocations, and facility contracts.
 */

export interface ClassificationResult {
  detectedVertical: "commercial" | "moveout" | "hospitality" | "special";
  priorityScore: number; // 0 - 100
  confidence: "high" | "medium" | "low";
  reasoning: string[];
}

// Keywords indicating high physical footprint and regular cleaning demand
const HIGH_PRIORITY_KEYWORDS = [
  "praxis", "arzt", "klinik", "zahnarzt", "therapie", "medizin", "gesundheit",
  "kanzlei", "anwalt", "rechtsanwalt", "notariat", "advokatur",
  "agentur", "architektur", "ingenieur", "labor", "forschung",
  "beratung", "consulting", "informatik", "software", "technologie",
  "werbung", "design", "studio", "schule", "bildung", "akademie",
  "coworking", "büro", "office", "headquarter", "niederlassung", "filiale",
  "laboratoire", "cabinet", "avocat", "clinique", "médical", "bureau",
  "studio", "avvocato", "clinica", "ufficio", "studio medico"
];

// Hospitality keywords
const HOSPITALITY_KEYWORDS = [
  "restaurant", "café", "cafe", "bar", "bistro", "gastronomie", "gastro",
  "hotel", "catering", "lounge", "gasthof", "pizzeria", "bäckerei",
  "konditorei", "take-away", "auberge", "trattoria"
];

// Negative / Low-priority signals (dormant holdings, asset managers, virtual offices)
const LOW_PRIORITY_KEYWORDS = [
  "reine holding", "beteiligung an gesellschaften", "finanzierungen aller art",
  "erwerb, verwaltung und veräusserung von beteiligungen",
  "vermögensverwaltung für eigene rechnung", "finanzgesellschaft",
  "family office", "trust", "domizil gewähren", "domiziladresse c/o",
  "holding company", "société holding", "società holding"
];

export function classifyLead(params: {
  companyName: string;
  purpose?: string | null;
  legalForm?: string | null;
  changeType?: string | null;
  hasOldAddress?: boolean;
  subRubric?: string | null;
  canton?: string;
}): ClassificationResult {
  const {
    companyName,
    purpose = "",
    legalForm = "",
    changeType,
    hasOldAddress = false,
    subRubric,
    canton = "ZH"
  } = params;

  let score = 50; // base score
  const reasoning: string[] = [];
  let detectedVertical: "commercial" | "moveout" | "hospitality" | "special" = "commercial";

  const lowerText = `${companyName} ${purpose || ""} ${legalForm || ""}`.toLowerCase();

  // 1. Vertical detection
  const isHospitality = HOSPITALITY_KEYWORDS.some((kw) => lowerText.includes(kw));
  if (isHospitality) {
    detectedVertical = "hospitality";
    reasoning.push("Hospitality/Gastronomy commercial space detected");
    score += 15;
  } else if (hasOldAddress || changeType === "seat+domicile" || changeType === "domicile") {
    // Relocating companies have immediate double opportunity: move-out clean + new office clean
    detectedVertical = hasOldAddress ? "moveout" : "commercial";
    reasoning.push("Office relocation in progress (high move-out / move-in cleaning intent)");
    score += 20;
  } else if (subRubric === "HR01" || changeType === "incorporation") {
    detectedVertical = "commercial";
    reasoning.push("New company incorporation (office setup phase)");
    score += 10;
  }

  // 2. High-value sector boost
  const matchedHighKeywords = HIGH_PRIORITY_KEYWORDS.filter((kw) => lowerText.includes(kw));
  if (matchedHighKeywords.length > 0) {
    score += Math.min(25, matchedHighKeywords.length * 10);
    reasoning.push(`Target sector signals: ${matchedHighKeywords.slice(0, 3).join(", ")}`);
  }

  // 3. Legal Form signal
  const lfUpper = (legalForm || "").toUpperCase();
  if (lfUpper.includes("AG") || lfUpper.includes("SA")) {
    score += 10;
    reasoning.push("Aktiengesellschaft (AG) structure implies larger team/space");
  } else if (lfUpper.includes("GMBH") || lfUpper.includes("SARL")) {
    score += 5;
    reasoning.push("GmbH corporate entity");
  }

  // 4. Prime economic cantons
  const primeCantons = ["ZH", "ZG", "BS", "GE", "BE", "LU"];
  if (primeCantons.includes(canton.toUpperCase())) {
    score += 5;
    reasoning.push(`Prime commercial hub (Canton ${canton.toUpperCase()})`);
  }

  // 5. Holding / Shell company penalty
  const matchedLowKeywords = LOW_PRIORITY_KEYWORDS.filter((kw) => lowerText.includes(kw));
  if (matchedLowKeywords.length > 0) {
    score -= 30;
    reasoning.push("Holding / financial participation entity (low on-site staff likelihood)");
  }

  // Check if address is c/o
  if (lowerText.includes("c/o ") || lowerText.includes("bei ")) {
    score -= 15;
    reasoning.push("c/o domicile address detected (potential virtual office)");
  }

  // Clamp score between 10 and 100
  const priorityScore = Math.max(10, Math.min(100, score));

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "medium";
  if (priorityScore >= 75 || hasOldAddress) {
    confidence = "high";
  } else if (priorityScore <= 35) {
    confidence = "low";
  }

  return {
    detectedVertical,
    priorityScore,
    confidence,
    reasoning,
  };
}
