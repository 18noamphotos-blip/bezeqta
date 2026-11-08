import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const temp = mkdtempSync(join(tmpdir(), 'bezeqta-tests-'));
const transpile = (text) => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
writeFileSync(join(temp, 'matches.mjs'), transpile(readFileSync('src/data/matches.ts', 'utf8')));
writeFileSync(join(temp, 'tennis.mjs'), transpile(readFileSync('src/lib/tennis.ts', 'utf8')).replace('"@/data/matches"', '"./matches.mjs"'));
const data = await import(pathToFileURL(join(temp, 'matches.mjs')));
const tennis = await import(pathToFileURL(join(temp, 'tennis.mjs')));
rmSync(temp, { recursive: true });

test('schedule, scores, played flags, next match and standings', () => {
  assert.equal(data.MATCHES.length, 12);
  assert.equal(tennis.playedCount({}), 0);
  const entries = { 1: { played: true, score: '2-1' }, 2: { played: true, score: '1-1' }, 3: { played: true, score: '0-3' } };
  assert.equal(tennis.playedCount(entries), 3);
  assert.deepEqual(tennis.recordFrom(entries), { wins: 1, draws: 1, losses: 1, scored: 3 });
  assert.ok(tennis.nextOpen(entries).every(m => !entries[m.id]?.played));
  assert.deepEqual(tennis.nextOpen(Object.fromEntries(data.MATCHES.map(m => [m.id, { played: true }]))), []);
});

test('local scores and home venue load using unchanged keys', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key) ?? null };
  assert.deepEqual(tennis.loadEntries(), {});
  store.set(tennis.STORAGE_KEY, JSON.stringify({ 1: { score: '2-1', played: true } }));
  assert.equal(tennis.loadEntries()[1].score, '2-1');
  store.set(tennis.HOME_KEY, 'hadar');
  assert.equal(tennis.loadHome(), 'hadar');
  store.set(tennis.HOME_KEY, 'invalid');
  assert.equal(tennis.loadHome(), null);
  store.set(tennis.STORAGE_KEY, 'broken');
  assert.deepEqual(tennis.loadEntries(), {});
  delete globalThis.localStorage;
});

test('outbound links, WhatsApp text and complete downloadable calendar', () => {
  const match = data.MATCHES[0];
  assert.equal(new URL(tennis.wazeUrl(match)).hostname, 'waze.com');
  assert.equal(new URL(tennis.mapsUrl(match)).hostname, 'www.google.com');
  const cal = new URL(tennis.googleCalendarUrl(match));
  assert.equal(cal.hostname, 'calendar.google.com');
  assert.equal(cal.searchParams.get('action'), 'TEMPLATE');
  const ics = tennis.buildIcs(data.MATCHES);
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 12);
  assert.ok(ics.includes('END:VCALENDAR'));
  assert.ok(tennis.whatsAppSeason({ 1: { played: true, score: '2-1' } }).includes('2-1'));
  let opened;
  globalThis.window = { open: (...args) => { opened = args; } };
  tennis.openWhatsApp('בדיקה');
  assert.equal(new URL(opened[0]).hostname, 'wa.me');
  assert.equal(new URL(opened[0]).searchParams.get('text'), 'בדיקה');
  delete globalThis.window;
});

test('Pages entry reuses unchanged UI with RTL shell and no Grok manifest', () => {
  const entry = readFileSync('pages/main.tsx', 'utf8');
  const html = readFileSync('pages/index.html', 'utf8');
  const ui = readFileSync('src/routes/index.tsx', 'utf8');
  assert.ok(entry.includes('Route.options.component'));
  assert.ok(readFileSync('pages/styles.css', 'utf8').includes('@source "../src"'));
  assert.ok(html.includes('lang="he" dir="rtl"'));
  assert.ok(!html.includes('/__grok/'));
  for (const code of ['localStorage.setItem(STORAGE_KEY', 'localStorage.setItem(HOME_KEY', 'MATCHES.filter', 'recordFrom(entries)', 'downloadIcs(MATCHES']) assert.ok(ui.includes(code), code);
});


test('shared clean start never reads old cached scores or auto-uploads them', () => {
 const ui = readFileSync('src/routes/index.tsx','utf8');
 assert.ok(!ui.includes('loadEntries'));
 assert.ok(!ui.includes('allowUpload'));
 assert.ok(!ui.includes('resetAll'));
 assert.ok(ui.includes('bezeq_tennis_shared_v1'));
 assert.ok(ui.includes('mergeSharedSnapshot(rows, remoteVersion.current'));
 assert.ok(ui.includes('6000'));
 assert.ok(ui.includes('350'));
});
