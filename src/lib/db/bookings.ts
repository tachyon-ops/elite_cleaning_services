import { db } from "@/lib/db";
import { getAuthenticatedActor } from "./auth-helper";
import { cancelBookingWithRefund } from "@/app/actions/payments";

/**
 * Retrieves bookings filtered based on the current user's role.
 * - Staff/Admins: Can view all bookings.
 * - Customers: Can only view their own bookings.
 */
export async function getBookings() {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const isStaff = ["super_admin", "editor", "dispatcher"].includes(actor.role);

  if (isStaff) {
    return await db.booking.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // Filter bookings specifically for this authenticated customer
  return await db.booking.findMany({
    where: { customerId: actor.id },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves a single booking by ID with ownership verification.
 */
export async function getBookingById(bookingId: string) {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return null;
  }

  const isStaff = ["super_admin", "editor", "dispatcher"].includes(actor.role);
  const isOwner = booking.customerId === actor.id;

  if (!isStaff && !isOwner) {
    throw new Error("Unauthorized: You do not have permission to view this booking.");
  }

  return booking;
}

/**
 * Creates a new booking. Can be associated with an authenticated customer
 * or an unauthenticated guest user.
 */
export async function createBooking(data: {
  vertical: string;
  categorySlug?: string;
  intake: Record<string, any>;
  scheduledAt: Date;
  scheduledWindow: string;
  locationAddress: string;
  locationGeo?: string;
  totalAmountChf: number;
  depositAmountChf: number;
  guestEmail?: string;
}) {
  const actor = await getAuthenticatedActor();

  // If user is authenticated, associate with their account.
  // Otherwise, fallback to the optional guestEmail.
  const customerId = actor?.id || null;
  const guestEmail = customerId ? null : (data.guestEmail || null);

  return await db.booking.create({
    data: {
      customerId,
      guestEmail,
      vertical: data.vertical,
      categorySlug: data.categorySlug || null,
      intake: JSON.stringify(data.intake),
      scheduledAt: data.scheduledAt,
      scheduledWindow: data.scheduledWindow,
      locationAddress: data.locationAddress,
      locationGeo: data.locationGeo || null,
      totalAmountChf: data.totalAmountChf,
      depositAmountChf: data.depositAmountChf,
      status: "draft",
    },
  });
}

/**
 * Updates a booking's status. Restrict to staff/admin roles.
 */
export async function updateBookingStatus(bookingId: string, status: string) {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const isStaff = ["super_admin", "editor", "dispatcher"].includes(actor.role);
  if (!isStaff) {
    throw new Error("Unauthorized: Admin privilege required to update status.");
  }

  return await db.booking.update({
    where: { id: bookingId },
    data: { status },
  });
}

/**
 * Cancels a booking.
 * - Staff/Admins can cancel any booking.
 * - Customers can cancel their own booking if scheduled clean is > 24 hours away.
 */
export async function cancelBooking(bookingId: string, reason: string) {
  const actor = await getAuthenticatedActor();
  if (!actor) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  const isStaff = ["super_admin", "editor", "dispatcher"].includes(actor.role);
  const isOwner = booking.customerId === actor.id;

  if (!isStaff && !isOwner) {
    throw new Error("Unauthorized: You do not have permission to modify this booking.");
  }

  // Check 24 hour threshold for customer cancellations
  if (!isStaff) {
    const timeDiffMs = booking.scheduledAt.getTime() - Date.now();
    const hoursDiff = timeDiffMs / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      throw new Error("Cancellation lock-out: Bookings cannot be cancelled less than 24 hours before schedule.");
    }
  }

  const cancelledBy = isStaff ? "ops" : "customer";
  const res = await cancelBookingWithRefund(bookingId, cancelledBy, reason);
  if (!res.success) {
    throw new Error(res.error);
  }

  const freshBooking = await db.booking.findUnique({
    where: { id: bookingId }
  });
  if (!freshBooking) {
    throw new Error("Booking not found after update.");
  }
  return freshBooking;
}
