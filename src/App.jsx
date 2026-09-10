import { useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowRight,
  CaretDown,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  Database,
  FileText,
  GitBranch,
  LinkSimple,
  MagnifyingGlass,
  NavigationArrow,
  Paperclip,
  PaperPlaneRight,
  ShieldCheck,
  Stack,
  UserCheck,
  UserCircle,
} from "@phosphor-icons/react";

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`}>
      <span className="brand__mark" aria-hidden="true">
        <NavigationArrow weight="fill" />
      </span>
      <span>Компас рекрутера</span>
    </div>
  );
}

function RecruiterMessage({ children, time }) {
  return (
    <div className="message-row message-row--recruiter">
      <div className="recruiter-message">{children}</div>
      <div className="person-icon" aria-hidden="true">
        <UserCircle weight="fill" />
      </div>
      <time>{time}</time>
    </div>
  );
}

function AgentMessage({ children, time, error }) {
  return (
    <div className="message-row message-row--agent">
      <span className="agent-mark" aria-hidden="true">
        <NavigationArrow weight="fill" />
      </span>
      <div className={"agent-message" + (error ? " agent-message--error" : "")}>{children}</div>
      <time>{time}</time>
    </div>
  );
}

const REC_LABEL = {
  continue: "Вести дальше",
  clarify: "Уточнить",
  not_for_current_vacancy: "Не подходит",
  consider_neighbour_role: "Соседняя роль",
};

const STATE_LABEL = {
  confirmed: "подтверждено",
  partially_confirmed: "частично",
  needs_clarification: "уточнить",
  not_met: "не подходит",
};

function CandidateCard({ card }) {
  const [open, setOpen] = useState(false);
  const counts = { confirmed: 0, partially_confirmed: 0, needs_clarification: 0, not_met: 0 };
  (card.evidence || []).forEach((e) => { counts[e.state] = (counts[e.state] || 0) + 1; });
  return (
    <div className={`candidate-card candidate-card--${card.recommendation}`}>
      <button className="candidate-card__head" type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <strong>{card.name}</strong>
        <span className="candidate-card__head-right">
          <span className={`rec-badge rec-badge--${card.recommendation}`}>{REC_LABEL[card.recommendation] || card.recommendation}</span>
          <CaretDown weight="bold" className={`chevron${open ? " chevron--open" : ""}`} />
        </span>
      </button>
      <p className="candidate-card__summary">{card.summary}</p>
      <div className="candidate-card__counts">
        {counts.confirmed > 0 && <span className="count count--confirmed">подтверждено {counts.confirmed}</span>}
        {counts.partially_confirmed > 0 && <span className="count count--partially">частично {counts.partially_confirmed}</span>}
        {counts.needs_clarification > 0 && <span className="count count--needs">уточнить {counts.needs_clarification}</span>}
        {counts.not_met > 0 && <span className="count count--notmet">не подходит {counts.not_met}</span>}
      </div>
      {open && (
        <div className="candidate-card__detail">
          <ul className="candidate-card__criteria">
            {card.evidence.map((e) => (
              <li key={e.criterion_id}>
                <span className={`crit-state crit-state--${e.state}`}>{STATE_LABEL[e.state] || e.state}</span>
                <span className="crit-claim">{e.claim}</span>
              </li>
            ))}
          </ul>
          {Array.isArray(card.critical_unknowns) && card.critical_unknowns.length > 0 && (
            <div className="candidate-card__unknowns">
              <strong>Что выяснить</strong>
              {card.critical_unknowns.map((u) => (
                <p key={u.criterion_id}>{u.question}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCards({ cards }) {
  return (
    <div className="review-cards">
      {cards.map((card) => (
        <CandidateCard key={card.candidate_id} card={card} />
      ))}
    </div>
  );
}

function VacancyList({ vacancies }) {
  return (
    <div className="vacancy-list">
      {vacancies.map((v) => (
        <div key={v.id} className="vacancy-item">
          <span className="vacancy-item__mark"><NavigationArrow weight="fill" /></span>
          <div><strong>{v.name}</strong><p>id {v.id}</p></div>
        </div>
      ))}
    </div>
  );
}

function CandidatesList({ candidates }) {
  return (
    <div className="vacancy-list">
      {candidates.map((c) => (
        <div key={c.candidate_id} className="vacancy-item">
          <span className="vacancy-item__mark"><UserCircle weight="fill" /></span>
          <div><strong>{c.name}</strong><p>id {c.candidate_id}</p></div>
        </div>
      ))}
    </div>
  );
}

function Digest({ data }) {
  const kindLabel = { must_have: "Обязательные", nice_to_have: "Желательные", constraint: "Ограничения" };
  const groups = { must_have: [], nice_to_have: [], constraint: [] };
  (data.criteria_list || []).forEach((c) => { (groups[c.kind] || groups.must_have).push(c); });
  const cand = data.candidates || {};
  const candLines = [
    ["continue", "Вести дальше"],
    ["clarify", "Уточнить"],
    ["not_for_current_vacancy", "Не подходит"],
    ["consider_neighbour_role", "Соседняя роль"],
  ];
  return (
    <div className="digest">
      <div className="digest__head">
        <strong>{data.vacancy_name}</strong>
      </div>
      <div className="digest__criteria">
        {["must_have", "nice_to_have", "constraint"].map((k) =>
          groups[k].length ? (
            <div key={k} className="digest__group">
              <span className="digest__group-label">{kindLabel[k]}</span>
              <ul>
                {groups[k].map((c) => (
                  <li key={c.criterion_id}>{c.title}</li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </div>
      <div className="digest__candidates">
        {candLines.map(([key, label]) =>
          (cand[key] || []).length ? (
            <div key={key} className="digest__cand-group">
              <span className="digest__group-label">{label}</span>
              <ul>{cand[key].map((c) => <li key={c.candidate_id}>{c.name}</li>)}</ul>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

function Ranking({ data }) {
  const best = data.ranking?.[0];
  return (
    <div className="ranking">
      <p>
        {best ? `Лучшая соседняя вакансия — «${best.job_name}» (${best.verdict}).` : "Подходящей соседней вакансии не найдено."}
      </p>
    </div>
  );
}

function formatAgentResponse(data) {
  if (!data || typeof data !== "object") return String(data ?? "");
  if (data.help) return data.help;
  if (typeof data.body === "string" && data.body) return data.body;
  if (Array.isArray(data.closed_gaps)) {
    const tail = data.remaining_gaps?.length ? "; осталось выяснить — " + data.remaining_gaps.join(", ") : "";
    return `Расшифровка учтена: закрыты пробелы ${data.closed_gaps.join(", ")}${tail}.`;
  }
  if (data.veto_type) {
    return data.next_action === "find_neighbour"
      ? "Отзыв — это veto по совместимости команды, а не профессиональная оценка. Ищу соседнюю вакансию."
      : "Отзыв руководителя учтён.";
  }
  if (Array.isArray(data.criteria) && data.criteria.length) {
    return `Критерии сформированы: ${data.criteria.length}.`;
  }
  if ("idempotent" in data) return data.idempotent ? "Действие уже выполнено — ничего не меняю." : "Действие выполнено.";
  return "";
}

function renderMarkdown(text) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  const lines = String(text ?? "").split(/\r?\n/);
  let html = "";
  let list = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const t = raw.trimEnd();
    if (!t.trim()) { closeList(); continue; }
    const h = t.match(/^(#{1,4})\s+(.*)/);
    if (h) { closeList(); const level = Math.min(h[1].length + 2, 6); html += `<h${level}>${inline(h[2])}</h${level}>`; continue; }
    const ul = t.match(/^[-*•]\s+(.*)/);
    if (ul) { if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; } html += `<li>${inline(ul[1])}</li>`; continue; }
    const ol = t.match(/^\d+[.)]\s+(.*)/);
    if (ol) { if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; } html += `<li>${inline(ol[1])}</li>`; continue; }
    closeList();
    html += `<p>${inline(t)}</p>`;
  }
  closeList();
  return html;
}

function renderAgentContent(msg) {
  const d = msg.data;
  if (d && Array.isArray(d.cards)) return <ReviewCards cards={d.cards} />;
  if (d && Array.isArray(d.vacancies)) return <VacancyList vacancies={d.vacancies} />;
  if (d && Array.isArray(d.candidates)) return <CandidatesList candidates={d.candidates} />;
  if (d && Array.isArray(d.criteria_list)) return <Digest data={d} />;
  if (d && Array.isArray(d.ranking)) return <Ranking data={d} />;
  return <div className="agent-answer" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text || formatAgentResponse(d)) }} />;
}

const WELCOME =
  "Здравствуйте! Я беру на себя рутину подбора: сверяю резюме с требованиями вакансии, разбираю расшифровки и отзывы, готовлю сообщения и ищу соседние роли. Спросите про вакансию или кандидата.";

const QUICK_COMMANDS = [
  { label: "Покажи утреннюю сводку", vacancy_id: 13 },
  { label: "Что ты умеешь?" },
  { label: "Разбери кандидатов по вакансии", vacancy_id: 13 },
  { label: "Покажи активные вакансии" },
];

const CAPABILITIES = [
  { icon: <CheckCircle weight="fill" />, title: "Сверка резюме с требованиями", text: "по каждому кандидату — вердикт «вести / уточнить / отклонить» со ссылкой на источник." },
  { icon: <FileText weight="bold" />, title: "Разбор интервью и отзыва", text: "расшифровка обновляет оценку, отзыв руководителя отделяется от профессиональной оценки." },
  { icon: <GitBranch weight="bold" />, title: "Поиск соседней роли", text: "при отказе по команде — другая подходящая вакансия уже найдена и оценена." },
  { icon: <PaperPlaneRight weight="bold" />, title: "Готовые сообщения и слоты", text: "вопросы, отказы и слоты составлены заранее — остаётся подтвердить." },
];

const BLOCKS = [
  {
    name: "Подготовка вакансии",
    text: "Из описания вакансии — проверяемые критерии",
    points: [
      "Сформировать критерии: обязательные, желательные, ограничения",
      "Подтвердить готовую версию или переделать по замечаниям",
      "Показать список активных вакансий",
    ],
  },
  {
    name: "Разбор и аутрич",
    text: "Сверка резюме с критериями",
    points: [
      "Вердикт по кандидату: вести, уточнить или отклонить — с основаниями",
      "Подготовить вопросы и слоты для интервью",
      "Написать черновик отказа или уточняющего вопроса",
    ],
  },
  {
    name: "Сопровождение",
    text: "Новые факты — в оценку",
    points: [
      "Разобрать расшифровку интервью и обновить оценку",
      "Отделить профессиональный отзыв от team-fit veto",
      "Найти и оценить соседнюю вакансию при отказе",
    ],
  },
  {
    name: "Действия и отчёт",
    text: "Сводка и безопасная запись",
    points: [
      "Собрать сводку: критерии, вердикты, пробелы",
      "Предложить следующий шаг и дождаться подтверждения",
      "Записать в Potok только подтверждённое действие",
    ],
  },
];

const STACK = [
  {
    name: "n8n",
    icon: GitBranch,
    text: "Оркестратор всей логики агента",
    points: [
      "Агентное ядро (AI Agent) + 17 инструментов + 4 блока + 2 под-флоу — 24 workflow",
      "Вход — webhook /webhook/compass-agent-lab; флоу связаны с креденшалами по имени",
      "Держит границу: модель выбирает read-only инструмент, запись — только блок 4",
    ],
  },
  {
    name: "DeepSeek",
    icon: MagnifyingGlass,
    text: "Языковая модель для интерпретации",
    points: [
      "Агент сам выбирает инструмент и формулирует ответ рекрутеру",
      "Блоки извлекают критерии, вердикты, вопросы и черновики",
      "temperature 0 — ответы детерминированные, без выдумок",
    ],
  },
  {
    name: "Potok API",
    icon: LinkSimple,
    text: "Источник данных о найме",
    points: [
      "Чтение (GET): вакансии, резюме, кандидаты, этапы",
      "Запись (POST): только подтверждённые действия через блок 4",
      "Bearer-токен песочницы — в креденшале Header Auth",
    ],
  },
  {
    name: "PostgreSQL",
    icon: Database,
    text: "Изолированная база состояния",
    points: [
      "Схема recruiter_compass: критерии, разборы, действия, аудит",
      "Агент stateless: состояние в базе, а не в памяти модели",
      "Отдельный контейнер, не пересекается с рабочей базой",
    ],
  },
];

export function App() {
  const [messages, setMessages] = useState([{ role: "agent", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const conversationRef = useRef(null);
  const sessionRef = useRef("ses-" + (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)));

  useEffect(() => {
    const el = conversationRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const ask = async (displayText, body) => {
    if (thinking) return;
    setInput("");
    setMessages((items) => [...items, { role: "recruiter", text: displayText }]);
    setThinking(true);
    try {
      const res = await fetch("/webhook/compass-agent-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, session_id: sessionRef.current }),
      });
      const data = await res.json();
      const isError = !res.ok || data?.ok === false;
      const text = data?.answer || data?.error?.message || "Не удалось выполнить запрос. Попробуйте ещё раз.";
      setMessages((items) => [...items, { role: "agent", text, error: isError }]);
    } catch {
      setMessages((items) => [...items, { role: "agent", text: "Не удалось получить ответ от агента. Проверьте соединение и попробуйте ещё раз.", error: true }]);
    } finally {
      setThinking(false);
    }
  };

  const submitMessage = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    ask(text, { text, context: { vacancy_id: 13 } });
  };

  const runQuick = (cmd) => {
    ask(cmd.label, { text: cmd.label, context: { vacancy_id: cmd.vacancy_id } });
  };

  const restart = () => {
    setMessages([{ role: "agent", text: WELCOME }]);
    sessionRef.current = "ses-" + (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  };

  return (
    <main>
      <section className="hero" id="product">
        <div className="hero__backdrop" aria-hidden="true" />
        <header className="topbar page-width">
          <Brand />
          <nav aria-label="Навигация по странице">
            <a href="#demo">Демонстрация</a>
            <a href="#architecture">Как устроено</a>
            <a href="#principles">Принципы</a>
          </nav>
          <span className="contest-note">Конкурсная версия</span>
        </header>

        <div className="hero__content page-width">
          <p className="eyebrow">Агент, который берёт на себя рутину подбора</p>
          <h1>
            <span>От требований вакансии —</span>
            <span>до обоснованного решения</span>
            <span>по каждому кандидату</span>
          </h1>
          <p className="hero__lead">
            Сверка резюме с требованиями, разбор интервью и отзывов, подготовка сообщений и поиск
            соседних ролей — агент делает рутинную работу за рекрутера. По каждому кандидату остаётся
            готовый вердикт и следующий шаг, а решение и запись в Potok — за вами.
          </p>
          <a className="primary-link" href="#demo">
            Посмотреть, как работает <ArrowRight weight="bold" />
          </a>
          <div className="hero__principles" aria-label="Ключевые принципы">
            <span><CheckCircle weight="fill" /> Вердикт со ссылкой на источник</span>
            <span><MagnifyingGlass weight="bold" /> Неизвестное превращается в вопрос</span>
            <span><ShieldCheck weight="fill" /> Действия подтверждает человек</span>
          </div>
        </div>
      </section>

      <section className="demo-section" id="demo" aria-label="Демонстрация работы агента">
        <div className="demo-heading page-width">
          <div>
            <p className="section-kicker">Живой диалог с агентом</p>
            <h2>Спросите о кандидатах — агент даст вердикт и следующий шаг</h2>
          </div>
          <button className="restart-button" type="button" onClick={restart}>
            <ArrowCounterClockwise weight="bold" /> Новая беседа
          </button>
        </div>

        <div className="demo-layout page-width">
          <aside className="product-info">
            <p className="product-info__kicker">Рутину агент берёт на себя</p>
            <h3>Рутинная работа — за агентом, решения — за рекрутером</h3>
            <ul className="capability-list">
              {CAPABILITIES.map((c) => (
                <li key={c.title}>
                  <span className="capability-list__icon">{c.icon}</span>
                  <div>
                    <strong>{c.title}</strong>
                    <p>{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="product-info__note">
              <ShieldCheck weight="fill" />
              <p>Всю рутинную работу агент делает сам. Рекрутер принимает решение и подтверждает запись в Potok.</p>
            </div>
          </aside>

          <div className="workspace workspace--chat" data-testid="workspace">
            <div className="workspace__header">
              <Brand compact />
              <div className="connection"><span /> Песочница Potok подключена</div>
            </div>

            <div className="conversation" ref={conversationRef} aria-live="polite">
              {messages.map((m, index) =>
                m.role === "recruiter" ? (
                  <RecruiterMessage key={`r-${index}`} time="сейчас">{m.text}</RecruiterMessage>
                ) : (
                  <AgentMessage key={`a-${index}`} time="сейчас" error={m.error}>{renderAgentContent(m)}</AgentMessage>
                )
              )}
              {thinking && (
                <AgentMessage time="сейчас">
                  <p className="agent-message--pending">Обрабатываю…</p>
                </AgentMessage>
              )}
            </div>

            {messages.length === 1 && (
              <div className="quick-commands">
                {QUICK_COMMANDS.map((cmd) => (
                  <button key={cmd.label} type="button" onClick={() => runQuick(cmd)}>{cmd.label}</button>
                ))}
              </div>
            )}

            <form className="composer" onSubmit={submitMessage}>
              <button type="button" aria-label="Приложить" onClick={() => ask("Разобрать расшифровку интервью кандидата 70", { text: "Разобрать расшифровку интервью кандидата 70", context: { candidate_id: 70, vacancy_id: 13 } })}>
                <Paperclip weight="bold" />
              </button>
              <label htmlFor="message" className="sr-only">Сообщение агенту</label>
              <input
                id="message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Спросите о кандидате или вакансии"
              />
              <button className="send-button" type="submit" aria-label="Отправить сообщение">
                <PaperPlaneRight weight="fill" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="architecture" id="architecture">
        <div className="page-width">
          <div className="architecture__heading">
            <p className="section-kicker section-kicker--dark">Что происходит за диалогом</p>
            <h2>Агент анализирует. Человек решает.</h2>
            <p className="architecture__subtitle">
              Роутер на DeepSeek распознаёт намерение из фразы и направляет её в один из четырёх блоков.
              В демо — песочница Potok с двумя вакансиями и семью кандидатами: расшифровка интервью,
              отзыв руководителя и veto, ведущее к соседней роли.
            </p>
          </div>

          <div className="flow">
            <div className="flow__step">
              <span className="flow__icon"><Database weight="duotone" /></span>
              <div><strong>Источники</strong><p>Вакансия, резюме, расшифровка, отзыв — из Potok</p></div>
            </div>
            <ArrowRight className="flow__arrow" weight="bold" />
            <div className="flow__step">
              <span className="flow__icon"><MagnifyingGlass weight="duotone" /></span>
              <div><strong>Вердикт</strong><p>Подходит, уточнить или отклонить — с основаниями</p></div>
            </div>
            <ArrowRight className="flow__arrow" weight="bold" />
            <div className="flow__step">
              <span className="flow__icon"><UserCheck weight="duotone" /></span>
              <div><strong>Подтверждение</strong><p>Следующий шаг ждёт решения рекрутера</p></div>
            </div>
            <ArrowRight className="flow__arrow" weight="bold" />
            <div className="flow__step">
              <span className="flow__icon"><CheckCircle weight="duotone" /></span>
              <div><strong>Запись в Potok</strong><p>Только подтверждённые изменения</p></div>
            </div>
          </div>

          <div className="architecture__columns">
            <div className="architecture__block">
              <h3><GitBranch weight="bold" /> Четыре блока агента</h3>
              <ul className="block-list">
                {BLOCKS.map((b, i) => (
                  <li key={b.name}>
                    <span className="block-list__num">{i + 1}</span>
                    <div>
                      <strong>{b.name}</strong>
                      <p>{b.text}</p>
                      <ul className="block-list__points">
                        {b.points.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="architecture__block">
              <h3><Stack weight="bold" /> Технологии и интеграции</h3>
              <ul className="stack-list">
                {STACK.map((t) => (
                  <li key={t.name}>
                    <t.icon weight="bold" />
                    <div>
                      <strong>{t.name}</strong>
                      <p>{t.text}</p>
                      <ul className="stack-list__points">
                        {t.points.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="tech-grid" id="principles">
            <div className="tech-item">
              <ShieldCheck weight="duotone" />
              <div><strong>Автономия только на чтение</strong><p>Агент сам выбирает инструменты чтения; запись в Potok — детерминированный шаг по action_id с подтверждением рекрутера</p></div>
            </div>
            <div className="tech-item">
              <Check weight="duotone" />
              <div><strong>Идемпотентность</strong><p>Повторный запуск не создаёт дублей и не портит состояние</p></div>
            </div>
            <div className="tech-item">
              <ClockCounterClockwise weight="duotone" />
              <div><strong>Аудит действий</strong><p>Видно, что предложил агент, что подтвердил рекрутер и что изменилось</p></div>
            </div>
          </div>

          <footer>
            <Brand compact />
            <p>Конкурсный прототип · демонстрационные данные · 2026</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
