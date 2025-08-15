# backend/api.py

from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
import sqlite3, os

BASE_DIR = os.path.dirname(__file__)
DB_PATH  = os.path.join(BASE_DIR, "myshop.db")
IM_DIR   = os.path.join(BASE_DIR, "..", "images")

app = FastAPI()
app.mount("/images", StaticFiles(directory=IM_DIR), name="images")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

@app.get("/products")
def list_products(skip: int = 0, limit: int = 20, db=Depends(get_db)):
    rows = db.execute(
        "SELECT * FROM products ORDER BY id LIMIT ? OFFSET ?", (limit, skip)
    ).fetchall()
    out = []
    for r in rows:
        kws = [k["keyword"] for k in db.execute(
            "SELECT keyword FROM product_keywords WHERE product_id = ?", (r["id"],)
        ).fetchall()]
        out.append({
          "id": r["id"],
          "name": r["name"],
          "image": f"/images/{r['image_path']}",
          "priceCents": r["price_cents"],
          "discountPercent": r["discount_pct"],
          "rating": {"stars": r["rating_stars"], "count": r["rating_count"]},
          "keywords": kws
        })
    return out

@app.get("/products/{pid}")
def get_product(pid: str, db=Depends(get_db)):
    r = db.execute(
        "SELECT * FROM products WHERE id = ?", (pid,)
    ).fetchone()
    if not r:
        raise HTTPException(404, "Not found")
    kws = [k["keyword"] for k in db.execute(
        "SELECT keyword FROM product_keywords WHERE product_id = ?", (pid,)
    ).fetchall()]
    return {
      "id": r["id"],
      "name": r["name"],
      "image": f"/images/{r['image_path']}",
      "priceCents": r["price_cents"],
      "discountPercent": r["discount_pct"],
      "rating": {"stars": r["rating_stars"], "count": r["rating_count"]},
      "keywords": kws
    }
