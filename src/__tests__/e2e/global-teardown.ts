import fs from "fs";
import path from "path";

export default async function globalTeardown() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const bakPath = path.join(process.cwd(), "prisma", "dev.db.bak");
  const templatePath = path.join(process.cwd(), "prisma", "dev.db.template");

  console.log("Cleaning up E2E test database templates...");
  
  if (fs.existsSync(templatePath)) {
    fs.unlinkSync(templatePath);
  }

  // Restore the backed-up database
  if (fs.existsSync(bakPath)) {
    console.log("Restoring original dev.db...");
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    // Remove any WAL files from tests
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    fs.copyFileSync(bakPath, dbPath);
    fs.unlinkSync(bakPath);
  }
}
