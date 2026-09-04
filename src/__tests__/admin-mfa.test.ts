import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../lib/db";
import { hashPassword, generateTOTPSecret } from "../lib/auth-utils";

vi.mock("next/headers", () => {
  const store = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return {
    cookies: vi.fn().mockResolvedValue(store),
  };
});

import {
  loginAdmin,
  loginAdmin2FA,
  requestEmailOtpFallback
} from "../app/actions/admin";
import { createHmac } from "crypto";

function generateTestTOTP(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = secret.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const buffer = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      buffer.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  const key = Buffer.from(buffer);
  const counter = Math.floor(Math.floor(Date.now() / 1000) / 30);
  const b = Buffer.alloc(8);
  let temp = counter;
  for (let j = 7; j >= 0; j--) {
    b[j] = temp & 0xff;
    temp = temp >> 8;
  }
  const hmac = createHmac("sha1", key).update(b).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

describe("Administrative Mandatory MFA & Opt-in Authenticator App", () => {
  const testEmail = "test-mfa-admin@mondar.ch";
  const testPassword = "AdminSecurePass2026!";

  beforeEach(async () => {
    await db.user.deleteMany({
      where: { email: testEmail }
    });

    await db.user.create({
      data: {
        email: testEmail,
        name: "Test Admin MFA",
        role: "super_admin",
        passwordHash: hashPassword(testPassword),
        twoFactorEnabled: true,
        twoFactorMethod: "email"
      }
    });
  });

  it("1. loginAdmin enforces mandatory MFA with Email OTP baseline by default", async () => {
    const res = await loginAdmin(testEmail, testPassword);
    expect(res.success).toBe(true);
    expect(res.requires2FA).toBe(true);
    expect(res.method).toBe("email");
    expect(res.userId).toBeDefined();

    const user = await db.user.findUnique({ where: { email: testEmail } });
    expect(user?.emailOtpCode).toHaveLength(6);
    expect(user?.emailOtpExpiresAt).toBeDefined();

    // Verify correct OTP logs in
    const verifyRes = await loginAdmin2FA(user!.id, user!.emailOtpCode!);
    expect(verifyRes.success).toBe(true);

    // Verify OTP cleared after use
    const userAfter = await db.user.findUnique({ where: { email: testEmail } });
    expect(userAfter?.emailOtpCode).toBeNull();
  });

  it("2. user can opt in to Authenticator App (TOTP) and login with rolling code", async () => {
    const totpSecret = generateTOTPSecret(16);
    const validToken = generateTestTOTP(totpSecret);

    // Update user to TOTP
    await db.user.update({
      where: { email: testEmail },
      data: {
        twoFactorSecret: totpSecret,
        twoFactorMethod: "totp",
        twoFactorEnabled: true
      }
    });

    // loginAdmin should return method: "totp" and NOT generate email OTP
    const res = await loginAdmin(testEmail, testPassword);
    expect(res.success).toBe(true);
    expect(res.requires2FA).toBe(true);
    expect(res.method).toBe("totp");

    const user = await db.user.findUnique({ where: { email: testEmail } });
    expect(user?.emailOtpCode).toBeNull(); // No email OTP generated!

    // Verify with valid TOTP rolling token
    const verifyRes = await loginAdmin2FA(user!.id, validToken);
    expect(verifyRes.success).toBe(true);

    // Verify with wrong TOTP token fails
    const failRes = await loginAdmin2FA(user!.id, "000000");
    expect(failRes.success).toBe(false);
  });

  it("3. TOTP user can request email fallback OTP if mobile app is unavailable", async () => {
    const totpSecret = generateTOTPSecret(16);

    await db.user.update({
      where: { email: testEmail },
      data: {
        twoFactorSecret: totpSecret,
        twoFactorMethod: "totp",
        twoFactorEnabled: true
      }
    });

    const user = await db.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeDefined();

    // Request fallback
    const fallbackRes = await requestEmailOtpFallback(user!.id);
    expect(fallbackRes.success).toBe(true);

    const userWithFallback = await db.user.findUnique({ where: { email: testEmail } });
    expect(userWithFallback?.emailOtpCode).toHaveLength(6);

    // Login with fallback email code
    const verifyRes = await loginAdmin2FA(user!.id, userWithFallback!.emailOtpCode!);
    expect(verifyRes.success).toBe(true);
  });

  it("4. switching back to Email OTP resets method to email while keeping MFA mandatory", async () => {
    const totpSecret = generateTOTPSecret(16);

    await db.user.update({
      where: { email: testEmail },
      data: {
        twoFactorSecret: totpSecret,
        twoFactorMethod: "totp",
        twoFactorEnabled: true
      }
    });

    // Directly reset to email
    await db.user.update({
      where: { email: testEmail },
      data: {
        twoFactorSecret: null,
        twoFactorMethod: "email",
        twoFactorEnabled: true
      }
    });

    const user = await db.user.findUnique({ where: { email: testEmail } });
    expect(user?.twoFactorMethod).toBe("email");
    expect(user?.twoFactorEnabled).toBe(true);
    expect(user?.twoFactorSecret).toBeNull();

    // Now loginAdmin returns email OTP
    const res = await loginAdmin(testEmail, testPassword);
    expect(res.success).toBe(true);
    expect(res.method).toBe("email");
  });
});
