const express = require('express');
const { one, query } = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

function toClient(row) {
  return {
    siteName: row.site_name,
    tagline: row.tagline,
    heroSubtitle: row.hero_subtitle,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    discordLink: row.discord_link,
    supportEmail: row.support_email,
    payPaypal: row.pay_paypal,
    payCard: row.pay_card,
    payCrypto: row.pay_crypto,
  };
}

router.get('/', async (req, res) => {
  const row = await one('SELECT * FROM settings WHERE id = 1');
  res.json(toClient(row));
});

router.put('/', requireAdmin, async (req, res) => {
  const b = req.body || {};
  const row = await one(
    `UPDATE settings SET
      site_name=$1, tagline=$2, hero_subtitle=$3, primary_color=$4, secondary_color=$5,
      discord_link=$6, support_email=$7, pay_paypal=$8, pay_card=$9, pay_crypto=$10
     WHERE id = 1 RETURNING *`,
    [
      (b.siteName || 'NEXORA').trim(),
      (b.tagline || '').trim(),
      (b.heroSubtitle || '').trim(),
      b.primaryColor || '#2FD9E8',
      b.secondaryColor || '#E64FD9',
      (b.discordLink || '').trim(),
      (b.supportEmail || '').trim(),
      !!b.payPaypal,
      !!b.payCard,
      !!b.payCrypto,
    ]
  );
  res.json(toClient(row));
});

module.exports = router;
