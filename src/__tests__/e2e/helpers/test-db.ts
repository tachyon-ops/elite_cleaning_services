import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function resetDatabaseForTest() {
  try {
    // Disable foreign key constraints temporarily if needed, or delete in topological order
    // Order: Child tables first, then parent tables
    await prisma.dispute.deleteMany({});
    await prisma.commissionLedger.deleteMany({});
    await prisma.payout.deleteMany({});
    await prisma.providerOffer.deleteMany({});
    await prisma.providerListing.deleteMany({});
    await prisma.providerDocument.deleteMany({});
    await prisma.providerApplication.deleteMany({});
    await prisma.consentLog.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.availabilityBlock.deleteMany({});
    await prisma.recurringSchedule.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.quote.deleteMany({});
    await prisma.jobOccurrence.deleteMany({});
    await prisma.serviceContract.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.guestEmail.deleteMany({});
    
    // Clear custom test users, leaving only the seeded default admin/partner
    await prisma.user.deleteMany({
      where: {
        email: {
          notIn: ["admin@elite-cleaning.ch", "partner@alpineclean.ch"]
        }
      }
    });

    // Reset OTP code state on the admin user to ensure clean state
    await prisma.user.updateMany({
      where: { email: "admin@elite-cleaning.ch" },
      data: { emailOtpCode: null, emailOtpExpiresAt: null }
    });

    console.log("[E2E DB HELPERS] Database transaction tables cleared.");
  } catch (error) {
    console.error("[E2E DB HELPERS] Error resetting test database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
