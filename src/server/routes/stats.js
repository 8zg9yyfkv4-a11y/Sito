const express = require('express');
const { one } = require('../db');

const router = express.Router();

// Pubblico: numeri usati nella homepage (prodotti attivi, ordini, rating medio)
router.get('/', async (req, res) => {
  const products = await one("SELECT COUNT(*)::int AS count FROM products WHERE active = true");
  const orders = await one('SELECT COUNT(*)::int AS count FROM orders');
  const rating = await one('SELECT AVG(rating)::float AS avg FROM reviews WHERE approved = true');
  res.json({
    activeProducts: products.count,
    totalOrders: orders.count,
    avgRating: rating.avg ? Number(rating.avg.toFixed(1)) : null,
  });
});

module.exports = router;
