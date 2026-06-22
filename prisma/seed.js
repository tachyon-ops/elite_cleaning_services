const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.HOME === '/home/editor';
  if (isProduction) {
    console.log('Production environment detected. Seeding is disabled to protect existing data.');
    return;
  }

  // Clear existing data
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
  await prisma.booking.deleteMany({});
  await prisma.serviceOffering.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  await prisma.providerTeam.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.guestEmail.deleteMany({});
  await prisma.jobOccurrence.deleteMany({});
  await prisma.serviceContract.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared.');

  // 1. Create default categories
  const categories = [
    { slug: 'domestic', name: 'Domestic Cleaning', vertical: 'domestic', pricingModel: 'instant', active: true },
    { slug: 'commercial', name: 'Commercial Offices', vertical: 'commercial', pricingModel: 'instant', active: true },
    { slug: 'hospitality', name: 'Hospitality & Turnovers', vertical: 'hospitality', pricingModel: 'instant', active: true },
    { slug: 'aviation', name: 'Aviation Detailing', vertical: 'aviation', pricingModel: 'quote_on_request', active: true },
    { slug: 'yacht', name: 'Yacht & Marine Care', vertical: 'yacht', pricingModel: 'quote_on_request', active: true },
    { slug: 'special', name: 'Biohazard & Post-Incident', vertical: 'special', pricingModel: 'quote_on_request', active: true },
    { slug: 'moveout', name: 'Move-Out & End Clean', vertical: 'moveout', pricingModel: 'quote_on_request', active: true },
    { slug: 'building-care', name: 'Building Care', vertical: 'building-care', pricingModel: 'quote_on_request', active: true },
    { slug: 'restaurant', name: 'Restaurant & Kitchen', vertical: 'restaurant', pricingModel: 'quote_on_request', active: true }
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.create({ data: cat });
  }
  console.log('Service categories created.');

  // 2. Create service offerings
  const offerings = [
    { categorySlug: 'domestic', name: 'Standard Home Clean', basePriceChf: 80.00, unit: 'per_job', description: 'Includes bedroom cleaning, living room dusting, floor mopping, kitchen wipe down, and trash emptying.' },
    { categorySlug: 'domestic', name: 'Deep Home Clean', basePriceChf: 140.00, unit: 'per_job', description: 'Standard clean + carpet cleaning, window interiors, and kitchen deep cleaning.' },
    { categorySlug: 'commercial', name: 'Standard Office Clean', basePriceChf: 150.00, unit: 'per_job', description: 'Includes workspace dusting, floor mopping, kitchen wipe down, and trash emptying.' },
    { categorySlug: 'commercial', name: 'Deep Commercial Clean', basePriceChf: 250.00, unit: 'per_job', description: 'Standard clean + carpet steam clean, window interiors, and disinfection.' },
    { categorySlug: 'hospitality', name: 'Turnover Standard Clean', basePriceChf: 120.00, unit: 'per_job', description: 'Includes sanitization, bed making, basic restocking, and guest prep.' },
    { categorySlug: 'hospitality', name: 'Linen Service Add-on', basePriceChf: 35.00, unit: 'per_job', description: 'Professional laundering and swap of bed sheets and towels.' }
  ];

  for (const off of offerings) {
    await prisma.serviceOffering.create({ data: off });
  }
  console.log('Service offerings created.');

  // 3. Create providers & teams
  const provider1 = await prisma.provider.create({
    data: {
      name: 'Alpine Cleaning Services AG',
      slug: 'alpine-cleaning-services',
      contactEmail: 'contact@alpineclean.ch',
      contactPhone: '+41 44 222 3344',
      address: 'Bahnhofstrasse 12, 8001 Zürich',
      legalEntityType: 'ag',
      uidNumber: 'CHE-123.456.789 MWST',
      bankDetailsVerified: true,
      stripeConnectAccountId: 'acct_mock_alpine123',
      stripeConnectStatus: 'active',
      onboardingStatus: 'active',
      notes: 'Reliable provider for high-end commercial and hospitality clients.'
    }
  });

  const team1 = await prisma.providerTeam.create({
    data: {
      providerId: provider1.id,
      name: 'Zürich North Dispatch Team',
      workingHours: JSON.stringify({ mon: ['08:00', '18:00'], tue: ['08:00', '18:00'], wed: ['08:00', '18:00'], thu: ['08:00', '18:00'], fri: ['08:00', '18:00'] }),
      serviceCategories: JSON.stringify(['commercial', 'hospitality']),
      region: 'Zürich'
    }
  });

  // Create listings for provider 1
  await prisma.providerListing.create({
    data: {
      providerId: provider1.id,
      categorySlug: 'commercial',
      serviceRadiusKm: 30,
      capacityPerDay: 5,
      leadTimeHours: 12,
      active: true
    }
  });
  await prisma.providerListing.create({
    data: {
      providerId: provider1.id,
      categorySlug: 'hospitality',
      serviceRadiusKm: 30,
      capacityPerDay: 5,
      leadTimeHours: 12,
      active: true
    }
  });

  const provider2 = await prisma.provider.create({
    data: {
      name: 'Lake Zurich Yacht Detailing GmbH',
      slug: 'lake-zurich-yacht-detailing',
      contactEmail: 'ops@yachtdetail.ch',
      contactPhone: '+41 44 555 6677',
      address: 'Seestrasse 144, 8810 Horgen',
      legalEntityType: 'gmbh',
      uidNumber: 'CHE-987.654.321 MWST',
      bankDetailsVerified: true,
      stripeConnectAccountId: 'acct_mock_yacht123',
      stripeConnectStatus: 'active',
      onboardingStatus: 'active',
      notes: 'Specialist team with marina passes for Lake Zurich harbors.'
    }
  });

  const team2 = await prisma.providerTeam.create({
    data: {
      providerId: provider2.id,
      name: 'Marine Team Alpha',
      workingHours: JSON.stringify({ mon: ['07:00', '19:00'], tue: ['07:00', '19:00'], wed: ['07:00', '19:00'], thu: ['07:00', '19:00'], fri: ['07:00', '19:00'], sat: ['08:00', '16:00'] }),
      serviceCategories: JSON.stringify(['yacht']),
      region: 'Zürichsee'
    }
  });

  await prisma.providerListing.create({
    data: {
      providerId: provider2.id,
      categorySlug: 'yacht',
      serviceRadiusKm: 50,
      capacityPerDay: 2,
      leadTimeHours: 24,
      active: true
    }
  });

  console.log('Providers, listings and teams created.');

  // 4. Create sample provider applications
  await prisma.providerApplication.create({
    data: {
      applicantEmail: 'partner.apply@quickclean.ch',
      applicantName: 'Jean Quick',
      companyName: 'QuickClean Romandie Sàrl',
      legalEntityType: 'gmbh',
      verticalsRequested: 'commercial,hospitality',
      region: 'Geneva',
      status: 'submitted',
      applicationData: JSON.stringify({
        experienceYears: 5,
        staffCount: 12,
        motivation: 'We want to expand our premium portfolio in Lake Geneva region.'
      })
    }
  });

  await prisma.providerApplication.create({
    data: {
      applicantEmail: 'info@swissaviationcleaners.ch',
      applicantName: 'Fritz Flieger',
      companyName: 'Swiss Aviation Cleaners AG',
      legalEntityType: 'ag',
      verticalsRequested: 'aviation',
      region: 'Zürich Airport',
      status: 'under_review',
      applicationData: JSON.stringify({
        experienceYears: 10,
        staffCount: 8,
        motivation: 'Already doing hangar cleaning, want to handle light business aircraft.'
      })
    }
  });

  console.log('Provider applications seeded.');

  // 5. Create default superadmin
  await prisma.user.create({
    data: {
      email: 'admin@elite-cleaning.ch',
      name: 'Elite Administrator',
      passwordHash: 'admin123', // plain for dev convenience
      role: 'super_admin',
      locale: 'en'
    }
  });

  // Create default provider staff login to ease testing
  await prisma.user.create({
    data: {
      email: 'partner@alpineclean.ch',
      name: 'Alpine Manager',
      passwordHash: 'partner123',
      role: 'provider_staff',
      providerCompanyId: provider1.id,
      locale: 'en'
    }
  });

  console.log('Users created: admin@elite-cleaning.ch (admin123), partner@alpineclean.ch (partner123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
