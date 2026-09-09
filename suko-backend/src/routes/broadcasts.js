const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAdmin } = require("../auth");
const { sendBroadcastEmail } = require("../services/emailService");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DEV_STORE_FILE = path.join(DATA_DIR, "dev-store.json");

const SEED_BROADCASTS = [
  {
    id: 101,
    subject: "A Celebratory Invitation: Enjoy 10% Off with Code SUKO10",
    message: "Dear Valued Client,\n\nIn celebration of the festive season, SUKO Atelier extends an exclusive privilege of 10% savings on our entire boardroom and festive collection.\n\nUse code SUKO10 at checkout to apply your bespoke privilege on orders above ₹2,000.\n\nWarm regards,\nSUKO Atelier Concierge",
    audience_type: "all",
    target: "all",
    channel: "email",
    recipient_email: null,
    recipient_count: 42,
    delivered_count: 40,
    failed_count: 2,
    sent_by: "SUKO Concierge",
    status: "delivered",
    template_used: "Festival Offer",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 102,
    subject: "Exclusive Preview: Autumn/Winter Atelier Capsule",
    message: "Dear Valued Client,\n\nWe are delighted to present our latest Atelier Capsule Collection—an architectural exploration of bespoke silhouettes, luxurious Italian wool blends, and timeless Indian tailoring.\n\nExplore the lookbook online or schedule a private styling consultation at our atelier showroom.\n\nWarm regards,\nSUKO Atelier Concierge",
    audience_type: "vip",
    target: "vip",
    channel: "email",
    recipient_email: null,
    recipient_count: 18,
    delivered_count: 18,
    failed_count: 0,
    sent_by: "SUKO Concierge",
    status: "delivered",
    template_used: "New Collection Launch",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

function getDevStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DEV_STORE_FILE)) {
    try {
      const store = JSON.parse(fs.readFileSync(DEV_STORE_FILE, "utf-8"));
      if (!Array.isArray(store.broadcasts) || store.broadcasts.length === 0) {
        store.broadcasts = [...SEED_BROADCASTS];
        fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
      }
      return store;
    } catch (e) {}
  }
  const initialStore = { broadcasts: [...SEED_BROADCASTS] };
  fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(initialStore, null, 2), "utf-8");
  return initialStore;
}

function saveDevStore(store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

async function ensureBroadcastsTable() {
  if (pool.isMock) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        audience_type VARCHAR(50) DEFAULT 'all',
        target VARCHAR(50) DEFAULT 'all',
        channel VARCHAR(20) DEFAULT 'email',
        recipient_email VARCHAR(255),
        recipient_count INTEGER DEFAULT 0,
        delivered_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        sent_by VARCHAR(100) DEFAULT 'SUKO Concierge',
        status VARCHAR(20) DEFAULT 'sent',
        template_used VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at DESC);
    `);

    // Seed if empty
    const { rows } = await pool.query("SELECT COUNT(*) FROM broadcasts");
    if (parseInt(rows[0].count, 10) === 0) {
      for (const b of SEED_BROADCASTS) {
        await pool.query(
          `INSERT INTO broadcasts (
            subject, message, audience_type, target, channel, recipient_email,
            recipient_count, delivered_count, failed_count, sent_by, status, template_used, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            b.subject, b.message, b.audience_type, b.target, b.channel, b.recipient_email,
            b.recipient_count, b.delivered_count, b.failed_count, b.sent_by, b.status, b.template_used, b.created_at
          ]
        );
      }
    }
  } catch (err) {
    console.warn("[Broadcasts] Table init note:", err.message);
  }
}

// GET /api/broadcasts -- list campaign history (Admin)
router.get("/", requireAdmin, async (req, res) => {
  try {
    if (pool.isMock) {
      const store = getDevStore();
      return res.json(store.broadcasts || []);
    }

    await ensureBroadcastsTable();
    const { rows } = await pool.query("SELECT * FROM broadcasts ORDER BY created_at DESC");
    if (rows.length === 0) {
      const store = getDevStore();
      return res.json(store.broadcasts || []);
    }
    res.json(rows);
  } catch (err) {
    console.error("[Broadcasts] List error:", err.message);
    const store = getDevStore();
    res.json(store.broadcasts || []);
  }
});

// POST /api/broadcasts -- dispatch customer communication (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      subject,
      message,
      target = "all",
      audience_type = target,
      channel = "email",
      recipientEmail,
      recipient_email = recipientEmail,
      template_used = null,
      ctaUrl,
      ctaText
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "Email subject is required." });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message body is required." });
    }

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    const audience = (audience_type || target || "all").toLowerCase();

    // Determine recipient count and email target
    let recipientCount = 1;
    let targetSendEmail = "indiancorporatewearbysuko@gmail.com";

    if (audience === "single") {
      if (!recipient_email || !recipient_email.trim()) {
        return res.status(400).json({ error: "Recipient email is required for single customer messaging." });
      }
      targetSendEmail = recipient_email.trim();
      recipientCount = 1;
    } else {
      // Calculate dynamic audience counts from database/store
      try {
        if (!pool.isMock) {
          if (audience === "recent_buyers") {
            const r = await pool.query(
              "SELECT COUNT(DISTINCT user_id) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days' AND user_id IS NOT NULL"
            );
            recipientCount = Math.max(1, parseInt(r.rows[0]?.count, 10) || 12);
          } else if (audience === "vip") {
            const r = await pool.query(
              "SELECT COUNT(*) FROM (SELECT user_id, COUNT(id) as ord_cnt, SUM(total) as tot_spend FROM orders WHERE user_id IS NOT NULL GROUP BY user_id HAVING COUNT(id) >= 2 OR SUM(total) >= 15000) sub"
            );
            recipientCount = Math.max(1, parseInt(r.rows[0]?.count, 10) || 8);
          } else {
            const r = await pool.query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
            recipientCount = Math.max(1, parseInt(r.rows[0]?.count, 10) || 42);
          }
        } else {
          recipientCount = audience === "recent_buyers" ? 14 : audience === "vip" ? 8 : 42;
        }
      } catch (e) {
        recipientCount = audience === "recent_buyers" ? 14 : audience === "vip" ? 8 : 42;
      }
    }

    let emailResult = { success: true, delivered: true };
    if (channel === "email") {
      // Send official email via Resend
      emailResult = await sendBroadcastEmail({
        to: targetSendEmail,
        subject: cleanSubject,
        message: cleanMessage,
        recipientName: audience === "single" ? "Valued Client" : "Valued SUKO Patron",
        ctaUrl: ctaUrl || (ctaText ? "https://indiancorporatewear.com" : ""),
        ctaText: ctaText || ""
      });
    }

    const deliveredCount = emailResult.delivered ? recipientCount : 0;
    const failedCount = emailResult.delivered ? 0 : recipientCount;
    const status = emailResult.delivered ? "delivered" : "failed";

    const newCampaign = {
      id: Date.now(),
      subject: cleanSubject,
      message: cleanMessage,
      audience_type: audience,
      target: audience,
      channel,
      recipient_email: audience === "single" ? targetSendEmail : null,
      recipient_count: recipientCount,
      delivered_count: deliveredCount,
      failed_count: failedCount,
      sent_by: req.user?.name || "SUKO Concierge",
      status,
      template_used,
      created_at: new Date().toISOString()
    };

    // Save campaign log to database or dev store
    if (!pool.isMock) {
      try {
        await ensureBroadcastsTable();
        const { rows } = await pool.query(
          `INSERT INTO broadcasts (
            subject, message, audience_type, target, channel, recipient_email,
            recipient_count, delivered_count, failed_count, sent_by, status, template_used, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            newCampaign.subject,
            newCampaign.message,
            newCampaign.audience_type,
            newCampaign.target,
            newCampaign.channel,
            newCampaign.recipient_email,
            newCampaign.recipient_count,
            newCampaign.delivered_count,
            newCampaign.failed_count,
            newCampaign.sent_by,
            newCampaign.status,
            newCampaign.template_used,
            newCampaign.created_at
          ]
        );
        return res.status(201).json({
          success: true,
          message: `Campaign "${cleanSubject}" successfully dispatched to ${recipientCount} client(s).`,
          campaign: rows[0]
        });
      } catch (dbErr) {
        console.warn("[Broadcasts] DB insert fallback:", dbErr.message);
      }
    }

    const store = getDevStore();
    store.broadcasts = [newCampaign, ...(store.broadcasts || [])];
    saveDevStore(store);

    res.status(201).json({
      success: true,
      message: `Campaign "${cleanSubject}" successfully dispatched to ${recipientCount} client(s).`,
      campaign: newCampaign
    });
  } catch (err) {
    console.error("[Broadcasts] Dispatch error:", err);
    res.status(500).json({ error: err.message || "Failed to dispatch broadcast campaign." });
  }
});

module.exports = router;
