#!/usr/bin/env bash
# Проверяет, что все workflow «Компас рекрутера» импортированы и активированы.
# Запускать после import-workflows.sh, publish-workflows.sh и перезапуска n8n.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKFLOWS="$ROOT/deploy/workflows"
CONTAINER="compass-n8n"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Ошибка: контейнер $CONTAINER не запущен." >&2
  exit 1
fi

active_ids="$(docker exec "$CONTAINER" n8n list:workflow --active=true --onlyId | sort)"

missing=0
for file in "$WORKFLOWS"/*.json; do
  id="$(basename "$file" .json)"
  if ! grep -qx "$id" <<< "$active_ids"; then
    echo "НЕ активен: $id"
    missing=$((missing + 1))
  fi
done

total="$(ls "$WORKFLOWS"/*.json | wc -l | tr -d ' ')"
active="$(wc -l <<< "$active_ids" | tr -d ' ')"

echo "-----------------------------------------"
echo "Ожидалось активных: $total"
echo "Активных в n8n:     $active"
echo "Не найдено/не активно: $missing"

if [ "$missing" -ne 0 ]; then
  echo "Итог: проверка НЕ пройдена." >&2
  exit 1
fi
echo "Итог: все workflow импортированы и активны."
