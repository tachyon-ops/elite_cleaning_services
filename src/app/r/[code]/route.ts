import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  try {
    const campaign = await db.promoCampaign.findUnique({
      where: { code: upperCode },
    });

    const now = new Date();
    const isActive = campaign?.active ?? false;
    const isValid = !campaign?.validUntil || campaign.validUntil > now;

    if (campaign && isActive && isValid) {
      // Extract IP, userAgent, referrer
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown IP";
      const userAgent = request.headers.get("user-agent") || "Unknown User Agent";
      const referrer = request.headers.get("referer") || null;

      // Create PromoScan record
      await db.promoScan.create({
        data: {
          campaignId: campaign.id,
          ipAddress,
          userAgent,
          referrer,
        },
      });

      // Redirect with promo code
      return NextResponse.redirect(new URL(`/book/general?promo=${upperCode}`, request.url));
    }
  } catch (error) {
    console.error("Error in QR scan redirect route:", error);
    // Fallthrough to redirect on error
  }

  // Graceful fallback
  return NextResponse.redirect(new URL("/book/general", request.url));
}
