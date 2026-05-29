"use server";

import { db } from "@/lib/db";

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

// 2. Send Simulated OTP
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

    console.log(`[SIMULATED EMAIL SERVICE] OTP for ${email}: ${otpCode}`);

    // Return the code for local development ease of validation
    return { success: true, code: otpCode };
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
function calculatePrice(categorySlug: string, intake: any) {
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
    else if (freq === "monthly") frequencyDiscount = 0.05; // 5%
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
    else if (freq === "monthly") frequencyDiscount = 0.05; // 5%
  }

  const subtotal = basePrice + sizeAdjustment + addons;
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
    const pricing = calculatePrice(categorySlug, intake);

    // Matching Engine: Find active providers with active listing for this category slug
    const matchingProviderListing = await db.providerListing.findFirst({
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

    const hasMatchingProvider = !!matchingProviderListing;
    const initialStatus = hasMatchingProvider ? "offer_dispatched" : "confirmed";

    // Create Booking
    const booking = await db.booking.create({
      data: {
        guestEmail: email,
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
        isFirstBooking: true
      }
    });

    // Create offer if match is found
    if (hasMatchingProvider) {
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
