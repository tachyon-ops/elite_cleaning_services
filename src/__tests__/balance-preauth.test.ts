import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  preAuthorizeBalance,
  processPreJobAuthorizations,
  captureBalance,
  cancelBookingWithRefund
} from "@/app/actions/payments";
import { updateBookingStatus } from "@/app/actions/admin";
import { cancelBooking } from "@/lib/db/bookings";

describe("70% Balance Pre-Authorization & Cancellation Policy Tests", () => {
  const testEmail = "test-preauth@test.ch";
  const declineEmail = "decline-balance@test.ch";

  beforeAll(async () => {
    // Ensure admin user exists for AuditLog foreign key constraint
    await db.user.upsert({
      where: { id: "admin_user" },
      update: {},
      create: {
        id: "admin_user",
        email: "admin-preauth@test.ch",
        name: "Test Admin",
        passwordHash: "hash",
        role: "super_admin"
      }
    });

    // Ensure guest emails are verified
    await db.guestEmail.upsert({
      where: { email: testEmail },
      update: { verifiedAt: new Date() },
      create: { email: testEmail, verifiedAt: new Date() }
    });

    await db.guestEmail.upsert({
      where: { email: declineEmail },
      update: { verifiedAt: new Date() },
      create: { email: declineEmail, verifiedAt: new Date() }
    });
  });

  afterAll(async () => {
    // Clean up
    await db.payment.deleteMany({
      where: {
        booking: {
          guestEmail: { in: [testEmail, declineEmail] }
        }
      }
    });
    await db.booking.deleteMany({
      where: {
        guestEmail: { in: [testEmail, declineEmail] }
      }
    });
    await db.guestEmail.deleteMany({
      where: { email: { in: [testEmail, declineEmail] } }
    });
    await db.user.deleteMany({ where: { email: "admin-preauth@test.ch" } });
  });

  it("Scenario 1: Success Path - 10 days out booking -> preauth at 6 days -> completion capture", async () => {
    // 1. Create a booking 10 days in the future
    const booking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "domestic",
        categorySlug: "domestic",
        intake: JSON.stringify({}),
        scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
        scheduledWindow: "morning",
        locationAddress: "Zürich",
        status: "confirmed",
        totalAmountChf: 200,
        depositAmountChf: 60,
        balanceAuthStatus: "not_attempted"
      }
    });

    // Create deposit payment record
    const depPayment = await db.payment.create({
      data: {
        bookingId: booking.id,
        stripeChargeId: "ch_mock_deposit",
        amountChf: 60,
        status: "succeeded"
      }
    });

    // 2. Run background pre-auth checks. Since it is 10 days out, it should NOT process it.
    let preAuthRes = await processPreJobAuthorizations();
    expect(preAuthRes.success).toBe(true);
    let found = preAuthRes.results?.some((r: any) => r.bookingId === booking.id);
    expect(found).toBe(false);

    // 3. Move booking to 5 days out
    await db.booking.update({
      where: { id: booking.id },
      data: {
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    });

    // 4. Run pre-auth checks again. It should authorize.
    preAuthRes = await processPreJobAuthorizations();
    expect(preAuthRes.success).toBe(true);
    found = preAuthRes.results?.some((r: any) => r.bookingId === booking.id && r.action === "first_auth" && r.success === true);
    expect(found).toBe(true);

    const freshBooking = await db.booking.findUnique({
      where: { id: booking.id }
    });
    expect(freshBooking?.balanceAuthStatus).toBe("authorized");
    expect(freshBooking?.balanceStripePaymentIntentId).toContain("pi_mock_balance_");

    // 5. Complete the job
    const statusUpdateRes = await updateBookingStatus(booking.id, "completed");
    expect(statusUpdateRes.success).toBe(true);

    // 6. Verify balance is captured and Payment record created
    const completedBooking = await db.booking.findUnique({
      where: { id: booking.id },
      include: { payments: true }
    });
    expect(completedBooking?.status).toBe("completed");
    expect(completedBooking?.balanceAuthStatus).toBe("captured");

    const balancePayment = completedBooking?.payments.find(p => p.stripeChargeId.includes("balance"));
    expect(balancePayment).toBeDefined();
    expect(Number(balancePayment?.amountChf)).toBe(140);
    expect(balancePayment?.status).toBe("succeeded");
  });

  it("Scenario 2: Cancellation > 7 days prior -> 100% refund of deposit", async () => {
    // 1. Create a booking 10 days in the future
    const booking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "domestic",
        categorySlug: "domestic",
        intake: JSON.stringify({}),
        scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
        scheduledWindow: "morning",
        locationAddress: "Zürich",
        status: "confirmed",
        totalAmountChf: 100,
        depositAmountChf: 30,
        balanceAuthStatus: "not_attempted"
      }
    });

    const depositPayment = await db.payment.create({
      data: {
        bookingId: booking.id,
        stripeChargeId: "ch_mock_dep_refund",
        amountChf: 30,
        status: "succeeded"
      }
    });

    // Mock authentication as admin to call cancelBooking
    const cancelRes = await cancelBookingWithRefund(booking.id, "ops", "Client changed mind");
    expect(cancelRes.success).toBe(true);
    expect(Number(cancelRes.refundAmountChf)).toBe(30);

    const cancelledBooking = await db.booking.findUnique({
      where: { id: booking.id },
      include: { payments: true }
    });

    expect(cancelledBooking?.status).toBe("cancelled_by_ops");
    const refundedPay = cancelledBooking?.payments.find(p => p.id === depositPayment.id);
    expect(refundedPay?.status).toBe("refunded");
    expect(Number(refundedPay?.refundedAmountChf)).toBe(30);
  });

  it("Scenario 3: Cancellation 2 days (48-72h) prior -> 75% refund of collected payments", async () => {
    // 1. Create a booking 55 hours in the future (between 48h and 72h)
    const booking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "domestic",
        categorySlug: "domestic",
        intake: JSON.stringify({}),
        scheduledAt: new Date(Date.now() + 55 * 60 * 60 * 1000), // 55 hours out
        scheduledWindow: "morning",
        locationAddress: "Zürich",
        status: "confirmed",
        totalAmountChf: 100,
        depositAmountChf: 30,
        balanceAuthStatus: "not_attempted"
      }
    });

    await db.payment.create({
      data: {
        bookingId: booking.id,
        stripeChargeId: "ch_mock_dep_75pct",
        amountChf: 40,
        status: "succeeded"
      }
    });

    // 2. Cancel booking (55 hours out -> 75% refund of 40 CHF = 30 CHF refund)
    const cancelRes = await cancelBookingWithRefund(booking.id, "ops", "Client cancellation 2 days prior");
    expect(cancelRes.success).toBe(true);
    expect(Number(cancelRes.refundAmountChf)).toBe(30); // 75% of 40 = 30
    expect(Number(cancelRes.retainedAmountChf)).toBe(10); // 25% retained = 10

    const cancelledBooking = await db.booking.findUnique({
      where: { id: booking.id },
      include: { payments: true }
    });

    expect(cancelledBooking?.status).toBe("cancelled_by_ops");
    expect(cancelledBooking?.balanceAuthStatus).toBe("released");
  });

  it("Scenario 4: Cancellation 1 day (24-48h) prior -> 50% refund of collected payments", async () => {
    // 1. Create a booking 30 hours in the future
    const booking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "domestic",
        categorySlug: "domestic",
        intake: JSON.stringify({}),
        scheduledAt: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30 hours out
        scheduledWindow: "morning",
        locationAddress: "Zürich",
        status: "confirmed",
        totalAmountChf: 100,
        depositAmountChf: 30,
        balanceAuthStatus: "not_attempted"
      }
    });

    await db.payment.create({
      data: {
        bookingId: booking.id,
        stripeChargeId: "ch_mock_dep_50pct",
        amountChf: 40,
        status: "succeeded"
      }
    });

    // 2. Cancel booking within 24-48h -> 50% refund
    const cancelRes = await cancelBookingWithRefund(booking.id, "ops", "Cancellation 1 day prior");
    expect(cancelRes.success).toBe(true);
    expect(Number(cancelRes.refundAmountChf)).toBe(20); // 50% of 40 = 20
    expect(Number(cancelRes.retainedAmountChf)).toBe(20);

    const cancelledBooking = await db.booking.findUnique({
      where: { id: booking.id },
      include: { payments: true }
    });

    expect(cancelledBooking?.status).toBe("cancelled_by_ops");
  });

  it("Scenario 4b: Cancellation < 24h prior -> 0% refund (no return)", async () => {
    // 1. Create a booking 10 hours in the future
    const booking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "domestic",
        categorySlug: "domestic",
        intake: JSON.stringify({}),
        scheduledAt: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours out
        scheduledWindow: "morning",
        locationAddress: "Zürich",
        status: "confirmed",
        totalAmountChf: 100,
        depositAmountChf: 30,
        balanceAuthStatus: "not_attempted"
      }
    });

    await db.payment.create({
      data: {
        bookingId: booking.id,
        stripeChargeId: "ch_mock_dep_0pct",
        amountChf: 40,
        status: "succeeded"
      }
    });

    // 2. Cancel booking within 24h -> 0% refund
    const cancelRes = await cancelBookingWithRefund(booking.id, "ops", "Last minute cancel <24h");
    expect(cancelRes.success).toBe(true);
    expect(Number(cancelRes.refundAmountChf)).toBe(0);
    expect(Number(cancelRes.retainedAmountChf)).toBe(40);

    const cancelledBooking = await db.booking.findUnique({
      where: { id: booking.id },
      include: { payments: true }
    });

    expect(cancelledBooking?.status).toBe("cancelled_by_ops");
  });

  it("Scenario 5: Failed auth with grace period -> retry daily -> cancel after 4 days", async () => {
    // 1. Create a booking 5 days in the future with decline email
    const booking = await db.booking.create({
      data: {
        guestEmail: declineEmail,
        vertical: "domestic",
        categorySlug: "domestic",
        intake: JSON.stringify({}),
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days out
        scheduledWindow: "morning",
        locationAddress: "Zürich",
        status: "confirmed",
        totalAmountChf: 100,
        depositAmountChf: 30,
        balanceAuthStatus: "not_attempted"
      }
    });

    // 2. Process authorizations. It should fail to preauthorize because of the decline email.
    let procRes = await processPreJobAuthorizations();
    expect(procRes.success).toBe(true);

    let freshBooking = await db.booking.findUnique({ where: { id: booking.id } });
    expect(freshBooking?.balanceAuthStatus).toBe("failed");
    expect(freshBooking?.balanceAuthAttempts).toBe(1);
    expect(freshBooking?.balanceAuthFailedAt).toBeDefined();

    // 3. Process authorizations again. It should retry auth but fail again.
    procRes = await processPreJobAuthorizations();
    expect(procRes.success).toBe(true);

    freshBooking = await db.booking.findUnique({ where: { id: booking.id } });
    expect(freshBooking?.balanceAuthStatus).toBe("failed");
    expect(freshBooking?.balanceAuthAttempts).toBe(2);

    // 4. Backdate the first failure to be 5 days ago (grace period is 4 days)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await db.booking.update({
      where: { id: booking.id },
      data: {
        balanceAuthFailedAt: fiveDaysAgo
      }
    });

    // 5. Process authorizations again. Since grace period expired, it should cancel the booking.
    procRes = await processPreJobAuthorizations();
    expect(procRes.success).toBe(true);

    const cancelledBooking = await db.booking.findUnique({ where: { id: booking.id } });
    expect(cancelledBooking?.status).toBe("cancelled_by_ops");
    expect(cancelledBooking?.balanceAuthStatus).toBe("failed_grace_expired");
    expect(cancelledBooking?.cancellationReason).toContain("grace period");
  });
});
