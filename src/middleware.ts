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

const VERTICAL_SLUGS: Record<string, Record<string, string>> = {
  de: { haus: "domestic", gewerbe: "commercial", airbnb: "hospitality", luftfahrt: "aviation", yacht: "yacht", endreinigung: "moveout", "gebaeude-service": "building-care", gastgewerbe: "restaurant", spezialreinigung: "special" },
  en: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht", "end-cleaning": "moveout", "building-care": "building-care", restaurant: "restaurant", special: "special" },
  fr: { domestique: "domestic", commercial: "commercial", hebergement: "hospitality", aviation: "aviation", yacht: "yacht", "nettoyage-remise": "moveout", "entretien-immeuble": "building-care", restaurant: "restaurant", special: "special" },
  it: { domestico: "domestic", commerciale: "commercial", accoglienza: "hospitality", aviazione: "aviation", yacht: "yacht", "pulizia-trasloco": "moveout", "gestione-immobili": "building-care", ristorante: "restaurant", speciale: "special" },
  rm: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht", moveout: "moveout", "tgir-edifizis": "building-care", restorant: "restaurant", special: "special" },
  es: { domestico: "domestic", comercial: "commercial", alojamiento: "hospitality", aviacion: "aviation", yate: "yacht", "limpieza-mudanza": "moveout", "mantenimiento-edificios": "building-care", restaurante: "restaurant", especial: "special" },
  pt: { domestica: "domestic", comercial: "commercial", alojamento: "hospitality", aviacao: "aviation", iate: "yacht", "limpeza-mudanca": "moveout", "manutencao-edificios": "building-care", restaurante: "restaurant", especial: "special" }
};

const INTERNAL_TO_VERTICAL: Record<string, Record<string, string>> = {
  de: { domestic: "haus", commercial: "gewerbe", hospitality: "airbnb", aviation: "luftfahrt", yacht: "yacht", moveout: "endreinigung", "building-care": "gebaeude-service", restaurant: "gastgewerbe", special: "spezialreinigung" },
  en: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "yacht", moveout: "end-cleaning", "building-care": "building-care", restaurant: "restaurant", special: "special" },
  fr: { domestic: "domestique", commercial: "commercial", hospitality: "hebergement", aviation: "aviation", yacht: "yacht", moveout: "nettoyage-remise", "building-care": "entretien-immeuble", restaurant: "restaurant", special: "special" },
  it: { domestic: "domestico", commercial: "commercial", hospitality: "accoglienza", aviation: "aviazione", yacht: "yacht", moveout: "pulizia-trasloco", "building-care": "gestione-immobili", restaurant: "ristorante", special: "speciale" },
  rm: { domestic: "domestic", commercial: "commercial", hospitality: "hospitality", aviation: "aviation", yacht: "iaht", moveout: "moveout", "building-care": "tgir-edifizis", restaurant: "restorant", special: "special" },
  es: { domestic: "domestico", commercial: "comercial", hospitality: "alojamiento", aviation: "aviacion", yacht: "yate", moveout: "limpieza-mudanza", "building-care": "mantenimiento-edificios", restaurant: "restaurante", special: "especial" },
  pt: { domestic: "domestica", commercial: "comercial", hospitality: "alojamento", aviation: "aviacao", yacht: "iate", moveout: "limpeza-mudanca", "building-care": "manutencao-edificios", restaurant: "restaurante", special: "especial" }
};

const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: false,
  secure: false, // Allow language preference cookie to be set/sent over HTTP in all environments (non-sensitive preference)
  sameSite: "lax" as const, // Lax SameSite preserves the preference when arriving from external links or bookmarks
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

function getBrowserLocale(request: NextRequest): string | null {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return null;

  const parsedLangs = acceptLanguage
    .split(",")
    .map(lang => {
      const parts = lang.split(";");
      const code = parts[0].trim().split("-")[0].toLowerCase();
      const qPart = parts[1];
      const q = qPart ? parseFloat(qPart.split("=")[1] || "1") : 1;
      return { code, q };
    })
    .sort((a, b) => b.q - a.q);

  for (const lang of parsedLangs) {
    if (LOCALES.includes(lang.code)) {
      return lang.code;
    }
  }
  return null;
}

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

  let internalVertical = remainingParts[1] || "";
  let canonicalVertical = remainingParts[1] || "";

  if (internalSlug === "book" && remainingParts[1]) {
    const verticalPart = remainingParts[1];
    let matchedVertical: string | null = null;
    
    if (VERTICAL_SLUGS[urlLocale] && VERTICAL_SLUGS[urlLocale][verticalPart]) {
      matchedVertical = VERTICAL_SLUGS[urlLocale][verticalPart];
    } else {
      for (const loc of LOCALES) {
        if (VERTICAL_SLUGS[loc] && VERTICAL_SLUGS[loc][verticalPart]) {
          matchedVertical = VERTICAL_SLUGS[loc][verticalPart];
          break;
        }
      }
    }
    
    if (matchedVertical) {
      internalVertical = matchedVertical;
      canonicalVertical = INTERNAL_TO_VERTICAL[urlLocale][matchedVertical] || matchedVertical;
    }
  }

  const internalParts = [internalSlug];
  if (internalSlug === "book" && internalVertical) {
    internalParts.push(internalVertical);
    if (remainingParts.slice(2).length > 0) {
      internalParts.push(...remainingParts.slice(2));
    }
  } else {
    internalParts.push(...remainingParts.slice(1));
  }

  const canonicalParts = [canonicalSlug];
  if (internalSlug === "book" && canonicalVertical) {
    canonicalParts.push(canonicalVertical);
    if (remainingParts.slice(2).length > 0) {
      canonicalParts.push(...remainingParts.slice(2));
    }
  } else {
    canonicalParts.push(...remainingParts.slice(1));
  }

  const internalPathname = "/" + internalParts.filter(Boolean).join("/");
  const canonicalPathnameParts = canonicalParts.filter(Boolean);
  const canonicalPathname = `/${urlLocale}` + (canonicalPathnameParts.length ? "/" + canonicalPathnameParts.join("/") : "");

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
  
  const remaining = [canonicalSlug];
  if (firstSlug === "book" && parts[2]) {
    const internalVert = parts[2];
    const localizedVert = (INTERNAL_TO_VERTICAL[targetLocale] && INTERNAL_TO_VERTICAL[targetLocale][internalVert]) || internalVert;
    remaining.push(localizedVert);
    if (parts.slice(3).length > 0) {
      remaining.push(...parts.slice(3));
    }
  } else {
    remaining.push(...parts.slice(2));
  }
  
  const finalPath = remaining.filter(Boolean);
  return `/${targetLocale}` + (finalPath.length ? "/" + finalPath.join("/") : "");
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

  // If the request is a POST (like Server Actions or form submissions),
  // bypass redirections and do not overwrite or set NEXT_LOCALE cookie.
  // We simply rewrite to the internal route and set the x-locale header.
  if (request.method === "POST") {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", locInfo.internalPathname);
    const rewriteUrl = new URL(locInfo.internalPathname, request.url);
    const rewriteResp = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      }
    });
    applySessionState(rewriteResp);
    rewriteResp.headers.set("x-locale", locInfo.urlLocale);
    return rewriteResp;
  }

  // Redirect root / to the browser/cookie locale
  if (pathname === "/") {
    const hasCookie = request.cookies.has("NEXT_LOCALE");
    const rawLocale = request.cookies.get("NEXT_LOCALE")?.value || getBrowserLocale(request) || DEFAULT_LOCALE;
    const cookieLocale = LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;

    const redirectUrl = new URL(`/${cookieLocale}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    
    const redirectResp = NextResponse.redirect(redirectUrl);
    applySessionState(redirectResp);
    if (!hasCookie) {
      redirectResp.cookies.set("NEXT_LOCALE", cookieLocale, COOKIE_OPTIONS);
    }
    return redirectResp;
  }

  // If the path DOES NOT have a locale prefix (e.g. /partner or /book/domestic)
  if (!locInfo.hasPrefix) {
    const hasCookie = request.cookies.has("NEXT_LOCALE");
    const rawLocale = request.cookies.get("NEXT_LOCALE")?.value || getBrowserLocale(request) || DEFAULT_LOCALE;
    const cookieLocale = LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;

    const canonicalPath = getCanonicalPathname(locInfo.internalPathname, cookieLocale);
    const redirectUrl = new URL(canonicalPath, request.url);
    redirectUrl.search = request.nextUrl.search;
    
    const redirectResp = NextResponse.redirect(redirectUrl);
    applySessionState(redirectResp);
    if (!hasCookie) {
      redirectResp.cookies.set("NEXT_LOCALE", cookieLocale, COOKIE_OPTIONS);
    }
    return redirectResp;
  }

  // If the requested pathname is not in its canonical form for its active locale (e.g. /fr/providers instead of /fr/partenaires)
  if (pathname !== locInfo.canonicalPathname) {
    const redirectUrl = new URL(locInfo.canonicalPathname, request.url);
    redirectUrl.search = request.nextUrl.search;
    const redirectResp = NextResponse.redirect(redirectUrl);
    applySessionState(redirectResp);
    redirectResp.cookies.set("NEXT_LOCALE", locInfo.urlLocale, COOKIE_OPTIONS);
    return redirectResp;
  }

  // --- AUTH GUARDS ---
  const internalPath = locInfo.internalPathname;
  const isAdminLoggedIn = request.cookies.get("admin_session")?.value === "true";
  const isProviderLoggedIn = request.cookies.get("provider_session")?.value === "true";

  // 1. Admin login/signup page: If already logged in, redirect to dashboard
  if ((internalPath === "/admin/login" || internalPath === "/admin/signup") && isAdminLoggedIn) {
    const targetUrl = new URL(getCanonicalPathname("/admin", locInfo.urlLocale), request.url);
    targetUrl.search = request.nextUrl.search;
    const redirectResp = NextResponse.redirect(targetUrl);
    applySessionState(redirectResp);
    return redirectResp;
  }

  // 2. Admin protected routes: If not logged in, redirect to login
  if (internalPath.startsWith("/admin") && internalPath !== "/admin/login" && internalPath !== "/admin/signup" && !isAdminLoggedIn) {
    const targetUrl = new URL(getCanonicalPathname("/admin/login", locInfo.urlLocale), request.url);
    targetUrl.search = request.nextUrl.search;
    const redirectResp = NextResponse.redirect(targetUrl);
    applySessionState(redirectResp);
    return redirectResp;
  }

  // 3. Provider login page: If already logged in, redirect to provider account
  if (internalPath === "/providers/account/login" && isProviderLoggedIn) {
    const targetUrl = new URL(getCanonicalPathname("/providers/account", locInfo.urlLocale), request.url);
    targetUrl.search = request.nextUrl.search;
    const redirectResp = NextResponse.redirect(targetUrl);
    applySessionState(redirectResp);
    return redirectResp;
  }

  // 4. Provider protected routes: If not logged in, redirect to provider login
  if (internalPath.startsWith("/providers/account") && internalPath !== "/providers/account/login" && !isProviderLoggedIn) {
    const targetUrl = new URL(getCanonicalPathname("/providers/account/login", locInfo.urlLocale), request.url);
    targetUrl.search = request.nextUrl.search;
    const redirectResp = NextResponse.redirect(targetUrl);
    applySessionState(redirectResp);
    return redirectResp;
  }

  // Rewrite to the internal route path (e.g. /providers/apply)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", locInfo.internalPathname);
  const rewriteUrl = new URL(locInfo.internalPathname, request.url);
  const rewriteResp = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    }
  });

  applySessionState(rewriteResp);
  rewriteResp.cookies.set("NEXT_LOCALE", locInfo.urlLocale, COOKIE_OPTIONS);
  rewriteResp.headers.set("x-locale", locInfo.urlLocale);

  return rewriteResp;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
