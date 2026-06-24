# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Elite Cleaning Services - Admin Dashboard Operations >> should view dispatches, inspect B2B quote_pending, and successfully send quote
- Location: src/__tests__/e2e/admin.spec.ts:63:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text(\'Bookings Dashboard\')')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1:has-text(\'Bookings Dashboard\')')

```

```yaml
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
- alert
```

# Test source

```ts
  1   | import { test } from "./helpers/fixtures";
  2   | import { expect } from "@playwright/test";
  3   | import { PrismaClient } from "@prisma/client";
  4   | import { loginAsAdmin } from "./helpers/auth";
  5   | 
  6   | const db = new PrismaClient();
  7   | 
  8   | test.describe("Elite Cleaning Services - Admin Dashboard Operations", () => {
  9   |   const testBookingId = "test-booking-admin-1";
  10  | 
  11  |   test.beforeEach(async ({ context }) => {
  12  |     // 1. Authenticate as Admin programmatically
  13  |     await loginAsAdmin(context);
  14  | 
  15  |     // 2. Upsert guest email record to satisfy foreign key constraints
  16  |     await db.guestEmail.upsert({
  17  |       where: { email: "b2b-admin-test@example.ch" },
  18  |       update: {},
  19  |       create: { email: "b2b-admin-test@example.ch" }
  20  |     });
  21  | 
  22  |     // 3. Insert a mock quote_pending booking
  23  |     await db.booking.upsert({
  24  |       where: { id: testBookingId },
  25  |       update: { status: "quote_pending" },
  26  |       create: {
  27  |         id: testBookingId,
  28  |         vertical: "restaurant",
  29  |         categorySlug: "restaurant",
  30  |         scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  31  |         scheduledWindow: "morning",
  32  |         locationAddress: "Lintheschergasse 15, 8001 Zürich",
  33  |         status: "quote_pending",
  34  |         guestEmail: "b2b-admin-test@example.ch",
  35  |         totalAmountChf: 0,
  36  |         depositAmountChf: 0,
  37  |         intake: JSON.stringify({
  38  |           restaurantVenueType: "restaurant",
  39  |           restaurantSurfaceArea: 100,
  40  |           restaurantCovers: 50,
  41  |           restaurantTier: ["tier_a"]
  42  |         })
  43  |       }
  44  |     });
  45  |   });
  46  | 
  47  |   test.afterEach(async () => {
  48  |     // Clean up mock booking
  49  |     await db.booking.deleteMany({
  50  |       where: { id: testBookingId }
  51  |     });
  52  |     await db.guestEmail.deleteMany({
  53  |       where: { email: "b2b-admin-test@example.ch" }
  54  |     });
  55  |   });
  56  | 
  57  |   test("should load the Admin Operations Hub successfully", async ({ page }) => {
  58  |     await page.goto("/en/admin");
  59  |     await expect(page.locator("h1:has-text('System Overview')")).toBeVisible();
  60  |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-ops-hub.png" });
  61  |   });
  62  | 
  63  |   test("should view dispatches, inspect B2B quote_pending, and successfully send quote", async ({ page }) => {
  64  |     // 1. Go to bookings list page
  65  |     await page.goto("/en/admin/bookings");
> 66  |     await expect(page.locator("h1:has-text('Bookings Dashboard')")).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  67  |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-bookings-list.png" });
  68  | 
  69  |     // 2. Verify that our mock booking is displayed in the table
  70  |     const bookingRow = page.locator(`tr:has-text('b2b-admin-test@example.ch')`);
  71  |     await expect(bookingRow).toBeVisible();
  72  | 
  73  |     // 3. Click the inspect (Eye icon) button on the booking row
  74  |     await bookingRow.locator("button").click();
  75  | 
  76  |     // 4. Expect Details Drawer to be loaded with intake schemas and quote form
  77  |     await expect(page.locator("h3:has-text('Intake Details')")).toBeVisible();
  78  |     await expect(page.locator("span:has-text('Generate Bespoke Quote')")).toBeVisible();
  79  |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-booking-inspect.png" });
  80  | 
  81  |     // 5. Fill out the Quote price and notes
  82  |     await page.locator("input[placeholder='e.g. 750']").fill("450");
  83  |     await page.locator("textarea[placeholder='e.g. Exterior hand wash, gelcoat sealant, and interior cabin detail.']").fill("Premium kitchen ventilation clean and nightly sanitizing.");
  84  | 
  85  |     // 6. Submit the quote to client
  86  |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-booking-quote-filled.png" });
  87  |     await page.click("button:has-text('Send Quote to Client')");
  88  | 
  89  |     // 7. Verify success banner message
  90  |     await expect(page.locator("text=Quote created and sent to customer successfully.")).toBeVisible();
  91  |     await page.screenshot({ path: "src/__tests__/e2e/snapshots/admin-booking-quote-success.png" });
  92  | 
  93  |     // 8. Confirm in database that booking status updated to 'quote_sent'
  94  |     const updatedBooking = await db.booking.findUnique({
  95  |       where: { id: testBookingId }
  96  |     });
  97  |     expect(updatedBooking?.status).toBe("quote_sent");
  98  |     expect(updatedBooking?.totalAmountChf.toNumber()).toBe(450.00);
  99  |   });
  100 | });
  101 | 
```