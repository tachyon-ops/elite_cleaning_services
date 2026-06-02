const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const moveout = await prisma.serviceCategory.findUnique({
    where: { slug: 'moveout' }
  });
  console.log('Seeded Category:');
  console.log(JSON.stringify(moveout, null, 2));
}

main().finally(() => prisma.$disconnect());
