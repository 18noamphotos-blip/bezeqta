import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import api from '../worker/index.mjs';
import { validMark, ORIGIN } from '../worker/validate.mjs';

const transpile = (file) =>
  ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;

const { buildMarkPayload } = await import(
  'data:text/javascript;base64,' + Buffer.from(transpile('src/lib/mark-payload.ts')).toString('base64')
);
const scores = await import(
  'data:text/javascript;base64,' + Buffer.from(transpile('src/lib/score-selection.ts')).toString('base64')
);

const schema = readFileSync(new URL('../worker/schema.sql', import.meta.url), 'utf8');
function binding(db) {
  return {
    prepare(sql) {
      return {
        sql,
        params: [],
        bind(...params) {
          return { sql, params };
        },
      };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const out = statements.map(({ sql, params }) => {
          const stmt = db.prepare(sql);
          return { results: sql.startsWith('SELECT') ? stmt.all(...params) : (stmt.run(...params), []) };
        });
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
function request(method = 'GET', data) {
  return new Request('https://test/marks', {
    method,
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

test('exact frontend score-selection payloads pass Worker validMark and persist via workerd path', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bezeqta-payload-'));
  const file = join(dir, 'db.sqlite');
  const db = new DatabaseSync(file);
  db.exec(schema);
  const env = { DB: binding(db) };

  const cases = [
    ['select 2-1', scores.scoreSelection('2-1')],
    ['select 3-0', scores.scoreSelection('3-0')],
    ['select 0-3', scores.scoreSelection('0-3')],
    ['select 1-2', scores.scoreSelection('1-2')],
    ['clear score', scores.scoreSelection('')],
    ['outcome win', scores.scoreSelection(scores.scoreForOutcome('win', ''))],
    ['outcome loss', scores.scoreSelection(scores.scoreForOutcome('loss', ''))],
    ['checkbox played only', { played: true }],
    ['checkbox unplay clears', { played: false, score: '' }],
  ];

  for (const [label, selection] of cases) {
    const payload = buildMarkPayload(7, selection);
    assert.equal(validMark(payload), true, `${label} rejected by validMark: ${JSON.stringify(payload)}`);
    assert.ok(!('outcome' in payload), `${label} must not send outcome field`);
    const res = await api.fetch(request('POST', payload), env);
    assert.equal(res.status, 200, `${label} worker status`);
    const body = await res.json();
    assert.deepEqual(
      body.marks.find((m) => m.matchId === 7),
      { matchId: 7, played: payload.played, score: payload.score },
      label,
    );
  }

  // Sanity: illegal scores still rejected by client builder scrub / worker
  const scrubbed = buildMarkPayload(7, { played: true, score: '<script>' });
  assert.equal(scrubbed.score, '');
  assert.equal(validMark(scrubbed), true);
  assert.equal(validMark({ matchId: 7, played: true, score: '<script>' }), false);

  db.close();
  rmSync(dir, { recursive: true });
});

test('ICS events include 1-day and 1-hour DISPLAY alarms', () => {
  const source = readFileSync('src/lib/tennis.ts', 'utf8');
  assert.ok(source.includes('BEGIN:VALARM'));
  assert.ok(source.includes('TRIGGER:-P1D'));
  assert.ok(source.includes('TRIGGER:-PT1H'));
  assert.ok(source.includes('ACTION:DISPLAY'));
  const ui = readFileSync('src/routes/index.tsx', 'utf8');
  assert.ok(ui.includes('downloadIcs([match]'));
  assert.ok(!ui.includes('googleCalendarUrl('));
  assert.ok(ui.includes('patch(match.id, selection, true)'));
  assert.ok(ui.includes('buildMarkPayload'));
});
