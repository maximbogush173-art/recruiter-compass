# Runbook оператора — «Компас рекрутера» (облачный контур)

> Кому: владелец сервера. Что: управление развёрнутым агентом и пересборка пакета.
> Секреты (ключи, токены) не хранятся в репозитории и вводятся только вручную в n8n.

---

## 1. Что развёрнуто на сервере

Проект `recruiter-compass` (Docker Compose) в `/home/maxim/recruiter-compass/`:

| Контейнер | Образ | Порт | Что |
|---|---|---|---|
| `compass-db` | postgres:17-alpine | `127.0.0.1:55432` | изолированный Postgres, БД `compass`, схема `recruiter_compass` |
| `compass-n8n` | n8nio/n8n:2.37.10 | `127.0.0.1:5678` | n8n (editor только локально, через SSH-туннель) |
| `compass-caddy` | caddy:2-alpine | `0.0.0.0:8080` | фронтенд + прокси `/webhook/*` → n8n |

Живой адрес агента: **http://188.225.44.97:8080**

Порт `8080` открыт в ufw. Существующий Supabase (`supabase_*`, `/opt/detailpro-supabase/`)
НЕ затрагивается — отдельные сеть, volume и порты.

---

## 2. Источник истины

| Что | Где |
|---|---|
| Импортируемые workflow (24 шт.) | `deploy/workflows/*.json` |
| Схема БД | `supabase/migrations/0001_*.sql`, `0002_*.sql` |
| Демо-данные | `supabase/seed/demo-data.sql` |
| Облачный контур | `deploy/docker-compose.yml`, `deploy/Caddyfile`, `.env.example` |
| Скрипты | `deploy/scripts/` |

`deploy/workflows/` — очищенный экспорт текущего агента (креды по имени, без
локальных id и метаданных инстанса). Актуальная архитектура — **агентное ядро +
17 инструментов + 4 блока + 2 под-флоу**; входной webhook — `/webhook/compass-agent-lab`.

---

## 3. Учётные записи (по имени)

| Тип | Имя | Параметры |
|---|---|---|
| DeepSeek API | `DeepSeek account` | API-ключ |
| Postgres | `Postgres account` | host `db`, port `5432`, database `compass`, user `compass`, пароль `COMPASS_DB_PASSWORD`, SSL выкл |
| Header Auth | `Header Auth account` | `Authorization: Bearer <токен Potok>` |

---

## 4. Управление (на сервере)

```bash
cd /home/maxim/recruiter-compass
sudo docker compose --env-file .env -f docker-compose.yml restart n8n   # перезапуск n8n
sudo docker compose --env-file .env -f docker-compose.yml logs -f n8n    # логи
sudo docker compose --env-file .env -f docker-compose.yml down           # остановить (данные в volume сохраняются)
# НЕ использовать: docker compose down -v  — удалит volume с данными n8n/Postgres
```

Editor: `ssh -L 5678:127.0.0.1:5678 maxim@188.225.44.97` → `http://localhost:5678`.

---

## 5. Как запустить демо и проверить

1. Открыть `http://188.225.44.97:8080`.
2. Отправить сообщение (например, «покажи сводку по вакансии»).
3. Ответ агента в чате; прогон виден в n8n → Executions.

**Ошибка/ручной разбор:** если агент вернул «workflow did not return a response» —
обычно неактивирован под-флоу инструмента или не прокинут `vacancy_id` в триггер
инструмента. Смотри Executions выбранного прогона.

---

## 6. Изменения и пересборка пакета

- **Правка флоу в editor** → затем переэкспорт в пакет:
  `n8n export:workflow --all --separate`, очистить `deploy/scripts/sanitize-export.mjs`,
  положить в `deploy/workflows/`.
- **Схема БД:** новая миграция `supabase/migrations/00NN_*.sql` → `apply-migrations.sh`.
- **Демо-данные:** `supabase/seed/demo-data.sql` → `seed-demo.sh`.
- **Фронтенд:** `npm ci && npm run build` (обновит `dist/client/`).

---

## 7. Активация и состояние

- После импорта workflow **выключены**; активируются `publish-workflows.sh`.
- Активны должны быть **все 24** флоу (агент + инструменты + блоки + под-флоу):
  вложенные вызовы `toolWorkflow`/`executeWorkflow` требуют активного под-флоу.
- После `publish-workflows.sh` нужен `docker compose restart n8n`.

---

## 8. Расположение артефактов

| Артефакт | Путь |
|---|---|
| Облачный контур | `deploy/docker-compose.yml`, `deploy/Caddyfile`, `.env.example` |
| Workflow JSON | `deploy/workflows/` |
| Скрипты | `deploy/scripts/` |
| Миграции / сид | `supabase/migrations/`, `supabase/seed/` |
| Фронтенд | `src/`, собранный `dist/client/` |
| Лицензия | `LICENSE` (MIT) |
