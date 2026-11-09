import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = 'https://bezeqta-scores-api.pages.dev/marks';
const WORKER = 'https://bezeqta-scores.bezeqta-noamisback.workers.dev/marks';

test('CI/pages dist bundle embeds Pages marks URL first, then Worker fallback', () => {
  const dir = 'dist/assets';
  assert.ok(existsSync(dir), 'dist/assets missing — run build:pages before this check');
  const js = readdirSync(dir).filter((name) => name.endsWith('.js'));
  assert.ok(js.length >= 1, 'no js assets in dist');
  const body = js.map((name) => readFileSync(join(dir, name), 'utf8')).join('\n');
  assert.ok(body.includes(PAGES), `bundle missing Pages URL ${PAGES}`);
  assert.ok(body.includes(WORKER), `bundle missing Worker fallback ${WORKER}`);
  assert.ok(!body.includes('http://localhost'), 'bundle must not point marks API at localhost');
  const pagesAt = body.indexOf(PAGES);
  const workerAt = body.indexOf(WORKER);
  assert.ok(pagesAt >= 0 && workerAt >= 0);
  // Source of truth: Pages first in MARKS_URLS
  const source = readFileSync('pages/marks-api.ts', 'utf8');
  assert.ok(source.includes(`PAGES_MARKS_URL = "${PAGES}"`));
  assert.ok(source.includes(`WORKER_MARKS_URL = "${WORKER}"`));
  assert.ok(source.includes('MARKS_URLS = [PAGES_MARKS_URL, WORKER_MARKS_URL]'));
  assert.ok(source.includes('AbortController'));
  assert.ok(!source.includes('AbortSignal.timeout('));
});
