"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyPassword, verifyTOTPToken, getTOTPAuthUrl, generateTOTPSecret, generateEmailOtp, hashPassword } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email-utils";
import QRCode from "qrcode";

// 1. Submit Application
export async function applyProvider(payload: {
  companyName: string;
  applicantEmail: string;
  applicantName: string;
  legalEntityType: string;
  verticalsRequested: string[];
  region: string;
  motivation: string;
  calendarSync?: string;
  bookingMode?: string;
  recurringSupport?: string;
  chatPreference?: string;
}) {
  try {
    const {
      companyName,
      applicantEmail,
      applicantName,
      legalEntityType,
      verticalsRequested,
      region,
      motivation,
      calendarSync,
      bookingMode,
      recurringSupport,
      chatPreference
    } = payload;

    if (!companyName || !applicantEmail || !applicantName) {
      throw new Error("Missing required application fields");
    }

    const application = await db.providerApplication.create({
      data: {
        companyName,
        applicantEmail,
        applicantName,
        legalEntityType,
        verticalsRequested: verticalsRequested.join(","),
        region,
        status: "submitted",
        applicationData: JSON.stringify({
          motivation,
          calendarSync: calendarSync || "manual",
          bookingMode: bookingMode || "request",
          recurringSupport: recurringSupport || "yes_rotate",
          chatPreference: chatPreference || "opt_in"
        })
      }
    });

    return { success: true, applicationId: application.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Authentication
export async function loginProvider(email: string, passphrase: string) {
  try {
    const user = await db.user.findFirst({
      where: { email, role: "provider_staff" }
    });
 
    if (!user || !user.passwordHash || !verifyPassword(passphrase, user.passwordHash)) {
      throw new Error("Invalid provider credentials");
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return { success: true, requires2FA: true, userId: user.id };
    }
 
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", user.locale || "de", {
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });
    cookieStore.set("provider_session", "true", { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
    cookieStore.set("provider_email", user.email, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
    cookieStore.set("provider_company_id", user.providerCompanyId || "", { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
 
    return { success: true, companyId: user.providerCompanyId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginProvider2FA(userId: string, token: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "provider_staff" || !user.twoFactorSecret) {
      throw new Error("Invalid user or 2FA not set up");
    }

    const isValid = verifyTOTPToken(token, user.twoFactorSecret);
    if (!isValid) {
      throw new Error("Invalid 2FA token");
    }

    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", user.locale || "de", {
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });
    cookieStore.set("provider_session", "true", { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
    cookieStore.set("provider_email", user.email, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });
    cookieStore.set("provider_company_id", user.providerCompanyId || "", { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" });

    return { success: true, companyId: user.providerCompanyId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2.1 2FA Actions for Partner Dashboard
export async function generateProvider2FASecret(email: string) {
  try {
    const secret = generateTOTPSecret();
    const otpauthUrl = getTOTPAuthUrl(email, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { success: true, secret, qrDataUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function enableProvider2FA(email: string, secret: string, token: string) {
  try {
    const isValid = verifyTOTPToken(token, secret);
    if (!isValid) {
      throw new Error("Invalid 2FA token. Please verify the code on your Authenticator app.");
    }

    await db.user.update({
      where: { email },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function disableProvider2FA(email: string) {
  try {
    await db.user.update({
      where: { email },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutProvider() {
  const cookieStore = await cookies();
  cookieStore.delete("provider_session");
  cookieStore.delete("provider_email");
  cookieStore.delete("provider_company_id");
  return { success: true };
}

export async function isProviderAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("provider_session")?.value === "true";
}

export async function getProviderCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get("provider_company_id")?.value || null;
}

// 3. Get Portal Data
export async function getProviderPortalData(companyId: string) {
  try {
    const provider = await db.provider.findUnique({
      where: { id: companyId },
      include: {
        teams: true,
        listings: true,
        documents: true
      }
    });

    if (!provider) {
      throw new Error("Provider company not found");
    }

    // Fetch offers
    const offers = await db.providerOffer.findMany({
      where: { providerId: companyId },
      include: {
        booking: true
      },
      orderBy: { offeredAt: "desc" }
    });

    // Fetch active bookings assigned
    const teamIds = provider.teams.map(t => t.id);
    const bookings = await db.booking.findMany({
      where: {
        providerTeamId: { in: teamIds }
      },
      orderBy: { scheduledAt: "asc" }
    });

    const cookieStore = await cookies();
    const email = cookieStore.get("provider_email")?.value || "";
    const user = await db.user.findFirst({
      where: { email, role: "provider_staff" },
      select: {
        email: true,
        twoFactorEnabled: true
      }
    });

    return { success: true, provider, offers, bookings, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Respond to Offer
export async function respondToOffer(payload: {
  offerId: string;
  response: "accepted" | "declined";
  declineReason?: string;
}) {
  try {
    const { offerId, response, declineReason } = payload;

    const offer = await db.providerOffer.findUnique({
      where: { id: offerId },
      include: { booking: true }
    });

    if (!offer) {
      throw new Error("Offer not found");
    }

    if (offer.response !== "pending") {
      throw new Error("Offer has already been processed");
    }

    // Update Offer
    await db.providerOffer.update({
      where: { id: offerId },
      data: {
        response,
        responseAt: new Date(),
        declineReason: response === "declined" ? declineReason : null
      }
    });

    if (response === "accepted") {
      // Find a team under this provider that operates the service category
      const providerTeams = await db.providerTeam.findMany({
        where: { providerId: offer.providerId }
      });

      const matchedTeam = providerTeams.find(team => {
        try {
          const cats = JSON.parse(team.serviceCategories);
          return cats.includes(offer.booking.categorySlug);
        } catch {
          return false;
        }
      });

      const teamId = matchedTeam ? matchedTeam.id : (providerTeams[0]?.id || null);

      // Update Booking status to assigned
      await db.booking.update({
        where: { id: offer.bookingId },
        data: {
          status: "assigned",
          providerTeamId: teamId,
          providerOfferId: offerId
        }
      });

      // If teamId is assigned, auto-block the slot in AvailabilityBlocks
      if (teamId) {
        await db.availabilityBlock.create({
          data: {
            providerTeamId: teamId,
            startsAt: offer.booking.scheduledAt,
            endsAt: new Date(offer.booking.scheduledAt.getTime() + 4 * 60 * 60 * 1000), // 4h duration block
            reason: "capacity",
            autoBlocked: true,
            bookingId: offer.bookingId
          }
        });
      }
    } else {
      // If declined, update booking status back to offer_exhausted or similar (or draft) if no other pending offer
      // Let's set status to confirmed (needs manual dispatch) so ops handles re-routing
      await db.booking.update({
        where: { id: offer.bookingId },
        data: { status: "confirmed" }
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Manage Document Simulation
export async function uploadProviderDocument(payload: {
  companyId: string;
  docType: string;
  fileUrl: string;
  expiresAtStr?: string;
}) {
  try {
    const { companyId, docType, fileUrl, expiresAtStr } = payload;

    const document = await db.providerDocument.create({
      data: {
        providerId: companyId,
        docType,
        fileUrl,
        expiresAt: expiresAtStr ? new Date(expiresAtStr) : null,
        verified: true, // auto-verified for simulated flow
        verifiedAt: new Date()
      }
    });

    return { success: true, document };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Stripe Connect status toggle simulation
export async function toggleStripeConnectSimulation(companyId: string) {
  try {
    const provider = await db.provider.findUnique({
      where: { id: companyId }
    });

    if (!provider) {
      throw new Error("Provider not found");
    }

    const nextStatus = provider.stripeConnectStatus === "active" ? "pending" : "active";

    await db.provider.update({
      where: { id: companyId },
      data: {
        stripeConnectStatus: nextStatus,
        stripeConnectAccountId: nextStatus === "active" ? `acct_sim_${Math.random().toString(36).substr(2, 9)}` : null,
        bankDetailsVerified: nextStatus === "active"
      }
    });

    return { success: true, stripeStatus: nextStatus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Manage Listings
export async function updateProviderListing(payload: {
  listingId: string;
  active: boolean;
  serviceRadiusKm: number;
  capacityPerDay: number;
}) {
  try {
    const { listingId, active, serviceRadiusKm, capacityPerDay } = payload;

    const listing = await db.providerListing.update({
      where: { id: listingId },
      data: {
        active,
        serviceRadiusKm: Number(serviceRadiusKm),
        capacityPerDay: Number(capacityPerDay)
      }
    });

    return { success: true, listing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Request Password Reset for provider staff
export async function requestPasswordResetProvider(email: string) {
  try {
    const user = await db.user.findFirst({
      where: { email: email.trim().toLowerCase(), role: "provider_staff" }
    });

    if (!user) {
      throw new Error("Provider email not found");
    }

    // Generate and save Email OTP
    const otp = generateEmailOtp();
    await db.user.update({
      where: { id: user.id },
      data: {
        emailOtpCode: otp,
        emailOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    console.log(`\n==================================================`);
    console.log(`[PROVIDER PASSWORD RESET OTP] Sent to: ${user.email}`);
    console.log(`[PROVIDER PASSWORD RESET OTP] Code: ${otp}`);
    console.log(`==================================================\n`);

    // Send SMTP email
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Elite Cleaning Services - Partner Password Reset Request",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #b59410; letter-spacing: 0.15em; font-weight: 500; text-align: center; margin-bottom: 24px;">PARTNER PORTAL PASSWORD RESET</h2>
          <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center;">Enter the verification code below to reset your partner portal password:</p>
          <div style="background-color: #141414; border: 1px solid #262626; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.2em; font-weight: bold; color: #b59410;">${otp}</span>
          </div>
          <p style="font-size: 11px; color: #595959; text-align: center; line-height: 1.4;">This code will expire in 5 minutes. If you did not initiate this request, please secure your account immediately.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to dispatch password reset OTP code via SMTP.");
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Reset Password for provider staff
export async function resetPasswordProvider(email: string, code: string, passwordNew: string) {
  try {
    const user = await db.user.findFirst({
      where: { email: email.trim().toLowerCase(), role: "provider_staff" }
    });

    if (!user) {
      throw new Error("Provider email not found");
    }

    if (!user.emailOtpCode || !user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
      throw new Error("Verification code has expired. Please request a new one.");
    }

    if (user.emailOtpCode !== code.trim()) {
      throw new Error("Invalid verification code. Please check your numbers.");
    }

    if (passwordNew.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    // Hash the new password and update user record
    const passwordHash = hashPassword(passwordNew);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailOtpCode: null,
        emailOtpExpiresAt: null
      }
    });

    // Log audit log
    await db.auditLog.create({
      data: {
        action: "reset_password",
        targetTable: "User",
        targetId: user.id,
        before: "redacted",
        after: "redacted",
        actorUserId: user.id
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
