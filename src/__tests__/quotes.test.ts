import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createQuote } from "@/app/actions/admin";
import { acceptQuoteAndPayDeposit, getBookingQuoteDetails, rejectQuote } from "@/app/actions/booking";
import { chargeDayOfService, confirmServiceCompletion } from "@/app/actions/payments";

describe("Quote-on-Request TDD", () => {
  const testEmail = "yacht-owner@test.ch";
  let bookingId: string;

  beforeAll(async () => {
    // Ensure admin user exists for AuditLog foreign key constraint
    await db.user.upsert({
      where: { id: "admin_user" },
      update: {},
      create: {
        id: "admin_user",
        email: "admin@test.ch",
        name: "Test Admin",
        passwordHash: "hash",
        role: "super_admin"
      }
    });

    // Ensure test email guest is verified in the database
    await db.guestEmail.upsert({
      where: { email: testEmail },
      update: { verifiedAt: new Date() },
      create: { email: testEmail, verifiedAt: new Date() }
    });

    // Create an active provider listing so the matching engine has a provider to assign
    const provider = await db.provider.upsert({
      where: { slug: "test-marina-cleaners" },
      update: { onboardingStatus: "active" },
      create: {
        name: "Test Marina Cleaners",
        slug: "test-marina-cleaners",
        contactEmail: "marina@test.ch",
        contactPhone: "+41 79 123 4567",
        address: "Zürich",
        legalEntityType: "GmbH",
        uidNumber: "CHE-123.456.789 MWST",
        onboardingStatus: "active"
      }
    });

    await db.providerListing.deleteMany({
      where: {
        providerId: provider.id,
        categorySlug: "yacht"
      }
    });

    await db.providerListing.create({
      data: {
        providerId: provider.id,
        categorySlug: "yacht",
        serviceRadiusKm: 50,
        capacityPerDay: 5,
        leadTimeHours: 12,
        active: true
      }
    });
  });

  afterAll(async () => {
    // Clean up database records created during test
    if (bookingId) {
      await db.commissionLedger.deleteMany({ where: { bookingId } });
      await db.payout.deleteMany({ where: { bookingId } });
      await db.payment.deleteMany({ where: { bookingId } });
      await db.providerOffer.deleteMany({ where: { bookingId } });
      await db.quote.deleteMany({ where: { bookingId } });
      await db.booking.deleteMany({ where: { id: bookingId } });
    }
    await db.providerListing.deleteMany({ where: { categorySlug: "yacht" } });
    await db.provider.deleteMany({ where: { slug: "test-marina-cleaners" } });
    await db.guestEmail.deleteMany({ where: { email: testEmail } });
  });

  it("should create a pending quote booking", async () => {
    const booking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "yachting",
        categorySlug: "yacht",
        intake: JSON.stringify({ vesselLength: 45, vesselType: "motor" }),
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        scheduledWindow: "morning",
        locationAddress: "Port of Zürich",
        status: "quote_pending",
        totalAmountChf: 0,
        depositAmountChf: 0
      }
    });

    bookingId = booking.id;
    expect(booking.id).toBeDefined();
    expect(booking.status).toBe("quote_pending");
  });

  it("should allow admin to create a quote", async () => {
    // Mock the session validation since we run inside vitest node process
    // We can directly call the action (assuming checkAdminAuthenticated handles test environment or bypassing it)
    const quoteRes = await createQuote({
      bookingId,
      amountChf: 1200,
      validUntilDays: 7,
      notes: "Bespoke Yacht Polish and Hull cleaning"
    });

    expect(quoteRes.success).toBe(true);

    const updatedBooking = await db.booking.findUnique({
      where: { id: bookingId }
    });

    expect(updatedBooking?.status).toBe("quote_sent");
    expect(Number(updatedBooking?.totalAmountChf)).toBe(1200);
    expect(Number(updatedBooking?.depositAmountChf)).toBe(400); // 1/3 of 1200
  });

  it("should allow public access to quote details", async () => {
    const detailsRes = await getBookingQuoteDetails(bookingId);
    expect(detailsRes.success).toBe(true);
    expect(detailsRes.booking).toBeDefined();
    expect(detailsRes.booking?.quote).toBeDefined();
    expect(detailsRes.booking?.quote?.notes).toBe("Bespoke Yacht Polish and Hull cleaning");
    expect(detailsRes.booking?.totalAmountChf).toBe(1200);
    expect(detailsRes.booking?.depositAmountChf).toBe(400);
  });

  it("should allow customer to accept quote and pay deposit", async () => {
    const acceptRes = await acceptQuoteAndPayDeposit({
      bookingId,
      paymentMethodId: "pm_mock_visa"
    });

    expect(acceptRes.success).toBe(true);

    // Assert booking status updated to offer_dispatched (since matching provider exists)
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { quote: true }
    });

    expect(booking?.status).toBe("offer_dispatched");
    expect(booking?.quote?.acceptedAt).toBeDefined();
    expect(booking?.prebookingHoldStatus).toBe("captured");

    // Assert payments are created for deposit (50 prebooking capture + 350 remainder = 400)
    const payments = await db.payment.findMany({
      where: { bookingId }
    });
    expect(payments.length).toBeGreaterThanOrEqual(1);
    const totalDeposited = payments.reduce((sum, p) => sum + Number(p.amountChf), 0);
    expect(totalDeposited).toBe(400);

    // Assert commission ledger is created
    const ledger = await db.commissionLedger.findFirst({
      where: { bookingId }
    });
    expect(ledger).toBeDefined();
    expect(Number(ledger?.grossAmountChf)).toBe(1200);
    expect(Number(ledger?.commissionRate)).toBe(0.15);
    expect(Number(ledger?.commissionAmountChf)).toBe(180); // 15% of 1200
    expect(Number(ledger?.providerPayoutChf)).toBe(1020); // 85% of 1200

    // Assert provider payout is created
    const payout = await db.payout.findFirst({
      where: { bookingId }
    });
    expect(payout).toBeDefined();
    expect(Number(payout?.amountChf)).toBe(1020);
    expect(payout?.status).toBe("scheduled");
  });

  it("should charge 2nd 1/3 on day of cleaning and set status to in_progress", async () => {
    const dayOfServiceRes = await chargeDayOfService(bookingId);
    expect(dayOfServiceRes.success).toBe(true);
    expect(dayOfServiceRes.amountCharged).toBe(400); // 2nd 1/3 of 1200

    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    });
    expect(booking?.status).toBe("in_progress");
  });

  it("should charge final 1/3 upon supplier completion confirmation and mark completed", async () => {
    const completeRes = await confirmServiceCompletion(bookingId);
    expect(completeRes.success).toBe(true);
    expect(completeRes.finalThirdCharged).toBe(400); // 3rd 1/3 of 1200

    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    });
    expect(booking?.status).toBe("completed");

    // Verify all 3 parts sum to the total: 400 + 400 + 400 = 1200
    const allPayments = await db.payment.findMany({
      where: { bookingId }
    });
    const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amountChf), 0);
    expect(totalCollected).toBe(1200);
  });

  it("should allow declining a quote and releasing the pre-booking hold", async () => {
    // Create a new booking in quote_sent status
    const declineBooking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "yachting",
        categorySlug: "yacht",
        intake: JSON.stringify({}),
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        scheduledWindow: "morning",
        locationAddress: "Port of Zürich",
        status: "quote_sent",
        totalAmountChf: 900,
        depositAmountChf: 300,
        prebookingDepositChf: 50,
        prebookingHoldStatus: "held"
      }
    });

    await db.quote.create({
      data: {
        bookingId: declineBooking.id,
        amountChf: 900,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentAt: new Date()
      }
    });

    const declineRes = await rejectQuote({
      bookingId: declineBooking.id,
      reason: "Budget exceeded"
    });

    expect(declineRes.success).toBe(true);

    const updated = await db.booking.findUnique({
      where: { id: declineBooking.id },
      include: { quote: true }
    });

    expect(updated?.status).toBe("cancelled_by_customer");
    expect(updated?.prebookingHoldStatus).toBe("released");
    expect(updated?.quote?.rejectedAt).toBeDefined();

    // Clean up decline booking
    await db.auditLog.deleteMany({ where: { targetId: declineBooking.id } });
    await db.quote.deleteMany({ where: { bookingId: declineBooking.id } });
    await db.booking.delete({ where: { id: declineBooking.id } });
  });
});
