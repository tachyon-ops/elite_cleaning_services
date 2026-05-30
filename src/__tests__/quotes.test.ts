import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createQuote } from "@/app/actions/admin";
import { acceptQuoteAndPayDeposit, getBookingQuoteDetails } from "@/app/actions/booking";

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
    await db.user.deleteMany({ where: { id: "admin_user" } });
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
    expect(Number(updatedBooking?.depositAmountChf)).toBe(360); // 30% of 1200
  });

  it("should allow public access to quote details", async () => {
    const detailsRes = await getBookingQuoteDetails(bookingId);
    expect(detailsRes.success).toBe(true);
    expect(detailsRes.booking).toBeDefined();
    expect(detailsRes.booking?.quote).toBeDefined();
    expect(detailsRes.booking?.quote?.notes).toBe("Bespoke Yacht Polish and Hull cleaning");
    expect(detailsRes.booking?.totalAmountChf).toBe(1200);
    expect(detailsRes.booking?.depositAmountChf).toBe(360);
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

    // Assert payment is created for deposit
    const payment = await db.payment.findFirst({
      where: { bookingId }
    });
    expect(payment).toBeDefined();
    expect(Number(payment?.amountChf)).toBe(360);
    expect(payment?.status).toBe("succeeded");

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
});
