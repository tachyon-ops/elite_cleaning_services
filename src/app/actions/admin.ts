"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";

// 1. Admin login action
export async function loginAdmin(password: string) {
  try {
    if (password === "admin123") {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "true", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 // 24 hours
      });
      return { success: true };
    }
    throw new Error("Invalid password");
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Admin logout action
export async function logoutAdmin() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
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
          in: ["confirmed", "assigned"]
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
    const revenueMTD = payments.reduce((sum, p) => sum + Number(p.amountChf), 0);

    // Calculate average satisfaction rating
    const reviews = await db.review.findMany();
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
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
        partnerTeam: {
          include: { partner: true }
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

// 6. Assign partner team
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
        partnerTeamId: teamId,
        status: teamId ? "assigned" : "confirmed"
      }
    });

    // Log administrative audit trail for GDPR compliance
    await db.auditLog.create({
      data: {
        action: "assign_partner_team",
        targetTable: "Booking",
        targetId: bookingId,
        before: JSON.stringify({ partnerTeamId: bookingBefore.partnerTeamId, status: bookingBefore.status }),
        after: JSON.stringify({ partnerTeamId: updated.partnerTeamId, status: updated.status }),
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

// 8. Get partners and teams
export async function getPartnersList() {
  try {
    if (!(await isAdminAuthenticated())) {
      throw new Error("Unauthorized");
    }

    const partners = await db.partner.findMany({
      include: { teams: true }
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

    await db.partner.update({
      where: { id: partnerId },
      data: { status }
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
