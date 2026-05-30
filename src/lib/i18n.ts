import en from "@/locales/en.json";
import de from "@/locales/de.json";

const dictionaries: Record<string, any> = {
  en,
  de,
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
