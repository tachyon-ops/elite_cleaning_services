import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateEmailOtp } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user identifier" }, { status: 400 });
    }

    const adminUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!adminUser || !["super_admin", "editor"].includes(adminUser.role)) {
      return NextResponse.json({ success: false, error: "Invalid user or administrative configuration" }, { status: 403 });
    }

    const otp = generateEmailOtp();
    await db.user.update({
      where: { id: adminUser.id },
      data: {
        emailOtpCode: otp,
        emailOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
      }
    });

    console.log(`\n==================================================`);
    console.log(`[RESEND EMAIL OTP] Sent to: ${adminUser.email}`);
    console.log(`[RESEND EMAIL OTP] Code: ${otp}`);
    console.log(`==================================================\n`);

    const isProduction = process.env.NODE_ENV === "production";
    const emailResult = await sendEmail({
      to: adminUser.email,
      subject: "Mondar - Security OTP",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #b59410; letter-spacing: 0.15em; font-weight: 500; text-align: center; margin-bottom: 24px;">MONDAR GATEWAY</h2>
          <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center;">Enter the new OTP code below to verify your identity and authorize your backoffice session:</p>
          <div style="background-color: #141414; border: 1px solid #262626; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.2em; font-weight: bold; color: #b59410;">${otp}</span>
          </div>
          <p style="font-size: 11px; color: #595959; text-align: center; line-height: 1.4;">This code will expire in 15 minutes. If you did not request this code, please secure your account immediately.</p>
        </div>
      `
    });

    if (!emailResult.success && isProduction) {
      return NextResponse.json({ success: false, error: emailResult.error || "Failed to dispatch security OTP code via SMTP." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      devOtp: isProduction ? undefined : otp
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
