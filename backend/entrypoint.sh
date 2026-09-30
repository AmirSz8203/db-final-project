#!/bin/sh
set -e
if [ ! -f "$DB_PATH" ]; then
  echo "Seeding database..."
  python load_data.py
fi
exec uvicorn api:app --host 0.0.0.0 --port 8000