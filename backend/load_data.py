# backend/load_data.py

import json
import sqlite3
import os

BASE_DIR    = os.path.dirname(__file__)
DB_PATH     = os.path.join(BASE_DIR, "myshop.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")
JSON_PATH   = os.path.join(BASE_DIR, "products.json")   # now here

# 1. Read JSON
with open(JSON_PATH, encoding="utf-8") as f:
    items = json.load(f)

# 2. Connect & create tables
conn = sqlite3.connect(DB_PATH)
cur  = conn.cursor()
cur.executescript(open(SCHEMA_PATH).read())

# 3. Insert data
for item in items:
    # store relative path under /images/
    rel_path = item["image"].split("images/")[-1]

    cur.execute("""
      INSERT OR REPLACE INTO products
        (id, name, image_path, price_cents, discount_pct, rating_stars, rating_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
      item["id"],
      item["name"],
      rel_path,
      item["priceCents"],
      item.get("discountPercent", 0),
      item["rating"]["stars"],
      item["rating"]["count"],
    ))

    for kw in item.get("keywords", []):
        cur.execute("""
          INSERT OR IGNORE INTO product_keywords (product_id, keyword)
          VALUES (?, ?)
        """, (item["id"], kw))

conn.commit()
conn.close()

print("Loaded", len(items), "products into", DB_PATH)
