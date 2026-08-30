"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

type CreateCampaignData = {
  name: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  vertical?: string | null;
  description?: string | null;
  pamphletHeadline?: string | null;
  pamphletSubtext?: string | null;
  pamphletVerticals?: string | null;
  pamphletHtml?: string | null;
  pamphletTheme?: string | null;
  pamphletImage?: string | null;
  pamphletPalette?: string | null;
  pamphletLocation?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  maxRedemptions?: number | null;
};

export async function createCampaign(data: CreateCampaignData) {
  try {
    const code = data.code.toUpperCase();
    const existing = await db.promoCampaign.findUnique({ where: { code } });
    if (existing) {
      return { success: false, error: "Promo code already exists" };
    }

    const campaign = await db.promoCampaign.create({
      data: {
        ...data,
        code,
      },
    });
    return { success: true, campaign: JSON.parse(JSON.stringify(campaign)) };
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return { success: false, error: error.message || "Failed to create campaign" };
  }
}

export async function updateCampaign(id: string, data: Partial<CreateCampaignData>) {
  try {
    let updateData = { ...data };
    
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existing = await db.promoCampaign.findFirst({
        where: { code: updateData.code, id: { not: id } },
      });
      if (existing) {
        return { success: false, error: "Promo code already exists" };
      }
    }

    const campaign = await db.promoCampaign.update({
      where: { id },
      data: updateData,
    });
    return { success: true, campaign: JSON.parse(JSON.stringify(campaign)) };
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    return { success: false, error: error.message || "Failed to update campaign" };
  }
}

export async function toggleCampaign(id: string) {
  try {
    const campaign = await db.promoCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const updated = await db.promoCampaign.update({
      where: { id },
      data: { active: !campaign.active },
    });
    return { success: true, active: updated.active };
  } catch (error: any) {
    console.error("Error toggling campaign:", error);
    return { success: false, error: error.message || "Failed to toggle campaign" };
  }
}

export async function deleteCampaign(id: string) {
  try {
    // Soft delete by deactivating
    await db.promoCampaign.update({
      where: { id },
      data: { active: false },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return { success: false, error: error.message || "Failed to delete campaign" };
  }
}

export async function getCampaigns() {
  try {
    const campaigns = await db.promoCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { scans: true, bookings: true },
        },
      },
    });
    return { success: true, campaigns: JSON.parse(JSON.stringify(campaigns)) };
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return { success: false, error: error.message || "Failed to fetch campaigns" };
  }
}

export async function getCampaign(id: string) {
  try {
    const campaign = await db.promoCampaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scans: true, bookings: true },
        },
      },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    // Recent 20 scans
    const recentScans = await db.promoScan.findMany({
      where: { campaignId: id },
      orderBy: { scannedAt: "desc" },
      take: 20,
      select: { scannedAt: true, userAgent: true, ipAddress: true },
    });

    // Unique scans
    const allScans = await db.promoScan.findMany({
      where: { campaignId: id, ipAddress: { not: null } },
      select: { ipAddress: true },
    });
    const uniqueIps = new Set(allScans.map((s) => s.ipAddress));
    const uniqueScans = uniqueIps.size;

    const stats = {
      totalScans: campaign._count.scans,
      uniqueScans,
      totalConversions: campaign._count.bookings,
    };

    const serializedCampaign = JSON.parse(JSON.stringify(campaign));
    if (serializedCampaign.discountValue) {
      serializedCampaign.discountValue = Number(campaign.discountValue);
    }

    return { 
      success: true, 
      campaign: serializedCampaign, 
      stats, 
      recentScans: JSON.parse(JSON.stringify(recentScans)) 
    };
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    return { success: false, error: error.message || "Failed to fetch campaign" };
  }
}

export async function validatePromoCode(code: string, vertical?: string) {
  try {
    const upperCode = code.toUpperCase();
    const campaign = await db.promoCampaign.findUnique({
      where: { code: upperCode },
    });

    if (!campaign) {
      return { valid: false, error: "Invalid promo code" };
    }

    if (!campaign.active) {
      return { valid: false, error: "Promo code is no longer active" };
    }

    const now = new Date();
    if (campaign.validFrom && campaign.validFrom > now) {
      return { valid: false, error: "Promo code is not yet valid" };
    }
    if (campaign.validUntil && campaign.validUntil < now) {
      return { valid: false, error: "Promo code has expired" };
    }

    if (campaign.maxRedemptions && campaign.totalRedemptions >= campaign.maxRedemptions) {
      return { valid: false, error: "Promo code has reached its maximum redemption limit" };
    }

    if (vertical && campaign.vertical && campaign.vertical !== vertical) {
      return { valid: false, error: "Promo code is not valid for this service type" };
    }

    return {
      valid: true,
      discountType: campaign.discountType,
      discountValue: Number(campaign.discountValue),
      campaignId: campaign.id,
      campaignName: campaign.name,
    };
  } catch (error: any) {
    console.error("Error validating promo code:", error);
    return { valid: false, error: error.message || "Failed to validate promo code" };
  }
}

export async function recordPromoScan(
  campaignId: string,
  ipAddress?: string,
  userAgent?: string,
  referrer?: string
) {
  try {
    await db.promoScan.create({
      data: {
        campaignId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        referrer: referrer || null,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error recording promo scan:", error);
    return { success: false, error: error.message || "Failed to record scan" };
  }
}
