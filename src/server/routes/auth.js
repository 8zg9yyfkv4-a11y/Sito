const express = require('express');
const bcrypt = require('bcryptjs');
const { one, query } = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username e password richiesti' });

  const user = await one('SELECT * FROM admin_users WHERE username = $1', [username]);
  if (!user) return res.status(401).json({ error: 'Credenziali non valide' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenziali non valide' });

  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  res.json({ ok: true, username: user.username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ authenticated: true, username: req.session.adminUsername });
  }
  res.json({ authenticated: false });
});

router.post('/change-password', async (req, res) => {
  if (!req.session || !req.session.adminId) return res.status(401).json({ error: 'Non autenticato' });
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'La nuova password deve avere almeno 6 caratteri' });
  }
  const user = await one('SELECT * FROM admin_users WHERE id = $1', [req.session.adminId]);
  const ok = await bcrypt.compare(currentPassword || '', user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Password attuale errata' });

  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
  res.json({ ok: true });
});

module.exports = router;
