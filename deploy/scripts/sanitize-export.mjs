import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Приводит экспорт n8n к переносимому виду для импорта в чужой инстанс:
//  - убирает локальные id учётных данных, оставляя только name (переносимая связь);
//  - убирает метаданные инстанса (versionId, createdAt, ...), которые мешают импорту.
// Не трогает id workflow и node: они нужны для кросс-ссылок executeWorkflow.

const here = dirname(fileURLToPath(import.meta.url));
const workflowsDir = join(here, '..', 'workflows');

const KEEP = ['id', 'name', 'description', 'active', 'nodes', 'connections', 'settings', 'pinData'];

function sanitizeCredential(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.name === 'string') {
    return { name: value.name };
  }
  return value;
}

function sanitizeWorkflow(raw) {
  const clean = {};
  for (const key of KEEP) {
    if (raw[key] !== undefined) clean[key] = raw[key];
  }
  clean.settings = { executionOrder: raw.settings?.executionOrder || 'v1' };
  for (const node of clean.nodes || []) {
    if (!node.credentials) continue;
    const creds = {};
    for (const [type, value] of Object.entries(node.credentials)) {
      creds[type] = sanitizeCredential(value);
    }
    node.credentials = creds;
  }
  return clean;
}

const files = readdirSync(workflowsDir).filter((f) => f.endsWith('.json'));
for (const file of files) {
  const path = join(workflowsDir, file);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const clean = sanitizeWorkflow(raw);
  const output = `${JSON.stringify(clean, null, 2)}\n`;
  if (readFileSync(path, 'utf8') !== output) {
    writeFileSync(path, output, 'utf8');
    console.log(`sanitized: ${file}`);
  } else {
    console.log(`unchanged: ${file}`);
  }
}
console.log(`Done. ${files.length} workflows processed.`);
