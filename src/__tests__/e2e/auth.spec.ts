import { test } from "./helpers/fixtures";
import { expect } from "@playwright/test";
import { getUserByEmail } from "./helpers/db-queries";

test.describe("Mondar - Authentication Flows", () => {

  test("should successfully login as Admin with 2FA OTP code", async ({ page }) => {
    // 1. Go to Admin Login page
    await page.goto("/en/admin/login");
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-login-empty.png" });

    // 2. Fill credentials
    await page.locator("input[type='email']").fill("admin@mondar.ch");
    await page.locator("input[type='password']").fill("admin123");
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-login-filled.png" });

    // 3. Click SEND OTP CODE
    await page.click("button:has-text('SEND OTP CODE')");

    // 4. Expect to be prompted for 2FA token
    await expect(page.locator("h2:has-text('MONDAR CONTROL')")).toBeVisible();
    await expect(page.locator("text=Verify Email OTP Code")).toBeVisible();

    // 5. Query OTP code from the database
    const adminUser = await getUserByEmail("admin@mondar.ch");
    expect(adminUser).not.toBeNull();
    const otpCode = adminUser?.emailOtpCode;
    expect(otpCode).not.toBeNull();
    expect(otpCode).toHaveLength(6);

    // 6. Enter OTP and submit
    await page.locator("input[placeholder='e.g. 123456']").fill(otpCode!);
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-login-otp.png" });
    await page.click("button:has-text('Verify Code')");

    // 7. Verify redirect to admin dashboard
    await expect(page).toHaveURL(/\/en\/admin/);
    await expect(page.locator("h1:has-text('System Overview')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-dashboard.png" });
  });

  test("should successfully login as Provider directly (2FA disabled)", async ({ page }) => {
    // 1. Go to Provider Login page
    await page.goto("/en/providers/account/login");
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-login-empty.png" });

    // 2. Fill credentials
    await page.locator("input[type='email']").fill("partner@alpineclean.ch");
    await page.locator("input[type='password']").fill("partner123");
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-login-filled.png" });

    // 3. Click SECURE ENTER
    await page.click("button:has-text('SECURE ENTER')");

    // 4. Verify redirect to partner account dashboard
    await expect(page).toHaveURL(/\/en\/providers\/account/);
    await expect(page.locator("h2:has-text('Alpine Cleaning Services AG')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-dashboard.png" });
  });
});
