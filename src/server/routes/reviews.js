const express = require('express');
const { query, one, uid } = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Pubblico: solo recensioni approvate
router.get('/', async (req, res) => {
  const rows = await query('SELECT * FROM reviews WHERE approved = true ORDER BY created_at DESC');
  res.json(rows);
});

// Admin: tutte le recensioni (anche nascoste)
router.get('/all', requireAdmin, async (req, res) => {
  const rows = await query('SELECT * FROM reviews ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', requireAdmin, async (req, res) => {
  const { productId, name, rating, text } = req.body || {};
  if (!productId || !name || !text) return res.status(400).json({ error: 'Campi mancanti' });
  const id = uid('r');
  const row = await one(
    `INSERT INTO reviews (id, product_id, name, rating, text, approved, created_at)
     VALUES ($1,$2,$3,$4,$5,true,$6) RETURNING *`,
    [id, productId, name, parseInt(rating, 10) || 5, text, Date.now()]
  );
  res.status(201).json(row);
});

router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  const row = await one('UPDATE reviews SET approved = NOT approved WHERE id = $1 RETURNING *', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Recensione non trovata' });
  res.json(row);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
