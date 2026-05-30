import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createBooking } from "@/app/actions/booking";
import { updateRecurringScheduleStatus, getRecurringSchedulesList } from "@/app/actions/admin";

describe("Recurring Bookings & Stripe Subscriptions (TDD)", () => {
  const recurringEmail = "recurring-villa@test.ch";
  let createdBookingId: string;
  let createdScheduleId: string;

  beforeAll(async () => {
    // Ensure admin user exists for AuditLog foreign key constraint
    await db.user.upsert({
      where: { id: "admin_user" },
      update: {},
      create: {
        id: "admin_user",
        email: "admin-recurring@test.ch",
        name: "Test Admin",
        passwordHash: "hash",
        role: "super_admin"
      }
    });

    // Ensure the guest email record is verified in the database
    await db.guestEmail.upsert({
      where: { email: recurringEmail },
      update: { verifiedAt: new Date() },
      create: { email: recurringEmail, verifiedAt: new Date() }
    });
  });

  afterAll(async () => {
    // Clean up test records
    if (createdBookingId) {
      await db.payment.deleteMany({ where: { bookingId: createdBookingId } });
      await db.booking.deleteMany({ where: { id: createdBookingId } });
    }
    if (createdScheduleId) {
      await db.recurringSchedule.deleteMany({ where: { id: createdScheduleId } });
    }
    await db.user.deleteMany({ where: { email: recurringEmail } });
    await db.guestEmail.deleteMany({ where: { email: recurringEmail } });
  });

  it("should auto-register customer user and create a recurring schedule when booking a weekly domestic service", async () => {
    const res = await createBooking({
      email: recurringEmail,
      vertical: "domestic",
      categorySlug: "domestic",
      intake: {
        bedrooms: 2,
        bathrooms: 2,
        frequency: "weekly" // recurring
      },
      scheduledAtStr: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      scheduledWindow: "afternoon",
      locationAddress: "Bahnhofstrasse 1, Zürich"
    });

    expect(res.success).toBe(true);
    expect(res.bookingId).toBeDefined();
    createdBookingId = res.bookingId!;

    // 1. Verify a User record was created for the guest email
    const customer = await db.user.findUnique({
      where: { email: recurringEmail }
    });
    expect(customer).toBeDefined();
    expect(customer?.role).toBe("registered_customer");

    // 2. Verify the Booking is linked to customerId and stripeSubscriptionId is generated
    const booking = await db.booking.findUnique({
      where: { id: createdBookingId }
    });
    expect(booking?.customerId).toBe(customer?.id);
    expect(booking?.stripeSubscriptionId).toContain("sub_sim_");

    // 3. Verify the RecurringSchedule was created
    const schedule = await db.recurringSchedule.findFirst({
      where: { customerId: customer?.id }
    });
    expect(schedule).toBeDefined();
    createdScheduleId = schedule!.id;
    expect(schedule?.frequency).toBe("weekly");
    expect(schedule?.status).toBe("active");
    expect(schedule?.timeWindow).toBe("afternoon");
    expect(schedule?.stripeSubscriptionId).toBe(booking?.stripeSubscriptionId);

    // 4. Verify dayOfWeek (0-6)
    const originalDate = new Date(booking!.scheduledAt);
    expect(schedule?.dayOfWeek).toBe(originalDate.getDay());

    // 5. Verify nextRunAt is projected correctly (+7 days for weekly)
    const expectedNextRun = new Date(originalDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    // Compare dates ignoring milliseconds
    expect(Math.floor(new Date(schedule!.nextRunAt).getTime() / 1000)).toBe(Math.floor(expectedNextRun.getTime() / 1000));
  });

  it("should allow admin to retrieve recurring schedules list", async () => {
    const listRes = await getRecurringSchedulesList();
    expect(listRes.success).toBe(true);
    expect(listRes.schedules).toBeDefined();
    
    const ourSchedule = listRes.schedules?.find(s => s.id === createdScheduleId);
    expect(ourSchedule).toBeDefined();
    expect(ourSchedule?.customer?.email).toBe(recurringEmail);
  });

  it("should allow admin to pause, resume, and cancel a recurring schedule", async () => {
    // 1. Pause
    const pauseRes = await updateRecurringScheduleStatus(createdScheduleId, "paused");
    expect(pauseRes.success).toBe(true);
    
    let schedule = await db.recurringSchedule.findUnique({
      where: { id: createdScheduleId }
    });
    expect(schedule?.status).toBe("paused");

    // 2. Resume
    const resumeRes = await updateRecurringScheduleStatus(createdScheduleId, "active");
    expect(resumeRes.success).toBe(true);

    schedule = await db.recurringSchedule.findUnique({
      where: { id: createdScheduleId }
    });
    expect(schedule?.status).toBe("active");

    // 3. Cancel
    const cancelRes = await updateRecurringScheduleStatus(createdScheduleId, "cancelled");
    expect(cancelRes.success).toBe(true);

    schedule = await db.recurringSchedule.findUnique({
      where: { id: createdScheduleId }
    });
    expect(schedule?.status).toBe("cancelled");
  });
});
