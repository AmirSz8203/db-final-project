# backend/load_data.py

import json
import sqlite3
import os

BASE_DIR    = os.path.dirname(__file__)
DB_PATH     = os.path.join(BASE_DIR, "myshop.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")
JSON_PATH   = os.path.join(BASE_DIR, "products.json")

# 1. Read JSON
with open(JSON_PATH, encoding="utf-8") as f:
    items = json.load(f)

# 2. Connect & create tables
# Delete the old DB file if it exists to ensure a fresh start with the new schema
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
cur  = conn.cursor()
cur.execute("PRAGMA foreign_keys = ON;")
with open(SCHEMA_PATH) as f:
    cur.executescript(f.read())

# 3. Insert data

# First, collect all unique keywords from the data
all_keywords = set()
for item in items:
    for kw in item.get("keywords", []):
        all_keywords.add(kw)

# Populate the keywords table and create a map of keyword_name -> keyword_id for later use
keyword_map = {}
for kw in sorted(list(all_keywords)): # Sort for deterministic IDs
    cur.execute("INSERT INTO keywords (name) VALUES (?)", (kw,))
    keyword_map[kw] = cur.lastrowid

# Now, loop through each product item and insert into the respective tables
for item in items:
    # Insert into products table (without rating info)
    rel_path = item["image"].split("images/")[-1]
    cur.execute("""
      INSERT OR REPLACE INTO products
        (id, name, image_path, price_cents, discount_pct)
      VALUES (?, ?, ?, ?, ?)
    """, (
      item["id"],
      item["name"],
      rel_path,
      item["priceCents"],
      item.get("discountPercent", 0),
    ))

    # Insert the corresponding rating into the ratings table
    cur.execute("""
      INSERT INTO ratings (product_id, stars, count)
      VALUES (?, ?, ?)
    """, (
      item["id"],
      item["rating"]["stars"],
      item["rating"]["count"],
    ))

    # Insert mappings into the product_keyword_map table
    for kw in item.get("keywords", []):
        keyword_id = keyword_map[kw]
        cur.execute("""
          INSERT INTO product_keyword_map (product_id, keyword_id)
          VALUES (?, ?)
        """, (item["id"], keyword_id))

conn.commit()
conn.close()

print("Loaded", len(items), "products into", DB_PATH)
print("Loaded", len(all_keywords), "unique keywords.")
