#!/usr/bin/env bash
# Импортирует workflow «Компас рекрутера» (26 шт.) в запущенный n8n.
# id workflow сохраняются — это нужно для кросс-ссылок executeWorkflow/toolWorkflow.
# Перед импортом в n8n должны быть созданы 3 учётные записи с точными именами
# (см. RUNBOOK.md). После импорта выполните publish-workflows.sh и перезапустите n8n.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKFLOWS="$ROOT/deploy/workflows"
CONTAINER="compass-n8n"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Ошибка: контейнер $CONTAINER не запущен. Поднимите n8n: docker compose --env-file .env -f deploy/docker-compose.yml up -d" >&2
  exit 1
fi

docker exec "$CONTAINER" mkdir -p /home/node/.n8n/import
docker cp "$WORKFLOWS/." "$CONTAINER":/home/node/.n8n/import/

docker exec "$CONTAINER" n8n import:workflow \
  --separate --input=/home/node/.n8n/import

docker exec "$CONTAINER" rm -rf /home/node/.n8n/import

echo "Импорт завершён. Дальше: deploy/scripts/publish-workflows.sh"
