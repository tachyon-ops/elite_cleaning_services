import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-utils";

const prisma = new PrismaClient();

async function main() {
  const email = "provider-test@example.com";

  // Check if provider user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log(`User ${email} already exists.`);
    return;
  }

  // Create dummy Provider
  const provider = await prisma.provider.upsert({
    where: { slug: "alpine-test-services" },
    update: {},
    create: {
      name: "Alpine Test Services",
      slug: "alpine-test-services",
      contactEmail: email,
      contactPhone: "+41 44 999 8877",
      address: "Zürich",
      legalEntityType: "gmbh",
      uidNumber: "CHE-123.456.789 MWST",
      onboardingStatus: "active"
    }
  });

  // Create provider staff user
  const user = await prisma.user.create({
    data: {
      email,
      name: "Test Partner User",
      passwordHash: hashPassword("partner123"),
      role: "provider_staff",
      providerCompanyId: provider.id,
      locale: "en"
    }
  });

  console.log(`Successfully seeded test provider staff user:`);
  console.log(`- Email: ${user.email}`);
  console.log(`- Role: ${user.role}`);
  console.log(`- Temporary Password: partner123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
