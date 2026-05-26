const { Router } = require("express");
const { Webhook } = require("svix");
const db = require("../config/db");

const router = Router();

// POST / — handles Clerk webhook events with signature verification
// Mounted at /api/clerk/webhook in index.js
router.post("/", async (req, res, next) => {
  try {
    const svixId = req.headers["svix-id"];
    const svixTimestamp = req.headers["svix-timestamp"];
    const svixSignature = req.headers["svix-signature"];

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: "Missing svix headers" });
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event;
    try {
      const wh = new Webhook(webhookSecret);
      const body = Buffer.isBuffer(req.body) ? req.body.toString("utf-8") : JSON.stringify(req.body);
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Webhook verification failed:", err.message);
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const { type, data } = event;

    if (type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = data;
      const email = email_addresses?.[0]?.email_address || "";
      const full_name = [first_name, last_name].filter(Boolean).join(" ");

      // Use advisory lock to prevent TOCTOU race on first-admin bootstrap
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext('bootstrap_admin'))");

        const userCount = await client.query("SELECT COUNT(*) FROM users");
        const role = parseInt(userCount.rows[0].count) === 0 ? "admin" : "patient";

        await client.query(
          `INSERT INTO users (clerk_user_id, email, full_name, role, status, avatar_url)
           VALUES ($1, $2, $3, $4, 'active', $5)
           ON CONFLICT (clerk_user_id) DO UPDATE SET avatar_url = $5`,
          [id, email, full_name, role, image_url || null]
        );

        await client.query("COMMIT");
        console.log(`User synced: ${email} (role: ${role}, avatar: ${image_url ? "yes" : "no"})`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    if (type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = data;
      const email = email_addresses?.[0]?.email_address || "";
      const full_name = [first_name, last_name].filter(Boolean).join(" ");

      await db.query(
        `UPDATE users SET email = $2, full_name = $3, avatar_url = $4 WHERE clerk_user_id = $1`,
        [id, email, full_name, image_url || null]
      );

      console.log(`User updated: ${email} (avatar: ${image_url ? "yes" : "no"})`);
    }

    if (type === "user.deleted") {
      const { id } = data;
      // Soft-delete: mark user as deleted, don't cascade destroy
      await db.query("UPDATE users SET deleted_at = NOW() WHERE clerk_user_id = $1", [id]);
      // Audit log
      await db.query(
        "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
        ["soft_delete", "user", id, null, JSON.stringify({ trigger: "clerk_webhook" })]
      );
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
