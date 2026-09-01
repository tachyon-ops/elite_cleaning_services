import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { createBooking, setCustomerPassword } from "@/app/actions/booking";
import { verifyPassword } from "@/lib/auth-utils";

describe("Customer Account Auto-Provisioning & Password Setup (TDD)", () => {
  const oneOffEmail = "oneoff-client@example.ch";
  const existingClientEmail = "existing-client@example.ch";
  let oneOffBookingId: string;

  beforeAll(async () => {
    // Ensure service categories exist
    await db.serviceCategory.upsert({
      where: { slug: "domestic" },
      update: {},
      create: { slug: "domestic", name: "Domestic Cleaning", vertical: "domestic", pricingModel: "instant", active: true }
    });

    // Verify emails in guest verification table
    await db.guestEmail.upsert({
      where: { email: oneOffEmail },
      update: { verifiedAt: new Date() },
      create: { email: oneOffEmail, verifiedAt: new Date() }
    });

    await db.guestEmail.upsert({
      where: { email: existingClientEmail },
      update: { verifiedAt: new Date() },
      create: { email: existingClientEmail, verifiedAt: new Date() }
    });

    // Clean up test users if existing
    await db.auditLog.deleteMany({
      where: { actorUser: { email: { in: [oneOffEmail, existingClientEmail] } } }
    });
    await db.user.deleteMany({
      where: { email: { in: [oneOffEmail, existingClientEmail] } }
    });
  });

  afterAll(async () => {
    if (oneOffBookingId) {
      await db.payment.deleteMany({ where: { bookingId: oneOffBookingId } });
      await db.booking.deleteMany({ where: { id: oneOffBookingId } });
    }
    await db.auditLog.deleteMany({
      where: { actorUser: { email: { in: [oneOffEmail, existingClientEmail] } } }
    });
    await db.user.deleteMany({
      where: { email: { in: [oneOffEmail, existingClientEmail] } }
    });
    await db.guestEmail.deleteMany({
      where: { email: { in: [oneOffEmail, existingClientEmail] } }
    });
  });

  it("should silently auto-provision a registered_customer user account on a one-off booking", async () => {
    // 1. Verify user does not exist prior to booking
    const userBefore = await db.user.findUnique({ where: { email: oneOffEmail } });
    expect(userBefore).toBeNull();

    // 2. Perform one-off booking
    const res = await createBooking({
      email: oneOffEmail,
      vertical: "domestic",
      categorySlug: "domestic",
      intake: {
        name: "Sophie Dupont",
        phone: "+41 79 111 2233",
        bedrooms: 2,
        bathrooms: 1,
        frequency: "one-off"
      },
      scheduledAtStr: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledWindow: "morning",
      locationAddress: "Rue du Rhône 10, 1204 Genève"
    });

    expect(res.success).toBe(true);
    expect(res.bookingId).toBeDefined();
    oneOffBookingId = res.bookingId!;

    // 3. Verify user was automatically created with customer role and contact details
    const userAfter = await db.user.findUnique({ where: { email: oneOffEmail } });
    expect(userAfter).not.toBeNull();
    expect(userAfter?.role).toBe("registered_customer");
    expect(userAfter?.name).toBe("Sophie Dupont");
    expect(userAfter?.phone).toBe("+41 79 111 2233");

    // 4. Verify the booking is linked to customerId
    const booking = await db.booking.findUnique({ where: { id: oneOffBookingId } });
    expect(booking?.customerId).toBe(userAfter?.id);
    expect(booking?.guestEmail).toBe(oneOffEmail);
  });

  it("should fail to set customer password if shorter than 8 characters", async () => {
    const res = await setCustomerPassword({
      email: oneOffEmail,
      password: "short"
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Password must be at least 8 characters long");
  });

  it("should successfully set customer password and create an audit log", async () => {
    const newPassword = "SecurePass123!";
    const res = await setCustomerPassword({
      email: oneOffEmail,
      password: newPassword
    });

    expect(res.success).toBe(true);

    // Verify password is saved and hashed
    const user = await db.user.findUnique({ where: { email: oneOffEmail } });
    expect(user?.passwordHash).not.toBeNull();
    expect(verifyPassword(newPassword, user!.passwordHash!)).toBe(true);

    // Verify audit log
    const audit = await db.auditLog.findFirst({
      where: {
        actorUserId: user!.id,
        action: "set_customer_password"
      }
    });
    expect(audit).not.toBeNull();
    expect(audit?.targetTable).toBe("User");
    expect(audit?.targetId).toBe(user!.id);
  });
});
