const express = require('express');
const { query, one, uid } = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Pubblico: elenco prodotti attivi
router.get('/', async (req, res) => {
  const rows = await query('SELECT * FROM products WHERE active = true ORDER BY created_at ASC');
  res.json(rows);
});

// Admin: elenco completo (inclusi nascosti)
router.get('/all', requireAdmin, async (req, res) => {
  const rows = await query('SELECT * FROM products ORDER BY created_at ASC');
  res.json(rows);
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, category, price, billing, icon, color, description, active } = req.body || {};
  if (!name || !description) return res.status(400).json({ error: 'Nome e descrizione richiesti' });
  const id = uid('p');
  const row = await one(
    `INSERT INTO products (id, name, category, price, billing, icon, color, description, active, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id, name, category || 'digital', parseFloat(price) || 0, billing || '', icon || '✨', color || 'cyan', description, active !== false, Date.now()]
  );
  res.status(201).json(row);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, category, price, billing, icon, color, description, active } = req.body || {};
  const row = await one(
    `UPDATE products SET name=$1, category=$2, price=$3, billing=$4, icon=$5, color=$6, description=$7, active=$8
     WHERE id=$9 RETURNING *`,
    [name, category, parseFloat(price) || 0, billing || '', icon || '✨', color, description, active !== false, req.params.id]
  );
  if (!row) return res.status(404).json({ error: 'Prodotto non trovato' });
  res.json(row);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
