#!/usr/bin/env bash
# Засевает демо-данные (критерии вакансии 13 + 7 разборов) в Postgres-контейнер.
# Идемпотентно: перед вставкой чистит демо-данные по vacancy_id=13.
# Скрипт использует psql-переменные (\set), поэтому применяется через psql.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SEED="$ROOT/supabase/seed/demo-data.sql"
CONTAINER="compass-db"

DBPW="${COMPASS_DB_PASSWORD:-$(grep '^COMPASS_DB_PASSWORD=' "$ROOT/.env" 2>/dev/null | cut -d= -f2-)}"
if [ -z "$DBPW" ]; then
  echo "Ошибка: задайте COMPASS_DB_PASSWORD (в .env или окружении)." >&2
  exit 1
fi
if [ ! -f "$SEED" ]; then
  echo "Ошибка: не найден $SEED" >&2
  exit 1
fi
if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Ошибка: контейнер $CONTAINER не запущен." >&2
  exit 1
fi

echo "Засеваю демо-данные..."
docker exec -i -e PGPASSWORD="$DBPW" "$CONTAINER" psql -U compass -d compass -v ON_ERROR_STOP=1 < "$SEED"

echo "=== проверка ==="
docker exec -i -e PGPASSWORD="$DBPW" "$CONTAINER" psql -U compass -d compass -c \
  "SELECT potok_vacancy_id, status, version_number FROM recruiter_compass.vacancy_criteria_versions WHERE potok_vacancy_id = 13;"
docker exec -i -e PGPASSWORD="$DBPW" "$CONTAINER" psql -U compass -d compass -c \
  "SELECT potok_candidate_id, recommendation FROM recruiter_compass.candidate_reviews WHERE potok_vacancy_id = 13 ORDER BY potok_candidate_id;"
