import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing campaign ID" }, { status: 400 });
    }

    const campaign = await db.promoCampaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scans: true, bookings: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    const serializedCampaign = JSON.parse(JSON.stringify(campaign));
    if (serializedCampaign.discountValue) {
      serializedCampaign.discountValue = Number(campaign.discountValue);
    }

    return NextResponse.json({
      success: true,
      campaign: serializedCampaign,
    });
  } catch (error: any) {
    console.error("API GET campaign error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing campaign ID" }, { status: 400 });
    }

    const body = await request.json();
    let updateData: any = { ...body };

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existing = await db.promoCampaign.findFirst({
        where: { code: updateData.code, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ success: false, error: "Promo code already exists" }, { status: 400 });
      }
    }

    const campaign = await db.promoCampaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      campaign: JSON.parse(JSON.stringify(campaign)),
    });
  } catch (error: any) {
    console.error("API PATCH campaign error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update campaign" },
      { status: 500 }
    );
  }
}
