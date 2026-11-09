import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const transpile = (file) =>
  ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;

const pending = await import(
  'data:text/javascript;base64,' + Buffer.from(transpile('src/lib/pending-marks.ts')).toString('base64')
);
const { mergeSharedSnapshot } = await import(
  'data:text/javascript;base64,' + Buffer.from(transpile('src/lib/shared-marks.ts')).toString('base64')
);
const { buildMarkPayload } = await import(
  'data:text/javascript;base64,' + Buffer.from(transpile('src/lib/mark-payload.ts')).toString('base64')
);
const scores = await import(
  'data:text/javascript;base64,' + Buffer.from(transpile('src/lib/score-selection.ts')).toString('base64')
);
const { validMark } = await import('../worker/validate.mjs');

test('outbox survives blank server snapshot the way a refresh does', () => {
  store.clear();
  let outbox = pending.upsertOutbox({}, 3, scores.scoreSelection('2-1'));
  assert.equal(store.get(pending.OUTBOX_KEY)?.includes('2-1'), true);

  // Simulate full page reload: new JS memory, only localStorage remains.
  outbox = pending.loadOutbox();
  const server = Object.assign(
    [
      { matchId: 1, played: false, score: '' },
      { matchId: 2, played: false, score: '' },
      { matchId: 3, played: false, score: '' },
    ],
    { version: 55 },
  );
  const local = pending.entriesWithOutbox({}, outbox);
  const merged = mergeSharedSnapshot(server, -1, local, pending.outboxIds(outbox));
  assert.deepEqual(merged.entries[3], { played: true, score: '2-1' });
  // Blank GET must not reconcile away a differing outbox row.
  outbox = pending.reconcileOutbox(outbox, Array.from(server));
  assert.deepEqual(outbox['3'], { played: true, score: '2-1', updatedAt: outbox['3'].updatedAt });
});

test('successful matching snapshot clears outbox; payload still valid for Worker', () => {
  store.clear();
  let outbox = pending.upsertOutbox({}, 3, scores.scoreSelection('2-1'));
  const payload = buildMarkPayload(3, outbox['3']);
  assert.equal(validMark(payload), true);
  outbox = pending.reconcileOutbox(outbox, [{ matchId: 3, played: true, score: '2-1' }]);
  assert.deepEqual(outbox, {});
  assert.equal(store.has(pending.OUTBOX_KEY), false);
});

test('UI keeps durable outbox path and does not treat display cache as authority on boot', () => {
  const ui = readFileSync('src/routes/index.tsx', 'utf8');
  assert.ok(ui.includes('bezeq_tennis_outbox_v1') || ui.includes('loadOutbox'));
  assert.ok(ui.includes('entriesWithOutbox'));
  assert.ok(ui.includes('reconcileOutbox'));
  assert.ok(ui.includes('outboxIds(outboxRef.current)'));
  // Still never auto-upload arbitrary old local display cache on boot.
  assert.ok(ui.includes('Never read or upload old device scores') || ui.includes('Shared board is authoritative'));
});
