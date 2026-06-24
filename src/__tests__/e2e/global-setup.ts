import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export default async function globalSetup() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const bakPath = path.join(process.cwd(), "prisma", "dev.db.bak");
  const templatePath = path.join(process.cwd(), "prisma", "dev.db.template");

  // 1. Back up existing dev.db if it exists
  if (fs.existsSync(dbPath)) {
    console.log("Backing up existing dev.db...");
    fs.copyFileSync(dbPath, bakPath);
  }



  try {
    console.log("Preparing clean database for E2E tests...");
    // 2. Push schema with force-reset and seed the database
    console.log("Running prisma db push --force-reset...");
    execSync("npx prisma db push --force-reset --skip-generate", { stdio: "inherit" });

    console.log("Seeding test database...");
    execSync("node prisma/seed.js", { stdio: "inherit" });

    // 4. Save the clean seeded database as a template
    fs.copyFileSync(dbPath, templatePath);
    console.log("Clean test template database created successfully.");
  } catch (error) {
    console.error("Failed to set up E2E test database:", error);
    // Restore backup if setup failed
    if (fs.existsSync(bakPath)) {
      console.log("Restoring backup...");
      fs.copyFileSync(bakPath, dbPath);
      fs.unlinkSync(bakPath);
    }
    throw error;
  }
}
