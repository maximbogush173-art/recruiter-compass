-- «Компас рекрутера»: демо-датасет для вакансии 13 (vacancy_id=13, кандидаты 70–90).
-- Требует заранее применённых миграций 0001 и 0002 (схема recruiter_compass).
-- Идемпотентно: перед вставкой удаляет демо-данные по vacancy_id=13.
-- Применять: psql "<CLOUD_SUPABASE_URL>" -f demo-data.sql

begin;

-- фиксированные id для связей
\set seed_run '11111111-1111-1111-1111-111111111111'
\set seed_cv   '22222222-2222-2222-2222-222222222222'

-- очистка прежнего демо (вакансия 13)
delete from recruiter_compass.action_audit       where action_id in (select action_id from recruiter_compass.action_proposals where source_vacancy_id = 13 or target_vacancy_id = 13);
delete from recruiter_compass.action_proposals   where source_vacancy_id = 13 or target_vacancy_id = 13;
delete from recruiter_compass.candidate_reviews  where potok_vacancy_id = 13;
delete from recruiter_compass.vacancy_criteria_versions where potok_vacancy_id = 13;
delete from recruiter_compass.agent_runs         where workflow_key = 'seed_demo';

-- 1. засевной прогон
insert into recruiter_compass.agent_runs
  (run_id, workflow_key, trigger_source, status, potok_vacancy_id, model_provider, model_name, prompt_version)
values
  (:'seed_run', 'seed_demo', 'manual', 'succeeded', 13, 'seed', 'seed', 'demo-v1');

-- 2. подтверждённые критерии вакансии 13
insert into recruiter_compass.vacancy_criteria_versions
  (criteria_version_id, potok_vacancy_id, version_number, status, criteria, source_run_id, confirmed_by, confirmed_at)
values
  (:'seed_cv', 13, 1, 'confirmed', $crit$
[
  {"criterion_id":"C1","kind":"must_have","title":"Самостоятельно вёл крупные корпоративные сделки от первого контакта до подписания","verification_rule":"В резюме есть конкретная сделка, которую кандидат лично вёл от первого контакта до подписания, с указанием роли и этапов.","why_it_matters":"Ключевое требование роли: самостоятельное ведение полного цикла сделки."},
  {"criterion_id":"C2","kind":"must_have","title":"Опыт сделок длительностью от 6 месяцев","verification_rule":"В резюме есть хотя бы одна сделка с циклом от 6 месяцев.","why_it_matters":"Длинные циклы характерны для корпоративных продаж."},
  {"criterion_id":"C3","kind":"must_have","title":"Опыт продаж с участием нескольких лиц, принимающих решения (закупки, финансы, производство)","verification_rule":"В резюме указаны минимум три функции/роли клиента, с которыми кандидат вёл переговоры.","why_it_matters":"Корпоративные сделки требуют работы с несколькими ЛПР."},
  {"criterion_id":"C4","kind":"must_have","title":"Выполнение личного плана продаж с понятными цифрами за последний год","verification_rule":"В резюме есть личные цифры плана и факта за последний год.","why_it_matters":"Проверяет результативность, а не только опыт."},
  {"criterion_id":"C5","kind":"must_have","title":"Опыт управления тремя менеджерами по корпоративным продажам","verification_rule":"В резюме указано управление минимум тремя менеджерами.","why_it_matters":"Роль предполагает управление командой."},
  {"criterion_id":"C6","kind":"nice_to_have","title":"Опыт контрактов от 20 млн рублей","verification_rule":"В резюме есть контракт на сумму от 20 млн рублей.","why_it_matters":"Крупный чек — плюс для роли."},
  {"criterion_id":"C7","kind":"nice_to_have","title":"Опыт работы с промышленными предприятиями","verification_rule":"В резюме есть клиенты из промышленного сектора.","why_it_matters":"Отраслевой опыт ускоряет адаптацию."},
  {"criterion_id":"C8","kind":"constraint","title":"Локация: Москва","verification_rule":"Кандидат находится в Москве или готов работать в московском офисе.","why_it_matters":"Офис находится в Москве."},
  {"criterion_id":"C9","kind":"constraint","title":"Гибридный график работы","verification_rule":"Кандидат согласен на гибридный формат.","why_it_matters":"Формат работы компании."},
  {"criterion_id":"C10","kind":"constraint","title":"Готовность к командировкам до 30% рабочего времени","verification_rule":"Кандидат готов к командировкам до 30% времени.","why_it_matters":"Роль предполагает командировки."}
]
$crit$::jsonb, :'seed_run', 'seed', now());

-- 3. разборы кандидатов
insert into recruiter_compass.candidate_reviews
  (run_id, potok_candidate_id, potok_vacancy_id, criteria_version_id, recommendation, summary, evidence, critical_unknowns)
values
  -- 70 Андреев Павел — уточнить
  (:'seed_run', 70, 13, :'seed_cv', 'clarify',
   'Сильный профиль, но нет личных цифр плана за год и неясно управление командой.',
   $e$[{"criterion_id":"C1","state":"partially_confirmed","claim":"Вёл корпоративные сделки, но часть — в составе команды, не всегда самостоятельно."},{"criterion_id":"C2","state":"confirmed","claim":"Есть сделки с циклом от 6 месяцев."},{"criterion_id":"C3","state":"partially_confirmed","claim":"Работал с несколькими ЛПР, точный состав функций неясен."},{"criterion_id":"C4","state":"needs_clarification","claim":"Личный план за год не указан — есть только план подразделения (108%)."},{"criterion_id":"C5","state":"needs_clarification","claim":"Неясно, управлял ли тремя менеджерами."},{"criterion_id":"C6","state":"needs_clarification","claim":"Нет данных о контрактах от 20 млн."},{"criterion_id":"C7","state":"needs_clarification","claim":"Нет данных о промышленных клиентах."},{"criterion_id":"C8","state":"needs_clarification","claim":"Локация не указана."},{"criterion_id":"C9","state":"needs_clarification","claim":"Готовность к гибриду не указана."},{"criterion_id":"C10","state":"needs_clarification","claim":"Готовность к командировкам не указана."}]$e$::jsonb,
   $u$[{"criterion_id":"C4","question":"Каковы личные плановые и фактические цифры продаж за последний год?","why_now":"Без личных цифр нельзя подтвердить результативность."},{"criterion_id":"C5","question":"Сколько менеджеров вы непосредственно вели?","why_now":"Требование роли — управление 3+ менеджерами."},{"criterion_id":"C8","question":"Готовы ли работать в Москве?","why_now":"Офис находится в Москве."}]$u$::jsonb),

  -- 71 Ковалёва Анна — вести дальше
  (:'seed_run', 71, 13, :'seed_cv', 'continue',
   'Все обязательные профессиональные критерии подтверждены; осталось уточнить ограничения.',
   $e$[{"criterion_id":"C1","state":"confirmed","claim":"Лично ведёт сделки 52 и 38 млн ₽ от первого контакта до подписания."},{"criterion_id":"C2","state":"confirmed","claim":"Циклы сделок 7–9 месяцев."},{"criterion_id":"C3","state":"confirmed","claim":"Работает с закупками, финансами и производством клиента."},{"criterion_id":"C4","state":"confirmed","claim":"Личный план выполнен на 112% и 108% в разные периоды."},{"criterion_id":"C5","state":"confirmed","claim":"Управляет тремя менеджерами."},{"criterion_id":"C6","state":"confirmed","claim":"Есть контракты от 20 млн ₽."},{"criterion_id":"C7","state":"confirmed","claim":"Работала с промышленными предприятиями."},{"criterion_id":"C8","state":"needs_clarification","claim":"Локация не уточнена."},{"criterion_id":"C9","state":"needs_clarification","claim":"Готовность к гибриду не уточнена."},{"criterion_id":"C10","state":"needs_clarification","claim":"Готовность к командировкам не уточнена."}]$e$::jsonb,
   $u$[{"criterion_id":"C8","question":"Готовы ли работать в московском офисе?","why_now":"Локация не подтверждена."},{"criterion_id":"C9","question":"Согласны ли на гибридный график?","why_now":"Формат работы не подтверждён."},{"criterion_id":"C10","question":"Готовы ли к командировкам до 30% времени?","why_now":"Мобильность не подтверждена."}]$u$::jsonb),

  -- 86 Орлов Михаил — уточнить
  (:'seed_run', 86, 13, :'seed_cv', 'clarify',
   'Нет примера полного цикла сделки и личных цифр плана; управление командой не подтверждено.',
   $e$[{"criterion_id":"C1","state":"partially_confirmed","claim":"Участвовал в крупных сделках, но полный цикл от первого контакта не показан."},{"criterion_id":"C2","state":"needs_clarification","claim":"Нет примера сделки с циклом от 6 месяцев."},{"criterion_id":"C3","state":"partially_confirmed","claim":"Взаимодействовал с несколькими ЛПР."},{"criterion_id":"C4","state":"needs_clarification","claim":"Личные цифры плана не указаны."},{"criterion_id":"C5","state":"needs_clarification","claim":"Управление тремя менеджерами не подтверждено."},{"criterion_id":"C6","state":"needs_clarification","claim":"Нет данных о контрактах от 20 млн."},{"criterion_id":"C7","state":"needs_clarification","claim":"Нет данных о промышленных клиентах."},{"criterion_id":"C8","state":"needs_clarification","claim":"Локация не указана."},{"criterion_id":"C9","state":"needs_clarification","claim":"Готовность к гибриду не указана."},{"criterion_id":"C10","state":"needs_clarification","claim":"Готовность к командировкам не указана."}]$e$::jsonb,
   $u$[{"criterion_id":"C2","question":"Есть ли сделка с циклом от 6 месяцев?","why_now":"Нет подтверждения длинного цикла."},{"criterion_id":"C4","question":"Каковы личные цифры плана и факта за год?","why_now":"Нет подтверждения результативности."},{"criterion_id":"C5","question":"Сколько менеджеров вели?","why_now":"Требование роли."}]$u$::jsonb),

  -- 87 Волков Алексей — уточнить
  (:'seed_run', 87, 13, :'seed_cv', 'clarify',
   'Нет цифр личного плана и подтверждения управления 3+ менеджерами.',
   $e$[{"criterion_id":"C1","state":"partially_confirmed","claim":"Вёл сделки, но самостоятельность полного цикла не показана."},{"criterion_id":"C2","state":"confirmed","claim":"Есть сделки с циклом от 6 месяцев."},{"criterion_id":"C3","state":"partially_confirmed","claim":"Работал с несколькими ЛПР."},{"criterion_id":"C4","state":"needs_clarification","claim":"Личный план с цифрами не указан."},{"criterion_id":"C5","state":"needs_clarification","claim":"Управление командой не подтверждено."},{"criterion_id":"C6","state":"needs_clarification","claim":"Нет данных о контрактах от 20 млн."},{"criterion_id":"C7","state":"needs_clarification","claim":"Нет данных о промышленных клиентах."},{"criterion_id":"C8","state":"needs_clarification","claim":"Локация не указана."},{"criterion_id":"C9","state":"needs_clarification","claim":"Готовность к гибриду не указана."},{"criterion_id":"C10","state":"needs_clarification","claim":"Готовность к командировкам не указана."}]$e$::jsonb,
   $u$[{"criterion_id":"C4","question":"Каковы личные цифры плана за год?","why_now":"Нет подтверждения результативности."},{"criterion_id":"C5","question":"Сколько менеджеров вели?","why_now":"Требование роли."}]$u$::jsonb),

  -- 88 Лебедев Сергей — вести дальше
  (:'seed_run', 88, 13, :'seed_cv', 'continue',
   'Все обязательные профессиональные критерии подтверждены; осталось уточнить ограничения.',
   $e$[{"criterion_id":"C1","state":"confirmed","claim":"Лично ведёт сделку 61 млн ₽ от первого контакта до подписания."},{"criterion_id":"C2","state":"confirmed","claim":"Есть сделки с циклом от 6 месяцев."},{"criterion_id":"C3","state":"confirmed","claim":"Работает с несколькими ЛПР клиента."},{"criterion_id":"C4","state":"confirmed","claim":"Личный план выполнен на 118% и 104%."},{"criterion_id":"C5","state":"confirmed","claim":"Управляет четырьмя менеджерами."},{"criterion_id":"C6","state":"confirmed","claim":"Есть контракты от 20 млн ₽."},{"criterion_id":"C7","state":"confirmed","claim":"Работал с промышленными предприятиями."},{"criterion_id":"C8","state":"needs_clarification","claim":"Локация не уточнена."},{"criterion_id":"C9","state":"needs_clarification","claim":"Готовность к гибриду не уточнена."},{"criterion_id":"C10","state":"needs_clarification","claim":"Готовность к командировкам не уточнена."}]$e$::jsonb,
   $u$[{"criterion_id":"C8","question":"Готовы ли работать в Москве?","why_now":"Локация не подтверждена."},{"criterion_id":"C9","question":"Согласны ли на гибрид?","why_now":"Формат не подтверждён."},{"criterion_id":"C10","question":"Готовы ли к командировкам до 30%?","why_now":"Мобильность не подтверждена."}]$u$::jsonb),

  -- 89 Петров Денис — не подходит
  (:'seed_run', 89, 13, :'seed_cv', 'not_for_current_vacancy',
   'Не вёл крупные корпоративные сделки самостоятельно: готовит коммерческие документы и презентации.',
   $e$[{"criterion_id":"C1","state":"not_met","claim":"Не вёл сделки от первого контакта до подписания — готовит коммерческие предложения и презентации."},{"criterion_id":"C2","state":"needs_clarification","claim":"Нет примера сделки с циклом от 6 месяцев."},{"criterion_id":"C3","state":"needs_clarification","claim":"Опыт работы с несколькими ЛПР не подтверждён."},{"criterion_id":"C4","state":"needs_clarification","claim":"Личные цифры плана не указаны."},{"criterion_id":"C5","state":"needs_clarification","claim":"Управление менеджерами не указано."},{"criterion_id":"C6","state":"needs_clarification","claim":"Нет данных о контрактах от 20 млн."},{"criterion_id":"C7","state":"needs_clarification","claim":"Нет данных о промышленных клиентах."},{"criterion_id":"C8","state":"needs_clarification","claim":"Локация не указана."},{"criterion_id":"C9","state":"needs_clarification","claim":"Готовность к гибриду не указана."},{"criterion_id":"C10","state":"needs_clarification","claim":"Готовность к командировкам не указана."}]$e$::jsonb,
   $u$[{"criterion_id":"C1","question":"Вели ли вы когда-либо сделку самостоятельно от первого контакта?","why_now":"Это ключевое требование роли."}]$u$::jsonb),

  -- 90 Морозова Елена — не подходит
  (:'seed_run', 90, 13, :'seed_cv', 'not_for_current_vacancy',
   'Нет опыта самостоятельного ведения крупных корпоративных сделок и личного плана с цифрами.',
   $e$[{"criterion_id":"C1","state":"not_met","claim":"Не ведёт крупные корпоративные сделки от первого контакта до подписания."},{"criterion_id":"C2","state":"needs_clarification","claim":"Нет примера сделки с циклом от 6 месяцев."},{"criterion_id":"C3","state":"needs_clarification","claim":"Опыт с несколькими ЛПР не подтверждён."},{"criterion_id":"C4","state":"needs_clarification","claim":"Личные цифры плана не указаны."},{"criterion_id":"C5","state":"needs_clarification","claim":"Управление командой не указано."},{"criterion_id":"C6","state":"needs_clarification","claim":"Нет данных о контрактах от 20 млн."},{"criterion_id":"C7","state":"needs_clarification","claim":"Нет данных о промышленных клиентах."},{"criterion_id":"C8","state":"needs_clarification","claim":"Локация не указана."},{"criterion_id":"C9","state":"needs_clarification","claim":"Готовность к гибриду не указана."},{"criterion_id":"C10","state":"needs_clarification","claim":"Готовность к командировкам не указана."}]$e$::jsonb,
   $u$[{"criterion_id":"C1","question":"Вели ли вы крупные корпоративные сделки самостоятельно?","why_now":"Ключевое требование роли."},{"criterion_id":"C4","question":"Каковы личные цифры плана за год?","why_now":"Нет подтверждения результативности."}]$u$::jsonb);

commit;
