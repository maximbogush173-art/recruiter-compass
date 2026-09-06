#!/usr/bin/env bash
# Применяет миграции схемы recruiter_compass к Postgres-контейнеру compass-db.
# Требует COMPASS_DB_PASSWORD (в .env или окружении).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS="$ROOT/supabase/migrations"
CONTAINER="compass-db"

DBPW="${COMPASS_DB_PASSWORD:-$(grep '^COMPASS_DB_PASSWORD=' "$ROOT/.env" 2>/dev/null | cut -d= -f2-)}"
if [ -z "$DBPW" ]; then
  echo "Ошибка: задайте COMPASS_DB_PASSWORD (в .env или окружении)." >&2
  exit 1
fi
if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Ошибка: контейнер $CONTAINER не запущен. Поднимите: docker compose --env-file .env -f deploy/docker-compose.yml up -d" >&2
  exit 1
fi

for f in "$MIGRATIONS"/[0-9]*.sql; do
  echo "Применяю: $(basename "$f")"
  docker exec -i -e PGPASSWORD="$DBPW" "$CONTAINER" psql -U compass -d compass -v ON_ERROR_STOP=1 < "$f"
done

echo "Миграции применены."
