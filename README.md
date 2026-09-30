# 🛒 DB Final Project — Amazon Clone

A full-stack clone of the Amazon shopping experience, built as a final project for a database course. It pairs a vanilla HTML/CSS/JS frontend with a FastAPI + SQLite backend and covers product browsing, cart management, checkout, order history, and JWT-based authentication. The whole stack runs with a single `docker compose up`.

## ✨ Features

- 🔍 Browse and search products with ratings, discounts, and keywords
- 🛍️ Add items to the cart and check out with delivery options
- 🔐 Signup/login secured with JWT tokens and bcrypt-hashed passwords
- 📦 Order history and shipment tracking
- 🗄️ Normalized relational schema for products, ratings, keywords, users, and orders
- 🐳 Dockerized backend and frontend, with the database persisted in a volume

## 🧱 Tech Stack

**Frontend**
- HTML5 / CSS3 / vanilla JavaScript (ES Modules)
- Served by nginx in Docker
- Google Fonts (Roboto)

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) + `uvicorn`
- SQLite (via Python's `sqlite3`)
- `python-jose` for JWT auth
- `passlib[bcrypt]` for password hashing

**Infrastructure**
- Docker & Docker Compose

## 📁 Project Structure

```
db-final-project/
├── amazon.html            # Home / product listing page
├── checkout.html          # Checkout page
├── login.html             # Login / signup page
├── orders.html            # Order history page
├── tracking.html          # Order tracking page
├── backend/
│   ├── api.py             # FastAPI app & all endpoints
│   ├── load_data.py       # Seeds the SQLite DB from products.json
│   ├── products.json      # Raw product data
│   ├── schema.sql         # Database schema
│   ├── requirements.txt
│   ├── Dockerfile         # Backend image
│   └── entrypoint.sh      # Seeds the DB on first start, then runs uvicorn
├── data/                  # Frontend data helpers (cart, orders, products, delivery options)
├── scripts/               # Frontend JS logic per page
├── styles/                # Shared & page-specific CSS
├── images/                # Product & UI images
├── Dockerfile.frontend    # nginx image for the static frontend
├── docker-compose.yml     # Runs backend + frontend
└── .env                   # Secrets (not committed)
```

## 🗄️ Database Schema

- **products** — id, name, image_path, price_cents, discount_pct
- **ratings** — product_id, stars, count
- **keywords** / **product_keyword_map** — many-to-many product tagging
- **users** — id, username, email, password_hash, created_at
- **orders** — id, user_id, order_date, total_price_cents
- **order_items** — order_id, product_id, quantity, price_cents, delivery_option_id

Foreign keys are enforced, and deleting a user, order, or product cascades to its dependent rows where appropriate.

## 🚀 Getting Started

### Option A — Docker (recommended)

**Prerequisites:** Docker and Docker Compose.

1. Create a `.env` file in the project root:

```env
   SECRET_KEY=your-long-random-secret
```

   Generate a strong key with:

```bash
   openssl rand -hex 32
```

2. Build and start everything:

```bash
   docker compose up --build
```

3. Open the app:

   | Service      | URL                                |
   | ------------ | ---------------------------------- |
   | Frontend     | http://localhost:8080/amazon.html  |
   | API          | http://localhost:8001              |
   | Swagger docs | http://localhost:8001/docs         |
   | ReDoc        | http://localhost:8001/redoc        |

The database is seeded automatically on the first start and persisted in the `db-data` Docker volume.

Useful commands:

```bash
docker compose up --build -d   # start in the background
docker compose logs -f backend # follow backend logs
docker compose down            # stop containers (data is kept)
docker compose down -v         # stop and delete the DB volume (re-seeds on next start)
```

> After editing `backend/products.json` or `backend/schema.sql`, run `docker compose down -v` so the database is re-seeded.

### Option B — Manual setup

**1. Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt

# Seed the database from products.json
python load_data.py

# Start the API on port 8001 (the port the frontend expects)
SECRET_KEY=your-long-random-secret uvicorn api:app --reload --port 8001
```

The API is available at `http://localhost:8001`, and product images are served from `http://localhost:8001/images/...`.

**2. Frontend**

The frontend is static, so no build step is needed. Serve the project root with any local server, for example VS Code's **Live Server** extension (`http://localhost:5501`), then open `amazon.html`.

The backend's CORS configuration allows these origins:

- `http://localhost:8080` and `http://127.0.0.1:8080` (Docker frontend)
- `http://localhost:5501` and `http://127.0.0.1:5501` (Live Server)
- `null` (pages opened directly from disk)

If you serve the frontend from a different origin, add it to the `origins` list in `backend/api.py`.

## 🔌 API Endpoints

Interactive documentation is generated automatically at `/docs` (Swagger UI) and `/redoc`. For protected endpoints, click **Authorize** in Swagger UI and log in with your username and password.

| Method | Endpoint          | Auth | Description                          |
| ------ | ----------------- | ---- | ------------------------------------ |
| POST   | `/signup`         | No   | Register a new user                  |
| POST   | `/token`          | No   | Log in and receive a JWT             |
| GET    | `/users/me/`      | Yes  | Get the current authenticated user   |
| GET    | `/products`       | No   | List products (`skip`, `limit`)      |
| GET    | `/products/{id}`  | No   | Get a single product                 |
| POST   | `/orders`         | Yes  | Create an order                      |
| GET    | `/orders`         | Yes  | Get the current user's orders        |

`/products` returns 20 items by default. The frontend requests `/products?limit=100` to load the full catalog.

## 🔒 Configuration

| Variable     | Where          | Description                                                              |
| ------------ | -------------- | ------------------------------------------------------------------------ |
| `SECRET_KEY` | `.env`         | Secret used to sign JWTs. Required by Docker Compose.                    |
| `DB_PATH`    | compose / env  | SQLite file location (`/data/myshop.db` in Docker; `backend/myshop.db` locally). |

## ⚠️ Notes

- `.env` is git-ignored. Never commit it, and use a different `SECRET_KEY` for any real deployment. If `SECRET_KEY` is not set outside Docker, the API falls back to an insecure development key.
- `myshop.db` is regenerated by `load_data.py`, so manual DB edits are lost on re-seed.
- Access tokens expire after 30 minutes.
- This is an educational project and is not production-hardened.

## 👤 Author

Built by [Amir Safarzadeh](https://github.com/AmirSz8203) as a database course final project.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

> **Note:** This is an educational project built for a database course. The Amazon branding and product imagery are used for learning purposes only and are not affiliated with or endorsed by Amazon.
