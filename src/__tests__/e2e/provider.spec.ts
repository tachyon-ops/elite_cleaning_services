import { test } from "./helpers/fixtures";
import { expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAsProvider } from "./helpers/auth";
import { getProviderBySlug } from "./helpers/db-queries";

const db = new PrismaClient();

test.describe("Elite Cleaning Services - Provider Portal Operations", () => {
  const testBookingId = "test-booking-provider-1";
  const testOfferId = "test-offer-provider-1";

  test.beforeEach(async ({ context }) => {
    // 1. Authenticate as Provider
    await loginAsProvider(context);

    // 2. Fetch provider details
    const provider = await getProviderBySlug("alpine-cleaning-services");
    expect(provider).not.toBeNull();

    // 3. Clean up any existing test records
    await db.providerOffer.deleteMany({ where: { id: testOfferId } });
    await db.booking.deleteMany({ where: { id: testBookingId } });
    await db.guestEmail.deleteMany({ where: { email: "provider-flow-test@example.ch" } });

    // 4. Upsert guest email to satisfy foreign key constraint
    await db.guestEmail.upsert({
      where: { email: "provider-flow-test@example.ch" },
      update: {},
      create: { email: "provider-flow-test@example.ch" }
    });

    // 5. Create mock booking & dispatch offer
    await db.booking.create({
      data: {
        id: testBookingId,
        vertical: "commercial",
        categorySlug: "commercial",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
        scheduledWindow: "morning",
        locationAddress: "Stampfenbachstrasse 48, 8006 Zürich",
        status: "confirmed",
        guestEmail: "provider-flow-test@example.ch",
        totalAmountChf: 250.00,
        depositAmountChf: 75.00,
        intake: JSON.stringify({
          officeType: "office",
          surfaceArea: 150,
          frequency: "one-off"
        })
      }
    });

    await db.providerOffer.create({
      data: {
        id: testOfferId,
        bookingId: testBookingId,
        providerId: provider!.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
        response: "pending"
      }
    });
  });

  test.afterEach(async () => {
    // Clean up mock records
    await db.providerOffer.deleteMany({ where: { id: testOfferId } });
    await db.booking.deleteMany({ where: { id: testBookingId } });
    await db.guestEmail.deleteMany({ where: { email: "provider-flow-test@example.ch" } });
  });

  test("should load the Partner Portal Dashboard and successfully accept dispatch offer", async ({ page }) => {
    // 1. Go to Provider dashboard
    await page.goto("/en/providers/account");
    await expect(page.locator("h2:has-text('Alpine Cleaning Services AG')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-portal-dashboard.png" });

    // 2. Verify that the pending offer is visible on screen
    await expect(page.locator("h2:has-text('Pending Jobs Offered')")).toBeVisible();
    await expect(page.locator("text=Stampfenbachstrasse 48, 8006 Zürich")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-offer-visible.png" });

    // 3. Click the Accept Job button
    await page.click("#accept-offer-btn");

    // 4. Verify that the pending offer is cleared or changes state
    await expect(page.locator("text=Stampfenbachstrasse 48, 8006 Zürich")).not.toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/provider-offer-accepted.png" });

    // 5. Query the database and verify the response updated to accepted
    const offer = await db.providerOffer.findUnique({
      where: { id: testOfferId }
    });
    expect(offer?.response).toBe("accepted");
  });
});
