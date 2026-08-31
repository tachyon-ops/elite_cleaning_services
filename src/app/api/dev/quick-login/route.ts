import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const adminUser = await db.user.findFirst({
      where: { role: "super_admin" }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get("redirect") || "/en/admin";
    const targetUrl = new URL(redirectTo, request.url);

    const response = NextResponse.redirect(targetUrl);

    // Set admin cookies
    response.cookies.set("admin_session", "true", {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    });

    response.cookies.set("admin_user_id", adminUser.id, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    });

    response.cookies.set("admin_user_role", adminUser.role, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    });

    response.cookies.set("NEXT_LOCALE", adminUser.locale || "en", {
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
