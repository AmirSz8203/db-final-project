# backend/api.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import sqlite3
import os

# --- Configuration ---
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "myshop.db")
IM_DIR = os.path.join(BASE_DIR, "..", "images")
SECRET_KEY = "a_very_secret_key"  # In a real app, use a more secure key and load from environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- FastAPI App Initialization ---
app = FastAPI()

origins = [
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "null",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory=IM_DIR), name="images")

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Database Connection ---
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# --- Pydantic Models ---
class User(BaseModel):
    username: str
    email: str
    model_config = ConfigDict(extra="ignore")

class UserInDB(User):
    password_hash: str

class UserCreate(User):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class OrderItem(BaseModel):
    product_id: str
    quantity: int
    price_cents: int

class OrderCreate(BaseModel):
    items: list[OrderItem]

# --- JWT Authentication ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(db: sqlite3.Connection, username: str):
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if user:
        return UserInDB(**user)
    return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: sqlite3.Connection = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# --- API Endpoints ---

@app.post("/signup", response_model=User)
def signup(user: UserCreate, db: sqlite3.Connection = Depends(get_db)):
    # Check if user already exists
    db_user = db.execute("SELECT * FROM users WHERE username = ? OR email = ?", (user.username, user.email)).fetchone()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    password_hash = pwd_context.hash(user.password)
    db.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (user.username, user.email, password_hash)
    )
    db.commit()
    return User(username=user.username, email=user.email)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: sqlite3.Connection = Depends(get_db)):
    user = get_user(db, form_data.username)
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/orders")
def create_order(order: OrderCreate, current_user: User = Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    user_id = db.execute("SELECT id FROM users WHERE username = ?", (current_user.username,)).fetchone()["id"]
    total_price_cents = sum(item.quantity * item.price_cents for item in order.items)

    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO orders (user_id, total_price_cents) VALUES (?, ?)",
        (user_id, total_price_cents)
    )
    order_id = cursor.lastrowid

    for item in order.items:
        cursor.execute(
            "INSERT INTO order_items (order_id, product_id, quantity, price_cents) VALUES (?, ?, ?, ?)",
            (order_id, item.product_id, item.quantity, item.price_cents)
        )

    db.commit()
    return {"order_id": order_id, "status": "Order created successfully"}

@app.get("/orders")
def get_orders(current_user: User = Depends(get_current_user), db: sqlite3.Connection = Depends(get_db)):
    user_id = db.execute("SELECT id FROM users WHERE username = ?", (current_user.username,)).fetchone()["id"]
    orders = db.execute("SELECT * FROM orders WHERE user_id = ?", (user_id,)).fetchall()

    result = []
    for order in orders:
        order_items = db.execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],)).fetchall()
        items = [dict(item) for item in order_items]
        order_data = dict(order)
        order_data["items"] = items
        result.append(order_data)

    return result

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
