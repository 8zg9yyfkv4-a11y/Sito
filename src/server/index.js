require('dotenv').config();
require('./asyncPatch'); // inoltra all'error handler gli errori delle route async (Express 4 non lo fa da solo)
const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { pool, initDb } = require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');
const orderRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Dietro un proxy HTTPS (Render, Railway, Heroku, Fly, Cloudflare...) Express deve fidarsi
// dell'header X-Forwarded-Proto, altrimenti pensa di essere in HTTP e la cookie di sessione
// "secure" non viene mai impostata: il login sembra riuscire ma la sessione non si salva.
app.set('trust proxy', 1);

app.use(express.json());
app.use(
  session({
    store: new pgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      // 'auto' = cookie secure solo se la connessione è davvero HTTPS.
      // Funziona sia in locale (http://localhost) sia online, anche con NODE_ENV=production.
      secure: 'auto',
      sameSite: 'lax',
    },
  })
);

// API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// Frontend statico (SPA con routing lato client via hash)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler generico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno del server' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[nexora] server avviato su http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[nexora] errore di avvio, impossibile inizializzare il database:', err);
    process.exit(1);
  });
