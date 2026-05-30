import { describe, it, expect, vi, beforeEach } from "vitest";
import { middleware } from "../middleware";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn().mockImplementation((req) => NextResponse.next({ request: req }))
}));

describe("Middleware i18n Browser Detection and Cookie Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (
    urlPath: string,
    headers: Record<string, string> = {},
    cookies: Record<string, string> = {},
    method: string = "GET"
  ) => {
    const url = `http://localhost:3000${urlPath}`;
    const reqHeaders = new Headers();
    Object.entries(headers).forEach(([k, v]) => reqHeaders.set(k, v));
    
    const req = new NextRequest(url, { method, headers: reqHeaders });
    
    Object.entries(cookies).forEach(([k, v]) => {
      req.cookies.set(k, v);
    });

    return req;
  };

  it("should skip middleware for static files and api routes", async () => {
    const req = createRequest("/api/some-endpoint");
    const res = await middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("should detect English from Accept-Language when no cookie is set and redirect to /en", async () => {
    const req = createRequest("/", { "accept-language": "en-US,en;q=0.9,de;q=0.8" });
    const res = await middleware(req);
    
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/en");
    
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain("NEXT_LOCALE=en");
    expect(setCookieHeader).toContain("Max-Age=31536000");
    expect(setCookieHeader).toContain("Path=/");
  });

  it("should detect French from Accept-Language when no cookie is set and redirect to /fr", async () => {
    const req = createRequest("/", { "accept-language": "fr-CH,fr;q=0.9,de;q=0.8" });
    const res = await middleware(req);
    
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/fr");
    
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain("NEXT_LOCALE=fr");
  });

  it("should detect German from Accept-Language when no cookie is set, proceed with prefixless rewrite, and set cookie to de", async () => {
    const req = createRequest("/", { "accept-language": "de-CH,de;q=0.9,en;q=0.5" });
    const res = await middleware(req);
    
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain("NEXT_LOCALE=de");
  });

  it("should use cookie value if cookie is present, overriding Accept-Language", async () => {
    const req = createRequest("/", { "accept-language": "fr-CH,fr;q=0.9" }, { NEXT_LOCALE: "de" });
    const res = await middleware(req);
    
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-locale")).toBe("de");
  });

  it("should respect URL prefix even if it contradicts cookie and browser headers, updating the cookie", async () => {
    const req = createRequest("/fr/partenaires", { "accept-language": "en-US,en" }, { NEXT_LOCALE: "de" });
    const res = await middleware(req);
    
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain("NEXT_LOCALE=fr");
    expect(res.headers.get("x-locale")).toBe("fr");
  });

  it("should bypass redirects and cookie setting on POST requests (Server Actions)", async () => {
    const req = createRequest("/en/providers", {}, { NEXT_LOCALE: "de" }, "POST");
    const res = await middleware(req);
    
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-locale")).toBe("en");
  });
});
