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

function interpolate(template: string, params?: Record<string, any>): string {
  if (!params || typeof template !== "string") return template;
  let result = template;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return result;
}

/**
 * Helper to resolve dot-notated keys (e.g. "admin.sidebar.title")
 * from a translation dictionary.
 */
export function translate(key: string, dictionary: any, params?: Record<string, any>): string {
  try {
    const parts = key.split(".");
    let current = dictionary;
    for (const part of parts) {
      if (current === undefined || current === null || current[part] === undefined) {
        return interpolate(translateFallback(key), params);
      }
      current = current[part];
    }
    const str = typeof current === "string" ? current : key;
    return interpolate(str, params);
  } catch {
    return interpolate(translateFallback(key), params);
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
  de: { haus: "domestic", gewerbe: "commercial", airbnb: "hospitality", luftfahrt: "aviation", yacht: "yacht", endreinigung: "moveout", "gebaeude-service": "building-care", gastgewerbe: "restaurant", spezialreinigung: "special" },
  en: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht", "end-cleaning": "moveout", "building-care": "building-care", restaurant: "restaurant", special: "special" },
  fr: { domestique: "domestic", commercial: "commercial", hebergement: "hospitality", aviation: "aviation", yacht: "yacht", "nettoyage-remise": "moveout", "entretien-immeuble": "building-care", restaurant: "restaurant", special: "special" },
  it: { domestico: "domestic", commerciale: "commercial", accoglienza: "hospitality", aviazione: "aviation", yacht: "yacht", "pulizia-trasloco": "moveout", "gestione-immobili": "building-care", ristorante: "restaurant", speciale: "special" },
  rm: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht", moveout: "moveout", "tgir-edifizis": "building-care", restorant: "restaurant", special: "special" },
  es: { domestico: "domestic", comercial: "commercial", alojamiento: "hospitality", aviacion: "aviation", yate: "yacht", "limpieza-mudanza": "moveout", "mantenimiento-edificios": "building-care", restaurante: "restaurant", especial: "special" },
  pt: { domestica: "domestic", comercial: "commercial", alojamento: "hospitality", aviacao: "aviation", iate: "yacht", "limpeza-mudanca": "moveout", "manutencao-edificios": "building-care", restaurante: "restaurant", especial: "special" }
};

export const INTERNAL_TO_VERTICAL: Record<string, Record<string, string>> = {
  de: { domestic: "haus", commercial: "gewerbe", hospitality: "airbnb", aviation: "luftfahrt", yacht: "yacht", moveout: "endreinigung", "building-care": "gebaeude-service", restaurant: "gastgewerbe", special: "spezialreinigung" },
  en: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht", moveout: "end-cleaning", "building-care": "building-care", restaurant: "restaurant", special: "special" },
  fr: { domestic: "domestique", commercial: "commercial", hospitality: "hebergement", aviation: "aviation", yacht: "yacht", moveout: "nettoyage-remise", "building-care": "entretien-immeuble", restaurant: "restaurant", special: "special" },
  it: { domestic: "domestico", commercial: "commercial", hospitality: "accoglienza", aviation: "aviazione", yacht: "yacht", moveout: "pulizia-trasloco", "building-care": "gestione-immobili", restaurant: "ristorante", special: "speciale" },
  rm: { domestic: "domestic", commercial: "commercial", hospitality: "ospitalita", aviation: "aviada", yacht: "iaht", moveout: "moveout", "building-care": "tgir-edifizis", restaurant: "restorant", special: "special" },
  es: { domestic: "domestico", commercial: "comercial", hospitality: "alojamiento", aviation: "aviacion", yacht: "yate", moveout: "limpieza-mudanza", "building-care": "mantenimiento-edificios", restaurant: "restaurante", special: "especial" },
  pt: { domestic: "domestica", commercial: "comercial", hospitality: "alojamento", aviation: "aviacao", yacht: "iate", moveout: "limpeza-mudanca", "building-care": "manutencao-edificios", restaurant: "restaurante", special: "especial" }
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

  // Split query string and hash from pathname
  let urlPath = href;
  let searchAndHash = "";
  const queryIndex = href.indexOf("?");
  const hashIndex = href.indexOf("#");
  
  let splitIndex = -1;
  if (queryIndex !== -1 && hashIndex !== -1) {
    splitIndex = Math.min(queryIndex, hashIndex);
  } else if (queryIndex !== -1) {
    splitIndex = queryIndex;
  } else if (hashIndex !== -1) {
    splitIndex = hashIndex;
  }

  if (splitIndex !== -1) {
    urlPath = href.slice(0, splitIndex);
    searchAndHash = href.slice(splitIndex);
  }

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
    "/contact": {
      de: "/kontakt",
      en: "/contact",
      fr: "/contact",
      it: "/contatto",
      rm: "/contact",
      es: "/contacto",
      pt: "/contacto"
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

  if (legalMappings[urlPath]) {
    const mapped = legalMappings[urlPath][cleanLocale];
    if (mapped) {
      return `/${cleanLocale}${mapped}${searchAndHash}`;
    }
  }

  const pathParts = urlPath.split("/");
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

  let localizedHref = urlPath;
  if (firstSegment && internalToSlug[cleanLocale] && internalToSlug[cleanLocale][firstSegment]) {
    const localizedSlug = internalToSlug[cleanLocale][firstSegment];
    pathParts[1] = localizedSlug;
    
    // Check if it is a book path and has a vertical sub-slug
    if (firstSegment === "book" && pathParts[2]) {
      const rawVert = pathParts[2];
      const internalVert = resolveVerticalSlug(rawVert, cleanLocale);
      const localizedVert = (INTERNAL_TO_VERTICAL[cleanLocale] && INTERNAL_TO_VERTICAL[cleanLocale][internalVert]) || internalVert;
      pathParts[2] = localizedVert;
    }
    
    localizedHref = pathParts.join("/");
  }

  return `/${cleanLocale}${localizedHref === "/" ? "" : localizedHref}${searchAndHash}`;
}


