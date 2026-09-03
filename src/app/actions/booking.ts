"use server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-utils";
import { hashPassword } from "@/lib/auth-utils";

// 1. Get availability slots
export async function getAvailableSlots(categorySlug: string, dateStr: string, preferredTime?: string) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }

    // Supply chain protection settings check
    const weekendSetting = await db.systemSetting.findUnique({ where: { key: "allow_weekend_bookings" } });
    const afterHoursSetting = await db.systemSetting.findUnique({ where: { key: "allow_after_hours_bookings" } });
    const allowWeekends = weekendSetting?.value === "true";
    const allowAfterHours = afterHoursSetting?.value === "true";

    const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekendDay && !allowWeekends) {
      return {
        success: false,
        error: "Weekend bookings are currently unavailable to safeguard supply chain capacity. Please select a weekday (Monday to Friday)."
      };
    }

    let standardSlots = [
      { id: "morning", label: "Morning (08:00 - 12:00)" },
      { id: "afternoon", label: "Afternoon (13:00 - 17:00)" }
    ];

    if (preferredTime === "after-hours" && allowAfterHours) {
      standardSlots = [
        { id: "after-hours", label: "After-Hours" }
      ];
    } else if ((preferredTime === "weekends" || isWeekendDay) && allowWeekends) {
      standardSlots = [
        { id: "morning", label: "Weekend Morning (09:00 - 13:00)" },
        { id: "afternoon", label: "Weekend Afternoon (13:00 - 17:00)" }
      ];
    }

    // Find any provider teams supporting this category
    const teams = await db.providerTeam.findMany({
      where: {
        provider: {
          onboardingStatus: "active"
        }
      }
    });

    // Check existing bookings for this date
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const bookings = await db.booking.findMany({
      where: {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ["cancelled"]
        }
      }
    });

    // If bookings exceed partner team capacity, mark slot as unavailable
    const slots = standardSlots.map(slot => {
      const bookingsInSlot = bookings.filter(b => b.scheduledWindow === slot.id);
      const isAvailable = bookingsInSlot.length < Math.max(1, teams.length);
      return {
        ...slot,
        available: isAvailable
      };
    });

    return { success: true, slots };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Send OTP
export async function sendOtp(email: string) {
  try {
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Generate a 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in GuestEmail
    await db.guestEmail.upsert({
      where: { email },
      update: {
        otpCode,
        otpExpiresAt,
        otpAttempts: 0,
        verifiedAt: null
      },
      create: {
        email,
        otpCode,
        otpExpiresAt,
        otpAttempts: 0
      }
    });

    // Send SMTP email
    await sendEmail({
      to: email,
      subject: "Mondar - Verification OTP",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #b59410; letter-spacing: 0.15em; font-weight: 500; text-align: center; margin-bottom: 24px;">MONDAR GATEWAY</h2>
          <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center;">Enter the verification code below to confirm your guest email address:</p>
          <div style="background-color: #141414; border: 1px solid #262626; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.2em; font-weight: bold; color: #b59410;">${otpCode}</span>
          </div>
          <p style="font-size: 11px; color: #595959; text-align: center; line-height: 1.4;">This code will expire in 10 minutes. If you did not request this code, you can ignore this message.</p>
        </div>
      `
    });

    console.log(`[GUEST EMAIL SERVICE] OTP for ${email}: ${otpCode}`);

    const isProduction = process.env.NODE_ENV === "production";

    // Return the code for local development ease of validation
    return {
      success: true,
      code: isProduction ? undefined : otpCode
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Verify OTP
export async function verifyOtp(email: string, code: string) {
  try {
    const record = await db.guestEmail.findUnique({
      where: { email }
    });

    if (!record) {
      throw new Error("No verification code sent to this email");
    }

    if (record.otpAttempts >= 5) {
      throw new Error("Maximum verification attempts exceeded. Please request a new code.");
    }

    if (record.otpExpiresAt && new Date() > record.otpExpiresAt) {
      throw new Error("Verification code expired");
    }

    if (record.otpCode !== code) {
      // Increment attempts
      await db.guestEmail.update({
        where: { email },
        data: { otpAttempts: { increment: 1 } }
      });
      throw new Error("Incorrect verification code");
    }

    // Mark as verified
    await db.guestEmail.update({
      where: { email },
      data: {
        verifiedAt: new Date(),
        otpCode: null, // Clear code
        otpExpiresAt: null
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper to calculate pricing strictly server-side (prevent tampering)
function calculatePrice(categorySlug: string, intake: any, scheduledAt?: Date) {
  let basePrice = 0;
  let sizeAdjustment = 0;
  let frequencyDiscount = 0;
  let addons = 0;

  if (categorySlug === "commercial") {
    basePrice = 150.00;
    const area = Number(intake.surfaceArea) || 0;
    if (area > 50) {
      sizeAdjustment = (area - 50) * 1.20; // 1.20 CHF per extra m2
    }
    const freq = intake.frequency;
    if (freq === "weekly") frequencyDiscount = 0.15; // 15%
    else if (freq === "bi-weekly") frequencyDiscount = 0.10; // 10%
    else if (freq === "monthly") {
      const prepay = intake.prepayPeriod || "1";
      if (prepay === "3") frequencyDiscount = 0.15; // 15%
      else if (prepay === "6") frequencyDiscount = 0.20; // 20%
      else frequencyDiscount = 0.05; // 5%
    }
    // Preferred time surcharges for commercial
    if (intake.preferredTime === "after-hours") {
      addons += 50.00;
    } else if (intake.preferredTime === "weekends") {
      addons += 80.00;
    }
  } else if (categorySlug === "hospitality") {
    basePrice = 120.00;
    const bedrooms = Number(intake.bedrooms) || 1;
    const bathrooms = Number(intake.bathrooms) || 1;
    sizeAdjustment = (bedrooms - 1) * 30.00 + (bathrooms - 1) * 20.00;
    if (intake.linenChange === "yes" || intake.linenChange === true) {
      addons = 35.00;
    }
    const freq = intake.frequency;
    if (freq === "weekly") frequencyDiscount = 0.10; // 10%
  } else if (categorySlug === "domestic") {
    basePrice = 80.00;
    const bedrooms = Number(intake.bedrooms) || 1;
    const bathrooms = Number(intake.bathrooms) || 1;
    sizeAdjustment = (bedrooms - 1) * 20.00 + (bathrooms - 1) * 15.00;
    const freq = intake.frequency;
    if (freq === "weekly") frequencyDiscount = 0.15; // 15%
    else if (freq === "bi-weekly") frequencyDiscount = 0.10; // 10%
    else if (freq === "monthly") {
      const prepay = intake.prepayPeriod || "1";
      if (prepay === "3") frequencyDiscount = 0.15; // 15%
      else if (prepay === "6") frequencyDiscount = 0.20; // 20%
      else frequencyDiscount = 0.05; // 5%
    }
    // Weekend surcharge for domestic based on actual date
    if (scheduledAt) {
      const day = scheduledAt.getDay();
      if (day === 0 || day === 6) {
        addons += 30.00;
      }
    }
  } else if (categorySlug === "moveout") {
    const rooms = Number(intake.moveoutRooms) || 3.5;
    const area = Number(intake.moveoutArea) || 80;
    const scope = Array.isArray(intake.moveoutScope) ? intake.moveoutScope : [];

    // Zurich customer-facing benchmark rates (with 100% Abnahmegarantie included)
    // Windows, Storen, oven, hood, fridge, balcony standardly included
    if (rooms <= 2.5) {
      basePrice = 600.00;
      if (area > 60) sizeAdjustment = (area - 60) * 2.50;
    } else if (rooms <= 3.5) {
      basePrice = 770.00;
      if (area > 90) sizeAdjustment = (area - 90) * 2.50;
    } else if (rooms <= 4.5) {
      basePrice = 960.00;
      if (area > 120) sizeAdjustment = (area - 120) * 2.50;
    } else {
      basePrice = 1180.00;
      if (area > 140) sizeAdjustment = (area - 140) * 2.50;
    }

    // Optional Add-ons
    if (scope.includes("carpet_steam")) addons += 100.00;
    if (scope.includes("keller_estrich") || scope.includes("garage")) addons += 80.00;
    if (scope.includes("express_weekend") || intake?.preferredTime === "weekends") {
      addons += 200.00;
    }
    if (intake?.preferredTime === "after-hours") {
      addons += 50.00;
    }
  }

  // Option B: 10% Platform & Guarantee commission on top
  const PLATFORM_COMMISSION_RATE = 0.10;

  const singleSubtotal = basePrice + sizeAdjustment + addons;
  const prepayFactor = (categorySlug === "commercial" || categorySlug === "domestic") && intake.frequency === "monthly"
    ? Number(intake.prepayPeriod || "1")
    : 1;

  const subtotal = singleSubtotal * prepayFactor;
  const platformFee = Math.round(subtotal * PLATFORM_COMMISSION_RATE * 100) / 100;
  const grossTotal = subtotal + platformFee;

  const discountAmount = grossTotal * frequencyDiscount;
  const total = grossTotal - discountAmount;
  // 30% deposit
  const deposit = total * 0.30;

  return {
    total: Math.round(total * 100) / 100,
    deposit: Math.round(deposit * 100) / 100,
    platformFee,
    subtotal: Math.round(subtotal * 100) / 100
  };
}

// 4. Create booking
export async function createBooking(payload: {
  email: string;
  vertical: string;
  categorySlug: string;
  intake: any;
  scheduledAtStr: string;
  scheduledWindow: string;
  locationAddress: string;
  promoCode?: string;
}) {
  try {
    const { email, vertical, categorySlug, intake, scheduledAtStr, scheduledWindow, locationAddress, promoCode } = payload;

    // Verify guest email is validated
    const guestRecord = await db.guestEmail.findUnique({
      where: { email }
    });

    if (!guestRecord || !guestRecord.verifiedAt) {
      throw new Error("Email address must be verified via OTP first");
    }

    const scheduledAt = new Date(scheduledAtStr);
    if (isNaN(scheduledAt.getTime())) {
      throw new Error("Invalid schedule date");
    }

    // Enforce lead time advance notice
    const leadSetting = await db.systemSetting.findUnique({ where: { key: "min_lead_time_days" } });
    const bizSetting = await db.systemSetting.findUnique({ where: { key: "lead_time_business_days_only" } });
    const minDays = leadSetting && leadSetting.value !== null ? parseInt(leadSetting.value, 10) : 5;
    const bizOnly = !bizSetting || bizSetting.value !== "false";

    if (minDays > 0) {
      const minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      let daysAdded = 0;
      while (daysAdded < minDays) {
        minDate.setDate(minDate.getDate() + 1);
        const dayOfWeek = minDate.getDay();
        if (bizOnly) {
          if (dayOfWeek !== 0 && dayOfWeek !== 6) daysAdded++;
        } else {
          daysAdded++;
        }
      }
      if (scheduledAt.getTime() < minDate.getTime()) {
        throw new Error(`Bookings require a minimum of ${minDays} ${bizOnly ? "business " : ""}days advance notice for tailored matching.`);
      }
    }

    // Supply chain protection settings check
    const weekendSetting = await db.systemSetting.findUnique({ where: { key: "allow_weekend_bookings" } });
    const afterHoursSetting = await db.systemSetting.findUnique({ where: { key: "allow_after_hours_bookings" } });
    const allowWeekends = weekendSetting?.value === "true";
    const allowAfterHours = afterHoursSetting?.value === "true";

    // Supply chain protection: Block weekend bookings if not enabled
    const dayOfWeek = scheduledAt.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && !allowWeekends) {
      throw new Error("Weekend bookings are currently paused to maintain quality of service. Please select a weekday (Monday to Friday).");
    }

    // Supply chain protection: Block after-hours bookings if not enabled
    if ((scheduledWindow === "after-hours" || intake?.preferredTime === "after-hours") && !allowAfterHours) {
      throw new Error("After-hours service is currently unavailable. Please select standard business hours (Morning or Afternoon).");
    }

    // Secure price calculation
    const pricing = calculatePrice(categorySlug, intake, scheduledAt);

    // Validate and apply promo discount
    let promoCampaignId: string | null = null;
    let promoDiscountChf: number | null = null;
    let finalTotal = pricing.total;
    let finalDeposit = pricing.deposit;

    if (promoCode) {
      const campaign = await db.promoCampaign.findFirst({
        where: { code: promoCode.toUpperCase() }
      });

      if (campaign && campaign.active) {
        const now = new Date();
        const validFrom = new Date(campaign.validFrom);
        const validUntil = campaign.validUntil ? new Date(campaign.validUntil) : null;
        const withinDates = now >= validFrom && (!validUntil || now <= validUntil);
        const withinRedemptions = !campaign.maxRedemptions || campaign.totalRedemptions < campaign.maxRedemptions;
        const verticalMatch = !campaign.vertical || campaign.vertical === categorySlug;

        if (withinDates && withinRedemptions && verticalMatch) {
          // Calculate promo discount
          const discountValue = Number(campaign.discountValue);
          let promoAmount = 0;
          if (campaign.discountType === "percentage") {
            promoAmount = pricing.total * (discountValue / 100);
          } else {
            promoAmount = discountValue;
          }

          // Apply promo discount (frequency discount is already baked into pricing.total)
          // We apply promo on top of the base subtotal, and use whichever results in a lower price
          promoAmount = Math.min(promoAmount, pricing.total); // can't discount more than total
          if (promoAmount > 0) {
            promoCampaignId = campaign.id;
            promoDiscountChf = Math.round(promoAmount * 100) / 100;
            finalTotal = Math.max(0, Math.round((pricing.total - promoAmount) * 100) / 100);
            finalDeposit = Math.round(finalTotal * 0.30 * 100) / 100;

            // Increment redemptions
            await db.promoCampaign.update({
              where: { id: campaign.id },
              data: { totalRedemptions: { increment: 1 } }
            });
          }
        }
      }
    }

    const isQuoteVertical = ["aviation", "yacht", "special", "moveout", "building-care", "restaurant"].includes(categorySlug);

    // Matching Engine: Find active providers with active listing for this category slug (only if not a quote vertical yet)
    let hasMatchingProvider = false;
    let matchingProviderListing = null;

    if (!isQuoteVertical) {
      matchingProviderListing = await db.providerListing.findFirst({
        where: {
          categorySlug,
          active: true,
          provider: {
            onboardingStatus: "active"
          }
        },
        include: {
          provider: true
        }
      });
      hasMatchingProvider = !!matchingProviderListing;
    }

    const autoCheckoutSetting = await db.systemSetting.findUnique({
      where: { key: "auto_checkout" }
    });
    const autoCheckoutEnabled = autoCheckoutSetting ? autoCheckoutSetting.value === "true" : true;

    const initialStatus = isQuoteVertical 
      ? "quote_pending" 
      : (!autoCheckoutEnabled 
          ? "draft" 
          : (hasMatchingProvider ? "offer_dispatched" : "confirmed"));

    // Resolve customer account (silent auto-provisioning for all bookings)
    const frequency = intake?.frequency;
    const isRecurring = ["weekly", "bi-weekly", "monthly"].includes(frequency);

    const normalizedEmail = email.trim().toLowerCase();
    let user = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: normalizedEmail,
          name: intake?.name || normalizedEmail.split("@")[0],
          phone: intake?.phone || null,
          role: "registered_customer"
        }
      });
    } else if (intake?.name && (!user.name || user.name === normalizedEmail.split("@")[0])) {
      await db.user.update({
        where: { id: user.id },
        data: {
          name: intake.name,
          phone: intake.phone || user.phone
        }
      });
    }

    const customerId = user.id;

    const stripeSubscriptionId = isRecurring
      ? `sub_sim_${Math.random().toString(36).substring(2, 11)}`
      : null;

    // Create Booking
    const booking = await db.booking.create({
      data: {
        customerId,
        guestEmail: email,
        vertical,
        categorySlug,
        intake: JSON.stringify(intake),
        scheduledAt,
        scheduledWindow,
        locationAddress,
        status: initialStatus,
        totalAmountChf: finalTotal,
        depositAmountChf: finalDeposit,
        providerTeamId: null,
        isFirstBooking: true,
        stripeSubscriptionId,
        promoCampaignId,
        promoDiscountChf,
        commissionAmountChf: pricing.platformFee || (finalTotal ? Math.round(finalTotal * 0.10 * 100) / 100 : null)
      }
    });

    if (isRecurring && customerId) {
      let nextRunDays = 7;
      if (frequency === "bi-weekly") {
        nextRunDays = 14;
      } else if (frequency === "monthly") {
        nextRunDays = 30;
      }
      const nextRunAt = new Date(scheduledAt.getTime() + nextRunDays * 24 * 60 * 60 * 1000);

      await db.recurringSchedule.create({
        data: {
          customerId,
          categorySlug,
          frequency,
          dayOfWeek: scheduledAt.getDay(),
          timeWindow: scheduledWindow,
          stripeSubscriptionId: stripeSubscriptionId!,
          status: "active",
          nextRunAt
        }
      });
    }

    if (!isQuoteVertical) {
      // Create offer if match is found
      if (hasMatchingProvider && matchingProviderListing) {
        await db.providerOffer.create({
          data: {
            bookingId: booking.id,
            providerId: matchingProviderListing.providerId,
            offeredAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes timeout
            response: "pending"
          }
        });
      }

      // Record Simulated Payment
      await db.payment.create({
        data: {
          bookingId: booking.id,
          stripeChargeId: `ch_mock_${Math.random().toString(36).substr(2, 9)}`,
          amountChf: finalDeposit,
          status: "succeeded",
          refundedAmountChf: 0
        }
      });
    }

    // Send Booking Confirmation Email
    try {
      const formattedDate = scheduledAt ? scheduledAt.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : scheduledAtStr;
      const verticalTitle = vertical.charAt(0).toUpperCase() + vertical.slice(1);
      
      await sendEmail({
        to: email,
        subject: `Mondar - Booking Confirmation (${booking.id.slice(0, 8).toUpperCase()})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 540px; margin: auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 11px; letter-spacing: 0.2em; color: #b59410; font-weight: 700; text-transform: uppercase;">Mondar Specialty Cleaning</span>
              <h2 style="color: #f2f2f2; letter-spacing: 0.05em; font-weight: 500; margin: 8px 0 0 0; font-size: 24px;">Booking Confirmed</h2>
            </div>
            
            <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              Congratulations! Your cleaning request has been securely placed with Mondar. A vetted, insured Swiss cleaning specialist is assigned to your service.
            </p>

            <div style="background-color: #141414; border: 1px solid #262626; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #f2f2f2;">
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Booking ID:</td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #b59410; font-weight: bold;">${booking.id.slice(0, 8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Service Category:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600;">${verticalTitle} Cleaning</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Scheduled Date:</td>
                  <td style="padding: 6px 0; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Time Window:</td>
                  <td style="padding: 6px 0; text-align: right; text-transform: capitalize;">${scheduledWindow}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Service Location:</td>
                  <td style="padding: 6px 0; text-align: right;">${locationAddress}</td>
                </tr>
                ${promoCode && promoDiscountChf ? `
                <tr>
                  <td style="padding: 6px 0; color: #22c55e;">Promo (${promoCode}):</td>
                  <td style="padding: 6px 0; text-align: right; color: #22c55e;">-CHF ${promoDiscountChf.toFixed(2)}</td>
                </tr>
                ` : ""}
                <tr style="border-top: 1px solid #262626;">
                  <td style="padding: 10px 0 4px 0; font-weight: bold; color: #f2f2f2;">Total Amount:</td>
                  <td style="padding: 10px 0 4px 0; text-align: right; font-weight: bold; font-size: 15px; color: #f2f2f2;">CHF ${finalTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #b59410; font-weight: 600;">Deposit (30%):</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #b59410;">CHF ${finalDeposit.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; padding-top: 8px;">
              <p style="font-size: 12px; color: #737373; line-height: 1.5;">
                Need to adjust your schedule or have special access instructions? Contact operations at <a href="mailto:ops@mondar.ch" style="color: #b59410; text-decoration: none;">ops@mondar.ch</a>.
              </p>
            </div>
          </div>
        `
      });
      console.log(`[BOOKING SERVICE] Confirmation email successfully dispatched to ${email} for booking ${booking.id}`);
    } catch (emailErr) {
      console.error("[BOOKING SERVICE] Failed to dispatch confirmation email:", emailErr);
    }

    return { success: true, bookingId: booking.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Get active categories for booking flow and header
export async function getActiveCategories() {
  try {
    const categories = await db.serviceCategory.findMany({
      where: { active: true }
    });
    return { success: true, categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Accept booking quote and pay deposit
export async function acceptQuoteAndPayDeposit(payload: {
  bookingId: string;
  paymentMethodId?: string;
}) {
  try {
    const { bookingId } = payload;
    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        quote: true
      }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "quote_sent") {
      throw new Error("Booking is not in quote_sent state");
    }

    if (!booking.quote) {
      throw new Error("No quote associated with this booking");
    }

    // Check expiration
    if (booking.quote.validUntil && new Date() > booking.quote.validUntil) {
      throw new Error("Quote has expired");
    }

    // Determine matching provider (matching engine)
    const matchingProviderListing = await db.providerListing.findFirst({
      where: {
        categorySlug: booking.categorySlug,
        active: true,
        provider: {
          onboardingStatus: "active"
        }
      },
      include: {
        provider: true
      }
    });
    const hasMatchingProvider = !!matchingProviderListing;

    const nextStatus = hasMatchingProvider ? "offer_dispatched" : "confirmed";

    // Start a transaction so that booking update, quote update, payment, commission, and payout are consistent
    await db.$transaction(async (tx) => {
      // 1. Update Booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: nextStatus
        }
      });

      // 2. Update Quote acceptance
      await tx.quote.update({
        where: { bookingId },
        data: {
          acceptedAt: new Date()
        }
      });

      // 3. Create simulated Payment
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          stripeChargeId: `ch_mock_${Math.random().toString(36).substring(2, 11)}`,
          amountChf: booking.depositAmountChf,
          status: "succeeded",
          refundedAmountChf: 0
        }
      });

      // 4. Create CommissionLedger
      const gross = Number(booking.totalAmountChf);
      const commissionRate = 0.15;
      const commissionAmount = Math.round(gross * commissionRate * 100) / 100;
      const providerPayout = Math.round((gross - commissionAmount) * 100) / 100;

      await tx.commissionLedger.create({
        data: {
          bookingId: booking.id,
          grossAmountChf: gross,
          commissionRate,
          commissionAmountChf: commissionAmount,
          providerPayoutChf: providerPayout,
          notes: `Bespoke dispatch commission for ${booking.categorySlug}`
        }
      });

      // 5. Create Payout record if matching provider exists
      if (hasMatchingProvider && matchingProviderListing) {
        // Create matching ProviderOffer
        await tx.providerOffer.create({
          data: {
            bookingId: booking.id,
            providerId: matchingProviderListing.providerId,
            offeredAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
            response: "pending"
          }
        });

        // Create scheduled Payout record
        await tx.payout.create({
          data: {
            providerId: matchingProviderListing.providerId,
            bookingId: booking.id,
            amountChf: providerPayout,
            status: "scheduled",
            scheduledFor: new Date(booking.scheduledAt.getTime() + 24 * 60 * 60 * 1000) // 24 hours after service scheduled date
          }
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Get booking details and its quote for client checkout page
export async function getBookingQuoteDetails(bookingId: string) {
  try {
    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        quote: true
      }
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Convert Decimals to numbers for client component serialization safety
    const formatted = {
      ...booking,
      totalAmountChf: Number(booking.totalAmountChf),
      depositAmountChf: Number(booking.depositAmountChf),
      quote: booking.quote ? {
        ...booking.quote,
        amountChf: Number(booking.quote.amountChf)
      } : null
    };

    return { success: true, booking: formatted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Set Customer Password (instant account activation post-booking)
export async function setCustomerPassword(payload: { email: string; password: string }) {
  try {
    const { email, password } = payload;
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }

    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          role: "registered_customer",
          passwordHash: hashPassword(password)
        }
      });
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(password)
        }
      });
    }

    // Record audit log
    await db.auditLog.create({
      data: {
        action: "set_customer_password",
        targetTable: "User",
        targetId: user.id,
        actorUserId: user.id
      }
    });

    // Send Account Active Email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Mondar - Your Account is Fully Active",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 540px; margin: auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 11px; letter-spacing: 0.2em; color: #b59410; font-weight: 700; text-transform: uppercase;">Mondar Specialty Cleaning</span>
              <h2 style="color: #f2f2f2; letter-spacing: 0.05em; font-weight: 500; margin: 8px 0 0 0; font-size: 24px;">Your Account is Ready</h2>
            </div>
            
            <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              Your Mondar client account credentials have been successfully created and your profile is fully active.
            </p>

            <div style="background-color: #141414; border: 1px solid #262626; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #f2f2f2;">
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Account Email:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #f2f2f2;">${normalizedEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Status:</td>
                  <td style="padding: 6px 0; text-align: right; color: #22c55e; font-weight: bold;">Fully Active</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #737373;">Services:</td>
                  <td style="padding: 6px 0; text-align: right;">Dedicated Swiss Cleaning Dispatch</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; padding-top: 8px;">
              <p style="font-size: 12px; color: #737373; line-height: 1.5;">
                For any questions or adjustments, reach out to your concierge team anytime at <a href="mailto:ops@mondar.ch" style="color: #b59410; text-decoration: none;">ops@mondar.ch</a>.
              </p>
            </div>
          </div>
        `
      });
      console.log(`[CUSTOMER SERVICE] Account activation email successfully sent to ${normalizedEmail}`);
    } catch (emailErr) {
      console.error("[CUSTOMER SERVICE] Failed to dispatch account activation email:", emailErr);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
