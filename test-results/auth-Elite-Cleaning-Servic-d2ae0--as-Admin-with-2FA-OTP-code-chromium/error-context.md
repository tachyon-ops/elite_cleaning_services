# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Elite Cleaning Services - Authentication Flows >> should successfully login as Admin with 2FA OTP code
- Location: src/__tests__/e2e/auth.spec.ts:7:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type=\'email\']')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "This page could not be found." [level=2] [ref=e6]
  - alert [ref=e7]
```

# Test source

```ts
  1  | import { test } from "./helpers/fixtures";
  2  | import { expect } from "@playwright/test";
  3  | import { getUserByEmail } from "./helpers/db-queries";
  4  | 
  5  | test.describe("Elite Cleaning Services - Authentication Flows", () => {
  6  | 
  7  |   test("should successfully login as Admin with 2FA OTP code", async ({ page }) => {
  8  |     // 1. Go to Admin Login page
  9  |     await page.goto("/en/admin/login");
  10 |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-login-empty.png" });
  11 | 
  12 |     // 2. Fill credentials
> 13 |     await page.locator("input[type='email']").fill("admin@elite-cleaning.ch");
     |                                               ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  14 |     await page.locator("input[type='password']").fill("admin123");
  15 |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-login-filled.png" });
  16 | 
  17 |     // 3. Click SEND OTP CODE
  18 |     await page.click("button:has-text('SEND OTP CODE')");
  19 | 
  20 |     // 4. Expect to be prompted for 2FA token
  21 |     await expect(page.locator("h2:has-text('ELITE CONTROL')")).toBeVisible();
  22 |     await expect(page.locator("text=Verify Email OTP Code")).toBeVisible();
  23 | 
  24 |     // 5. Query OTP code from the database
  25 |     const adminUser = await getUserByEmail("admin@elite-cleaning.ch");
  26 |     expect(adminUser).not.toBeNull();
  27 |     const otpCode = adminUser?.emailOtpCode;
  28 |     expect(otpCode).not.toBeNull();
  29 |     expect(otpCode).toHaveLength(6);
  30 | 
  31 |     // 6. Enter OTP and submit
  32 |     await page.locator("input[placeholder='e.g. 123456']").fill(otpCode!);
  33 |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-login-otp.png" });
  34 |     await page.click("button:has-text('Verify Code')");
  35 | 
  36 |     // 7. Verify redirect to admin dashboard
  37 |     await expect(page).toHaveURL(/\/en\/admin/);
  38 |     await expect(page.locator("h1:has-text('System Overview')")).toBeVisible();
  39 |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-dashboard.png" });
  40 |   });
  41 | 
  42 |   test("should successfully login as Provider directly (2FA disabled)", async ({ page }) => {
  43 |     // 1. Go to Provider Login page
  44 |     await page.goto("/en/providers/account/login");
  45 |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-login-empty.png" });
  46 | 
  47 |     // 2. Fill credentials
  48 |     await page.locator("input[type='email']").fill("partner@alpineclean.ch");
  49 |     await page.locator("input[type='password']").fill("partner123");
  50 |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-login-filled.png" });
  51 | 
  52 |     // 3. Click SECURE ENTER
  53 |     await page.click("button:has-text('SECURE ENTER')");
  54 | 
  55 |     // 4. Verify redirect to partner account dashboard
  56 |     await expect(page).toHaveURL(/\/en\/providers\/account/);
  57 |     await expect(page.locator("h2:has-text('Alpine Cleaning Services AG')")).toBeVisible();
  58 |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-dashboard.png" });
  59 |   });
  60 | });
  61 | 
```