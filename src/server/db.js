// db.js
// Database PostgreSQL (Neon) — unica fonte di verità per prodotti, ordini,
// recensioni, impostazioni e utenti admin. Tutte le funzioni sono async.

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL non impostata: aggiungila al file .env (vedi .env.example)');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'digital',
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      billing TEXT DEFAULT '',
      icon TEXT DEFAULT '✨',
      color TEXT DEFAULT 'cyan',
      description TEXT DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      text TEXT NOT NULL,
      approved BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      notes TEXT DEFAULT '',
      payment TEXT DEFAULT '',
      items JSONB NOT NULL DEFAULT '[]',
      total NUMERIC(10,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      site_name TEXT NOT NULL DEFAULT 'NEXORA',
      tagline TEXT DEFAULT '',
      hero_subtitle TEXT DEFAULT '',
      primary_color TEXT DEFAULT '#2FD9E8',
      secondary_color TEXT DEFAULT '#E64FD9',
      discord_link TEXT DEFAULT '',
      support_email TEXT DEFAULT '',
      pay_paypal BOOLEAN DEFAULT true,
      pay_card BOOLEAN DEFAULT true,
      pay_crypto BOOLEAN DEFAULT true,
      CONSTRAINT single_row CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL COLLATE "default",
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    ) WITH (OIDS=FALSE);
    ALTER TABLE session DROP CONSTRAINT IF EXISTS session_pkey;
    ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
  `);

  await seedIfEmpty();
  await ensureAdminUser();
}

async function seedIfEmpty() {
  const { count } = await one('SELECT COUNT(*)::int AS count FROM products');
  if (count > 0) return;

  const now = Date.now();
  const products = [
    ['p1', 'Starter Brand Kit', 'digital', 19, '', '🎨', 'cyan', 'Template di brand identity pronti da personalizzare: loghi, palette e mockup social.', now - 9e8],
    ['p2', 'Automation Playbook', 'digital', 29, '', '📘', 'magenta', 'Guida pratica con workflow e checklist per automatizzare i processi ripetitivi.', now - 8e8],
    ['p3', 'Motion Graphics Pack', 'digital', 24, '', '🎬', 'success', 'Oltre 40 elementi animati pronti per progetti video e social.', now - 7e8],
    ['p4', 'Pro Suite License', 'license', 59, '1 anno', '🔑', 'magenta', "Licenza annuale per l'intera suite di strumenti creativi Pro.", now - 6e8],
    ['p5', 'Studio Toolkit License', 'license', 149, 'a vita', '🛠️', 'cyan', 'Accesso a vita al toolkit completo per studi creativi e freelance.', now - 5e8],
    ['p6', 'Community Access', 'subscription', 9, 'mensile', '💬', 'success', 'Accesso alla community privata: canali dedicati, eventi e supporto diretto.', now - 4e8],
    ['p7', 'Insider Tools', 'subscription', 79, 'annuale', '⚙️', 'cyan', 'Set di strumenti e integrazioni riservate agli abbonati annuali.', now - 3e8],
  ];
  for (const p of products) {
    await query(
      `INSERT INTO products (id, name, category, price, billing, icon, color, description, active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9)`,
      p
    );
  }

  const reviews = [
    ['r1', 'p1', 'Marco T.', 5, 'Template puliti e velocissimi da adattare al mio brand. Consigliatissimo.', now - 3e8],
    ['r2', 'p4', 'Giulia R.', 5, "La licenza annuale vale ogni euro speso, supporto rapidissimo.", now - 2e8],
    ['r3', 'p6', 'Davide P.', 4, 'Community molto attiva, utile per chi inizia. Consegna istantanea.', now - 1e8],
    ['r4', 'p3', 'Sara L.', 5, 'Il pack di motion graphics mi ha fatto risparmiare ore di lavoro.', now - 5e7],
  ];
  for (const r of reviews) {
    await query(
      `INSERT INTO reviews (id, product_id, name, rating, text, approved, created_at)
       VALUES ($1,$2,$3,$4,$5,true,$6)`,
      r
    );
  }

  await query(
    `INSERT INTO settings (id, site_name, tagline, hero_subtitle, primary_color, secondary_color, discord_link, support_email, pay_paypal, pay_card, pay_crypto)
     VALUES (1,'NEXORA','Il tuo hub per prodotti digitali, licenze e abbonamenti — tutto in un posto solo.',
     'Sfoglia un catalogo curato di risorse digitali, licenze software e abbonamenti, con consegna immediata e assistenza reale.',
     '#2FD9E8','#E64FD9','https://discord.com','supporto@nexora.store', true, true, true)
     ON CONFLICT (id) DO NOTHING`
  );
}

async function ensureAdminUser() {
  const existing = await one('SELECT id FROM admin_users ORDER BY id LIMIT 1');
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'nexora2026';

  if (existing) {
    // L'admin viene creato solo al primo avvio: cambiare ADMIN_PASSWORD nel .env dopo non ha effetto.
    // Con ADMIN_RESET=true nel .env, al prossimo avvio username e password vengono riallineati al .env.
    if (process.env.ADMIN_RESET === 'true') {
      const newHash = await bcrypt.hash(password, 10);
      await query('UPDATE admin_users SET username = $1, password_hash = $2 WHERE id = $3', [username, newHash, existing.id]);
      console.log(`[db] Credenziali admin riallineate al .env (username: ${username}). Rimuovi ADMIN_RESET dal .env.`);
    }
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await query(
    'INSERT INTO admin_users (username, password_hash, created_at) VALUES ($1,$2,$3)',
    [username, hash, Date.now()]
  );
  console.log(`[db] Utente admin creato: ${username} (imposta ADMIN_PASSWORD nel .env per cambiare la password iniziale)`);
}

module.exports = { pool, query, one, uid, initDb };
