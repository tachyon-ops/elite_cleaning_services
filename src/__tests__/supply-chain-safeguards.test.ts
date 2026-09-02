import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { getAvailableSlots, sendOtp, verifyOtp, createBooking } from "@/app/actions/booking";

describe("Supply Chain Safeguards & Admin Toggle Controls", () => {
  const testEmail = "supplychain.client@test.ch";

  beforeEach(async () => {
    await db.payment.deleteMany({ where: { booking: { guestEmail: testEmail } } });
    await db.payout.deleteMany({ where: { booking: { guestEmail: testEmail } } });
    await db.auditLog.deleteMany({ where: { targetTable: "Booking" } });
    await db.booking.deleteMany({ where: { guestEmail: testEmail } });
    await db.user.deleteMany({ where: { email: testEmail } });
    await db.guestEmail.deleteMany({ where: { email: testEmail } });

    // Reset toggles to default: blocked ("false")
    await db.systemSetting.upsert({
      where: { key: "allow_weekend_bookings" },
      update: { value: "false" },
      create: { key: "allow_weekend_bookings", value: "false" }
    });
    await db.systemSetting.upsert({
      where: { key: "allow_after_hours_bookings" },
      update: { value: "false" },
      create: { key: "allow_after_hours_bookings", value: "false" }
    });
  });

  async function setupVerifiedGuest(email: string) {
    await sendOtp(email);
    const guestRecord = await db.guestEmail.findUnique({ where: { email } });
    const otp = guestRecord?.otpCode || "";
    await verifyOtp(email, otp);
  }

  it("1. When weekend toggle is false: getAvailableSlots and createBooking reject weekends", async () => {
    // Saturday: 2026-09-12
    const saturdayRes = await getAvailableSlots("commercial", "2026-09-12");
    expect(saturdayRes.success).toBe(false);
    expect(saturdayRes.error).toContain("Weekend bookings are currently unavailable");

    // Attempt booking on weekend
    await setupVerifiedGuest(testEmail);
    const bookingRes = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: { officeType: "office", surfaceArea: 100, frequency: "one-off" },
      scheduledAtStr: "2026-09-19",
      scheduledWindow: "morning",
      locationAddress: "Bleicherweg 10, 8002 Zürich"
    });

    expect(bookingRes.success).toBe(false);
    expect(bookingRes.error).toContain("Weekend bookings are currently paused");
  });

  it("2. When weekend toggle is true: getAvailableSlots and createBooking accept weekends", async () => {
    // Enable weekend bookings via backoffice system setting
    await db.systemSetting.update({
      where: { key: "allow_weekend_bookings" },
      data: { value: "true" }
    });

    // Saturday: 2026-09-12
    const saturdayRes = await getAvailableSlots("commercial", "2026-09-12");
    expect(saturdayRes.success).toBe(true);
    expect(saturdayRes.slots).toBeDefined();
    const slotLabels = saturdayRes.slots!.map((s: any) => s.label);
    expect(slotLabels.some((l: string) => l.includes("Weekend"))).toBe(true);

    // Book on Saturday
    await setupVerifiedGuest(testEmail);
    const bookingRes = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: { officeType: "office", surfaceArea: 100, frequency: "one-off", preferredTime: "weekends" },
      scheduledAtStr: "2026-09-19",
      scheduledWindow: "morning",
      locationAddress: "Bleicherweg 10, 8002 Zürich"
    });

    expect(bookingRes.success).toBe(true);
    expect(bookingRes.bookingId).toBeDefined();
  });

  it("3. When after-hours toggle is false: after-hours slots are excluded and booking is rejected", async () => {
    // Monday: 2026-09-14 with preferredTime="after-hours"
    const res = await getAvailableSlots("commercial", "2026-09-14", "after-hours");
    expect(res.success).toBe(true);
    const slotIds = res.slots!.map((s: any) => s.id);
    expect(slotIds).not.toContain("after-hours");

    // Attempt booking after-hours
    await setupVerifiedGuest(testEmail);
    const bookingRes = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: { officeType: "office", surfaceArea: 100, frequency: "one-off", preferredTime: "after-hours" },
      scheduledAtStr: "2026-09-21",
      scheduledWindow: "after-hours",
      locationAddress: "Bleicherweg 10, 8002 Zürich"
    });

    expect(bookingRes.success).toBe(false);
    expect(bookingRes.error).toContain("After-hours service is currently unavailable");
  });

  it("4. When after-hours toggle is true: after-hours slot is returned and booking succeeds", async () => {
    // Enable after-hours bookings via backoffice system setting
    await db.systemSetting.update({
      where: { key: "allow_after_hours_bookings" },
      data: { value: "true" }
    });

    // Monday: 2026-09-14 with preferredTime="after-hours"
    const res = await getAvailableSlots("commercial", "2026-09-14", "after-hours");
    expect(res.success).toBe(true);
    const slotIds = res.slots!.map((s: any) => s.id);
    expect(slotIds).toContain("after-hours");

    // Book after-hours
    await setupVerifiedGuest(testEmail);
    const bookingRes = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: { officeType: "office", surfaceArea: 100, frequency: "one-off", preferredTime: "after-hours" },
      scheduledAtStr: "2026-09-21",
      scheduledWindow: "after-hours",
      locationAddress: "Bleicherweg 10, 8002 Zürich"
    });

    expect(bookingRes.success).toBe(true);
    expect(bookingRes.bookingId).toBeDefined();

    const booking = await db.booking.findUnique({ where: { id: bookingRes.bookingId } });
    expect(booking?.scheduledWindow).toBe("after-hours");
  });

  it("5. createBooking succeeds on standard weekday business-hours regardless of toggles", async () => {
    await setupVerifiedGuest(testEmail);

    // Tuesday: 2026-09-22
    const res = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: { officeType: "office", surfaceArea: 100, frequency: "one-off", preferredTime: "business-hours" },
      scheduledAtStr: "2026-09-22",
      scheduledWindow: "morning",
      locationAddress: "Bleicherweg 10, 8002 Zürich"
    });

    expect(res.success).toBe(true);
    expect(res.bookingId).toBeDefined();
  });
});
