import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createBooking } from "@/app/actions/booking";
import { validatePromoCode } from "@/app/actions/marketing";

describe("Move-Out Cleaning Pricing & Promo Discount Engine", () => {
  const moveoutEmail = "moveout-client@test.ch";
  const testPromoCode = "MOVETEST20";
  let promoCampaignId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Ensure moveout service category exists
    await db.serviceCategory.upsert({
      where: { slug: "moveout" },
      update: { active: true },
      create: {
        slug: "moveout",
        name: "Move-Out & End Clean",
        vertical: "moveout",
        pricingModel: "quote_on_request",
        active: true
      }
    });

    // Ensure verified guest email exists
    await db.guestEmail.upsert({
      where: { email: moveoutEmail },
      update: { verifiedAt: new Date() },
      create: { email: moveoutEmail, verifiedAt: new Date() }
    });

    // Create a 20% discount promo campaign for testing
    const campaign = await db.promoCampaign.upsert({
      where: { code: testPromoCode },
      update: { active: true, discountValue: 20, discountType: "percentage" },
      create: {
        code: testPromoCode,
        name: "Move-out 20% Discount Test",
        discountType: "percentage",
        discountValue: 20,
        active: true,
        validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    promoCampaignId = campaign.id;
  });

  afterAll(async () => {
    if (bookingId) {
      await db.booking.deleteMany({ where: { id: bookingId } });
    }
    await db.guestEmail.deleteMany({ where: { email: moveoutEmail } });
    await db.user.deleteMany({ where: { email: moveoutEmail } });
    if (promoCampaignId) {
      await db.promoCampaign.deleteMany({ where: { id: promoCampaignId } });
    }
  });

  it("should validate the promo code successfully for moveout vertical", async () => {
    const res = await validatePromoCode(testPromoCode, "moveout");
    expect(res.valid).toBe(true);
    expect(res.discountType).toBe("percentage");
    expect(res.discountValue).toBe(20);
  });

  it("should calculate correct benchmark and apply 20% promo code on a 4.5 room move-out booking with balcony and carpet steam", async () => {
    // 4.5 rooms base = CHF 960 (balcony is standardly included at CHF 0)
    // Carpet steam add-on = CHF 100
    // Provider subtotal = CHF 1'060
    // 15% platform commission on top = +CHF 159
    // Gross Total = CHF 1'219
    // 20% discount = CHF 243.80
    // Final Total = CHF 975.20

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    if (futureDate.getDay() === 0) futureDate.setDate(futureDate.getDate() + 1);
    if (futureDate.getDay() === 6) futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = futureDate.toISOString().split("T")[0];

    const res = await createBooking({
      email: moveoutEmail,
      vertical: "moveout",
      categorySlug: "moveout",
      intake: {
        moveoutRooms: 4.5,
        moveoutArea: 100,
        bedrooms: 3,
        bathrooms: 2,
        moveoutScope: ["handover_guarantee", "balcony_terrace", "carpet_steam"],
        preferredTime: "business-hours"
      },
      scheduledAtStr: dateStr,
      scheduledWindow: "morning",
      locationAddress: "Bahnhofstrasse 1, 8001 Zürich",
      promoCode: testPromoCode
    });

    expect(res.success).toBe(true);
    expect(res.bookingId).toBeDefined();
    bookingId = res.bookingId!;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { promoCampaign: true }
    });

    expect(booking).toBeDefined();
    expect(booking?.vertical).toBe("moveout");
    expect(booking?.promoCampaign?.code).toBe(testPromoCode);
    expect(booking?.promoCampaignId).toBe(promoCampaignId);
    expect(Number(booking?.commissionAmountChf)).toBe(159);
    expect(Number(booking?.promoDiscountChf)).toBe(243.8);
    expect(Number(booking?.totalAmountChf)).toBe(975.2);
  });
});
