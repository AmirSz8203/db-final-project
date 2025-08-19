-- backend/schema.sql

CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  image_path   TEXT,
  price_cents  INTEGER NOT NULL,
  discount_pct INTEGER,
  rating_stars INTEGER,
  rating_count INTEGER
);

CREATE TABLE IF NOT EXISTS product_keywords (
  product_id TEXT
    REFERENCES products(id) ON DELETE CASCADE,
  keyword    TEXT,
  PRIMARY KEY (product_id, keyword)
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_price_cents INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  delivery_option_id TEXT NOT NULL
);
