import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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

function getLocalizationInfo(pathname: string) {
  const parts = pathname.split("/");
  let hasPrefix = false;
  let urlLocale = DEFAULT_LOCALE;

  if (parts[1] && LOCALES.includes(parts[1])) {
    hasPrefix = true;
    urlLocale = parts[1];
  }

  const remainingParts = hasPrefix ? parts.slice(2) : parts.slice(1);
  const firstSlug = remainingParts[0] || "";

  let internalSlug = firstSlug;
  let canonicalSlug = firstSlug;

  const mappingForLocale = SLUG_TO_INTERNAL[urlLocale];
  if (firstSlug && mappingForLocale && mappingForLocale[firstSlug]) {
    internalSlug = mappingForLocale[firstSlug];
    canonicalSlug = firstSlug;
  } else {
    let matchedInternal: string | null = null;

    if (firstSlug === "providers" || firstSlug === "book") {
      matchedInternal = firstSlug;
    } else {
      for (const loc of LOCALES) {
        const otherMapping = SLUG_TO_INTERNAL[loc];
        if (otherMapping && otherMapping[firstSlug]) {
          matchedInternal = otherMapping[firstSlug];
          break;
        }
      }
    }

    if (matchedInternal) {
      internalSlug = matchedInternal;
      canonicalSlug = INTERNAL_TO_SLUG[urlLocale][matchedInternal] || matchedInternal;
    }
  }

  const internalPathname = "/" + [internalSlug, ...remainingParts.slice(1)].filter(Boolean).join("/");
  const canonicalParts = [canonicalSlug, ...remainingParts.slice(1)].filter(Boolean);
  let canonicalPathname = "";
  if (urlLocale === DEFAULT_LOCALE) {
    canonicalPathname = "/" + canonicalParts.join("/");
  } else {
    canonicalPathname = `/${urlLocale}` + (canonicalParts.length ? "/" + canonicalParts.join("/") : "");
  }

  return {
    urlLocale,
    internalPathname,
    canonicalPathname,
    hasPrefix
  };
}

function getCanonicalPathname(internalPathname: string, targetLocale: string) {
  const parts = internalPathname.split("/");
  const firstSlug = parts[1] || "";
  
  let canonicalSlug = firstSlug;
  if (firstSlug && INTERNAL_TO_SLUG[targetLocale] && INTERNAL_TO_SLUG[targetLocale][firstSlug]) {
    canonicalSlug = INTERNAL_TO_SLUG[targetLocale][firstSlug];
  }
  
  const remaining = [canonicalSlug, ...parts.slice(2)].filter(Boolean);
  if (targetLocale === DEFAULT_LOCALE) {
    return "/" + remaining.join("/");
  } else {
    return `/${targetLocale}` + (remaining.length ? "/" + remaining.join("/") : "");
  }
}

export async function middleware(request: NextRequest) {
  let response = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(.*)$/.test(pathname)
  ) {
    return response;
  }

  const locInfo = getLocalizationInfo(pathname);

  // Helper to copy session cookies
  const applySessionState = (toResp: NextResponse) => {
    response.cookies.getAll().forEach(cookie => {
      toResp.cookies.set(cookie.name, cookie.value);
    });
  };

  // If the path contains the DEFAULT locale prefix (e.g. /de/...), redirect to the prefixless URL
  if (locInfo.urlLocale === DEFAULT_LOCALE && locInfo.hasPrefix) {
    const cleanPath = pathname.replace(`/${DEFAULT_LOCALE}`, "") || "/";
    const redirectUrl = new URL(cleanPath, request.url);
    const redirectResp = NextResponse.redirect(redirectUrl);
    applySessionState(redirectResp);
    redirectResp.cookies.set("NEXT_LOCALE", DEFAULT_LOCALE, { path: "/" });
    return redirectResp;
  }

  // If the requested pathname is not in its canonical form for its active locale (e.g. /fr/providers instead of /fr/partenaires)
  if (pathname !== locInfo.canonicalPathname) {
    const redirectUrl = new URL(locInfo.canonicalPathname, request.url);
    const redirectResp = NextResponse.redirect(redirectUrl);
    applySessionState(redirectResp);
    redirectResp.cookies.set("NEXT_LOCALE", locInfo.urlLocale, { path: "/" });
    return redirectResp;
  }

  // If the path DOES NOT have a locale prefix (e.g. /book/domestic or /)
  if (!locInfo.hasPrefix) {
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value || DEFAULT_LOCALE;

    // If the cookie locale is not the default locale, redirect to the prefixed canonical URL
    if (cookieLocale !== DEFAULT_LOCALE && LOCALES.includes(cookieLocale)) {
      const canonicalPath = getCanonicalPathname(locInfo.internalPathname, cookieLocale);
      const redirectUrl = new URL(canonicalPath, request.url);
      const redirectResp = NextResponse.redirect(redirectUrl);
      applySessionState(redirectResp);
      return redirectResp;
    }
  }

  // Rewrite to the internal route path (e.g. /providers/apply)
  const rewriteUrl = new URL(locInfo.internalPathname, request.url);
  const rewriteResp = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: new Headers(request.headers),
    }
  });

  applySessionState(rewriteResp);
  rewriteResp.cookies.set("NEXT_LOCALE", locInfo.urlLocale, { path: "/" });
  rewriteResp.headers.set("x-locale", locInfo.urlLocale);

  return rewriteResp;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
