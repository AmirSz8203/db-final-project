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
