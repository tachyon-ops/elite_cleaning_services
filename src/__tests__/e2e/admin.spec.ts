import { test } from "./helpers/fixtures";
import { expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAsAdmin } from "./helpers/auth";

const db = new PrismaClient();

test.describe("Elite Cleaning Services - Admin Dashboard Operations", () => {
  const testBookingId = "test-booking-admin-1";

  test.beforeEach(async ({ context }) => {
    // 1. Authenticate as Admin programmatically
    await loginAsAdmin(context);

    // 2. Upsert guest email record to satisfy foreign key constraints
    await db.guestEmail.upsert({
      where: { email: "b2b-admin-test@example.ch" },
      update: {},
      create: { email: "b2b-admin-test@example.ch" }
    });

    // 3. Insert a mock quote_pending booking
    await db.booking.upsert({
      where: { id: testBookingId },
      update: { status: "quote_pending" },
      create: {
        id: testBookingId,
        vertical: "restaurant",
        categorySlug: "restaurant",
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        scheduledWindow: "morning",
        locationAddress: "Lintheschergasse 15, 8001 Zürich",
        status: "quote_pending",
        guestEmail: "b2b-admin-test@example.ch",
        totalAmountChf: 0,
        depositAmountChf: 0,
        intake: JSON.stringify({
          restaurantVenueType: "restaurant",
          restaurantSurfaceArea: 100,
          restaurantCovers: 50,
          restaurantTier: ["tier_a"]
        })
      }
    });
  });

  test.afterEach(async () => {
    // Clean up mock booking
    await db.booking.deleteMany({
      where: { id: testBookingId }
    });
    await db.guestEmail.deleteMany({
      where: { email: "b2b-admin-test@example.ch" }
    });
  });

  test("should load the Admin Operations Hub successfully", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.locator("h1:has-text('System Overview')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-ops-hub.png" });
  });

  test("should view dispatches, inspect B2B quote_pending, and successfully send quote", async ({ page }) => {
    // 1. Go to bookings list page
    await page.goto("/en/admin/bookings");
    await expect(page.locator("h1:has-text('Bookings Dashboard')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-bookings-list.png" });

    // 2. Verify that our mock booking is displayed in the table
    const bookingRow = page.locator(`tr:has-text('b2b-admin-test@example.ch')`);
    await expect(bookingRow).toBeVisible();

    // 3. Click the inspect (Eye icon) button on the booking row
    await bookingRow.locator("button").click();

    // 4. Expect Details Drawer to be loaded with intake schemas and quote form
    await expect(page.locator("h3:has-text('Intake Details')")).toBeVisible();
    await expect(page.locator("span:has-text('Generate Bespoke Quote')")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-booking-inspect.png" });

    // 5. Fill out the Quote price and notes
    await page.locator("input[placeholder='e.g. 750']").fill("450");
    await page.locator("textarea[placeholder='e.g. Exterior hand wash, gelcoat sealant, and interior cabin detail.']").fill("Premium kitchen ventilation clean and nightly sanitizing.");

    // 6. Submit the quote to client
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-booking-quote-filled.png" });
    await page.click("button:has-text('Send Quote to Client')");

    // 7. Verify success banner message
    await expect(page.locator("text=Quote created and sent to customer successfully.")).toBeVisible();
    await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-booking-quote-success.png" });

    // 8. Confirm in database that booking status updated to 'quote_sent'
    const updatedBooking = await db.booking.findUnique({
      where: { id: testBookingId }
    });
    expect(updatedBooking?.status).toBe("quote_sent");
    expect(updatedBooking?.totalAmountChf.toNumber()).toBe(450.00);
  });
});
