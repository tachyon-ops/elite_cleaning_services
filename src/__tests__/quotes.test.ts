import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createQuote } from "@/app/actions/admin";
import { acceptQuoteAndPayDeposit, getBookingQuoteDetails, rejectQuote, createBooking } from "@/app/actions/booking";
import { chargeDayOfService, confirmServiceCompletion, providerCheckInBooking, providerCompleteBookingWithProof } from "@/app/actions/payments";

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
    expect(booking?.prebookingHoldStatus).toBe("none");

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

  it("should support provider check-in and completion with photographic proof", async () => {
    // 1. Create a booking in offer_dispatched status with 1/3 deposit paid
    const proofBooking = await db.booking.create({
      data: {
        guestEmail: testEmail,
        vertical: "yachting",
        categorySlug: "yacht",
        intake: JSON.stringify({}),
        scheduledAt: new Date(),
        scheduledWindow: "morning",
        locationAddress: "Marina Zürich, Pier 3",
        status: "offer_dispatched",
        totalAmountChf: 900,
        depositAmountChf: 300,
        prebookingDepositChf: 0,
        prebookingHoldStatus: "none"
      }
    });

    // Record the initial 1/3 deposit payment
    await db.payment.create({
      data: {
        bookingId: proofBooking.id,
        stripeChargeId: `ch_mock_deposit_${Math.random().toString(36).substring(2, 9)}`,
        amountChf: 300,
        status: "succeeded",
        refundedAmountChf: 0
      }
    });

    // 2. Provider arrives and clicks Check In
    const checkInRes = await providerCheckInBooking(proofBooking.id);
    expect(checkInRes.success).toBe(true);

    const checkedInBooking = await db.booking.findUnique({
      where: { id: proofBooking.id }
    });
    expect(checkedInBooking?.status).toBe("in_progress");
    expect(checkedInBooking?.checkInAt).toBeDefined();

    // 3. Provider finishes service and submits photographic proof
    const samplePhotos = [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac"
    ];
    const notes = "Yacht deck and interior deep detailing completed. Inspection signed off.";

    const completeRes = await providerCompleteBookingWithProof({
      bookingId: proofBooking.id,
      photos: samplePhotos,
      notes
    });

    expect(completeRes.success).toBe(true);
    expect(completeRes.remainingCharged).toBe(600); // Remaining 2/3 of 900 = 600

    const completedBooking = await db.booking.findUnique({
      where: { id: proofBooking.id }
    });
    expect(completedBooking?.status).toBe("completed");
    expect(completedBooking?.completedAt).toBeDefined();
    expect(completedBooking?.completionNotes).toBe(notes);
    expect(JSON.parse(completedBooking!.completionPhotos!)).toEqual(samplePhotos);

    // Verify all payments total 900
    const payments = await db.payment.findMany({
      where: { bookingId: proofBooking.id }
    });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountChf), 0);
    expect(totalPaid).toBe(900);

    // Clean up
    await db.auditLog.deleteMany({ where: { targetId: proofBooking.id } });
    await db.payment.deleteMany({ where: { bookingId: proofBooking.id } });
    await db.booking.delete({ where: { id: proofBooking.id } });
  });

  it("should preserve coupon on reservation and apply discount when admin generates quote", async () => {
    // 1. Create a 25% discount test coupon campaign
    const promoCode = "YACHT25";
    await db.promoCampaign.deleteMany({ where: { code: promoCode } });
    const campaign = await db.promoCampaign.create({
      data: {
        code: promoCode,
        name: "Yacht 25% Promotion",
        discountType: "percentage",
        discountValue: 25,
        active: true,
        validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalRedemptions: 0
      }
    });

    // 2. Customer books quote-on-request service with coupon code
    const bookRes = await createBooking({
      email: testEmail,
      vertical: "yacht",
      categorySlug: "yacht",
      intake: { vesselLength: 50 },
      scheduledAtStr: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledWindow: "morning",
      locationAddress: "Port of Lausanne",
      promoCode
    });

    expect(bookRes.success).toBe(true);
    expect(bookRes.bookingId).toBeDefined();
    const couponBookingId = bookRes.bookingId!;

    // Assert booking starts at quote_pending AND remembers promoCampaignId
    const couponBooking = await db.booking.findUnique({
      where: { id: couponBookingId }
    });
    expect(couponBooking?.status).toBe("quote_pending");
    expect(couponBooking?.promoCampaignId).toBe(campaign.id);

    // 3. Admin reviews requirements and prepares quote of CHF 2000
    const quoteRes = await createQuote({
      bookingId: couponBookingId,
      amountChf: 2000,
      validUntilDays: 7,
      notes: "Full luxury yacht detailing"
    });
    expect(quoteRes.success).toBe(true);

    // Assert the quote applied the 25% coupon discount (2000 * 0.25 = 500 discount -> 1500 net total)
    const quotedBooking = await db.booking.findUnique({
      where: { id: couponBookingId },
      include: { quote: true, promoCampaign: true }
    });
    expect(quotedBooking?.status).toBe("quote_sent");
    expect(Number(quotedBooking?.promoDiscountChf)).toBe(500); // 25% of 2000
    expect(Number(quotedBooking?.totalAmountChf)).toBe(1500); // 2000 - 500
    expect(Number(quotedBooking?.depositAmountChf)).toBe(500); // 1/3 of 1500

    // 4. Quote details API returns promoCampaign and discount
    const detailsRes = await getBookingQuoteDetails(couponBookingId);
    expect(detailsRes.success).toBe(true);
    expect(detailsRes.booking?.promoDiscountChf).toBe(500);
    expect(detailsRes.booking?.promoCampaign?.code).toBe(promoCode);
    expect(detailsRes.booking?.totalAmountChf).toBe(1500);
    expect(detailsRes.booking?.depositAmountChf).toBe(500);

    // Clean up
    await db.auditLog.deleteMany({ where: { targetId: couponBookingId } });
    await db.quote.deleteMany({ where: { bookingId: couponBookingId } });
    await db.booking.delete({ where: { id: couponBookingId } });
    await db.promoCampaign.delete({ where: { id: campaign.id } });
  });
});
