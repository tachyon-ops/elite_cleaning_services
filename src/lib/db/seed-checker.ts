import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";

export async function checkAndSeedDb() {
  try {
    // Migrate plain-text passwords to hashed passwords (if any exist)
    const plainUsers = await db.user.findMany();
    for (const u of plainUsers) {
      if (u.passwordHash && !u.passwordHash.includes(":")) {
        const hashed = hashPassword(u.passwordHash);
        await db.user.update({
          where: { id: u.id },
          data: { passwordHash: hashed }
        });
        console.log(`Migrated password for user ${u.email} to secure hash.`);
      }
    }

    // Check if domestic is missing and seed it
    const domesticCat = await db.serviceCategory.findUnique({
      where: { slug: "domestic" }
    });

    if (!domesticCat) {
      console.log("Domestic category missing. Seeding domestic category and offerings...");
      await db.serviceCategory.create({
        data: { slug: "domestic", name: "Domestic Cleaning", vertical: "domestic", pricingModel: "instant", active: true }
      });

      const domesticOfferings = [
        { categorySlug: "domestic", name: "Standard Home Clean", basePriceChf: 80.00, unit: "per_job", description: "Includes bedroom cleaning, living room dusting, floor mopping, kitchen wipe down, and trash emptying." },
        { categorySlug: "domestic", name: "Deep Home Clean", basePriceChf: 140.00, unit: "per_job", description: "Standard clean + carpet cleaning, window interiors, and kitchen deep cleaning." }
      ];

      for (const off of domesticOfferings) {
        await db.serviceOffering.create({
          data: {
            categorySlug: off.categorySlug,
            name: off.name,
            basePriceChf: off.basePriceChf,
            unit: off.unit,
            description: off.description
          }
        });
      }
      console.log("Domestic cleaning seeded successfully.");
    }

    const count = await db.serviceCategory.count();
    if (count > 1) { // 1 if only domestic was just seeded, but normally it should seed everything if completely empty
      console.log("Database already seeded. Categories count:", count);
      return;
    }
    console.log("Database empty. Starting automatic seed...");
    
    // Create categories
    const categories = [
      { slug: "commercial", name: "Commercial Offices", vertical: "commercial", pricingModel: "instant", active: true },
      { slug: "hospitality", name: "Hospitality & Turnovers", vertical: "hospitality", pricingModel: "instant", active: true },
      { slug: "aviation", name: "Aviation Detailing", vertical: "aviation", pricingModel: "quote_on_request", active: true },
      { slug: "yacht", name: "Yacht & Marine Care", vertical: "yacht", pricingModel: "quote_on_request", active: true },
      { slug: "special", name: "Biohazard & Post-Incident", vertical: "special", pricingModel: "quote_on_request", active: true }
    ];

    for (const cat of categories) {
      await db.serviceCategory.create({ data: cat });
    }

    // Create offerings
    const offerings = [
      { categorySlug: "commercial", name: "Standard Office Clean", basePriceChf: 150.00, unit: "per_job", description: "Includes workspace dusting, floor mopping, kitchen wipe down, and trash emptying." },
      { categorySlug: "commercial", name: "Deep Commercial Clean", basePriceChf: 250.00, unit: "per_job", description: "Standard clean + carpet steam clean, window interiors, and disinfection." },
      { categorySlug: "hospitality", name: "Turnover Standard Clean", basePriceChf: 120.00, unit: "per_job", description: "Includes sanitization, bed making, basic restocking, and guest prep." },
      { categorySlug: "hospitality", name: "Linen Service Add-on", basePriceChf: 35.00, unit: "per_job", description: "Professional laundering and swap of bed sheets and towels." }
    ];

    for (const off of offerings) {
      await db.serviceOffering.create({
        data: {
          categorySlug: off.categorySlug,
          name: off.name,
          basePriceChf: off.basePriceChf,
          unit: off.unit,
          description: off.description
        }
      });
    }

    // Create providers
    const provider1 = await db.provider.create({
      data: {
        name: "Alpine Cleaning Services AG",
        slug: "alpine-cleaning-services",
        contactEmail: "contact@alpineclean.ch",
        contactPhone: "+41 44 222 3344",
        address: "Bahnhofstrasse 12, 8001 Zürich",
        legalEntityType: "ag",
        uidNumber: "CHE-123.456.789 MWST",
        bankDetailsVerified: true,
        stripeConnectAccountId: "acct_mock_alpine123",
        stripeConnectStatus: "active",
        onboardingStatus: "active",
        notes: "Reliable provider for high-end commercial and hospitality clients."
      }
    });

    await db.providerTeam.create({
      data: {
        providerId: provider1.id,
        name: "Zürich North Dispatch Team",
        workingHours: JSON.stringify({ mon: ["08:00", "18:00"], tue: ["08:00", "18:00"], wed: ["08:00", "18:00"], thu: ["08:00", "18:00"], fri: ["08:00", "18:00"] }),
        serviceCategories: JSON.stringify(["commercial", "hospitality"]),
        region: "Zürich"
      }
    });

    await db.providerListing.create({
      data: {
        providerId: provider1.id,
        categorySlug: "commercial",
        serviceRadiusKm: 30,
        capacityPerDay: 5,
        leadTimeHours: 12,
        active: true
      }
    });
    await db.providerListing.create({
      data: {
        providerId: provider1.id,
        categorySlug: "hospitality",
        serviceRadiusKm: 30,
        capacityPerDay: 5,
        leadTimeHours: 12,
        active: true
      }
    });

    const provider2 = await db.provider.create({
      data: {
        name: "Lake Zurich Yacht Detailing GmbH",
        slug: "lake-zurich-yacht-detailing",
        contactEmail: "ops@yachtdetail.ch",
        contactPhone: "+41 44 555 6677",
        address: "Seestrasse 144, 8810 Horgen",
        legalEntityType: "gmbh",
        uidNumber: "CHE-987.654.321 MWST",
        bankDetailsVerified: true,
        stripeConnectAccountId: "acct_mock_yacht123",
        stripeConnectStatus: "active",
        onboardingStatus: "active",
        notes: "Specialist team with marina passes for Lake Zurich harbors."
      }
    });

    await db.providerTeam.create({
      data: {
        providerId: provider2.id,
        name: "Marine Team Alpha",
        workingHours: JSON.stringify({ mon: ["07:00", "19:00"], tue: ["07:00", "19:00"], wed: ["07:00", "19:00"], thu: ["07:00", "19:00"], fri: ["07:00", "19:00"], sat: ["08:00", "16:00"] }),
        serviceCategories: JSON.stringify(["yacht"]),
        region: "Zürichsee"
      }
    });

    await db.providerListing.create({
      data: {
        providerId: provider2.id,
        categorySlug: "yacht",
        serviceRadiusKm: 50,
        capacityPerDay: 2,
        leadTimeHours: 24,
        active: true
      }
    });

    // Create applications
    await db.providerApplication.create({
      data: {
        applicantEmail: "partner.apply@quickclean.ch",
        applicantName: "Jean Quick",
        companyName: "QuickClean Romandie Sàrl",
        legalEntityType: "gmbh",
        verticalsRequested: "commercial,hospitality",
        region: "Geneva",
        status: "submitted",
        applicationData: JSON.stringify({
          experienceYears: 5,
          staffCount: 12,
          motivation: "We want to expand our premium portfolio in Lake Geneva region."
        })
      }
    });
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error during checkAndSeedDb:", error);
  }
}
