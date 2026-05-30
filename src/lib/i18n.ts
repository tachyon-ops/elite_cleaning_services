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
    }
  };

  if (legalMappings[href]) {
    const mapped = legalMappings[href][cleanLocale];
    if (mapped) {
      // Note that mapped contains the slug path (with a leading slash), so we return it directly or with prefix
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
    localizedHref = pathParts.join("/");
  }

  if (cleanLocale === "de") {
    return localizedHref;
  }

  return `/${cleanLocale}${localizedHref === "/" ? "" : localizedHref}`;
}


