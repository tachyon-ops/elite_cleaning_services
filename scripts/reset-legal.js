const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const keys = ['privacy', 'terms', 'cookies', 'provider-terms', 'impressum'];
  console.log(`Starting reset of legal pages in the database: ${keys.join(', ')}`);
  
  const result = await prisma.page.deleteMany({
    where: {
      key: {
        in: keys
      }
    }
  });
  
  console.log(`Successfully deleted ${result.count} page records (and cascading translations).`);
}

main()
  .catch((e) => {
    console.error("Error resetting legal pages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
