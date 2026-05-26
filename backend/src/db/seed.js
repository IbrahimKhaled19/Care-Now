require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function seed() {
  const seedFile = path.join(__dirname, "seed.sql");

  if (!fs.existsSync(seedFile)) {
    console.log("No seed.sql found.");
    process.exit(0);
  }

  const sql = fs.readFileSync(seedFile, "utf-8");
  console.log("Running seed data...");

  try {
    await pool.query(sql);
    console.log("Seed data loaded successfully.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }

  await pool.end();
}

seed();
