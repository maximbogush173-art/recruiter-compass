# Засев демо-данных «Компас рекрутера» (облачная Supabase)

Этот пакет засевает в облачную Supabase демо-данные для вакансии **13**
«[ДЕМО] Руководитель корпоративных продаж» и семи кандидатов (id 70–90),
чтобы агент мог сразу отвечать без прогона генерации через LLM.

## Что входит

| Файл | Что делает |
|---|---|
| `supabase/migrations/0001_recruiter_compass_audit.sql` | схема `recruiter_compass` (таблицы) |
| `supabase/migrations/0002_recruiter_compass_action_types.sql` | расширение enum-ов |
| `supabase/seed/demo-data.sql` | **этот пакет**: подтверждённые критерии + 7 разборов |

Засеваются:
- 1 запись `agent_runs` (засевной прогон);
- 1 подтверждённая версия критериев `vacancy_criteria_versions` (10 критериев C1–C10, `status='confirmed'`);
- 7 разборов `candidate_reviews`:
  | Кандидат | id | Вердикт |
  |---|---|---|
  | Андреев Павел | 70 | уточнить (`clarify`) |
  | Ковалёва Анна | 71 | вести дальше (`continue`) |
  | Орлов Михаил | 86 | уточнить (`clarify`) |
  | Волков Алексей | 87 | уточнить (`clarify`) |
  | Лебедев Сергей | 88 | вести дальше (`continue`) |
  | Петров Денис | 89 | не подходит (`not_for_current_vacancy`) |
  | Морозова Елена | 90 | не подходит (`not_for_current_vacancy`) |

## Порядок применения

Выполнять на сервере с доступом к облачной Supabase (строка подключения —
`SUPABASE_DB_URL` в формате `postgresql://USER:PASS@HOST:PORT/postgres`).

```bash
# 1) схема (только если ещё не применена — проверяет/создаёт таблицы)
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_recruiter_compass_audit.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_recruiter_compass_action_types.sql

# 2) демо-данные (идемпотентно: чистит вакансию 13 и вставляет заново)
psql "$SUPABASE_DB_URL" -f supabase/seed/demo-data.sql
```

> Важно: скрипт использует psql-переменные (`\set`), поэтому запускать именно
> через `psql -f`, а не в произвольном SQL-клиенте.

## Проверка после заливки

```bash
psql "$SUPABASE_DB_URL" -c "SELECT potok_vacancy_id, status, version_number FROM recruiter_compass.vacancy_criteria_versions WHERE potok_vacancy_id = 13;"
psql "$SUPABASE_DB_URL" -c "SELECT potok_candidate_id, recommendation FROM recruiter_compass.candidate_reviews WHERE potok_vacancy_id = 13 ORDER BY potok_candidate_id;"
```

Ожидаемо: 1 критериальная версия (`status=confirmed`) и 7 разборов с вердиктами выше.

## Примечания

- Внешняя песочница Potok (`demo.app.potok.io`) уже содержит вакансию 13 и
  кандидатов 70–90 — засев Potok не нужен.
- Разборы засеяны только как **начальное состояние** для чтения (`почему отказ`,
  `сводка`, `пробелы`). При запуске «разбери кандидатов» агент сгенерирует свежие
  разборы через LLM и запишет их новым прогоном — это нормально.
- Креды в n8n (`DeepSeek account`, `Postgres account`, `Header Auth account`)
  этим пакетом не затрагиваются.
