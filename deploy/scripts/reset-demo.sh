#!/usr/bin/env bash
# Полный сброс демо в исходное состояние:
# 1) Supabase: сид критериев вакансии 13 + 7 разборов (идемпотентный demo-data.sql).
# 2) Potok: возврат стадий кандидатов (Павел — скрининг, остальные — sourced).
# Запускать на облачном сервере перед каждым показом демо.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== 1/2 Сброс Supabase ==="
bash "$ROOT/deploy/scripts/seed-demo.sh"

echo ""
echo "=== 2/2 Сброс стадий Potok ==="
POTOK_TOKEN="${POTOK_TOKEN:-$(grep '^POTOK_TOKEN=' "$ROOT/.env" 2>/dev/null | cut -d= -f2-)}"
export POTOK_TOKEN
if [ -z "$POTOK_TOKEN" ]; then
  echo "Ошибка: задайте POTOK_TOKEN (в .env или окружении)." >&2
  exit 1
fi
node "$ROOT/scripts/reset-potok.mjs"

echo ""
echo "Демо возвращено в исходное состояние."
