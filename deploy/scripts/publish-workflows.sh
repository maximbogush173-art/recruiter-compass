#!/usr/bin/env bash
# Активирует (публикует) все импортированные workflow «Компас рекрутера».
# id берутся из имён файлов deploy/workflows/. После публикации нужен перезапуск
# n8n, чтобы активные workflow (webhook + вложенные вызовы) заработали:
#   docker compose --env-file .env -f deploy/docker-compose.yml restart n8n
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKFLOWS="$ROOT/deploy/workflows"
CONTAINER="compass-n8n"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Ошибка: контейнер $CONTAINER не запущен." >&2
  exit 1
fi

count=0
for file in "$WORKFLOWS"/*.json; do
  id="$(basename "$file" .json)"
  echo "Публикую: $id"
  docker exec "$CONTAINER" n8n publish:workflow --id="$id"
  count=$((count + 1))
done

echo "Опубликовано workflow: $count."
echo "Перезапустите n8n, чтобы изменения вступили в силу:"
echo "  docker compose --env-file .env -f deploy/docker-compose.yml restart n8n"
