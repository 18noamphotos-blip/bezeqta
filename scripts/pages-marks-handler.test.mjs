import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleMarks, validMark, ORIGIN } from '../pages-api/marks-handler.mjs';

const schema = readFileSync(new URL('../worker/schema.sql', import.meta.url), 'utf8');
function binding(db) {
  return {
    prepare(sql) {
      return { sql, params: [], bind(...params) { return { sql, params }; } };
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

test('Pages marks handler serves clean board and accepts score payload against shared schema', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bezeqta-pages-api-'));
  const db = new DatabaseSync(join(dir, 'db.sqlite'));
  db.exec(schema);
  const env = { DB: binding(db) };
  const host = 'bezeqta-scores-api.pages.dev';
  const get = await handleMarks(new Request('https://test/marks', { headers: { Origin: ORIGIN } }), env, host);
  assert.equal(get.status, 200);
  const board = await get.json();
  assert.equal(board.version, 0);
  assert.equal(board.marks.length, 12);
  const edit = { matchId: 1, played: true, score: '2-1' };
  assert.equal(validMark(edit), true);
  const post = await handleMarks(
    new Request('https://test/marks', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    }),
    env,
    host,
  );
  assert.equal(post.status, 200);
  const saved = await post.json();
  assert.equal(saved.version, 1);
  assert.deepEqual(saved.marks[0], edit);
  db.close();
  rmSync(dir, { recursive: true });
});
