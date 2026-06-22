import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import { requestPasswordResetAdmin, resetPasswordAdmin } from "@/app/actions/admin";
import { requestPasswordResetProvider, resetPasswordProvider } from "@/app/actions/provider";

// Mock email-utils to avoid sending real SMTP emails and SMTP_HOST issues
vi.mock("@/lib/email-utils", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "test-message-id" })
}));

describe("Password Reset Server Actions Tests", () => {
  const adminEmail = "admin-reset-test@swisscleaners.ch";
  const providerEmail = "provider-reset-test@swisscleaners.ch";
  const customerEmail = "customer-reset-test@swisscleaners.ch";

  let adminId: string;
  let providerId: string;
  let customerId: string;

  beforeAll(async () => {
    // 1. Clean up potential leftover test users from prior failed test run
    await db.auditLog.deleteMany({
      where: {
        actorUser: {
          email: {
            in: [adminEmail, providerEmail, customerEmail]
          }
        }
      }
    });

    await db.user.deleteMany({
      where: {
        email: {
          in: [adminEmail, providerEmail, customerEmail]
        }
      }
    });

    // 2. Provision test users
    const adminUser = await db.user.create({
      data: {
        name: "Test Admin Reset",
        email: adminEmail,
        passwordHash: hashPassword("oldAdminPass123"),
        role: "super_admin"
      }
    });
    adminId = adminUser.id;

    const providerUser = await db.user.create({
      data: {
        name: "Test Provider Reset",
        email: providerEmail,
        passwordHash: hashPassword("oldProviderPass123"),
        role: "provider_staff"
      }
    });
    providerId = providerUser.id;

    const customerUser = await db.user.create({
      data: {
        name: "Test Customer Reset",
        email: customerEmail,
        passwordHash: hashPassword("oldCustomerPass123"),
        role: "registered_customer"
      }
    });
    customerId = customerUser.id;
  });

  afterAll(async () => {
    // Clean up created audit logs and users
    await db.auditLog.deleteMany({
      where: {
        actorUserId: {
          in: [adminId, providerId, customerId]
        }
      }
    });

    await db.user.deleteMany({
      where: {
        id: {
          in: [adminId, providerId, customerId]
        }
      }
    });
  });

  describe("Admin Password Reset", () => {
    it("should fail to request reset for non-existent admin email", async () => {
      const res = await requestPasswordResetAdmin("nonexistent-admin@swisscleaners.ch");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Administrative email not found");
    });

    it("should fail to request reset for an admin action if the user has customer role", async () => {
      const res = await requestPasswordResetAdmin(customerEmail);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Administrative email not found");
    });

    it("should request password reset successfully for a valid admin user", async () => {
      const res = await requestPasswordResetAdmin(adminEmail);
      expect(res.success).toBe(true);

      const dbUser = await db.user.findUnique({ where: { id: adminId } });
      expect(dbUser?.emailOtpCode).not.toBeNull();
      expect(dbUser?.emailOtpCode).toHaveLength(6);
      expect(dbUser?.emailOtpExpiresAt).not.toBeNull();
    });

    it("should fail to reset if email is invalid", async () => {
      const dbUser = await db.user.findUnique({ where: { id: adminId } });
      const otp = dbUser?.emailOtpCode || "123456";

      const res = await resetPasswordAdmin("nonexistent@swisscleaners.ch", otp, "newSecurePassword123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Administrative email not found");
    });

    it("should fail to reset if OTP code is incorrect", async () => {
      const res = await resetPasswordAdmin(adminEmail, "000000", "newSecurePassword123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid verification code");
    });

    it("should fail to reset if OTP code is expired", async () => {
      const dbUser = await db.user.findUnique({ where: { id: adminId } });
      const otp = dbUser?.emailOtpCode || "123456";

      // Manually set OTP expiration to past
      await db.user.update({
        where: { id: adminId },
        data: {
          emailOtpExpiresAt: new Date(Date.now() - 1000) // 1 second ago
        }
      });

      const res = await resetPasswordAdmin(adminEmail, otp, "newSecurePassword123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Verification code has expired");
    });

    it("should fail to reset if password is too short", async () => {
      // Regenerate OTP
      await requestPasswordResetAdmin(adminEmail);
      const dbUser = await db.user.findUnique({ where: { id: adminId } });
      const otp = dbUser?.emailOtpCode || "123456";

      const res = await resetPasswordAdmin(adminEmail, otp, "short");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Password must be at least 8 characters long");
    });

    it("should reset password successfully with correct OTP", async () => {
      // Get current valid OTP
      const dbUserBefore = await db.user.findUnique({ where: { id: adminId } });
      const otp = dbUserBefore?.emailOtpCode || "123456";

      const res = await resetPasswordAdmin(adminEmail, otp, "newSecurePassword123");
      expect(res.success).toBe(true);

      // Verify OTP is cleared in the DB
      const dbUserAfter = await db.user.findUnique({ where: { id: adminId } });
      expect(dbUserAfter?.emailOtpCode).toBeNull();
      expect(dbUserAfter?.emailOtpExpiresAt).toBeNull();

      // Verify new password is hashed and verified correctly
      expect(verifyPassword("newSecurePassword123", dbUserAfter?.passwordHash || "")).toBe(true);

      // Verify audit log exists
      const auditLog = await db.auditLog.findFirst({
        where: {
          actorUserId: adminId,
          action: "reset_password"
        }
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog?.targetTable).toBe("User");
      expect(auditLog?.targetId).toBe(adminId);
    });
  });

  describe("Provider Password Reset", () => {
    it("should fail to request reset for non-existent provider email", async () => {
      const res = await requestPasswordResetProvider("nonexistent-provider@swisscleaners.ch");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Provider email not found");
    });

    it("should fail to request reset for provider if user is admin instead", async () => {
      const res = await requestPasswordResetProvider(adminEmail);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Provider email not found");
    });

    it("should request password reset successfully for a valid provider user", async () => {
      const res = await requestPasswordResetProvider(providerEmail);
      expect(res.success).toBe(true);

      const dbUser = await db.user.findUnique({ where: { id: providerId } });
      expect(dbUser?.emailOtpCode).not.toBeNull();
      expect(dbUser?.emailOtpCode).toHaveLength(6);
      expect(dbUser?.emailOtpExpiresAt).not.toBeNull();
    });

    it("should fail to reset provider password if code is incorrect", async () => {
      const res = await resetPasswordProvider(providerEmail, "999999", "newProviderPassword123");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid verification code");
    });

    it("should reset provider password successfully with correct OTP", async () => {
      const dbUserBefore = await db.user.findUnique({ where: { id: providerId } });
      const otp = dbUserBefore?.emailOtpCode || "123456";

      const res = await resetPasswordProvider(providerEmail, otp, "newProviderPassword123");
      expect(res.success).toBe(true);

      // Verify OTP is cleared in the DB
      const dbUserAfter = await db.user.findUnique({ where: { id: providerId } });
      expect(dbUserAfter?.emailOtpCode).toBeNull();
      expect(dbUserAfter?.emailOtpExpiresAt).toBeNull();

      // Verify new password is hashed and verified correctly
      expect(verifyPassword("newProviderPassword123", dbUserAfter?.passwordHash || "")).toBe(true);

      // Verify audit log exists
      const auditLog = await db.auditLog.findFirst({
        where: {
          actorUserId: providerId,
          action: "reset_password"
        }
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog?.targetTable).toBe("User");
      expect(auditLog?.targetId).toBe(providerId);
    });
  });
});
