import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.POTOK_TOKEN;
const BASE = 'https://demo.app.potok.io/api/v3';
const VACANCY_ID = 13;
const CANDIDATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo-data', 'candidates');

if (!TOKEN) {
  console.error('POTOK_TOKEN env is required');
  process.exit(1);
}

async function api(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${text.slice(0, 400)}`);
  return data;
}

function section(md, title) {
  const m = md.match(new RegExp('## ' + title + '\\n([\\s\\S]*?)(?=\\n## |$)'));
  return m ? m[1].trim() : '';
}

function parsePeriod(period) {
  const m = period.match(/(\d{4})\s*[—-]\s*(н\.?\s*в\.?|(\d{4}))/i);
  if (!m) return { start: null, end: null, now: false };
  if (m[2] && /н/i.test(m[2])) return { start: m[1] + '-01-01', end: null, now: true };
  return { start: m[1] + '-01-01', end: m[2] + '-12-31', now: false };
}

function parseExperience(expSec) {
  const jobs = [];
  const blocks = expSec.split(/(?=\*\*«)/);
  for (const block of blocks) {
    const lines = block.split('\n');
    const company = ((lines[0] || '').match(/«(.+?)»/) || [])[1] || '';
    let position = '';
    let period = '';
    const descLines = [];
    for (const line of lines.slice(1)) {
      const pm = line.match(/^\*(.+?) · (.+?)\*$/);
      if (pm) { position = pm[1].trim(); period = pm[2].trim(); }
      else { descLines.push(line); }
    }
    let desc = descLines.join('\n').replace(/^\s*-\s*/gm, '').replace(/\s+/g, ' ').trim();
    if (company) {
      const d = parsePeriod(period);
      jobs.push({ company, position, start: d.start, end: d.end, now: d.now, description: desc });
    }
  }
  return jobs;
}

function parse(md) {
  const fio = (md.match(/\*\*ФИО:\*\*\s*(.+)/) || [])[1]?.trim() || '';
  const title = (md.match(/\*\*Должность:\*\*\s*(.+)/) || [])[1]?.trim() || '';
  const aboutMe = section(md, 'О себе');
  const skills = section(md, 'Ключевые навыки').replace(/\s+/g, ' ').trim();
  const experience = parseExperience(section(md, 'Опыт работы'));
  const [last, first, middle] = fio.split(/\s+/);
  return { first_name: first, last_name: last, middle_name: middle || '', title, about_me: aboutMe, skills, experience };
}

const candidates = readdirSync(CANDIDATES_DIR).filter(x => x.endsWith('.md')).sort()
  .map(f => ({ file: f, data: parse(readFileSync(join(CANDIDATES_DIR, f), 'utf8')) }));

const dry = process.argv.includes('--dry');
if (dry) {
  for (const c of candidates) {
    console.log(`\n=== ${c.data.first_name} ${c.data.last_name} ===`);
    console.log('title:', c.data.title);
    console.log('experience jobs:', c.data.experience.length);
    for (const j of c.data.experience) console.log(`  [${j.company}] ${j.description}`);
  }
  process.exit(0);
}

const existing = {};
const apps = await api('GET', '/applicants.json?per_page=100');
for (const a of (apps.data || [])) {
  const name = `${a.first_name} ${(a.last_name || '').replace(' [ДЕМО]', '')}`.trim();
  if (!existing[name] || a.id > existing[name]) existing[name] = a.id;
}

for (const c of candidates) {
  const p = c.data;
  const fullName = `${p.first_name} ${p.last_name}`;
  const cv_params = { title: p.title, about_me: p.about_me, skills: p.skills, experience: p.experience };
  const appId = existing[fullName];
  if (appId) {
    await api('POST', `/applicants/${appId}/resumes.json`, { cv_params });
    console.log(`[resume] ${fullName} (applicant ${appId})`);
  } else {
    const app = await api('POST', '/applicants.json', {
      first_name: p.first_name, last_name: p.last_name + ' [ДЕМО]', middle_name: p.middle_name,
      title: p.title, source_type: 'sourced',
    });
    await api('POST', `/applicants/${app.id}/resumes.json`, { cv_params });
    await api('POST', '/ajs_joins.json', { job_id: VACANCY_ID, applicant_id: app.id, stage_type: 'sourced' });
    console.log(`[created] ${fullName} -> applicant ${app.id}`);
  }
}

console.log('done');
