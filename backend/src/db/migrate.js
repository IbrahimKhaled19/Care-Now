require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function migrate() {
  const migrationDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql")).sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    process.exit(0);
  }

  // Create migrations tracking table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  const applied = await pool.query("SELECT name FROM _migrations");
  const appliedSet = new Set(applied.rows.map(r => r.name));

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`Skipping (already applied): ${file}`);
      continue;
    }

    const filePath = path.join(migrationDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`Running migration: ${file}`);
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      console.log(`  Done: ${file}`);
    } catch (err) {
      console.error(`  Failed: ${file}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  await pool.end();
  console.log("All migrations complete.");
}

migrate();
