#!/bin/bash
set -e
───────────────────────────────────────────────

echo "─── OrbitFlow Entrypoint ───"

# ─── Wait for PostgreSQL ───
echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."

python << 'END'
import sys, time, os

max_retries = 30
retry_interval = 2

for attempt in range(1, max_retries + 1):
    try:
        import psycopg2
        conn = psycopg2.connect(
            dbname=os.environ.get("DB_NAME", "orbitflow"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", ""),
            host=os.environ.get("DB_HOST", "postgres"),
            port=os.environ.get("DB_PORT", "5432"),
        )
        conn.close()
        print("✓ PostgreSQL is ready!")
        sys.exit(0)
    except Exception:
        print(f"  Attempt {attempt}/{max_retries} — PostgreSQL not ready, retrying in {retry_interval}s...")
        time.sleep(retry_interval)

print("✗ ERROR: Could not connect to PostgreSQL after 60s!")
sys.exit(1)
END

# ─── Run migrations and collectstatic for web server only ───
if [[ "$1" == "gunicorn" ]]; then
    echo "Applying database migrations..."
    python manage.py migrate --noinput
    echo "✓ Migrations applied."

    echo "Collecting static files..."
    python manage.py collectstatic --noinput
    echo "✓ Static files collected."
fi

echo "Starting: $@"
exec "$@"
