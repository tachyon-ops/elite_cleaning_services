import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateTOTPSecret,
  generateEmailOtp,
  getTOTPAuthUrl
} from "../lib/auth-utils";

describe("auth-utils", () => {
  describe("password hashing", () => {
    it("should hash a password and verify it correctly", () => {
      const password = "mySecurePassword123";
      const hashedPassword = hashPassword(password);
      
      expect(hashedPassword).toContain(":");
      expect(verifyPassword(password, hashedPassword)).toBe(true);
      expect(verifyPassword("wrongPassword", hashedPassword)).toBe(false);
    });

    it("should fallback to plain password match if no salt prefix exists", () => {
      expect(verifyPassword("plain", "plain")).toBe(true);
      expect(verifyPassword("plain", "other")).toBe(false);
    });
  });

  describe("TOTP helpers", () => {
    it("should generate a random base32 secret of specified length", () => {
      const secret = generateTOTPSecret(16);
      expect(secret).toHaveLength(16);
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it("should construct valid totp auth url", () => {
      const email = "user@test.ch";
      const secret = "JBSWY3DPEHPK3PXP";
      const url = getTOTPAuthUrl(email, secret);
      expect(url).toBe("otpauth://totp/Mondar:user@test.ch?secret=JBSWY3DPEHPK3PXP&issuer=Mondar");
    });
  });

  describe("email OTP", () => {
    it("should generate a 6-digit numeric string", () => {
      const otp = generateEmailOtp();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d+$/);
    });
  });
});
