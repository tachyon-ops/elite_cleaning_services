import { test } from "./helpers/fixtures";
import { expect } from "@playwright/test";
import { getLatestBookingForEmail } from "./helpers/db-queries";

test.describe("Mondar - Booking Intake Wizard", () => {
  
  test("should successfully complete a Domestic booking (Credit Card Flow)", async ({ page }) => {
    // 1. Navigate to Domestic booking intake page in English
    await page.goto("/en/book/domestic");
    
    // Validate Step 1 UI and take snapshot
    await expect(page.locator("h2:has-text('Describe your requirements')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/domestic-step1.png" });

    // Fill out form details
    await page.locator("input[type='number']").first().fill("4"); // Bedrooms
    await page.locator("input[type='number']").nth(1).fill("2"); // Bathrooms
    
    // Click Continue to Schedule
    await page.click("button:has-text('Continue to Schedule')");

    // 2. Schedule Step
    await expect(page.locator("h2:has-text('Select date and window')")).toBeVisible();
    
    // Select the first active/non-disabled calendar day
    const activeDays = page.locator("button.rdp-day:not(.rdp-day_disabled):not(.rdp-day_outside)");
    await expect(activeDays.first()).toBeVisible();
    await activeDays.first().click();

    // Select Morning Slot
    await page.click("button:has-text('Morning Slot')");
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/domestic-step2.png" });

    // Click Continue to Quote
    await page.click("button:has-text('Continue to Quote')");

    // 3. Quote Step
    await expect(page.locator("h2:has-text('Review Booking Details')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/domestic-step3.png" });

    // Click Secure with OTP Verification
    await page.click("button:has-text('Secure with OTP Verification')");

    // 4. Contact & OTP Verification Step
    await expect(page.locator("h2:has-text('Contact & Verification')")).toBeVisible();
    
    // Fill out Contact Info
    await page.locator("input[placeholder='John Doe']").fill("Domestic Tester");
    await page.locator("input[placeholder='+41 79 123 4567']").fill("+41 79 999 8888");
    const testEmail = `domestic-${Date.now()}@example.ch`;
    await page.locator("input[type='email']").fill(testEmail);

    // Send OTP
    await page.click("button:has-text('SEND OTP CODE')");

    // Wait for the simulated OTP banner and extract OTP code
    await expect(page.locator("span:has-text('Local Testing Code Triggered')")).toBeVisible();
    const otpText = await page.locator("span:has-text('Enter verification code')").textContent();
    const otpMatch = otpText?.match(/\d{6}/);
    const otpCode = otpMatch ? otpMatch[0] : "";
    expect(otpCode).toHaveLength(6);

    // Enter OTP
    await page.locator("input[placeholder='000000']").fill(otpCode);
    await page.click("button:has-text('VERIFY CODE')");

    // 5. Payment Step (Stripe Sandbox)
    await expect(page.locator("h2:has-text('Simulated Credit Card Deposit')")).toBeVisible();
    
    // Enter Address and Stripe details
    await page.locator("input[placeholder='Seestrasse 10, 8002 Zürich']").fill("Badenerstrasse 42, 8004 Zürich");
    await page.locator("input[placeholder='John Doe']").fill("Domestic Tester");
    // Card Number is pre-filled, so just click Pay Deposit
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/domestic-step5.png" });
    await page.click("button:has-text('PAY DEPOSIT')");

    // 6. Success Screen Verification
    await expect(page.locator("h2:has-text('Booking Confirmed')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/domestic-success.png" });

    // Assert database logging
    const booking = await getLatestBookingForEmail(testEmail);
    expect(booking).not.toBeNull();
    expect(booking?.vertical).toBe("domestic");
    expect(booking?.status).toBe("confirmed");
  });

  test("should successfully submit B2B Building Care Quote request", async ({ page }) => {
    // Navigate to Building Care booking page
    await page.goto("/en/book/building-care");
    
    await expect(page.locator("h2:has-text('Describe your requirements')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/buildingcare-step1.png" });

    // Fill out form fields
    await page.locator("input[type='number']").first().fill("2"); // Entrances
    await page.locator("input[type='number']").nth(1).fill("4"); // Floors
    await page.locator("input[type='number']").nth(2).fill("300"); // Common area
    await page.locator("textarea[placeholder='Access Schließanlage codes, key repository location...']").fill("Key is in secure mailbox box 4.");

    // Continue to Schedule
    await page.click("button:has-text('Continue to Schedule')");

    // Select date and slot
    const activeDays = page.locator("button.rdp-day:not(.rdp-day_disabled):not(.rdp-day_outside)");
    await expect(activeDays.first()).toBeVisible();
    await activeDays.first().click();
    await page.click("button:has-text('Morning Slot')");
    await page.click("button:has-text('Continue to Quote')");

    // Verify Quote info
    await expect(page.locator("h2:has-text('Bespoke Quote Required')")).toBeVisible();
    await page.click("button:has-text('Secure with OTP Verification')");

    // Contact details
    await page.locator("input[placeholder='John Doe']").fill("B2B Building Admin");
    await page.locator("input[placeholder='+41 79 123 4567']").fill("+41 78 555 1234");
    const testEmail = `b2b-building-${Date.now()}@example.ch`;
    await page.locator("input[type='email']").fill(testEmail);
    await page.click("button:has-text('SEND OTP CODE')");

    // OTP verification
    await expect(page.locator("span:has-text('Local Testing Code Triggered')")).toBeVisible();
    const otpText = await page.locator("span:has-text('Enter verification code')").textContent();
    const otpCode = otpText?.match(/\d{6}/)?.[0] || "";
    await page.locator("input[placeholder='000000']").fill(otpCode);
    await page.click("button:has-text('VERIFY CODE')");

    // Finalize Quote request (no Stripe payment necessary)
    await expect(page.locator("h2:has-text('Confirm Request Submission')")).toBeVisible();
    await page.locator("input[placeholder='e.g. Seestrasse 10, 8002 Zürich']").fill("Limmatquai 15, 8001 Zürich");
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/buildingcare-step5.png" });
    await page.click("button:has-text('SUBMIT BESPOKE REQUEST')");

    // Verified quote request screen
    await expect(page.locator("h2:has-text('Request Submitted')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/buildingcare-success.png" });

    // Assert database logging
    const booking = await getLatestBookingForEmail(testEmail);
    expect(booking).not.toBeNull();
    expect(booking?.vertical).toBe("building-care");
    expect(booking?.status).toBe("quote_pending");
  });

  test("should successfully submit B2B Restaurant & Kitchen request with multi-tiers selected", async ({ page }) => {
    // Navigate to Restaurant booking page
    await page.goto("/en/book/restaurant");
    
    await expect(page.locator("h2:has-text('Describe your requirements')")).toBeVisible();
    
    // Choose both Tier A & Tier B
    await page.check("input[type='checkbox'][checked]"); // Tier A is checked by default
    await page.locator("input[type='checkbox']").nth(1).check(); // Check Tier B
    
    // Fill out Restaurant specific fields
    await page.locator("input[type='number']").first().fill("220"); // Surface area
    await page.locator("input[type='number']").nth(1).fill("45"); // Kitchen m2
    await page.locator("input[type='number']").nth(2).fill("5"); // Hood canopy length
    await page.locator("input[type='number']").nth(3).fill("2"); // Hood count
    await page.locator("input[type='date']").fill("2026-03-01"); // Last certified clean date

    await page.screenshot({ path: "src/__tests__/e2e/snapshots/restaurant-step1.png" });
    await page.click("button:has-text('Continue to Schedule')");

    // Select date and slot
    const activeDays = page.locator("button.rdp-day:not(.rdp-day_disabled):not(.rdp-day_outside)");
    await expect(activeDays.first()).toBeVisible();
    await activeDays.first().click();
    await page.click("button:has-text('Afternoon Slot')");
    await page.click("button:has-text('Continue to Quote')");

    // Verify Quote info
    await expect(page.locator("h2:has-text('Bespoke Quote Required')")).toBeVisible();
    await page.click("button:has-text('Secure with OTP Verification')");

    // Contact details
    await page.locator("input[placeholder='John Doe']").fill("B2B Restaurant Manager");
    await page.locator("input[placeholder='+41 79 123 4567']").fill("+41 77 444 3333");
    const testEmail = `b2b-restaurant-${Date.now()}@example.ch`;
    await page.locator("input[type='email']").fill(testEmail);
    await page.click("button:has-text('SEND OTP CODE')");

    // OTP verification
    await expect(page.locator("span:has-text('Local Testing Code Triggered')")).toBeVisible();
    const otpText = await page.locator("span:has-text('Enter verification code')").textContent();
    const otpCode = otpText?.match(/\d{6}/)?.[0] || "";
    await page.locator("input[placeholder='000000']").fill(otpCode);
    await page.click("button:has-text('VERIFY CODE')");

    // Submit request
    await expect(page.locator("h2:has-text('Confirm Request Submission')")).toBeVisible();
    await page.locator("input[placeholder='e.g. Bahnhofstrasse 12, 8001 Zürich']").fill("Langstrasse 100, 8004 Zürich");
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/restaurant-step5.png" });
    await page.click("button:has-text('SUBMIT BESPOKE REQUEST')");

    // Success Screen
    await expect(page.locator("h2:has-text('Request Submitted')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/restaurant-success.png" });

    // Assert database logging
    const booking = await getLatestBookingForEmail(testEmail);
    expect(booking).not.toBeNull();
    expect(booking?.vertical).toBe("restaurant");
    expect(booking?.status).toBe("quote_pending");
    
    // Check custom serialized tiers
    const parsedIntake = JSON.parse(booking!.intake);
    expect(parsedIntake.restaurantTier).toContain("tier_a");
    expect(parsedIntake.restaurantTier).toContain("tier_b");
  });
});
