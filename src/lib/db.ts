import { createRequire } from "module";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// Check if the cached client is outdated (lacks new marketplace models)
if (globalForPrisma.prisma && !globalForPrisma.prisma.providerApplication) {
  console.log("[PRISMA] Schema mismatch detected (missing providerApplication). Invalidating cache...");
  globalForPrisma.prisma = undefined;

  try {
    const require = createRequire(import.meta.url);
    Object.keys(require.cache).forEach((key) => {
      if (key.includes("prisma")) {
        delete require.cache[key];
      }
    });
  } catch (e) {
    console.error("[PRISMA] Failed to clear require cache:", e);
  }
}

let PrismaClientClass;
try {
  const require = createRequire(import.meta.url);
  PrismaClientClass = require("@prisma/client").PrismaClient;
} catch {
  // fallback if createRequire fails in compile context
  const { PrismaClient } = require("@prisma/client");
  PrismaClientClass = PrismaClient;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClientClass({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
