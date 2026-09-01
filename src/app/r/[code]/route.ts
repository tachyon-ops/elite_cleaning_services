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

      // Determine target vertical from campaign or pamphlet configuration
      let targetVertical = "general";
      if (campaign.vertical && campaign.vertical.trim() && campaign.vertical !== "all") {
        targetVertical = campaign.vertical.trim().toLowerCase();
      } else if (campaign.pamphletVerticals) {
        try {
          const parsed = typeof campaign.pamphletVerticals === "string"
            ? JSON.parse(campaign.pamphletVerticals)
            : campaign.pamphletVerticals;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            const vid = typeof first === "string" ? first : first?.id;
            if (vid) targetVertical = vid.toLowerCase();
          }
        } catch {}
      }

      // Map alias slugs if necessary
      if (targetVertical === "residential") targetVertical = "home";
      if (targetVertical === "office") targetVertical = "commercial";
      if (targetVertical === "gastronomy" || targetVertical === "dining") targetVertical = "restaurant";

      // Redirect with promo code to target vertical booking flow
      return NextResponse.redirect(new URL(`/book/${targetVertical}?promo=${upperCode}`, request.url));
    }
  } catch (error) {
    console.error("Error in QR scan redirect route:", error);
    // Fallthrough to redirect on error
  }

  // Graceful fallback
  return NextResponse.redirect(new URL("/book/general", request.url));
}
