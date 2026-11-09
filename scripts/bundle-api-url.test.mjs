import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED = 'https://bezeqta-scores.bezeqta-noamisback.workers.dev/marks';

test('CI/pages dist bundle embeds absolute Worker marks URL (not relative/localhost/empty env)', () => {
  const dir = 'dist/assets';
  assert.ok(existsSync(dir), 'dist/assets missing — run build:pages before this check');
  const js = readdirSync(dir).filter((name) => name.endsWith('.js'));
  assert.ok(js.length >= 1, 'no js assets in dist');
  const body = js.map((name) => readFileSync(join(dir, name), 'utf8')).join('\n');
  assert.ok(body.includes(EXPECTED), `bundle missing ${EXPECTED}`);
  assert.ok(!body.includes('http://localhost'), 'bundle must not point marks API at localhost');
  assert.equal((body.match(/bezeqta-scores\.bezeqta-noamisback\.workers\.dev\/marks/g) || []).length >= 1, true);
  // Source of truth stays hardcoded for GitHub Pages origin.
  const source = readFileSync('pages/marks-api.ts', 'utf8');
  assert.ok(source.includes(`WORKER_MARKS_URL = "${EXPECTED}"`));
  assert.ok(source.includes('AbortController'));
  assert.ok(!source.includes('AbortSignal.timeout('));
  assert.ok(!body.includes('AbortSignal.timeout('));
});
