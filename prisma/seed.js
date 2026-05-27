const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
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
  await prisma.partnerTeam.deleteMany({});
  await prisma.partner.deleteMany({});
  await prisma.guestEmail.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared.');

  // 1. Create default categories
  const categories = [
    { slug: 'commercial', name: 'Commercial Offices', vertical: 'commercial', pricingModel: 'instant', active: true },
    { slug: 'hospitality', name: 'Hospitality & Turnovers', vertical: 'hospitality', pricingModel: 'instant', active: true },
    { slug: 'aviation', name: 'Aviation Detailing', vertical: 'aviation', pricingModel: 'quote_on_request', active: true },
    { slug: 'yacht', name: 'Yacht & Marine Care', vertical: 'yacht', pricingModel: 'quote_on_request', active: true },
    { slug: 'special', name: 'Biohazard & Post-Incident', vertical: 'special', pricingModel: 'quote_on_request', active: true }
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.create({ data: cat });
  }
  console.log('Service categories created.');

  // 2. Create service offerings
  const offerings = [
    { categorySlug: 'commercial', name: 'Standard Office Clean', basePriceChf: 150.00, unit: 'per_job', description: 'Includes workspace dusting, floor mopping, kitchen wipe down, and trash emptying.' },
    { categorySlug: 'commercial', name: 'Deep Commercial Clean', basePriceChf: 250.00, unit: 'per_job', description: 'Standard clean + carpet steam clean, window interiors, and disinfection.' },
    { categorySlug: 'hospitality', name: 'Turnover Standard Clean', basePriceChf: 120.00, unit: 'per_job', description: 'Includes sanitization, bed making, basic restocking, and guest prep.' },
    { categorySlug: 'hospitality', name: 'Linen Service Add-on', basePriceChf: 35.00, unit: 'per_job', description: 'Professional laundering and swap of bed sheets and towels.' }
  ];

  for (const off of offerings) {
    await prisma.serviceOffering.create({ data: off });
  }
  console.log('Service offerings created.');

  // 3. Create partners & partner teams
  const partner1 = await prisma.partner.create({
    data: {
      name: 'Alpine Cleaning Services AG',
      contactEmail: 'contact@alpineclean.ch',
      contactPhone: '+41 44 222 3344',
      address: 'Bahnhofstrasse 12, 8001 Zürich',
      vatNumber: 'CHE-123.456.789 MWST',
      status: 'active',
      notes: 'Reliable subcontractor for high-end residential and commercial turnovers.'
    }
  });

  const team1 = await prisma.partnerTeam.create({
    data: {
      partnerId: partner1.id,
      name: 'Zürich North Dispatch Team',
      workingHours: JSON.stringify({ mon: ['08:00', '18:00'], tue: ['08:00', '18:00'], wed: ['08:00', '18:00'], thu: ['08:00', '18:00'], fri: ['08:00', '18:00'] }),
      serviceCategories: JSON.stringify(['commercial', 'hospitality']),
      region: 'Zürich'
    }
  });

  const partner2 = await prisma.partner.create({
    data: {
      name: 'Lake Zurich Yacht Detailing GmbH',
      contactEmail: 'ops@yachtdetail.ch',
      contactPhone: '+41 44 555 6677',
      address: 'Seestrasse 144, 8810 Horgen',
      vatNumber: 'CHE-987.654.321 MWST',
      status: 'active',
      notes: 'Specialist team with marina passes for Lake Zurich harbors.'
    }
  });

  const team2 = await prisma.partnerTeam.create({
    data: {
      partnerId: partner2.id,
      name: 'Marine Team Alpha',
      workingHours: JSON.stringify({ mon: ['07:00', '19:00'], tue: ['07:00', '19:00'], wed: ['07:00', '19:00'], thu: ['07:00', '19:00'], fri: ['07:00', '19:00'], sat: ['08:00', '16:00'] }),
      serviceCategories: JSON.stringify(['yacht']),
      region: 'Zürichsee'
    }
  });

  console.log('Partners and teams created.');

  // 4. Create default superadmin
  await prisma.user.create({
    data: {
      email: 'admin@elite-cleaning.ch',
      name: 'Elite Administrator',
      passwordHash: 'admin123', // stored plain for local dev convenience
      role: 'super_admin',
      locale: 'en'
    }
  });
  console.log('Superadmin user created: admin@elite-cleaning.ch / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
