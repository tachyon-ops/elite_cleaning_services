"use server";

import { db } from "@/lib/db";
import { getLoggedInAdmin } from "@/app/actions/admin";
import { revalidatePath } from "next/cache";

const LOCALES = ["de", "en", "fr", "it", "rm", "es", "pt"];
const DEFAULT_LOCALE = "de";

const INTERNAL_TO_SLUG: Record<string, Record<string, string>> = {
  de: { providers: "partner", book: "buchen" },
  en: { providers: "providers", book: "book" },
  fr: { providers: "partenaires", book: "reserver" },
  it: { providers: "partner", book: "prenotare" },
  rm: { providers: "partenaris", book: "reservar" },
  es: { providers: "proveedores", book: "reservar" },
  pt: { providers: "parceiros", book: "reservar" }
};

const SLUG_TO_INTERNAL: Record<string, Record<string, string>> = {
  de: { partner: "providers", buchen: "book" },
  en: { providers: "providers", book: "book" },
  fr: { partenaires: "providers", reserver: "book" },
  it: { partner: "providers", prenotare: "book" },
  rm: { partenaris: "providers", reservar: "book" },
  es: { proveedores: "providers", reservar: "book" },
  pt: { parceiros: "providers", reservar: "book" }
};

/**
 * Clean a slug path by removing leading/trailing slashes and double slashes
 */
function cleanSlugPath(slug: string): string {
  return slug
    .trim()
    .replace(/^\/+|\/+$/g, "") // remove leading/trailing slashes
    .replace(/\/+/g, "/");      // replace multiple slashes with single slash
}

/**
 * Updates or creates a translation for a given page key and locale.
 * Checks permissions and prevents slug collisions.
 */
export async function updatePageTranslation(payload: {
  pageKey: string;
  locale: string;
  slug: string;
  title: string;
  content: string;
}) {
  try {
    const admin = await getLoggedInAdmin();
    if (!admin || (admin.role !== "super_admin" && admin.role !== "editor")) {
      throw new Error("Unauthorized. Only administrators or editors can edit page translations.");
    }

    const { pageKey, locale, slug, title, content } = payload;
    const cleanedSlug = cleanSlugPath(slug);

    if (!cleanedSlug) {
      throw new Error("Slug cannot be empty.");
    }
    if (!title.trim()) {
      throw new Error("Title cannot be empty.");
    }

    // Verify slug uniqueness in the target locale
    const collision = await db.pageTranslation.findFirst({
      where: {
        locale,
        slug: cleanedSlug,
        page: {
          key: { not: pageKey }
        }
      }
    });

    if (collision) {
      throw new Error(`The slug '${cleanedSlug}' is already in use by another page in ${locale.toUpperCase()}.`);
    }

    // Find or create the page key
    let page = await db.page.findUnique({ where: { key: pageKey } });
    if (!page) {
      page = await db.page.create({ data: { key: pageKey } });
    }

    // Upsert translation
    const translation = await db.pageTranslation.findFirst({
      where: { pageId: page.id, locale }
    });

    if (translation) {
      await db.pageTranslation.update({
        where: { id: translation.id },
        data: {
          slug: cleanedSlug,
          title: title.trim(),
          content
        }
      });
    } else {
      await db.pageTranslation.create({
        data: {
          pageId: page.id,
          locale,
          slug: cleanedSlug,
          title: title.trim(),
          content
        }
      });
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Resolves the equivalent URL path in a target locale for any pathname.
 * Handles both static slugs (e.g. /providers -> /partenaires) and dynamic DB pages.
 */
export async function resolveAlternateLocaleUrl(
  currentPathname: string,
  targetLocale: string
): Promise<string> {
  try {
    if (!LOCALES.includes(targetLocale)) {
      targetLocale = DEFAULT_LOCALE;
    }

    const parts = currentPathname.split("/");
    let hasPrefix = false;
    let urlLocale = DEFAULT_LOCALE;

    if (parts[1] && LOCALES.includes(parts[1])) {
      hasPrefix = true;
      urlLocale = parts[1];
    }

    const remainingParts = hasPrefix ? parts.slice(2) : parts.slice(1);
    const firstSlug = remainingParts[0] || "";

    // 1. Check if first slug matches static mapping (e.g. providers, book)
    let internalSlug = firstSlug;
    let isStatic = false;

    const mappingForLocale = SLUG_TO_INTERNAL[urlLocale];
    if (firstSlug && mappingForLocale && mappingForLocale[firstSlug]) {
      internalSlug = mappingForLocale[firstSlug];
      isStatic = true;
    } else {
      // Find if first slug is static in any other locale
      for (const loc of LOCALES) {
        const otherMapping = SLUG_TO_INTERNAL[loc];
        if (otherMapping && otherMapping[firstSlug]) {
          internalSlug = otherMapping[firstSlug];
          isStatic = true;
          break;
        }
      }
    }

    if (isStatic) {
      const canonicalSlug = INTERNAL_TO_SLUG[targetLocale][internalSlug] || internalSlug;
      const finalParts = [canonicalSlug, ...remainingParts.slice(1)].filter(Boolean);
      
      if (targetLocale === DEFAULT_LOCALE) {
        return "/" + finalParts.join("/");
      } else {
        return `/${targetLocale}` + (finalParts.length ? "/" + finalParts.join("/") : "");
      }
    }

    // 2. Check if remaining path is a dynamic DB page
    const cleanPath = remainingParts.join("/");
    if (cleanPath) {
      // Query if this slug matches a page translation in the current locale
      const match = await db.pageTranslation.findFirst({
        where: {
          locale: urlLocale,
          slug: cleanPath
        },
        include: {
          page: true
        }
      });

      if (match) {
        // Find translation for target locale
        const targetMatch = await db.pageTranslation.findFirst({
          where: {
            pageId: match.pageId,
            locale: targetLocale
          }
        });

        if (targetMatch) {
          const finalSlug = targetMatch.slug;
          if (targetLocale === DEFAULT_LOCALE) {
            return `/${finalSlug}`;
          } else {
            return `/${targetLocale}/${finalSlug}`;
          }
        }
      } else {
        // Try searching in any locale just in case they switched language on a mismatched slug
        const matchAny = await db.pageTranslation.findFirst({
          where: {
            slug: cleanPath
          },
          include: {
            page: true
          }
        });

        if (matchAny) {
          const targetMatch = await db.pageTranslation.findFirst({
            where: {
              pageId: matchAny.pageId,
              locale: targetLocale
            }
          });

          if (targetMatch) {
            const finalSlug = targetMatch.slug;
            if (targetLocale === DEFAULT_LOCALE) {
              return `/${finalSlug}`;
            } else {
              return `/${targetLocale}/${finalSlug}`;
            }
          }
        }
      }
    }

    // Fallback: Default simple prefix translation
    const finalParts = remainingParts.filter(Boolean);
    if (targetLocale === DEFAULT_LOCALE) {
      return "/" + finalParts.join("/");
    } else {
      return `/${targetLocale}` + (finalParts.length ? "/" + finalParts.join("/") : "");
    }
  } catch (error) {
    console.error("Failed to resolve alternate locale URL:", error);
    // Ultimate fallback: return home
    return targetLocale === DEFAULT_LOCALE ? "/" : `/${targetLocale}`;
  }
}

/**
 * Fetches page translation details for the given page key and locale.
 */
export async function getPageTranslationAction(pageKey: string, locale: string) {
  try {
    const page = await db.page.findUnique({ where: { key: pageKey } });
    if (!page) {
      return { success: true, translation: null };
    }

    const translation = await db.pageTranslation.findFirst({
      where: { pageId: page.id, locale }
    });

    return { success: true, translation };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

