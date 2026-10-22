#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-./.venv/bin/python}"
GUNICORN_BIN="${GUNICORN_BIN:-./.venv/bin/gunicorn}"

"$PYTHON_BIN" manage.py migrate --noinput
"$PYTHON_BIN" manage.py seed_demo_catalog
exec "$GUNICORN_BIN" market.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
