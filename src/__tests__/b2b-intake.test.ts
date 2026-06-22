import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createBooking } from "@/app/actions/booking";

describe("B2B Verticals Intake and Quote Routing (TDD)", () => {
  const b2bEmail = "b2b-client@rewilt-properties.ch";
  let buildingBookingId: string;
  let restaurantBookingId: string;

  beforeAll(async () => {
    // Ensure the guest email record is verified in the database
    await db.guestEmail.upsert({
      where: { email: b2bEmail },
      update: { verifiedAt: new Date() },
      create: { email: b2bEmail, verifiedAt: new Date() }
    });
  });

  afterAll(async () => {
    // Clean up test records
    if (buildingBookingId) {
      await db.booking.deleteMany({ where: { id: buildingBookingId } });
    }
    if (restaurantBookingId) {
      await db.booking.deleteMany({ where: { id: restaurantBookingId } });
    }
    await db.guestEmail.deleteMany({ where: { email: b2bEmail } });
    await db.user.deleteMany({ where: { email: b2bEmail } });
  });

  it("should successfully create a quote_pending booking for Building Care with building specs", async () => {
    const res = await createBooking({
      email: b2bEmail,
      vertical: "building-care",
      categorySlug: "building-care",
      intake: {
        buildingPropertyType: "residential",
        buildingEntrances: 3,
        buildingFloors: 5,
        buildingCommonArea: 250,
        buildingLift: true,
        buildingGarage: true,
        buildingGarageArea: 400,
        buildingWasteRoom: true,
        buildingWindowCleaning: true,
        buildingWindowFreq: "quarterly",
        buildingPortfolioSize: 2,
        frequency: "weekly"
      },
      scheduledAtStr: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledWindow: "morning",
      locationAddress: "Löwenstrasse 12, 8001 Zürich"
    });

    expect(res.success).toBe(true);
    expect(res.bookingId).toBeDefined();
    buildingBookingId = res.bookingId!;

    // Retrieve from database and verify
    const booking = await db.booking.findUnique({
      where: { id: buildingBookingId }
    });

    expect(booking).toBeDefined();
    expect(booking?.vertical).toBe("building-care");
    expect(booking?.status).toBe("quote_pending"); // Should be a quote vertical
    expect(booking?.totalAmountChf.toNumber()).toBe(0); // Quote verticals start at 0

    const parsedIntake = JSON.parse(booking!.intake);
    expect(parsedIntake.buildingPropertyType).toBe("residential");
    expect(parsedIntake.buildingEntrances).toBe(3);
    expect(parsedIntake.buildingFloors).toBe(5);
    expect(parsedIntake.buildingCommonArea).toBe(250);
    expect(parsedIntake.buildingLift).toBe(true);
    expect(parsedIntake.buildingGarage).toBe(true);
    expect(parsedIntake.buildingGarageArea).toBe(400);
    expect(parsedIntake.buildingWindowFreq).toBe("quarterly");
  });

  it("should successfully create a quote_pending booking for Restaurant & Kitchen with multi-tier options", async () => {
    const res = await createBooking({
      email: b2bEmail,
      vertical: "restaurant",
      categorySlug: "restaurant",
      intake: {
        restaurantVenueType: "commercial_kitchen",
        restaurantSurfaceArea: 180,
        restaurantCovers: 80,
        restaurantTier: ["tier_a", "tier_b"], // Both compliance and nightly cleaning
        restaurantKitchenArea: 60,
        restaurantGreaseLoad: "heavy",
        restaurantHoodLength: 4,
        restaurantHoodsCount: 2,
        restaurantDuctAccessible: true,
        restaurantLastCertified: "2026-01-15",
        restaurantCertRequiredFor: ["insurer", "fire"],
        restaurantOperatingHours: "after-hours",
        frequency: "one-off"
      },
      scheduledAtStr: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledWindow: "afternoon",
      locationAddress: "Bahnhofplatz 15, 8001 Zürich"
    });

    expect(res.success).toBe(true);
    expect(res.bookingId).toBeDefined();
    restaurantBookingId = res.bookingId!;

    // Retrieve and verify
    const booking = await db.booking.findUnique({
      where: { id: restaurantBookingId }
    });

    expect(booking).toBeDefined();
    expect(booking?.vertical).toBe("restaurant");
    expect(booking?.status).toBe("quote_pending");

    const parsedIntake = JSON.parse(booking!.intake);
    expect(parsedIntake.restaurantVenueType).toBe("commercial_kitchen");
    expect(parsedIntake.restaurantTier).toContain("tier_a");
    expect(parsedIntake.restaurantTier).toContain("tier_b");
    expect(parsedIntake.restaurantGreaseLoad).toBe("heavy");
    expect(parsedIntake.restaurantHoodLength).toBe(4);
    expect(parsedIntake.restaurantHoodsCount).toBe(2);
    expect(parsedIntake.restaurantDuctAccessible).toBe(true);
    expect(parsedIntake.restaurantLastCertified).toBe("2026-01-15");
    expect(parsedIntake.restaurantCertRequiredFor).toContain("insurer");
    expect(parsedIntake.restaurantCertRequiredFor).toContain("fire");
  });
});
