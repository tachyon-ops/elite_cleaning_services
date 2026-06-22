"use server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-utils";

// 1. Get availability slots
export async function getAvailableSlots(categorySlug: string, dateStr: string) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }

    // Default slots
    const standardSlots = [
      { id: "morning", label: "Morning (08:00 - 12:00)" },
      { id: "afternoon", label: "Afternoon (13:00 - 17:00)" }
    ];

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
      subject: "Elite Cleaning Services - Verification OTP",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #b59410; letter-spacing: 0.15em; font-weight: 500; text-align: center; margin-bottom: 24px;">ELITE CLEANING GATEWAY</h2>
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
  }

  const singleSubtotal = basePrice + sizeAdjustment + addons;
  const prepayFactor = (categorySlug === "commercial" || categorySlug === "domestic") && intake.frequency === "monthly"
    ? Number(intake.prepayPeriod || "1")
    : 1;

  const subtotal = singleSubtotal * prepayFactor;
  const discountAmount = subtotal * frequencyDiscount;
  const total = subtotal - discountAmount;
  // 30% deposit
  const deposit = total * 0.30;

  return {
    total: Math.round(total * 100) / 100,
    deposit: Math.round(deposit * 100) / 100
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
}) {
  try {
    const { email, vertical, categorySlug, intake, scheduledAtStr, scheduledWindow, locationAddress } = payload;

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

    // Secure price calculation
    const pricing = calculatePrice(categorySlug, intake, scheduledAt);

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

    // Resolve customer and recurring settings
    let customerId: string | null = null;
    const frequency = intake?.frequency;
    const isRecurring = ["weekly", "bi-weekly", "monthly"].includes(frequency);

    let user = await db.user.findUnique({
      where: { email }
    });

    if (isRecurring) {
      if (!user) {
        user = await db.user.create({
          data: {
            email,
            name: intake.name || email.split("@")[0],
            role: "registered_customer"
          }
        });
      }
      customerId = user.id;
    } else if (user) {
      customerId = user.id;
    }

    const stripeSubscriptionId = isRecurring
      ? `sub_sim_${Math.random().toString(36).substring(2, 11)}`
      : null;

    // Create Booking
    const booking = await db.booking.create({
      data: {
        customerId,
        guestEmail: customerId ? null : email,
        vertical,
        categorySlug,
        intake: JSON.stringify(intake),
        scheduledAt,
        scheduledWindow,
        locationAddress,
        status: initialStatus,
        totalAmountChf: pricing.total,
        depositAmountChf: pricing.deposit,
        providerTeamId: null,
        isFirstBooking: true,
        stripeSubscriptionId
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
          amountChf: pricing.deposit,
          status: "succeeded",
          refundedAmountChf: 0
        }
      });
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
