import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const adminUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!adminUser || !["super_admin", "editor"].includes(adminUser.role)) {
      return NextResponse.json({ success: false, error: "Invalid user or administrative configuration" }, { status: 403 });
    }

    if (!adminUser.emailOtpCode || !adminUser.emailOtpExpiresAt || adminUser.emailOtpExpiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "OTP code has expired. Please request a new code." }, { status: 400 });
    }

    const cleanToken = String(token).replace(/\D/g, "").trim();
    const isValid = adminUser.emailOtpCode.trim() === cleanToken;
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid verification code. Please check the 6-digit code sent to your email." }, { status: 400 });
    }

    // Clear OTP code once used, and increment loginCount
    await db.user.update({
      where: { id: adminUser.id },
      data: { 
        emailOtpCode: null, 
        emailOtpExpiresAt: null,
        loginCount: adminUser.loginCount + 1 
      }
    });

    const isProduction = process.env.NODE_ENV === "production";
    const res = NextResponse.json({ success: true });

    res.cookies.set("NEXT_LOCALE", adminUser.locale || "en", {
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });
    res.cookies.set("admin_session", "true", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    });
    res.cookies.set("admin_user_id", adminUser.id, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    });
    res.cookies.set("admin_user_role", adminUser.role, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
