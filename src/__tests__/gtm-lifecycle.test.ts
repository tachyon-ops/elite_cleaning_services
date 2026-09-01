import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { GET as qrRedirectRoute } from "@/app/r/[code]/route";
import { validatePromoCode } from "@/app/actions/marketing";
import { sendOtp, verifyOtp, createBooking } from "@/app/actions/booking";
import { assignPartnerTeamWithBudget, finalizeServiceCostAndSettle } from "@/app/actions/admin";

describe("Pre-GTM Full Lifecycle Battle Test", () => {
  const testPromoCode = "GTMTEST15";
  const testEmail = "gtm.client@example.com";
  let promoCampaignId: string;
  let providerId: string;
  let teamId: string;

  beforeEach(async () => {
    // 1. Ensure clean slate for test campaign, provider, and customer
    await db.payment.deleteMany({ where: { booking: { guestEmail: testEmail } } });
    await db.payout.deleteMany({ where: { booking: { guestEmail: testEmail } } });
    await db.auditLog.deleteMany({ where: { targetTable: "Booking" } });
    await db.booking.deleteMany({ where: { guestEmail: testEmail } });
    await db.promoScan.deleteMany({ where: { campaign: { code: testPromoCode } } });
    await db.promoCampaign.deleteMany({ where: { code: testPromoCode } });
    await db.user.deleteMany({ where: { email: testEmail } });
    await db.guestEmail.deleteMany({ where: { email: testEmail } });

    // 2. Setup Active Promo Campaign with QR / Pamphlet configuration
    const campaign = await db.promoCampaign.create({
      data: {
        name: "GTM Opening Campaign",
        code: testPromoCode,
        discountType: "percentage",
        discountValue: 15.0,
        vertical: "commercial",
        pamphletHeadline: "Exclusive Commercial Cleaning",
        pamphletSubtext: "Scan to receive 15% off your first office cleaning.",
        active: true
      }
    });
    promoCampaignId = campaign.id;

    // 3. Setup Test Provider and Subcontractor Team
    const existingProvider = await db.provider.findFirst({ where: { slug: "gtm-subcontractor-gmbh" } });
    if (existingProvider) {
      providerId = existingProvider.id;
      const team = await db.providerTeam.findFirst({ where: { providerId } });
      teamId = team?.id || "";
    } else {
      const provider = await db.provider.create({
        data: {
          name: "GTM Certified Subcontractors GmbH",
          slug: "gtm-subcontractor-gmbh",
          contactEmail: "ops@gtm-subcontractors.ch",
          contactPhone: "+41441234567",
          address: "Bahnhofstrasse 10, 8001 Zürich",
          legalEntityType: "gmbh",
          uidNumber: "CHE-123.456.789",
          onboardingStatus: "active"
        }
      });
      providerId = provider.id;

      const team = await db.providerTeam.create({
        data: {
          providerId: provider.id,
          name: "Zürich Commercial Squad Alpha",
          workingHours: JSON.stringify({ mon: ["08:00", "18:00"] }),
          serviceCategories: JSON.stringify(["commercial", "hospitality"]),
          region: "Zürich"
        }
      });
      teamId = team.id;
    }
  });

  async function setupVerifiedGuest(email: string) {
    await sendOtp(email);
    const guestRecord = await db.guestEmail.findUnique({ where: { email } });
    const otp = guestRecord?.otpCode || "";
    await verifyOtp(email, otp);
  }

  it("Step 1: QR Code Scan -> logs PromoScan and redirects with promo tracking", async () => {
    const fakeRequest = new Request(`http://localhost:3000/r/${testPromoCode}`, {
      headers: {
        "x-forwarded-for": "194.230.145.20",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "referer": "https://mondar.ch/pamphlet"
      }
    });

    const response = await qrRedirectRoute(fakeRequest, {
      params: Promise.resolve({ code: testPromoCode })
    });

    expect(response.status).toBe(307); // NextResponse.redirect
    const location = response.headers.get("location");
    expect(location).toContain(`/book/commercial?promo=${testPromoCode}`);

    // Verify PromoScan record was created in database
    const scan = await db.promoScan.findFirst({
      where: { campaignId: promoCampaignId }
    });
    expect(scan).not.toBeNull();
    expect(scan?.ipAddress).toBe("194.230.145.20");
    expect(scan?.userAgent).toContain("iPhone");
  });

  it("Step 2: Customer applies promo & books with 30% Retainer Deposit (5-day notice)", async () => {
    // 1. Validate promo code
    const promoCheck = await validatePromoCode(testPromoCode, "commercial");
    expect(promoCheck.valid).toBe(true);
    expect(promoCheck.discountValue).toBe(15.0); // 15% discount

    // 2. OTP Verification
    await setupVerifiedGuest(testEmail);

    // 3. Create Booking with 14-day advance notice (exceeding 5-day minimum window)
    const futureDateStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const bookingRes = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: {
        officeType: "office",
        surfaceArea: 120,
        frequency: "one-off",
        preferredTime: "morning"
      },
      scheduledAtStr: futureDateStr,
      scheduledWindow: "morning",
      locationAddress: "Paradeplatz 8, 8001 Zürich",
      promoCode: testPromoCode
    });

    expect(bookingRes.success).toBe(true);
    expect(bookingRes.bookingId).toBeDefined();

    // Verify Booking in database
    const booking = await db.booking.findUnique({
      where: { id: bookingRes.bookingId },
      include: { payments: true }
    });

    expect(booking).not.toBeNull();
    expect(booking?.guestEmail).toBe(testEmail);
    expect(booking?.promoCampaignId).toBe(promoCampaignId);
    expect(Number(booking?.promoDiscountChf)).toBeGreaterThan(0);
    expect(Number(booking?.depositAmountChf)).toBeGreaterThan(0);

    // Verify 30% retainer deposit payment record
    expect(booking?.payments.length).toBe(1);
    expect(Number(booking?.payments[0].amountChf)).toBe(Number(booking?.depositAmountChf));
    expect(booking?.payments[0].status).toBe("succeeded");

    // Verify automatic customer user provisioning
    const user = await db.user.findUnique({ where: { email: testEmail } });
    expect(user).not.toBeNull();
    expect(user?.role).toBe("registered_customer");
  });

  it("Step 3: Operations assigns supplier and defines cost budget during 5-day window", async () => {
    // 1. Create initial booking
    await setupVerifiedGuest(testEmail);
    const futureDateStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const bookingRes = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: { officeType: "office", surfaceArea: 100, frequency: "one-off" },
      scheduledAtStr: futureDateStr,
      scheduledWindow: "morning",
      locationAddress: "Bleicherweg 10, 8002 Zürich",
      promoCode: testPromoCode
    });

    const bookingId = bookingRes.bookingId!;

    // 2. Operations assigns supplier team with accepted budget of CHF 300.00
    const assignRes = await assignPartnerTeamWithBudget(bookingId, teamId, 300.0);
    expect(assignRes.success).toBe(true);
    expect(assignRes.booking?.status).toBe("assigned");
    expect(assignRes.booking?.providerPayoutAmountChf).toBe(300.0);
    expect(assignRes.booking?.commissionAmountChf).toBe(45.0); // 15% platform margin on 300 CHF

    // 3. Verify audit log was recorded
    const audit = await db.auditLog.findFirst({
      where: { targetId: bookingId, action: "assign_provider_team_with_budget" }
    });
    expect(audit).not.toBeNull();
  });

  it("Step 4: Post-Service Fine-Tuning -> applies +15% margin, deducts retainer, and settles balance", async () => {
    // 1. Create booking
    await setupVerifiedGuest(testEmail);
    const futureDateStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const bookingRes = await createBooking({
      email: testEmail,
      vertical: "commercial",
      categorySlug: "commercial",
      intake: { officeType: "office", surfaceArea: 150, frequency: "one-off" },
      scheduledAtStr: futureDateStr,
      scheduledWindow: "afternoon",
      locationAddress: "Gotthardstrasse 26, 8002 Zürich",
      promoCode: testPromoCode
    });

    const bookingId = bookingRes.bookingId!;
    await assignPartnerTeamWithBudget(bookingId, teamId, 350.0);

    const initialBooking = await db.booking.findUnique({ where: { id: bookingId } });
    const depositPaid = Number(initialBooking?.depositAmountChf || 0);

    // 2. Service Completed: Supplier fine-tunes actual cost to CHF 380.00
    const settleRes = await finalizeServiceCostAndSettle(bookingId, 380.0, 15);
    expect(settleRes.success).toBe(true);

    const breakdown = settleRes.breakdown!;
    expect(breakdown.supplierActualCost).toBe(380.0);
    expect(breakdown.platformCommission).toBe(57.0); // 15% of 380 = 57.00 CHF
    // Gross client total = 380 + 57 = 437.00 CHF
    // Net client total = 437.00 - promoDiscount
    expect(breakdown.finalClientTotal).toBe(380.0 + 57.0 - breakdown.promoDiscount);
    // Remaining balance = Net client total - Deposit paid
    expect(breakdown.remainingBalance).toBe(breakdown.finalClientTotal - depositPaid);

    // 3. Verify Database Records
    const completedBooking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true, payouts: true }
    });

    expect(completedBooking?.status).toBe("completed");
    expect(Number(completedBooking?.totalAmountChf)).toBe(breakdown.finalClientTotal);
    expect(Number(completedBooking?.providerPayoutAmountChf)).toBe(380.0);
    expect(Number(completedBooking?.commissionAmountChf)).toBe(57.0);

    // Verify that two payments exist (Retainer Deposit + Balance Settlement)
    expect(completedBooking?.payments.length).toBe(2);
    const totalPaymentsPaid = completedBooking?.payments.reduce((sum, p) => sum + Number(p.amountChf), 0);
    expect(Math.round(totalPaymentsPaid! * 100) / 100).toBe(breakdown.finalClientTotal);

    // Verify scheduled provider payout record
    expect(completedBooking?.payouts.length).toBe(1);
    expect(Number(completedBooking?.payouts[0].amountChf)).toBe(380.0);
    expect(completedBooking?.payouts[0].status).toBe("scheduled");
  });
});
