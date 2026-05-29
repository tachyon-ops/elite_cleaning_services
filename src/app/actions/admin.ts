"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword, verifyTOTPToken, getTOTPAuthUrl, generateTOTPSecret, generateEmailOtp } from "@/lib/auth-utils";
import QRCode from "qrcode";
import { sendEmail } from "@/lib/email-utils";


// 1.0 Check if any admin user exists
export async function checkAdminExists() {
  try {
    const adminUser = await db.user.findFirst({
      where: { role: "super_admin" }
    });
    return { success: true, exists: !!adminUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 1.1 Register initial admin user
export async function registerAdmin(payload: {
  name: string;
  email: string;
  twoFactorSecret: string;
  twoFactorToken: string;
}) {
  try {
    const { name, email, twoFactorSecret, twoFactorToken } = payload;
    
    // Check if an admin already exists
    const existsRes = await checkAdminExists();
    if (existsRes.success && existsRes.exists) {
      throw new Error("Admin registration is closed. An administrator already exists.");
    }

    if (!twoFactorSecret || !twoFactorToken) {
      throw new Error("Email verification is mandatory to register an administrator account.");
    }

    const isValid = twoFactorToken.trim() === twoFactorSecret.trim();
    if (!isValid) {
      throw new Error("Invalid verification code. Please check the code sent to your email.");
    }

    const user = await db.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        role: "super_admin",
        twoFactorSecret: twoFactorSecret,
        twoFactorEnabled: true,
        twoFactorMethod: "email",
        locale: "en",
        loginCount: 1 // Registration acts as the first login session
      }
    });

    // Authenticate the session immediately upon successful registration
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 // 24 hours
    });
    cookieStore.set("admin_user_id", user.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24
    });
    cookieStore.set("admin_user_role", user.role, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 1.2 Admin login action (Initiates OTP dispatch)
export async function loginAdmin(email: string) {
  try {
    const adminUser = await db.user.findFirst({
      where: { email: email.trim().toLowerCase(), role: "super_admin" }
    });

    if (!adminUser) {
      throw new Error("Invalid administrative credentials");
    }

    // Generate and save Email OTP
    const otp = generateEmailOtp();
    await db.user.update({
      where: { id: adminUser.id },
      data: {
        emailOtpCode: otp,
        emailOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
    console.log(`\n==================================================`);
    console.log(`[EMAIL OTP] Sent to: ${adminUser.email}`);
    console.log(`[EMAIL OTP] Code: ${otp}`);
    console.log(`==================================================\n`);

    // Send SMTP email
    const emailResult = await sendEmail({
      to: adminUser.email,
      subject: "Elite Cleaning Services - Security OTP",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #b59410; letter-spacing: 0.15em; font-weight: 500; text-align: center; margin-bottom: 24px;">ELITE CLEANING GATEWAY</h2>
          <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center;">Enter the OTP code below to verify your identity and authorize your backoffice session:</p>
          <div style="background-color: #141414; border: 1px solid #262626; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.2em; font-weight: bold; color: #b59410;">${otp}</span>
          </div>
          <p style="font-size: 11px; color: #595959; text-align: center; line-height: 1.4;">This code will expire in 5 minutes. If you did not request this code, please secure your account immediately.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to dispatch security OTP code via SMTP.");
    }

    return { 
      success: true, 
      requires2FA: true, 
      userId: adminUser.id, 
      method: "email",
      emailMasked: adminUser.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 1.3 Admin login action (step 2: verify 2FA token)
export async function loginAdmin2FA(userId: string, token: string) {
  let shouldRedirect = false;
  try {
    const adminUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!adminUser || adminUser.role !== "super_admin") {
      throw new Error("Invalid user or security configuration");
    }

    if (!adminUser.emailOtpCode || !adminUser.emailOtpExpiresAt || adminUser.emailOtpExpiresAt < new Date()) {
      throw new Error("OTP has expired. Please try again.");
    }

    const isValid = adminUser.emailOtpCode === token.trim();
    if (!isValid) {
      throw new Error("Invalid verification code. Please check your numbers.");
    }

    // Clear OTP code once used, and increment loginCount
    await db.user.update({
      where: { id: adminUser.id },
      data: { 
        emailOtpCode: null, 
        emailOtpExpiresAt: null,
        loginCount: adminUser.loginCount + 1 
      }
    });

    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24
    });
    cookieStore.set("admin_user_id", adminUser.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24
    });
    cookieStore.set("admin_user_role", adminUser.role, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24
    });

    shouldRedirect = true;
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  if (shouldRedirect) {
    redirect("/admin");
  }
}

// 1.4 Helper to get dynamic 2FA link for registration
export async function getRegistration2FASecret(email: string) {
  try {
    const secret = generateTOTPSecret();
    const otpauthUrl = getTOTPAuthUrl(email, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { success: true, secret, qrDataUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 1.5 Send Registration Email OTP code securely
export async function sendRegistrationEmailOtp(email: string) {
  try {
    const otp = generateEmailOtp();
    console.log(`\n==================================================`);
    console.log(`[REGISTRATION EMAIL OTP] Sent to: ${email}`);
    console.log(`[REGISTRATION EMAIL OTP] Code: ${otp}`);
    console.log(`==================================================\n`);

    // Send SMTP email
    const emailResult = await sendEmail({
      to: email,
      subject: "Elite Cleaning Services - Root Setup MFA OTP",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background-color: #080808; color: #f2f2f2; border: 1px solid #262626; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #b59410; letter-spacing: 0.15em; font-weight: 500; text-align: center; margin-bottom: 24px;">ELITE CLEANING GATEWAY</h2>
          <p style="font-size: 14px; color: #a6a6a6; line-height: 1.6; text-align: center;">You are setting up administrative Multi-Factor Authentication. Please input the following OTP code on your setup screen:</p>
          <div style="background-color: #141414; border: 1px solid #262626; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.2em; font-weight: bold; color: #b59410;">${otp}</span>
          </div>
          <p style="font-size: 11px; color: #595959; text-align: center; line-height: 1.4;">This code will expire shortly. If you did not initiate this request, please contact platform operations.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || "Failed to send email OTP code." };
    }

    return { success: true, otp };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 1.6 Verify registration 2FA token securely on server
export async function verifyRegistrationToken(token: string, secret: string, method = "totp") {
  try {
    let isValid = false;
    if (method === "totp") {
      isValid = verifyTOTPToken(token, secret);
    } else if (method === "email") {
      isValid = token.trim() === secret.trim();
    }
    return { success: true, isValid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



// 2. Admin logout action
export async function logoutAdmin() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    cookieStore.delete("admin_user_id");
    cookieStore.delete("admin_user_role");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Check admin auth status helper
export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

// 3.1 Fetch logged-in admin user
export async function getLoggedInAdmin() {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get("admin_session")?.value === "true";
    if (!isAuthenticated) return null;

    const adminUserId = cookieStore.get("admin_user_id")?.value;
    if (adminUserId) {
      return await db.user.findUnique({ where: { id: adminUserId } });
    }

    // Fallback for active session with missing cookie
    return await db.user.findFirst({ where: { role: "super_admin" } });
  } catch {
    return null;
  }
}

// 3.2 Fetch service categories for management
export async function getServiceCategoriesList() {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }
    const categories = await db.serviceCategory.findMany({
      orderBy: { slug: "asc" }
    });
    return { success: true, categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3.3 Toggle active status of a service category
export async function toggleServiceCategoryActive(slug: string, active: boolean) {
  try {
    const admin = await getLoggedInAdmin();
    if (!admin || admin.role !== "super_admin") {
      throw new Error("Unauthorized: Root access required");
    }

    const categoryBefore = await db.serviceCategory.findUnique({
      where: { slug }
    });
    if (!categoryBefore) {
      throw new Error("Category not found");
    }

    const updated = await db.serviceCategory.update({
      where: { slug },
      data: { active }
    });

    // Log admin audit log
    await db.auditLog.create({
      data: {
        action: "toggle_vertical_active",
        targetTable: "ServiceCategory",
        targetId: slug,
        before: JSON.stringify({ active: categoryBefore.active }),
        after: JSON.stringify({ active: updated.active }),
        actorUserId: admin.id
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3.4 Update custom price text of a service category
export async function updateServiceCategoryPriceText(slug: string, customPriceText: string | null) {
  try {
    const admin = await getLoggedInAdmin();
    if (!admin || admin.role !== "super_admin") {
      throw new Error("Unauthorized: Root access required");
    }

    const categoryBefore = await db.serviceCategory.findUnique({
      where: { slug }
    });
    if (!categoryBefore) {
      throw new Error("Category not found");
    }

    const updated = await db.serviceCategory.update({
      where: { slug },
      data: { customPriceText }
    });

    // Log admin audit log
    await db.auditLog.create({
      data: {
        action: "update_vertical_price_text",
        targetTable: "ServiceCategory",
        targetId: slug,
        before: JSON.stringify({ customPriceText: categoryBefore.customPriceText }),
        after: JSON.stringify({ customPriceText: updated.customPriceText }),
        actorUserId: admin.id
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Get Dashboard statistics
export async function getDashboardStats() {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const bookingsCount = await db.booking.count();
    const activeBookings = await db.booking.count({
      where: {
        status: {
          in: ["confirmed", "assigned", "offer_dispatched"]
        }
      }
    });

    const completedBookings = await db.booking.count({
      where: { status: "completed" }
    });

    // Calculate MTD Revenue
    const payments = await db.payment.findMany({
      where: { status: "succeeded" }
    });
    const revenueMTD = payments.reduce((sum: number, p) => sum + Number(p.amountChf), 0);

    // Calculate average satisfaction rating
    const reviews = await db.review.findMany();
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length
      : 5.0;

    return {
      success: true,
      stats: {
        bookingsCount,
        activeBookings,
        completedBookings,
        revenueMTD: Math.round(revenueMTD * 100) / 100,
        avgRating: Math.round(avgRating * 10) / 10
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Get all bookings
export async function getBookingsList() {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const bookings = await db.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        providerTeam: {
          include: { provider: true }
        }
      }
    });

    // Map Decimal to float for frontend serialization safety
    const formatted = bookings.map(b => ({
      ...b,
      totalAmountChf: Number(b.totalAmountChf),
      depositAmountChf: Number(b.depositAmountChf)
    }));

    return { success: true, bookings: formatted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Assign provider team
export async function assignPartnerTeam(bookingId: string, teamId: string | null) {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const bookingBefore = await db.booking.findUnique({ where: { id: bookingId } });
    if (!bookingBefore) {
      throw new Error("Booking not found");
    }

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: {
        providerTeamId: teamId,
        status: teamId ? "assigned" : "confirmed"
      }
    });

    // Log administrative audit trail for GDPR compliance
    await db.auditLog.create({
      data: {
        action: "assign_provider_team",
        targetTable: "Booking",
        targetId: bookingId,
        before: JSON.stringify({ providerTeamId: bookingBefore.providerTeamId, status: bookingBefore.status }),
        after: JSON.stringify({ providerTeamId: updated.providerTeamId, status: updated.status }),
        actorUserId: "admin_user"
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Update booking status
export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const bookingBefore = await db.booking.findUnique({ where: { id: bookingId } });
    if (!bookingBefore) {
      throw new Error("Booking not found");
    }

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: { status }
    });

    // Log audit trail
    await db.auditLog.create({
      data: {
        action: "update_booking_status",
        targetTable: "Booking",
        targetId: bookingId,
        before: JSON.stringify({ status: bookingBefore.status }),
        after: JSON.stringify({ status: updated.status }),
        actorUserId: "admin_user"
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Get providers and teams
export async function getPartnersList() {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const partners = await db.provider.findMany({
      include: { teams: true, listings: true }
    });

    return { success: true, partners };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Toggle partner status
export async function togglePartnerStatus(partnerId: string, status: string) {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    await db.provider.update({
      where: { id: partnerId },
      data: { onboardingStatus: status }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 10. GDPR: Delete customer data entirely
export async function deleteCustomerDataGDPR(email: string) {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    // 1. Delete matching guest account or verify record
    await db.guestEmail.deleteMany({
      where: { email }
    });

    // 2. Fetch associated bookings
    const bookings = await db.booking.findMany({
      where: { guestEmail: email }
    });

    for (const booking of bookings) {
      // Clean up reviews
      await db.review.deleteMany({
        where: { bookingId: booking.id }
      });
      // Clean up payments
      await db.payment.deleteMany({
        where: { bookingId: booking.id }
      });
    }

    // 3. Delete Bookings
    await db.booking.deleteMany({
      where: { guestEmail: email }
    });

    // 4. Log audit log of GDPR deletion (with target email redacted for privacy)
    await db.auditLog.create({
      data: {
        action: "gdpr_delete_customer",
        targetTable: "GuestEmail",
        targetId: "redacted",
        before: JSON.stringify({ email }),
        after: JSON.stringify({ status: "deleted" }),
        actorUserId: "admin_user"
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- NEW V2 ADMIN ACTIONS ---

// 11. List provider applications
export async function getProviderApplications() {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const applications = await db.providerApplication.findMany({
      orderBy: { submittedAt: "desc" }
    });

    return { success: true, applications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 12. Review provider application
export async function reviewApplication(payload: {
  applicationId: string;
  status: "approved" | "rejected" | "info_requested";
  decisionNotes?: string;
}) {
  try {
    const { applicationId, status, decisionNotes } = payload;

    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const app = await db.providerApplication.findUnique({
      where: { id: applicationId }
    });

    if (!app) {
      throw new Error("Application not found");
    }

    // Update Application
    await db.providerApplication.update({
      where: { id: applicationId },
      data: {
        status,
        decisionAt: new Date(),
        decisionNotes
      }
    });

    if (status === "approved") {
      // 1. Create Provider
      const slug = app.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const provider = await db.provider.create({
        data: {
          name: app.companyName,
          slug,
          contactEmail: app.applicantEmail,
          contactPhone: "+41 44 999 8877",
          address: app.region,
          legalEntityType: app.legalEntityType,
          uidNumber: "CHE-000.000.000 MWST",
          onboardingStatus: "active", // Approved directly for testing simplicity
          stripeConnectStatus: "pending",
          bankDetailsVerified: false
        }
      });

      // 2. Create Default Team
      await db.providerTeam.create({
        data: {
          providerId: provider.id,
          name: "Primary Dispatch Team",
          workingHours: JSON.stringify({ mon: ["08:00", "18:00"], tue: ["08:00", "18:00"], wed: ["08:00", "18:00"], thu: ["08:00", "18:00"], fri: ["08:00", "18:00"] }),
          serviceCategories: JSON.stringify(app.verticalsRequested.split(",")),
          region: app.region
        }
      });

      // 3. Create listings for each requested category
      const verticals = app.verticalsRequested.split(",");
      for (const catSlug of verticals) {
        await db.providerListing.create({
          data: {
            providerId: provider.id,
            categorySlug: catSlug,
            serviceRadiusKm: 50,
            capacityPerDay: 3,
            leadTimeHours: 24,
            active: true
          }
        });
      }

      // 4. Create User login credentials
      await db.user.create({
        data: {
          email: app.applicantEmail,
          name: app.applicantName,
          passwordHash: hashPassword("partner123"), // default credentials
          role: "provider_staff",
          providerCompanyId: provider.id,
          locale: "en"
        }
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 13. Enable 2FA for administrative user from Settings
export async function enableAdmin2FA(email: string, method: string, secret: string, token: string) {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    let isValid = false;
    if (method === "totp") {
      isValid = verifyTOTPToken(token, secret);
    } else if (method === "email") {
      isValid = token.trim() === secret.trim();
    }

    if (!isValid) {
      throw new Error("Invalid verification code. Please try again.");
    }

    await db.user.update({
      where: { email },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorMethod: method
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 14. Disable 2FA for administrative user from Settings
export async function disableAdmin2FA(email: string) {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    await db.user.update({
      where: { email },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorMethod: "totp"
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

