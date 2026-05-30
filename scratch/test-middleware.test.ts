import { describe, it, expect, vi } from "vitest";
import { middleware } from "../src/middleware";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn().mockImplementation((req) => NextResponse.next({ request: req }))
}));

describe("Debug /de middleware crash", () => {
  it("should trace middleware execution on /de", async () => {
    try {
      const url = "http://localhost:3000/de";
      const req = new NextRequest(url);
      const res = await middleware(req);
      console.log("Status:", res.status);
      console.log("Location:", res.headers.get("location"));
      console.log("Set-Cookie:", res.headers.get("set-cookie"));
    } catch (e: any) {
      console.error("MIDDLEWARE CRASHED:", e);
      throw e;
    }
  });
});
