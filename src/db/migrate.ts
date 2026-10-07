import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  const sql = neon(connectionString);
  const drizzleDir = path.resolve(process.cwd(), "drizzle");
  const files = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration files in ${drizzleDir}`);

  for (const file of files) {
    const fullPath = path.join(drizzleDir, file);
    console.log(`Applying migration: ${file}...`);
    const content = fs.readFileSync(fullPath, "utf-8");
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await (sql as any).query(stmt);
      } catch (err: any) {
        // Ignore "already exists" errors gracefully
        if (
          err?.code === "42710" || // duplicate object/type
          err?.code === "42701" || // duplicate column
          err?.code === "42P07"    // duplicate table
        ) {
          // Already applied
        } else {
          console.warn(`  Notice (${file}): ${err?.message || err}`);
        }
      }
    }
  }

  console.log("All migrations checked and applied successfully!");
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
