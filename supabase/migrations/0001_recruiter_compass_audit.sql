-- «Компас рекрутера»: изолированная предметная схема для локального Supabase.
-- Миграция НЕ хранит ключи и не предназначена для записи полных резюме.

create schema if not exists recruiter_compass;
create extension if not exists pgcrypto;

create table if not exists recruiter_compass.agent_runs (
  run_id uuid primary key default gen_random_uuid(),
  workflow_key text not null,
  trigger_source text not null check (trigger_source in ('manual', 'ui', 'schedule', 'webhook')),
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'rejected')),
  potok_vacancy_id bigint,
  input_snapshot_sha256 char(64),
  input_snapshot_ref text,
  model_provider text,
  model_name text,
  prompt_version text not null,
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists recruiter_compass.vacancy_criteria_versions (
  criteria_version_id uuid primary key default gen_random_uuid(),
  potok_vacancy_id bigint not null,
  version_number integer not null check (version_number > 0),
  status text not null check (status in ('proposed', 'confirmed', 'superseded')),
  criteria jsonb not null,
  source_run_id uuid not null references recruiter_compass.agent_runs(run_id),
  confirmed_by text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (potok_vacancy_id, version_number)
);

create unique index if not exists vacancy_criteria_one_confirmed_per_vacancy
  on recruiter_compass.vacancy_criteria_versions (potok_vacancy_id)
  where status = 'confirmed';

create table if not exists recruiter_compass.candidate_reviews (
  review_id uuid primary key default gen_random_uuid(),
  run_id uuid not null references recruiter_compass.agent_runs(run_id),
  potok_candidate_id bigint not null,
  potok_vacancy_id bigint not null,
  criteria_version_id uuid not null references recruiter_compass.vacancy_criteria_versions(criteria_version_id),
  recommendation text not null check (recommendation in ('continue', 'clarify', 'not_for_current_vacancy')),
  summary text not null,
  evidence jsonb not null,
  critical_unknowns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, potok_candidate_id)
);

create table if not exists recruiter_compass.action_proposals (
  action_id uuid primary key default gen_random_uuid(),
  source_review_id uuid references recruiter_compass.candidate_reviews(review_id),
  action_type text not null check (action_type in ('advance_candidate', 'transfer_to_neighbouring_vacancy', 'prepare_candidate_message', 'retain_talent_memory')),
  status text not null check (status in ('proposed', 'consent_required', 'ready_for_recruiter_confirmation', 'confirmed', 'executed', 'declined', 'expired', 'failed')),
  potok_candidate_id bigint not null,
  source_vacancy_id bigint,
  target_vacancy_id bigint,
  payload jsonb not null,
  candidate_consent_at timestamptz,
  recruiter_confirmed_by text,
  recruiter_confirmed_at timestamptz,
  idempotency_key uuid not null default gen_random_uuid(),
  expires_at timestamptz not null,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists recruiter_compass.action_audit (
  audit_id uuid primary key default gen_random_uuid(),
  action_id uuid not null references recruiter_compass.action_proposals(action_id),
  event_type text not null check (event_type in ('proposed', 'candidate_consent_recorded', 'recruiter_confirmed', 'execution_started', 'execution_succeeded', 'execution_failed', 'expired', 'declined')),
  actor_type text not null check (actor_type in ('agent', 'recruiter', 'candidate', 'system')),
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on schema recruiter_compass is 'Аудит и управляемое состояние локального агента «Компас рекрутера».';
comment on table recruiter_compass.candidate_reviews is 'Только выводы и ограниченные доказательства с указателями на источник; не сырой текст резюме.';
comment on table recruiter_compass.action_proposals is 'Любое действие начинается предложением и требует явно зафиксированного подтверждения.';
