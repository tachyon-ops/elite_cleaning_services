import en from "@/locales/en.json";
import de from "@/locales/de.json";
import fr from "@/locales/fr.json";
import it from "@/locales/it.json";
import rm from "@/locales/rm.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";

const dictionaries: Record<string, any> = {
  en,
  de,
  fr,
  it,
  rm,
  es,
  pt,
};

/**
 * Gets the static dictionary for the specified locale.
 * Falls back to English if the requested locale is not supported.
 */
export function getTranslationsForLocale(locale: string = "en") {
  const normalized = (locale || "en").toLowerCase().slice(0, 2);
  return dictionaries[normalized] || dictionaries.en;
}

/**
 * Helper to resolve dot-notated keys (e.g. "admin.sidebar.title")
 * from a translation dictionary.
 */
export function translate(key: string, dictionary: any): string {
  try {
    const parts = key.split(".");
    let current = dictionary;
    for (const part of parts) {
      if (current === undefined || current === null || current[part] === undefined) {
        return translateFallback(key);
      }
      current = current[part];
    }
    return typeof current === "string" ? current : key;
  } catch {
    return translateFallback(key);
  }
}

/**
 * Fallback key resolver using the English dictionary.
 */
function translateFallback(key: string): string {
  try {
    const parts = key.split(".");
    let current: any = dictionaries.en;
    for (const part of parts) {
      if (current === undefined || current === null || current[part] === undefined) {
        return key;
      }
      current = current[part];
    }
    return typeof current === "string" ? current : key;
  } catch {
    return key;
  }
}

export const VERTICAL_SLUGS: Record<string, Record<string, string>> = {
  de: { haus: "domestic", gewerbe: "commercial", airbnb: "hospitality", luftfahrt: "aviation", yacht: "yacht" },
  en: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht" },
  fr: { domestique: "domestic", commercial: "commercial", hebergement: "hospitality", aviation: "aviation", yacht: "yacht" },
  it: { domestico: "domestic", commerciale: "commercial", accoglienza: "hospitality", aviazione: "aviation", yacht: "yacht" },
  rm: { domestic: "domestic", commercial: "commercial", ospitalita: "hospitality", aviada: "aviation", iaht: "yacht" },
  es: { domestico: "domestic", comercial: "commercial", alojamiento: "hospitality", aviacion: "aviation", yate: "yacht" },
  pt: { domestica: "domestic", comercial: "commercial", alojamento: "hospitality", aviacao: "aviation", iate: "yacht" }
};

export const INTERNAL_TO_VERTICAL: Record<string, Record<string, string>> = {
  de: { domestic: "haus", commercial: "gewerbe", hospitality: "airbnb", aviation: "luftfahrt", yacht: "yacht" },
  en: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht" },
  fr: { domestic: "domestique", commercial: "commercial", hospitality: "hebergement", aviation: "aviation", yacht: "yacht" },
  it: { domestic: "domestico", commercial: "commercial", hospitality: "accoglienza", aviation: "aviazione", yacht: "yacht" },
  rm: { domestic: "domestic", commercial: "commercial", hospitality: "ospitalita", aviation: "aviada", yacht: "iaht" },
  es: { domestic: "domestico", commercial: "comercial", hospitality: "alojamiento", aviation: "aviacion", yacht: "yate" },
  pt: { domestic: "domestica", commercial: "comercial", hospitality: "alojamento", aviation: "aviacao", yacht: "iate" }
};

/**
 * Resolves a localized vertical slug back to its internal equivalent (e.g. "domestica" -> "domestic").
 * If the slug is already an internal one or unrecognized, returns it as-is.
 */
export function resolveVerticalSlug(slug: string, locale: string): string {
  if (!slug) return slug;
  const cleanLocale = (locale || "de").toLowerCase().slice(0, 2);
  
  if (VERTICAL_SLUGS[cleanLocale] && VERTICAL_SLUGS[cleanLocale][slug]) {
    return VERTICAL_SLUGS[cleanLocale][slug];
  }
  
  for (const loc of Object.keys(VERTICAL_SLUGS)) {
    if (VERTICAL_SLUGS[loc] && VERTICAL_SLUGS[loc][slug]) {
      return VERTICAL_SLUGS[loc][slug];
    }
  }
  return slug;
}

/**
 * Appends the locale prefix to a URL pathname if the locale is not the default (de).
 * Also localizes page slugs (e.g. /providers -> /partenaires).
 */
export function localizeHref(href: string, locale: string): string {
  if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }

  const cleanLocale = (locale || "de").toLowerCase().slice(0, 2);

  const legalMappings: Record<string, Record<string, string>> = {
    "/legal/privacy": {
      de: "/rechtliches/datenschutz",
      en: "/legal/privacy",
      fr: "/juridique/confidentialite",
      it: "/legale/privacy",
      rm: "/legal/datas",
      es: "/legal/privacidad",
      pt: "/legal/privacidade"
    },
    "/legal/terms": {
      de: "/rechtliches/agb",
      en: "/legal/terms",
      fr: "/juridique/conditions-generales",
      it: "/legale/termini",
      rm: "/legal/cundizions",
      es: "/legal/condiciones",
      pt: "/legal/termos"
    },
    "/legal/cookies": {
      de: "/rechtliches/cookies",
      en: "/legal/cookies",
      fr: "/juridique/cookies",
      it: "/legale/cookie",
      rm: "/legal/cookies",
      es: "/legal/cookies",
      pt: "/legal/cookies"
    },
    "/about": {
      de: "/ueber-uns",
      en: "/about",
      fr: "/a-propos",
      it: "/chi-siamo",
      rm: "/davart-nus",
      es: "/sobre-nosotros",
      pt: "/sobre-nos"
    },
    "/legal/provider-terms": {
      de: "/rechtliches/partner-agb",
      en: "/legal/provider-terms",
      fr: "/juridique/conditions-prestataires",
      it: "/legale/termini-partner",
      rm: "/legal/cundizions-partenaris",
      es: "/legal/condiciones-socios",
      pt: "/legal/termos-parceiros"
    },
    "/legal/impressum": {
      de: "/rechtliches/impressum",
      en: "/legal/imprint",
      fr: "/juridique/mentions-legales",
      it: "/legale/impressum",
      rm: "/legal/impressum",
      es: "/legal/aviso-legal",
      pt: "/legal/impressum"
    }
  };

  if (legalMappings[href]) {
    const mapped = legalMappings[href][cleanLocale];
    if (mapped) {
      return cleanLocale === "de" ? mapped : `/${cleanLocale}${mapped}`;
    }
  }

  const pathParts = href.split("/");
  const firstSegment = pathParts[1]; // e.g. "providers" or "book"

  const internalToSlug: Record<string, Record<string, string>> = {
    de: { providers: "partner", book: "buchen" },
    en: { providers: "providers", book: "book" },
    fr: { providers: "partenaires", book: "reserver" },
    it: { providers: "partner", book: "prenotare" },
    rm: { providers: "partenaris", book: "reservar" },
    es: { providers: "proveedores", book: "reservar" },
    pt: { providers: "parceiros", book: "reservar" }
  };

  let localizedHref = href;
  if (firstSegment && internalToSlug[cleanLocale] && internalToSlug[cleanLocale][firstSegment]) {
    const localizedSlug = internalToSlug[cleanLocale][firstSegment];
    pathParts[1] = localizedSlug;
    
    // Check if it is a book path and has a vertical sub-slug
    if (firstSegment === "book" && pathParts[2]) {
      const internalVert = pathParts[2];
      const localizedVert = (INTERNAL_TO_VERTICAL[cleanLocale] && INTERNAL_TO_VERTICAL[cleanLocale][internalVert]) || internalVert;
      pathParts[2] = localizedVert;
    }
    
    localizedHref = pathParts.join("/");
  }

  if (cleanLocale === "de") {
    return localizedHref;
  }

  return `/${cleanLocale}${localizedHref === "/" ? "" : localizedHref}`;
}


