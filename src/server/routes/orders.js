const express = require('express');
const { query, one, uid } = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Pubblico: crea un ordine a partire dal carrello (validato lato server sui prezzi reali)
router.post('/', async (req, res) => {
  const { name, email, notes, payment, items } = req.body || {};
  if (!name || !email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Dati ordine incompleti' });
  }

  const ids = items.map((i) => i.id);
  const products = await query('SELECT * FROM products WHERE id = ANY($1) AND active = true', [ids]);

  const lineItems = [];
  let total = 0;
  for (const item of items) {
    const p = products.find((x) => x.id === item.id);
    if (!p) continue;
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    const price = parseFloat(p.price);
    total += price * qty;
    lineItems.push({ id: p.id, name: p.name, price, qty });
  }
  if (!lineItems.length) return res.status(400).json({ error: 'Nessun prodotto valido nel carrello' });

  const id = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  const row = await one(
    `INSERT INTO orders (id, name, email, notes, payment, items, total, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8) RETURNING *`,
    [id, name, email, notes || '', payment || 'PayPal', JSON.stringify(lineItems), total, Date.now()]
  );
  res.status(201).json(row);
});

router.get('/:id', async (req, res) => {
  const row = await one('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Ordine non trovato' });
  res.json(row);
});

// Admin: elenco e gestione stato
router.get('/', requireAdmin, async (req, res) => {
  const rows = await query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(rows);
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pending', 'paid', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Stato non valido' });
  const row = await one('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
  if (!row) return res.status(404).json({ error: 'Ordine non trovato' });
  res.json(row);
});

module.exports = router;
