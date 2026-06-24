const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, role: u.role, passwordHash: u.passwordHash, twoFactorEnabled: u.twoFactorEnabled })));
  
  const providers = await prisma.provider.findMany();
  console.log("Providers:", providers.map(p => ({ id: p.id, name: p.name, slug: p.slug })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
