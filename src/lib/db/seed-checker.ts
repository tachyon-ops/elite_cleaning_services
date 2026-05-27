import { db } from "@/lib/db";

export async function checkAndSeedDb() {
  try {
    const count = await db.serviceCategory.count();
    if (count > 0) {
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

    // Create partners
    const partner1 = await db.partner.create({
      data: {
        name: "Alpine Cleaning Services AG",
        contactEmail: "contact@alpineclean.ch",
        contactPhone: "+41 44 222 3344",
        address: "Bahnhofstrasse 12, 8001 Zürich",
        vatNumber: "CHE-123.456.789 MWST",
        status: "active",
        notes: "Reliable subcontractor for high-end residential and commercial turnovers."
      }
    });

    await db.partnerTeam.create({
      data: {
        partnerId: partner1.id,
        name: "Zürich North Dispatch Team",
        workingHours: JSON.stringify({ mon: ["08:00", "18:00"], tue: ["08:00", "18:00"], wed: ["08:00", "18:00"], thu: ["08:00", "18:00"], fri: ["08:00", "18:00"] }),
        serviceCategories: JSON.stringify(["commercial", "hospitality"]),
        region: "Zürich"
      }
    });

    const partner2 = await db.partner.create({
      data: {
        name: "Lake Zurich Yacht Detailing GmbH",
        contactEmail: "ops@yachtdetail.ch",
        contactPhone: "+41 44 555 6677",
        address: "Seestrasse 144, 8810 Horgen",
        vatNumber: "CHE-987.654.321 MWST",
        status: "active",
        notes: "Specialist team with marina passes for Lake Zurich harbors."
      }
    });

    await db.partnerTeam.create({
      data: {
        partnerId: partner2.id,
        name: "Marine Team Alpha",
        workingHours: JSON.stringify({ mon: ["07:00", "19:00"], tue: ["07:00", "19:00"], wed: ["07:00", "19:00"], thu: ["07:00", "19:00"], fri: ["07:00", "19:00"], sat: ["08:00", "16:00"] }),
        serviceCategories: JSON.stringify(["yacht"]),
        region: "Zürichsee"
      }
    });

    // Create superadmin
    await db.user.create({
      data: {
        email: "admin@elite-cleaning.ch",
        name: "Elite Administrator",
        passwordHash: "admin123",
        role: "super_admin",
        locale: "en"
      }
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error during checkAndSeedDb:", error);
  }
}
